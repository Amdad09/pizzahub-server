import { ObjectId } from 'mongodb';

import {
    menuItems,
    orders,
    transactions,
    users,
} from '../../database/collections.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AdminMenuListQuery, AdminUserListQuery } from './admin.schema.js';

export async function getAdminOverview() {
    const [
        totalUsers,
        totalCustomers,
        totalVendors,
        blockedUsers,
        totalMenuItems,
        pendingMenuItems,
        approvedMenuItems,
        totalOrders,
        pendingOrders,
        totalTransactions,
    ] = await Promise.all([
        users.countDocuments(),
        users.countDocuments({ role: 'customer' }),
        users.countDocuments({ role: 'vendor' }),
        users.countDocuments({ isBlocked: true }),
        menuItems.countDocuments(),
        menuItems.countDocuments({ status: 'pending' }),
        menuItems.countDocuments({ status: 'approved', isActive: true }),
        orders.countDocuments(),
        orders.countDocuments({ status: 'pending' }),
        transactions.countDocuments(),
    ]);

    return {
        users: {
            total: totalUsers,
            customers: totalCustomers,
            vendors: totalVendors,
            blocked: blockedUsers,
        },
        menu: {
            total: totalMenuItems,
            pending: pendingMenuItems,
            approved: approvedMenuItems,
        },
        orders: {
            total: totalOrders,
            pending: pendingOrders,
        },
        transactions: {
            total: totalTransactions,
        },
    };
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getUserIdentityFilter(id: string) {
    const identities: Record<string, unknown>[] = [{ _id: id }, { id }];

    if (ObjectId.isValid(id)) {
        identities.push({ _id: new ObjectId(id) });
    }

    return { $or: identities };
}

export async function getAdminUsers(query: AdminUserListQuery) {
    const { q, role, page, limit } = query;

    const filter: Record<string, unknown> = {
        role: role === 'all' ? { $in: ['customer', 'vendor'] } : role,
    };

    if (q) {
        const search = new RegExp(escapeRegex(q), 'i');

        filter.$or = [
            { name: search },
            { email: search },
            { businessName: search },
        ];
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
        users
            .find(filter)
            .project({
                _id: 1,
                id: 1,
                name: 1,
                email: 1,
                image: 1,
                role: 1,
                businessName: 1,
                isBlocked: 1,
                createdAt: 1,
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        users.countDocuments(filter),
    ]);

    const items = documents.map((user) => ({
        id: String(user.id ?? user._id),
        name: String(user.name ?? ''),
        email: String(user.email ?? ''),
        image: typeof user.image === 'string' ? user.image : null,
        role: user.role,
        businessName:
            typeof user.businessName === 'string' ? user.businessName : null,
        isBlocked: Boolean(user.isBlocked),
        createdAt: user.createdAt,
    }));

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getAdminUserById(id: string) {
    const user = await users.findOne(getUserIdentityFilter(id), {
        projection: {
            _id: 1,
            id: 1,
            name: 1,
            email: 1,
            image: 1,
            role: 1,
            businessName: 1,
            isBlocked: 1,
            createdAt: 1,
        },
    });

    if (!user || !['customer', 'vendor'].includes(String(user.role))) {
        throw new AppError('User not found', {
            statusCode: 404,
            code: 'USER_NOT_FOUND',
        });
    }

    return {
        id: String(user.id ?? user._id),
        name: String(user.name ?? ''),
        email: String(user.email ?? ''),
        image: typeof user.image === 'string' ? user.image : null,
        role: user.role,
        businessName:
            typeof user.businessName === 'string' ? user.businessName : null,
        isBlocked: Boolean(user.isBlocked),
        createdAt: user.createdAt,
    };
}

async function updateUserBlockStatus(
    id: string,
    adminId: string,
    isBlocked: boolean,
) {
    if (id === adminId) {
        throw new AppError('You cannot block your own account', {
            statusCode: 403,
            code: 'SELF_BLOCK_NOT_ALLOWED',
        });
    }

    const user = await users.findOne(getUserIdentityFilter(id));

    if (!user || !['customer', 'vendor'].includes(String(user.role))) {
        throw new AppError('User not found', {
            statusCode: 404,
            code: 'USER_NOT_FOUND',
        });
    }

    if (Boolean(user.isBlocked) === isBlocked) {
        throw new AppError(
            isBlocked ? 'User is already blocked' : 'User is already unblocked',
            {
                statusCode: 409,
                code: 'USER_STATUS_UNCHANGED',
            },
        );
    }

    const result = await users.updateOne(
        {
            $and: [
                getUserIdentityFilter(id),
                { role: { $in: ['customer', 'vendor'] } },
            ],
        },
        {
            $set: {
                isBlocked,
                updatedAt: new Date(),
            },
        },
    );

    if (result.modifiedCount !== 1) {
        throw new AppError('Unable to update user status', {
            statusCode: 409,
            code: 'USER_UPDATE_FAILED',
        });
    }

    return {
        id,
        isBlocked,
    };
}

export async function blockAdminUser(id: string, adminId: string) {
    return updateUserBlockStatus(id, adminId, true);
}

export async function unblockAdminUser(id: string, adminId: string) {
    return updateUserBlockStatus(id, adminId, false);
}

function validateMenuId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid menu item ID.', {
            statusCode: 400,
            code: 'INVALID_MENU_ID',
        });
    }

    return new ObjectId(id);
}

