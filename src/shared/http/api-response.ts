import type { Response } from 'express';

interface SuccessOptions {
    message?: string;
    statusCode?: number;
}

interface ErrorOptions {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
}

export function sendSuccess<T>(
    res: Response,
    data: T,
    options: SuccessOptions = {},
): Response {
    const { message = 'Success', statusCode = 200 } = options;

    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

export function sendError(res: Response, options: ErrorOptions): Response {
    const { statusCode, code, message, details } = options;

    return res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(details !== undefined && { details }),
    });
}
