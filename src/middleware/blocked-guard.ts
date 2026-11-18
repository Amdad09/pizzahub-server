import type { RequestHandler } from 'express';

import { AppError } from '../shared/errors/app-error.js';

export const blockedGuard: RequestHandler = (req, _res, next) => {
    if (!req.auth) {
        next(
            new AppError('Authentication required', {
                statusCode: 401,
                code: 'UNAUTHORIZED',
            }),
        );
        return;
    }

    if (req.auth.user.isBlocked) {
        next(
            new AppError('Your account has been blocked', {
                statusCode: 403,
                code: 'ACCOUNT_BLOCKED',
            }),
        );
        return;
    }

    next();
};
