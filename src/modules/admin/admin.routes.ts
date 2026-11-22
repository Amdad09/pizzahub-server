import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { blockedGuard } from '../../middleware/blocked-guard.js';
import { validate } from '../../middleware/validate.js';

import {
    blockAdminUserController,
    getAdminOverviewController,
    getAdminTransactionsController,
    getAdminUserByIdController,
    getAdminUsersController,
    unblockAdminUserController,
} from './admin.controller.js';

import {
    approveAdminMenuItemController,
    getAdminMenuItemController,
    getAdminMenuItemsController,
    rejectAdminMenuItemController,
} from './admin.controller.js';

import {
    adminMenuListSchema,
    rejectMenuSchema,
    adminUserParamsSchema,
    adminUserListSchema,
    adminTransactionListSchema
} from './admin.schema.js';

const router = Router();

router.use(authenticate, authorize('admin'), blockedGuard);

router.get('/overview', getAdminOverviewController);

router.get(
    '/users',
    validate({ query: adminUserListSchema }),
    getAdminUsersController,
);

router.get(
    '/users/:id',
    validate({ params: adminUserParamsSchema }),
    getAdminUserByIdController,
);

router.patch(
    '/users/:id/block',
    validate({ params: adminUserParamsSchema }),
    blockAdminUserController,
);

router.patch(
    '/users/:id/unblock',
    validate({ params: adminUserParamsSchema }),
    unblockAdminUserController,
);

router.get(
    '/menu',
    validate({ query: adminMenuListSchema }),
    getAdminMenuItemsController,
);

router.get(
    '/menu/:id',
    validate({ params: adminUserParamsSchema }),
    getAdminMenuItemController,
);

router.get(
    '/transactions',
    validate({ query: adminTransactionListSchema }),
    getAdminTransactionsController,
);

router.patch(
    '/menu/:id/approve',
    validate({ params: adminUserParamsSchema }),
    approveAdminMenuItemController,
);

router.patch(
    '/menu/:id/reject',
    validate({
        params: adminUserParamsSchema,
        body: rejectMenuSchema,
    }),
    rejectAdminMenuItemController,
);


export default router;
