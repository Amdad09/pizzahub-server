import 'dotenv/config'
import { z } from "zod";
import { logger } from '../shared/logger/logger.js';

const envSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    CLIENT_URL: z.url().transform((url) => url.replace(/\/+$/, '')),
    BETTER_AUTH_SECRET: z
        .string()
        .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    ADMIN_NAME: z.string().min(1).optional(),
    ADMIN_EMAIL: z.email().optional(),
    ADMIN_PASSWORD: z
        .string()
        .min(6)
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[a-z]/, 'Must contain a lowercase letter')
        .optional(),
    IMGBB_API_KEY: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    STRIPE_PREMIUM_PRICE_ID: z.string().min(1).optional(),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
    logger.error('Invalid environment variables');
    logger.error(
        result.error.issues
            .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
            .join('\n'),
    );
    process.exit(1);
}

export const env =  result.data;