import { z } from 'zod';

export const createMenuSchema = z.object({
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10).max(2000),
    price: z.number().positive().max(100000),
    category: z.string().trim().min(2).max(50),
    location: z.string().trim().min(2).max(100),
    images: z.array(z.url()).min(1).max(4),
});

export const updateMenuSchema = createMenuSchema
    .partial()
    .refine(
        (data) => Object.keys(data).length > 0,
        'At least one field is required',
    );

export const menuQuerySchema = z.object({
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    location: z.string().trim().optional(),
    sort: z.enum(['price_asc', 'price_desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
