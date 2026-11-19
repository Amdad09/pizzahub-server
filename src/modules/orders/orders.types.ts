import type { ObjectId } from 'mongodb';

export const ORDER_STATUSES = [
    'pending',
    'accepted',
    'rejected',
    'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderStatusHistory {
    status: OrderStatus;
    actorId: string;
    actorRole: 'customer' | 'vendor';
    note?: string;
    createdAt: Date;
}

export interface Order {
    _id: ObjectId;
    customerId: string;
    vendorId: string;
    menuItemId: ObjectId;

    itemSnapshot: {
        name: string;
        price: number;
        image: string | null;
        vendorName: string;
    };

    quantity: number;
    totalPrice: number;

    deliveryDate: string;
    deliveryAddress: string;
    phone: string;
    note?: string;

    status: OrderStatus;
    statusHistory: OrderStatusHistory[];

    createdAt: Date;
    updatedAt: Date;
}

export interface OrderFilters {
    status?: OrderStatus;
    page: number;
    limit: number;
}
