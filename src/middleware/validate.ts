import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface ValidationSchemas {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
}

export const validate = (schemas: ValidationSchemas): RequestHandler => {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }

            if (schemas.query) {
                res.locals.validatedQuery = schemas.query.parse(req.query);
            }

            if (schemas.params) {
                schemas.params.parse(req.params);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
