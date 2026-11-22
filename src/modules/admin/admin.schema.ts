import { z } from 'zod';

export const adminUserListSchema = z.object({
    q: z.string().trim().max(100).optional(),
    role: z.enum(['all', 'customer', 'vendor']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminUserParamsSchema = z.object({
    id: z.string().min(1, 'User ID is required'),
});

export const adminMenuListSchema = z.object({
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const rejectMenuSchema = z.object({
    reason: z.string().trim().min(5).max(500),
});

export type AdminMenuListQuery = z.infer<typeof adminMenuListSchema>;

export type AdminUserListQuery = z.infer<typeof adminUserListSchema>;

export const adminTransactionListSchema = z.object({
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type AdminTransactionListQuery = z.infer<
    typeof adminTransactionListSchema
>;