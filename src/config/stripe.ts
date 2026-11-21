import Stripe from 'stripe';

import { env } from './env.js';
import { AppError } from '../shared/errors/app-error.js';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
    if (!env.STRIPE_SECRET_KEY) {
        throw new AppError('Stripe is not configured.', {
            statusCode: 503,
            code: 'STRIPE_NOT_CONFIGURED',
        });
    }

    stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);

    return stripeClient;
}
