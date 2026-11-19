import type { RequestHandler } from 'express';
import { menuService } from './menu.service.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { AppError } from '../../shared/errors/app-error.js';

function getParamId(req: Parameters<RequestHandler>[0]): string {
    const id = req.params.id;

    if (typeof id !== 'string' || !id) {
        throw new AppError('Invalid menu item ID.', {
            statusCode: 400,
            code: 'INVALID_ID',
        });
    }

    return id;
}

function getVendorId(req: Parameters<RequestHandler>[0]): string {
    const vendorId = req.auth?.user.id;

    if (!vendorId) {
        throw new AppError('Authentication required.', {
            statusCode: 401,
            code: 'UNAUTHORIZED',
        });
    }

    return vendorId;
}

export const getPublicMenu: RequestHandler = async (_req, res) => {
    const filters = res.locals.validatedQuery;
    const result = await menuService.getPublicList(filters);

    return sendSuccess(res, result, {
        message: 'Menu items fetched successfully.',
    });
};

export const getPublicMenuById: RequestHandler = async (req, res) => {
    const item = await menuService.getPublic(getParamId(req));

    return sendSuccess(res, item, {
        message: 'Menu item fetched successfully.',
    });
};

export const getVendorMenu: RequestHandler = async (req, res) => {
    const items = await menuService.getVendorItems(getVendorId(req));

    return sendSuccess(res, items, {
        message: 'Your menu items fetched successfully.',
    });
};

export const createMenu: RequestHandler = async (req, res) => {
    const item = await menuService.create(getVendorId(req), req.body);

    return sendSuccess(res, item, {
        statusCode: 201,
        message: 'Menu item submitted for approval.',
    });
};

export const updateMenu: RequestHandler = async (req, res) => {
    const item = await menuService.update(
        getParamId(req),
        getVendorId(req),
        req.body,
    );

    return sendSuccess(res, item, {
        message: 'Menu item updated and submitted for approval.',
    });
};

export const deleteMenu: RequestHandler = async (req, res) => {
    await menuService.remove(getParamId(req), getVendorId(req));

    return sendSuccess(res, null, {
        message: 'Menu item deleted successfully.',
    });
};

export const getVendorMenuById: RequestHandler = async (req, res) => {
    const item = await menuService.getVendorItem(
        getParamId(req),
        getVendorId(req),
    );

    return sendSuccess(res, item, {
        message: 'Menu item fetched successfully.',
    });
};

export const uploadMenuImage: RequestHandler = async (req, res) => {
    getVendorId(req);

    const result = await menuService.uploadImage(req.body.image);

    return sendSuccess(res, result, {
        statusCode: 201,
        message: 'Image uploaded successfully.',
    });
};