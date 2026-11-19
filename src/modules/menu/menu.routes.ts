import { Router } from 'express';
import {
    createMenu,
    deleteMenu,
    getPublicMenu,
    getPublicMenuById,
    getVendorMenu,
    getVendorMenuById,
    updateMenu,
    uploadMenuImage,
} from './menu.controller.js';
import {
    createMenuSchema,
    menuQuerySchema,
    updateMenuSchema,
} from './menu.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { blockedGuard } from '../../middleware/blocked-guard.js';

const router = Router();

// Public routes
router.get('/', validate({ query: menuQuerySchema }), getPublicMenu);
router.get('/:id', getPublicMenuById);

// Vendor routes
const vendorRouter = Router();

vendorRouter.use(authenticate, authorize('vendor'), blockedGuard);

vendorRouter.get('/mine', getVendorMenu);
vendorRouter.get('/mine/:id', getVendorMenuById);
vendorRouter.post('/', validate({ body: createMenuSchema }), createMenu);
vendorRouter.patch('/:id', validate({ body: updateMenuSchema }), updateMenu);
vendorRouter.delete('/:id', deleteMenu);
vendorRouter.post('/images', uploadMenuImage);
router.use('/vendor', vendorRouter);

export default router;
