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

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
    }),
);

app.use(requestLogger);
app.use(globalRateLimit);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
    sendSuccess(res, { status: 'ok' }, { message: 'Server is healthy' });
});


app.use(notFoundHandler);
app.use(errorHandler);

export default app