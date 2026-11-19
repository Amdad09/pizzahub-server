import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestLogger } from './middleware/request-logger.js';
import { sendSuccess } from './shared/http/api-response.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/auth.js';
import { globalRateLimit } from './middleware/rate-limit.js';
import menuRoutes from './modules/menu/menu.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = ['http://localhost:3000', env.CLIENT_URL];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
);

app.use(requestLogger);
app.use(globalRateLimit);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json({ limit: '6mb' }));

app.get('/health', (_req, res) => {
    sendSuccess(res, { status: 'ok' }, { message: 'Server is healthy' });
});

app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app