export async function getAdminMenuItems(query: AdminMenuListQuery) {
    const { q, page, limit } = query;

    const filter: Record<string, unknown> = {
        status: 'pending',
    };

    if (q) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');

        filter.$or = [
            { name: regex },
            { vendorName: regex },
            { category: regex },
            { location: regex },
        ];
    }

    const [items, total] = await Promise.all([
        menuItems
            .find(filter)
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray(),

        menuItems.countDocuments(filter),
    ]);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getAdminMenuItemById(id: string) {
    const item = await menuItems.findOne({
        _id: validateMenuId(id),
    });

    if (!item) {
        throw new AppError('Menu item not found.', {
            statusCode: 404,
            code: 'MENU_NOT_FOUND',
        });
    }

    return item;
}

export async function approveAdminMenuItem(id: string) {
    const result = await menuItems.findOneAndUpdate(
        {
            _id: validateMenuId(id),
            status: 'pending',
        },
        {
            $set: {
                status: 'approved',
                isActive: true,
                updatedAt: new Date(),
            },
            $unset: {
                rejectionReason: '',
            },
        },
        {
            returnDocument: 'after',
        },
    );

    if (!result) {
        const exists = await menuItems.findOne(
            { _id: new ObjectId(id) },
            { projection: { _id: 1 } },
        );

        if (!exists) {
            throw new AppError('Menu item not found.', {
                statusCode: 404,
                code: 'MENU_NOT_FOUND',
            });
        }

        throw new AppError('This menu item has already been reviewed.', {
            statusCode: 409,
            code: 'MENU_ALREADY_REVIEWED',
        });
    }

    return result;
}

export async function rejectAdminMenuItem(id: string, reason: string) {
    const result = await menuItems.findOneAndUpdate(
        {
            _id: validateMenuId(id),
            status: 'pending',
        },
        {
            $set: {
                status: 'rejected',
                isActive: false,
                rejectionReason: reason,
                updatedAt: new Date(),
            },
        },
        {
            returnDocument: 'after',
        },
    );

    if (!result) {
        const exists = await menuItems.findOne(
            { _id: new ObjectId(id) },
            { projection: { _id: 1 } },
        );

        if (!exists) {
            throw new AppError('Menu item not found.', {
                statusCode: 404,
                code: 'MENU_NOT_FOUND',
            });
        }

        throw new AppError('This menu item has already been reviewed.', {
            statusCode: 409,
            code: 'MENU_ALREADY_REVIEWED',
        });
    }

    return result;
}