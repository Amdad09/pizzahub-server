import { Router } from 'express';

import {
    createCheckoutSession,
    createPortalSession,
    getSubscription,
} from './subscriptions.controller.js';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { blockedGuard } from '../../middleware/blocked-guard.js';

const router = Router();

router.use(authenticate, authorize('vendor'), blockedGuard);

router.get('/', getSubscription);
router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);

export default router;
