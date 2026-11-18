import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../shared/errors/app-error.js';
import { logger } from '../shared/logger/logger.js';
import { sendError } from '../shared/http/api-response.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
        next(err);
        return;
    }

    if (err instanceof AppError) {
        const { statusCode, code, message, details } = err;

        if (statusCode >= 500) {
            logger.error({ err }, 'Application error');
        } else {
            logger.warn({ err }, 'Request rejected');
        }

        sendError(res, {
            statusCode,
            code,
            message: statusCode >= 500 ? 'Internal server error' : message,
            ...(statusCode < 500 && details !== undefined ? { details } : {}),
        });

        return;
    }

    if (err instanceof ZodError) {
        sendError(res, {
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });

        return;
    }

    logger.error({ err }, 'Unhandled error');

    sendError(res, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
    });
};
