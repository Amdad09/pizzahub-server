import type { RequestHandler } from 'express';

import { ordersService } from './orders.service.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { AppError } from '../../shared/errors/app-error.js';

import type { OrderFilters } from './orders.types.js';

function getUserId(req: Parameters<RequestHandler>[0]): string {
    const userId = req.auth?.user.id;

    if (!userId) {
        throw new AppError('Authentication required.', {
            statusCode: 401,
            code: 'UNAUTHORIZED',
        });
    }

    return userId;
}

function getParamId(req: Parameters<RequestHandler>[0]): string {
    const id = req.params.id;

    if (typeof id !== 'string' || !id) {
        throw new AppError('Invalid order ID.', {
            statusCode: 400,
            code: 'INVALID_ID',
        });
    }

    return id;
}

function getFilters(res: Parameters<RequestHandler>[1]): OrderFilters {
    return res.locals.validatedQuery as OrderFilters;
}

function getReason(req: Parameters<RequestHandler>[0]): string | undefined {
    const body = req.body as { reason?: string } | undefined;
    return body?.reason;
}

export const createOrder: RequestHandler = async (req, res) => {
    const order = await ordersService.create(getUserId(req), req.body);

    return sendSuccess(res, order, {
        statusCode: 201,
        message: 'Order placed successfully.',
    });
};

export const getCustomerOrders: RequestHandler = async (req, res) => {
    const result = await ordersService.getCustomerOrders(
        getUserId(req),
        getFilters(res),
    );

    return sendSuccess(res, result, {
        message: 'Your orders fetched successfully.',
    });
};

export const getCustomerOrder: RequestHandler = async (req, res) => {
    const order = await ordersService.getCustomerOrder(
        getParamId(req),
        getUserId(req),
    );

    return sendSuccess(res, order, {
        message: 'Order fetched successfully.',
    });
};

export const getVendorOrders: RequestHandler = async (req, res) => {
    const result = await ordersService.getVendorOrders(
        getUserId(req),
        getFilters(res),
    );

    return sendSuccess(res, result, {
        message: 'Customer orders fetched successfully.',
    });
};

export const getVendorOrder: RequestHandler = async (req, res) => {
    const order = await ordersService.getVendorOrder(
        getParamId(req),
        getUserId(req),
    );

    return sendSuccess(res, order, {
        message: 'Order fetched successfully.',
    });
};

export const acceptOrder: RequestHandler = async (req, res) => {
    const order = await ordersService.accept(getParamId(req), getUserId(req));

    return sendSuccess(res, order, {
        message: 'Order accepted successfully.',
    });
};

export const rejectOrder: RequestHandler = async (req, res) => {
    const order = await ordersService.reject(
        getParamId(req),
        getUserId(req),
        getReason(req),
    );

    return sendSuccess(res, order, {
        message: 'Order rejected successfully.',
    });
};

export const cancelOrder: RequestHandler = async (req, res) => {
    const order = await ordersService.cancel(
        getParamId(req),
        getUserId(req),
        getReason(req),
    );

    return sendSuccess(res, order, {
        message: 'Order cancelled successfully.',
    });
};
