import { ObjectId, type Document, type Filter } from 'mongodb';
import { menuItems, users } from '../../database/collections.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { CreateMenuInput, UpdateMenuInput } from './menu.schema.js';
import type { MenuFilters, MenuItem } from './menu.types.js';
import { env } from '../../config/env.js';

interface VendorContext {
    id: string;
    name: string;
    businessName?: string;
    subscriptionPlan?: string;
    subscriptionExpiresAt?: Date;
}

function isPremium(vendor: VendorContext): boolean {
    return (
        vendor.subscriptionPlan === 'premium' &&
        (!vendor.subscriptionExpiresAt ||
            vendor.subscriptionExpiresAt.getTime() > Date.now())
    );
}

async function getVendorContext(vendorId: string): Promise<VendorContext> {
    const filters: Filter<Document>[] = [
        { id: vendorId },
        { _id: vendorId as unknown as ObjectId },
    ];

    if (ObjectId.isValid(vendorId)) {
        filters.push({
            _id: new ObjectId(vendorId),
        });
    }

    const vendor = await users.findOne({
        $or: filters,
    });
    // const vendor = await users.findOne({ id: vendorId });

    if (!vendor || vendor.role !== 'vendor' || vendor.isBlocked) {
        throw new AppError('Vendor account not found or unavailable.', {
            statusCode: 403,
            code: 'VENDOR_UNAVAILABLE',
        });
    }

    return {
        id: vendorId,
        name: vendor.name,
        ...(vendor.businessName && { businessName: vendor.businessName }),
        ...(vendor.subscriptionPlan && {
            subscriptionPlan: vendor.subscriptionPlan,
        }),
        ...(vendor.subscriptionExpiresAt instanceof Date && {
            subscriptionExpiresAt: vendor.subscriptionExpiresAt,
        }),
    };
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid menu item ID.', {
            statusCode: 400,
            code: 'INVALID_ID',
        });
    }

    return new ObjectId(id);
}

export const menuService = {
    async create(vendorId: string, input: CreateMenuInput) {
        const vendor = await getVendorContext(vendorId);
        const premium = isPremium(vendor);

        if (!premium) {
            const activeCount = await menuItems.countDocuments({
                vendorId,
                isActive: true,
                status: { $ne: 'inactive' },
            });

            if (activeCount >= 3) {
                throw new AppError(
                    'Free plan allows only 3 active menu items.',
                    {
                        statusCode: 403,
                        code: 'MENU_LIMIT_REACHED',
                    },
                );
            }
        }

        const now = new Date();

        const item: Omit<MenuItem, '_id'> = {
            ...input,
            vendorId,
            vendorName: vendor.businessName || vendor.name,
            status: 'pending',
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };

        const result = await menuItems.insertOne(item);

        return {
            ...item,
            _id: result.insertedId,
        };
    },

    async update(id: string, vendorId: string, input: UpdateMenuInput) {
        const objectId = validateObjectId(id);

        const result = await menuItems.findOneAndUpdate(
            {
                _id: objectId,
                vendorId,
            },
            {
                $set: {
                    ...input,
                    status: 'pending',
                    updatedAt: new Date(),
                },
            },
            {
                returnDocument: 'after',
            },
        );

        if (!result) {
            throw new AppError('Menu item not found.', {
                statusCode: 404,
                code: 'MENU_NOT_FOUND',
            });
        }

        return result;
    },

    async remove(id: string, vendorId: string) {
        const objectId = validateObjectId(id);

        const result = await menuItems.deleteOne({
            _id: objectId,
            vendorId,
        });

        if (result.deletedCount === 0) {
            throw new AppError('Menu item not found.', {
                statusCode: 404,
                code: 'MENU_NOT_FOUND',
            });
        }
    },

    async getPublic(id: string) {
        const objectId = validateObjectId(id);

        const item = await menuItems.findOne({
            _id: objectId,
            status: 'approved',
            isActive: true,
        });

        if (!item) {
            throw new AppError('Menu item not found.', {
                statusCode: 404,
                code: 'MENU_NOT_FOUND',
            });
        }

        return item;
    },

    async getPublicList(filters: MenuFilters) {
        const { q, category, location, sort, page, limit } = filters;

        const query: Record<string, unknown> = {
            status: 'approved',
            isActive: true,
        };

        if (q) {
            const regex = new RegExp(escapeRegex(q), 'i');

            query.$or = [
                { name: regex },
                { description: regex },
                { vendorName: regex },
            ];
        }

        if (category) {
            query.category = category;
        }

        if (location) {
            query.location = new RegExp(escapeRegex(location), 'i');
        }

        const [allItems, total, premiumVendors] = await Promise.all([
            menuItems.find(query).toArray(),
            menuItems.countDocuments(query),
            users
                .find({
                    role: 'vendor',
                    subscriptionPlan: 'premium',
                    $or: [
                        { subscriptionExpiresAt: { $exists: false } },
                        { subscriptionExpiresAt: null },
                        { subscriptionExpiresAt: { $gt: new Date() } },
                    ],
                })
                .project<{ id: string }>({ id: 1 })
                .toArray(),
        ]);

        const premiumIds = new Set(premiumVendors.map((vendor) => vendor.id));

        allItems.sort((a, b) => {
            const premiumDifference =
                Number(premiumIds.has(b.vendorId)) -
                Number(premiumIds.has(a.vendorId));

            if (premiumDifference !== 0) {
                return premiumDifference;
            }

            if (sort === 'price_asc') {
                return a.price - b.price;
            }

            if (sort === 'price_desc') {
                return b.price - a.price;
            }

            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });

        const start = (page - 1) * limit;

        return {
            items: allItems.slice(start, start + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getVendorItems(vendorId: string) {
        return menuItems.find({ vendorId }).sort({ createdAt: -1 }).toArray();
    },

    async getVendorItem(id: string, vendorId: string) {
        const objectId = validateObjectId(id);

        const item = await menuItems.findOne({
            _id: objectId,
            vendorId,
        });

        if (!item) {
            throw new AppError('Menu item not found.', {
                statusCode: 404,
                code: 'MENU_NOT_FOUND',
            });
        }

        return item;
    },

    async uploadImage(image: string) {
        if (!env.IMGBB_API_KEY) {
            throw new AppError('Image upload is not configured.', {
                statusCode: 503,
                code: 'UPLOAD_NOT_CONFIGURED',
            });
        }

        if (
            typeof image !== 'string' ||
            image.length === 0 ||
            image.length > 5_500_000 ||
            !/^[A-Za-z0-9+/]+={0,2}$/.test(image)
        ) {
            throw new AppError('Invalid image data.', {
                statusCode: 400,
                code: 'INVALID_IMAGE',
            });
        }

        const formData = new FormData();
        formData.append('image', image);

        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`,
            {
                method: 'POST',
                body: formData,
            },
        );

        const result = (await response.json()) as {
            success: boolean;
            data?: { display_url?: string };
        };

        if (!response.ok || !result.success || !result.data?.display_url) {
            throw new AppError('Image upload failed.', {
                statusCode: 502,
                code: 'IMAGE_UPLOAD_FAILED',
            });
        }

        return { url: result.data.display_url };
    },
};
