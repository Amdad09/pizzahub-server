import type { ObjectId } from 'mongodb';

export const SUBSCRIPTION_STATUSES = [
    'incomplete',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete_expired',
    'paused',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface Subscription {
    _id: ObjectId;
    vendorId: string;

    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;

    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;

    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface StripeEventRecord {
    _id: ObjectId;
    stripeEventId: string;
    type: string;
    processedAt: Date;
}

export interface SubscriptionTransaction {
    _id: ObjectId;
    vendorId: string;

    stripeSessionId?: string;
    stripeInvoiceId?: string;
    stripePaymentIntentId?: string;

    stripeSubscriptionId?: string;

    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';

    createdAt: Date;
    updatedAt: Date;
}
