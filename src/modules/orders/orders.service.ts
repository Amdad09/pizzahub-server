import { MongoServerError, ObjectId } from 'mongodb';
import { menuItems, orders } from '../../database/collections.js';
import { AppError } from '../../shared/errors/app-error.js';

import type { Order, OrderFilters, OrderStatus } from './orders.types.js';
import type { CreateOrderInput } from './orders.schema.js';
import type { MenuItem } from '../menu/menu.types.js';

function validateObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid order ID.', {
            statusCode: 400,
            code: 'INVALID_ID',
        });
    }

    return new ObjectId(id);
}

function notFound(): AppError {
    return new AppError('Order not found.', {
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
    });
}

async function getOwnedOrder(
    id: string,
    field: 'customerId' | 'vendorId',
    userId: string,
): Promise<Order> {
    const order = (await orders.findOne({
        _id: validateObjectId(id),
        [field]: userId,
    })) as Order | null;

    if (!order) throw notFound();

    return order;
}

async function updateOrderStatus(
    id: string,
    userId: string,
    role: 'customer' | 'vendor',
    status: OrderStatus,
    reason?: string,
): Promise<Order> {
    const field = role === 'customer' ? 'customerId' : 'vendorId';
    const existingOrder = await getOwnedOrder(id, field, userId);

    if (existingOrder.status !== 'pending') {
        throw new AppError('Only pending orders can be updated.', {
            statusCode: 409,
            code: 'ORDER_STATUS_CONFLICT',
        });
    }

    const now = new Date();

    const historyEntry = {
        status,
        actorId: userId,
        actorRole: role,
        ...(reason && { note: reason }),
        createdAt: now,
    };

    const result = await orders.updateOne(
        {
            _id: existingOrder._id,
            [field]: userId,
            status: 'pending',
        },
        {
            $set: {
                status,
                updatedAt: now,
            },
            $push: {
                statusHistory: historyEntry,
            },
        },
    );

    if (result.matchedCount === 0) {
        throw new AppError('Order status has already changed.', {
            statusCode: 409,
            code: 'ORDER_STATUS_CONFLICT',
        });
    }

    const updatedOrder = (await orders.findOne({
        _id: existingOrder._id,
    })) as Order | null;

    if (!updatedOrder) throw notFound();

    return updatedOrder;
}

export const ordersService = {
    async create(customerId: string, input: CreateOrderInput) {
        const menuItem = (await menuItems.findOne({
            _id: new ObjectId(input.menuItemId),
            status: 'approved',
            isActive: true,
        })) as MenuItem | null;

        if (!menuItem) {
            throw new AppError('Menu item is not available.', {
                statusCode: 404,
                code: 'MENU_ITEM_UNAVAILABLE',
            });
        }

        if (menuItem.vendorId === customerId) {
            throw new AppError('You cannot order your own menu item.', {
                statusCode: 403,
                code: 'OWN_ITEM_ORDER',
            });
        }

        const deliveryDate = input.deliveryDate;
        const today = new Date().toISOString().slice(0, 10);

        if (deliveryDate < today) {
            throw new AppError('Delivery date cannot be in the past.', {
                statusCode: 400,
                code: 'INVALID_DELIVERY_DATE',
            });
        }

        const menuItemId = menuItem._id;

        const duplicateOrder = await orders.findOne({
            customerId,
            menuItemId,
            deliveryDate,
            status: { $in: ['pending', 'accepted'] },
        });

        if (duplicateOrder) {
            throw new AppError(
                'You already have an active order for this item and delivery date.',
                {
                    statusCode: 409,
                    code: 'DUPLICATE_ORDER',
                },
            );
        }

        const now = new Date();
        const totalPrice = menuItem.price * input.quantity;

        const order: Order = {
            _id: new ObjectId(),
            customerId,
            vendorId: menuItem.vendorId,
            menuItemId,

            itemSnapshot: {
                name: menuItem.name,
                price: menuItem.price,
                image: menuItem.images[0] ?? null,
                vendorName: menuItem.vendorName,
            },

            quantity: input.quantity,
            totalPrice,

            deliveryDate,
            deliveryAddress: input.deliveryAddress,
            phone: input.phone,
            ...(input.note && { note: input.note }),

            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    actorId: customerId,
                    actorRole: 'customer',
                    createdAt: now,
                },
            ],

            createdAt: now,
            updatedAt: now,
        };

        try {
            await orders.insertOne(order);
            return order;
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                throw new AppError(
                    'An active order already exists for this item and date.',
                    {
                        statusCode: 409,
                        code: 'DUPLICATE_ORDER',
                    },
                );
            }

            throw error;
        }
    },

    async getCustomerOrders(customerId: string, filters: OrderFilters) {
        const query = {
            customerId,
            ...(filters.status && { status: filters.status }),
        };

        const skip = (filters.page - 1) * filters.limit;

        const [items, total] = await Promise.all([
            orders
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(filters.limit)
                .toArray(),

            orders.countDocuments(query),
        ]);

        return {
            items,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    },

    async getVendorOrders(vendorId: string, filters: OrderFilters) {
        const query = {
            vendorId,
            ...(filters.status && { status: filters.status }),
        };

        const skip = (filters.page - 1) * filters.limit;

        const [items, total] = await Promise.all([
            orders
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(filters.limit)
                .toArray(),

            orders.countDocuments(query),
        ]);

        return {
            items,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    },

    async getCustomerOrder(id: string, customerId: string) {
        return getOwnedOrder(id, 'customerId', customerId);
    },

    async getVendorOrder(id: string, vendorId: string) {
        return getOwnedOrder(id, 'vendorId', vendorId);
    },

    async accept(id: string, vendorId: string) {
        return updateOrderStatus(id, vendorId, 'vendor', 'accepted');
    },

    async reject(id: string, vendorId: string, reason?: string) {
        return updateOrderStatus(id, vendorId, 'vendor', 'rejected', reason);
    },

    async cancel(id: string, customerId: string, reason?: string) {
        return updateOrderStatus(
            id,
            customerId,
            'customer',
            'cancelled',
            reason,
        );
    },
};
