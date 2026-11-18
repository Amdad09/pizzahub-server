import type { Server } from 'node:http';

import  app  from './app.js';
import { closeDB, connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './shared/logger/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let isShuttingDown = false;

async function shutdown(reason: string, exitCode = 0): Promise<void> {
    if (isShuttingDown) return;

    isShuttingDown = true;

    logger.info({ reason }, 'Shutting down');

    setTimeout(() => {
        logger.fatal('Shutdown timed out, forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    try {
        const activeServer = server;

        if (activeServer?.listening) {
            await new Promise<void>((resolve, reject) => {
                activeServer.close((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve();
                });
            });
        }

        await closeDB();

        process.exitCode = exitCode;
    } catch (err) {
        logger.fatal({ err }, 'Error during shutdown');
        process.exitCode = 1;
    }
}

async function start(): Promise<void> {
    await connectDB();

    const httpServer = app.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
    });

    httpServer.keepAliveTimeout = 65_000;
    httpServer.headersTimeout = 66_000;

    server = httpServer;

    server.on('error', (err) => {
        logger.fatal({ err }, 'Server error');
        void shutdown('server error', 1);
    });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    void shutdown('uncaughtException', 1);
});

start().catch(async (err: unknown) => {
    logger.fatal({ err }, 'Failed to start server');
    await shutdown('startup failure', 1);
});
