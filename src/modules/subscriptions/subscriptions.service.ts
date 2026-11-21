import { ObjectId } from 'mongodb';

import { env } from '../../config/env.js';
import { getStripe } from '../../config/stripe.js';
import { subscriptions, users } from '../../database/collections.js';
import { AppError } from '../../shared/errors/app-error.js';

import type { Subscription } from './subscriptions.types.js';

interface VendorRecord {
    _id?: ObjectId;
    id?: string;
    name: string;
    email: string;
    role: string;
    isBlocked?: boolean;
    subscriptionPlan?: string;
    subscriptionExpiresAt?: Date | null;
    stripeCustomerId?: string;
}

function getVendorFilter(vendor: VendorRecord) {
    if (vendor._id) {
        return { _id: vendor._id };
    }

    if (vendor.id) {
        return { id: vendor.id };
    }

    throw new AppError('Vendor identifier is missing.', {
        statusCode: 500,
        code: 'VENDOR_ID_MISSING',
    });
}

async function getVendor(vendorId: string): Promise<VendorRecord> {
    const vendor =
        (ObjectId.isValid(vendorId)
            ? await users.findOne({ _id: new ObjectId(vendorId) })
            : null) ?? (await users.findOne({ id: vendorId }));

    if (!vendor || vendor.role !== 'vendor' || vendor.isBlocked) {
        throw new AppError('Vendor account is unavailable.', {
            statusCode: 403,
            code: 'VENDOR_UNAVAILABLE',
        });
    }

    return vendor as unknown as VendorRecord;
}

function getStripePriceId(): string {
    if (!env.STRIPE_PREMIUM_PRICE_ID) {
        throw new AppError('Premium subscription is not configured.', {
            statusCode: 503,
            code: 'SUBSCRIPTION_NOT_CONFIGURED',
        });
    }

    return env.STRIPE_PREMIUM_PRICE_ID;
}

async function getOrCreateStripeCustomer(
    vendor: VendorRecord,
    vendorId: string,
): Promise<string> {
    const stripe = getStripe();

    if (vendor.stripeCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(
                vendor.stripeCustomerId,
            );

            if (!customer.deleted) {
                return customer.id;
            }
        } catch (error) {
            if (!(
                error instanceof Error &&
                'code' in error &&
                error.code === 'resource_missing'
            )) {
                throw error;
            }

            // console.warn(
            //     '[Stripe] Stored customer not found. Creating a new customer.',
            // );
        }
    }

    const customer = await stripe.customers.create({
        name: vendor.name,
        email: vendor.email,
        metadata: { vendorId },
    });

    await users.updateOne(getVendorFilter(vendor), {
        $set: {
            stripeCustomerId: customer.id,
            updatedAt: new Date(),
        },
    });

    return customer.id;
}

export const subscriptionsService = {
    async createCheckoutSession(vendorId: string) {
        const vendor = await getVendor(vendorId);
        const stripe = getStripe();
        const priceId = getStripePriceId();

        // Verify that the configured price exists and is recurring.
        const price = await stripe.prices.retrieve(priceId);

        if (!price.active || price.type !== 'recurring') {
            throw new AppError(
                'The configured Premium price must be an active recurring price.',
                {
                    statusCode: 503,
                    code: 'INVALID_SUBSCRIPTION_PRICE',
                },
            );
        }

        const existing = (await subscriptions.findOne({
            vendorId,
        })) as Subscription | null;

        if (
            existing &&
            ['active', 'trialing', 'past_due'].includes(existing.status)
        ) {
            throw new AppError(
                'You already have an active subscription. Manage it from your billing portal.',
                {
                    statusCode: 409,
                    code: 'SUBSCRIPTION_ALREADY_EXISTS',
                },
            );
        }

        const customerId = await getOrCreateStripeCustomer(vendor, vendorId);

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            client_reference_id: vendorId,
            metadata: {
                vendorId,
                priceId,
            },
            subscription_data: {
                metadata: {
                    vendorId,
                },
            },
            success_url: `${env.CLIENT_URL}/dashboard/vendor/subscription?checkout=success`,
            cancel_url: `${env.CLIENT_URL}/dashboard/vendor/subscription?checkout=cancelled`,
            allow_promotion_codes: true,
        });

        return {
            checkoutUrl: session.url,
            sessionId: session.id,
        };
    },

    async createPortalSession(vendorId: string) {
        const vendor = await getVendor(vendorId);

        if (!vendor.stripeCustomerId) {
            throw new AppError('No billing account was found.', {
                statusCode: 404,
                code: 'BILLING_ACCOUNT_NOT_FOUND',
            });
        }

        const stripe = getStripe();

        const session = await stripe.billingPortal.sessions.create({
            customer: vendor.stripeCustomerId,
            return_url: `${env.CLIENT_URL}/dashboard/vendor/subscription`,
        });

        return {
            portalUrl: session.url,
        };
    },

    async getSubscription(vendorId: string) {
        const vendor = await getVendor(vendorId);

        const subscription = await subscriptions.findOne({
            vendorId,
        });

        return {
            plan: vendor.subscriptionPlan ?? 'free',
            expiresAt: vendor.subscriptionExpiresAt ?? null,
            subscription: subscription ?? null,
        };
    },
};
