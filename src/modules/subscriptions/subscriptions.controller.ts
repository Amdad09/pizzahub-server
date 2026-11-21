import type { RequestHandler } from 'express';

import { subscriptionsService } from './subscriptions.service.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { AppError } from '../../shared/errors/app-error.js';

function getUserId(req: Parameters<RequestHandler>[0]): string {
    const userId = req.auth?.user.id;

    if (!userId) {
        throw new AppError('Authentication required.', {
            statusCode: 401,
            code: 'UNAUTHORIZED',
        });
    }

    return userId;
}

export const createCheckoutSession: RequestHandler = async (req, res, next) => {
    try {
        const result = await subscriptionsService.createCheckoutSession(
            getUserId(req),
        );

        return sendSuccess(res, result, {
            statusCode: 201,
            message: 'Checkout session created successfully.',
        });
    } catch (error) {
        // console.error('[CREATE CHECKOUT SESSION ERROR]', error);

        return next(error);
    }
};

export const createPortalSession: RequestHandler = async (req, res) => {
    const result = await subscriptionsService.createPortalSession(
        getUserId(req),
    );

    return sendSuccess(res, result, {
        message: 'Billing portal session created successfully.',
    });
};

export const getSubscription: RequestHandler = async (req, res, next) => {
    try {
        res.set({
            'Cache-Control':
                'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'Surrogate-Control': 'no-store',
        });

        const result = await subscriptionsService.getSubscription(
            getUserId(req),
        );

        return sendSuccess(res, result, {
            message: 'Subscription details fetched successfully.',
        });
    } catch (error) {
        return next(error);
    }
};
