import type { RequestHandler } from 'express';

import { auth } from '../config/auth.js';
import { AppError } from '../shared/errors/app-error.js';
import { ROLES, type Role } from '../config/roles.js';

export const authenticate: RequestHandler = async (req, _res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: new Headers(
                Object.entries(req.headers).reduce<[string, string][]>(
                    (headers, [key, value]) => {
                        if (value === undefined) return headers;

                        headers.push([
                            key,
                            Array.isArray(value)
                                ? value.join(', ')
                                : String(value),
                        ]);

                        return headers;
                    },
                    [],
                ),
            ),
        });

        if (!session) {
            throw new AppError('Authentication required', {
                statusCode: 401,
                code: 'UNAUTHORIZED',
            });
        }

        const role = session.user.role as Role;

        if (!ROLES.includes(role)) {
            throw new AppError('Invalid user role', {
                statusCode: 403,
                code: 'INVALID_ROLE',
            });
        }

        req.auth = {
            user: {
                id: session.user.id,
                role,
                isBlocked: Boolean(session.user.isBlocked),
            },
            session: {
                id: session.session.id,
            },
        };

        next();
    } catch (error) {
        next(error);
    }
};
