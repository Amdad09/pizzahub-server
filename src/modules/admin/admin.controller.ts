import type { RequestHandler } from 'express';

import {
    approveAdminMenuItem,
    blockAdminUser,
    getAdminOverview,
    getAdminUserById,
    getAdminUsers,
    rejectAdminMenuItem,
    getAdminMenuItemById,
    getAdminMenuItems,
    unblockAdminUser,
} from './admin.service.js';
import type { AdminMenuListQuery, AdminUserListQuery } from './admin.schema.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { AppError } from '../../shared/errors/app-error.js';

function getUserId(req: Parameters<RequestHandler>[0]): string {
    const id = req.params.id;

    if (typeof id !== 'string') {
        throw new AppError('Invalid user ID', {
            statusCode: 400,
            code: 'INVALID_USER_ID',
        });
    }
    return id;
}
export const getAdminOverviewController: RequestHandler = async (_req, res) => {
    const overview = await getAdminOverview();
    return sendSuccess(res, overview, {
        message: 'Admin overview retrieved successfully.',
    });
};

export const getAdminUsersController: RequestHandler = async (_req, res) => {
    const query = res.locals.validatedQuery as AdminUserListQuery;
    const result = await getAdminUsers(query);

    return sendSuccess(res, result, {
        message: 'Users retrieved successfully.',
    });
};

export const getAdminUserByIdController: RequestHandler = async (req, res) => {
    const userId = getUserId(req);
    const user = await getAdminUserById(userId);

    return sendSuccess(res, user, {
        message: 'User retrieved successfully.',
    });
};

export const blockAdminUserController: RequestHandler = async (req, res) => {
    const userId = getUserId(req);
    const result = await blockAdminUser(userId, req.auth!.user.id);

    return sendSuccess(res, result, {
        message: 'User blocked successfully.',
    });
};

export const unblockAdminUserController: RequestHandler = async (req, res) => {
    const userId = getUserId(req);
    const result = await unblockAdminUser(userId, req.auth!.user.id);

    return sendSuccess(res, result, {
        message: 'User unblocked successfully.',
    });
};

function getMenuId(req: Parameters<RequestHandler>[0]): string {
    const id = req.params.id;

    if (typeof id !== 'string' || !id) {
        throw new AppError('Invalid menu item ID.', {
            statusCode: 400,
            code: 'INVALID_MENU_ID',
        });
    }

    return id;
}

export const getAdminMenuItemsController: RequestHandler = async (
    _req,
    res,
) => {
    const query = res.locals.validatedQuery as AdminMenuListQuery;
    const result = await getAdminMenuItems(query);

    return sendSuccess(res, result, {
        message: 'Pending menu items fetched successfully.',
    });
};

export const getAdminMenuItemController: RequestHandler = async (req, res) => {
    const item = await getAdminMenuItemById(getMenuId(req));

    return sendSuccess(res, item, {
        message: 'Menu item details fetched successfully.',
    });
};


export const approveAdminMenuItemController: RequestHandler = async (
    req,
    res,
) => {
    const item = await approveAdminMenuItem(getMenuId(req));

    return sendSuccess(res, item, {
        message: 'Menu item approved successfully.',
    });
};

export const rejectAdminMenuItemController: RequestHandler = async (
    req,
    res,
) => {
    const reason = req.body.reason as string;
    const item = await rejectAdminMenuItem(getMenuId(req), reason);

    return sendSuccess(res, item, {
        message: 'Menu item rejected successfully.',
    });
};