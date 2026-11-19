import { Router } from 'express';

import {
    acceptOrder,
    cancelOrder,
    createOrder,
    getCustomerOrder,
    getCustomerOrders,
    getVendorOrder,
    getVendorOrders,
    rejectOrder,
} from './orders.controller.js';

import {
    createOrderSchema,
    orderActionSchema,
    orderQuerySchema,
} from './orders.schema.js';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { blockedGuard } from '../../middleware/blocked-guard.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Customer routes
router.post(
    '/',
    authenticate,
    authorize('customer'),
    blockedGuard,
    validate({ body: createOrderSchema }),
    createOrder,
);

router.get(
    '/customer',
    authenticate,
    authorize('customer'),
    blockedGuard,
    validate({ query: orderQuerySchema }),
    getCustomerOrders,
);

router.get(
    '/customer/:id',
    authenticate,
    authorize('customer'),
    blockedGuard,
    getCustomerOrder,
);

router.patch(
    '/:id/cancel',
    authenticate,
    authorize('customer'),
    blockedGuard,
    validate({ body: orderActionSchema }),
    cancelOrder,
);

// Vendor routes
router.get(
    '/vendor',
    authenticate,
    authorize('vendor'),
    blockedGuard,
    validate({ query: orderQuerySchema }),
    getVendorOrders,
);

router.get(
    '/vendor/:id',
    authenticate,
    authorize('vendor'),
    blockedGuard,
    getVendorOrder,
);

router.patch(
    '/:id/accept',
    authenticate,
    authorize('vendor'),
    blockedGuard,
    acceptOrder,
);

router.patch(
    '/:id/reject',
    authenticate,
    authorize('vendor'),
    blockedGuard,
    validate({ body: orderActionSchema }),
    rejectOrder,
);

export default router;
