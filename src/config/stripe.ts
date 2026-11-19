import Stripe from 'stripe';
import { env } from './env.js';

export const stripe = env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY)
    : null;

export function getStripe(): Stripe {
    if (!stripe) {
        throw new Error(
            'Stripe is not configured. Please provide STRIPE_SECRET_KEY.',
        );
    }

    return stripe;
}
