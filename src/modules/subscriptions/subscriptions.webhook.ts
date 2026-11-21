import { ObjectId } from 'mongodb';
import type Stripe from 'stripe';
import type { RequestHandler } from 'express';

import { env } from '../../config/env.js';
import { getStripe } from '../../config/stripe.js';
import {
    stripeEvents,
    subscriptions,
    transactions,
    users,
} from '../../database/collections.js';
import { AppError } from '../../shared/errors/app-error.js';

import type {
    SubscriptionStatus,
    StripeEventRecord,
    SubscriptionTransaction,
} from './subscriptions.types.js';

interface StripeSubscriptionSnapshot {
    id: string;
    customer: string | { id: string };
    status: string;
    cancel_at_period_end: boolean;
    metadata: Record<string, string>;
    items: {
        data: Array<{
            price: { id: string };
            current_period_start?: number;
            current_period_end?: number;
        }>;
    };
    current_period_start?: number;
    current_period_end?: number;
}

interface InvoicePayload {
    id: string;
    subscription?: string | { id: string } | null;
    parent?: {
        subscription_details?: {
            subscription?: string | { id: string } | null;
        } | null;
    } | null;
    amount_paid: number;
    amount_due: number;
    currency: string;
    payment_intent?: string | { id: string } | null;
}

function getSubscriptionId(value: unknown): string | null {
    if (typeof value === 'string') {
        return value;
    }

    if (
        value &&
        typeof value === 'object' &&
        'id' in value &&
        typeof value.id === 'string'
    ) {
        return value.id;
    }

    return null;
}

function toDate(timestamp?: number): Date | null {
    return typeof timestamp === 'number' ? new Date(timestamp * 1000) : null;
}


async function syncSubscription(subscriptionId: string): Promise<void> {
    const stripe = getStripe();

    const rawSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    const subscription =
        rawSubscription as unknown as StripeSubscriptionSnapshot;

    const customerId = getSubscriptionId(subscription.customer);
    const vendorIdFromMetadata = subscription.metadata.vendorId;

    // Find vendor using MongoDB _id, Better Auth id, or Stripe customer ID.
    const vendor =
        (vendorIdFromMetadata && ObjectId.isValid(vendorIdFromMetadata)
            ? await users.findOne({
                  _id: new ObjectId(vendorIdFromMetadata),
              })
            : null) ??
        (vendorIdFromMetadata
            ? await users.findOne({ id: vendorIdFromMetadata })
            : null) ??
        (customerId
            ? await users.findOne({ stripeCustomerId: customerId })
            : null);

    if (!vendor) {
        throw new AppError('Subscription vendor could not be identified.', {
            statusCode: 404,
            code: 'SUBSCRIPTION_VENDOR_NOT_FOUND',
        });
    }

    const vendorId =
        typeof vendor.id === 'string'
            ? vendor.id
            : vendor._id instanceof ObjectId
              ? vendor._id.toString()
              : null;

    if (!vendorId) {
        throw new AppError('Vendor identifier is missing.', {
            statusCode: 500,
            code: 'VENDOR_ID_MISSING',
        });
    }

    if (!customerId) {
        throw new AppError('Stripe customer could not be identified.', {
            statusCode: 400,
            code: 'STRIPE_CUSTOMER_NOT_FOUND',
        });
    }

    const vendorFilter =
        vendor._id instanceof ObjectId ? { _id: vendor._id } : { id: vendorId };

    const firstItem = subscription.items.data[0];

    const currentPeriodStart = toDate(
        firstItem?.current_period_start ?? subscription.current_period_start,
    );

    const currentPeriodEnd = toDate(
        firstItem?.current_period_end ?? subscription.current_period_end,
    );

    const priceId = firstItem?.price.id;

    if (!priceId) {
        throw new AppError('Stripe subscription price was not found.', {
            statusCode: 400,
            code: 'STRIPE_PRICE_NOT_FOUND',
        });
    }

    const status = subscription.status as SubscriptionStatus;
    const now = new Date();

    await subscriptions.updateOne(
        { vendorId },
        {
            $set: {
                vendorId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                currentPeriodStart,
                currentPeriodEnd,
                updatedAt: now,
            },
            $setOnInsert: {
                _id: new ObjectId(),
                createdAt: now,
            },
        },
        { upsert: true },
    );

    const hasPremiumAccess =
        (status === 'active' || status === 'trialing') &&
        (!currentPeriodEnd || currentPeriodEnd > now);

    await users.updateOne(vendorFilter, {
        $set: {
            subscriptionPlan: hasPremiumAccess ? 'premium' : 'free',
            subscriptionExpiresAt: hasPremiumAccess ? currentPeriodEnd : null,
            updatedAt: now,
        },
    });
}


