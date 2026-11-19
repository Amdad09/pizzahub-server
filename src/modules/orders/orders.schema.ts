import { z } from 'zod';

export const createOrderSchema = z.object({
    menuItemId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid menu item ID.'),
    quantity: z.number().int().min(1).max(20),
    deliveryDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid delivery date.')
        .refine(
            (value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)),
            'Invalid delivery date.',
        ),
    deliveryAddress: z.string().trim().min(10).max(300),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9\s()-]{8,20}$/),
    note: z.string().trim().max(500).optional(),
});

export const orderQuerySchema = z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const orderActionSchema = z
    .object({
        reason: z.string().trim().max(300).optional(),
    })
    .default({});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
