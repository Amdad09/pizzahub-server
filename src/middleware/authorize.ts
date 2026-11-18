import type { RequestHandler } from 'express';

import type { Role } from '../config/roles.js';
import { AppError } from '../shared/errors/app-error.js';

export const authorize = (...allowedRoles: Role[]): RequestHandler => {
    return (req, _res, next) => {
        if (!req.auth) {
            next(
                new AppError('Authentication required', {
                    statusCode: 401,
                    code: 'UNAUTHORIZED',
                }),
            );
            return;
        }

        if (!allowedRoles.includes(req.auth.user.role)) {
            next(
                new AppError('You do not have permission', {
                    statusCode: 403,
                    code: 'FORBIDDEN',
                }),
            );
            return;
        }

        next();
    };
};
