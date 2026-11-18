interface AppErrorOptions {
    statusCode?: number;
    code?: string;
    details?: unknown;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational = true;
    public readonly details?: unknown;

    constructor(message: string, options: AppErrorOptions = {}) {
        super(message);

        this.name = new.target.name;
        this.statusCode = options.statusCode ?? 500;
        this.code = options.code ?? 'INTERNAL_ERROR';
        this.details = options.details;

        Error.captureStackTrace(this, new.target);
    }
}