function getInvoiceSubscriptionId(invoice: InvoicePayload): string | null {
    return (
        getSubscriptionId(invoice.subscription) ??
        getSubscriptionId(invoice.parent?.subscription_details?.subscription)
    );
}

async function saveInvoiceTransaction(
    invoice: InvoicePayload,
    status: 'paid' | 'failed',
): Promise<void> {
    const subscriptionId = getInvoiceSubscriptionId(invoice);

    if (!subscriptionId) {
        return;
    }

    const subscription = await subscriptions.findOne({
        stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
        throw new AppError('Subscription record was not found.', {
            statusCode: 404,
            code: 'SUBSCRIPTION_NOT_FOUND',
        });
    }

    const paymentIntentId = getSubscriptionId(invoice.payment_intent);

    const now = new Date();

    const transaction: SubscriptionTransaction = {
        _id: new ObjectId(),
        vendorId: subscription.vendorId,
        stripeInvoiceId: invoice.id,
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
        stripeSubscriptionId: subscriptionId,
        amount: status === 'paid' ? invoice.amount_paid : invoice.amount_due,
        currency: invoice.currency.toLowerCase(),
        status,
        createdAt: now,
        updatedAt: now,
    };

    await transactions.updateOne(
        { stripeInvoiceId: invoice.id },
        {
            $set: {
                vendorId: transaction.vendorId,
                stripeSubscriptionId: transaction.stripeSubscriptionId,
                stripePaymentIntentId: transaction.stripePaymentIntentId,
                amount: transaction.amount,
                currency: transaction.currency,
                status: transaction.status,
                updatedAt: now,
            },
            $setOnInsert: {
                _id: transaction._id,
                stripeInvoiceId: transaction.stripeInvoiceId,
                createdAt: now,
            },
        },
        { upsert: true },
    );
}

async function processStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;

            if (session.mode !== 'subscription') {
                break;
            }

            const subscriptionId = getSubscriptionId(session.subscription);

            if (subscriptionId) {
                await syncSubscription(subscriptionId);
            }

            break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;

            await syncSubscription(subscription.id);
            break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as unknown as InvoicePayload;

            const subscriptionId = getInvoiceSubscriptionId(invoice);

            if (subscriptionId) {
                await syncSubscription(subscriptionId);
                await saveInvoiceTransaction(invoice, 'paid');
            }

            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as unknown as InvoicePayload;

            const subscriptionId = getInvoiceSubscriptionId(invoice);

            if (subscriptionId) {
                await syncSubscription(subscriptionId);
                await saveInvoiceTransaction(invoice, 'failed');
            }

            break;
        }

        default:
            break;
    }
}

export const stripeWebhook: RequestHandler = async (req, res, next) => {
    if (!env.STRIPE_WEBHOOK_SECRET) {
        return next(
            new AppError('Stripe webhook is not configured.', {
                statusCode: 503,
                code: 'STRIPE_WEBHOOK_NOT_CONFIGURED',
            }),
        );
    }

    const signature = req.get('stripe-signature');

    if (!signature || !Buffer.isBuffer(req.body)) {
        return res.status(400).send('Invalid Stripe webhook request.');
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            req.body,
            signature,
            env.STRIPE_WEBHOOK_SECRET,
        );
    } catch {
        return res.status(400).send('Invalid Stripe webhook signature.');
    }

    try {
        const existingEvent = await stripeEvents.findOne({
            stripeEventId: event.id,
        });

        if (existingEvent) {
            return res.status(200).json({ received: true });
        }

        await processStripeEvent(event);

        const now = new Date();

        const eventRecord: StripeEventRecord = {
            _id: new ObjectId(),
            stripeEventId: event.id,
            type: event.type,
            processedAt: now,
        };

        await stripeEvents.updateOne(
            { stripeEventId: event.id },
            { $setOnInsert: eventRecord },
            { upsert: true },
        );

        return res.status(200).json({ received: true });
    } catch (error) {
        return next(error);
    }
};
