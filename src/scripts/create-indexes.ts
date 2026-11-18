import { closeDB, connectDB } from '../config/db.js';
import { createDatabaseIndexes } from '../database/indexes.js';
import { logger } from '../shared/logger/logger.js';

async function main(): Promise<void> {
    try {
        await connectDB();
        await createDatabaseIndexes();

        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error({ err: error }, 'Failed to create database indexes');
        process.exitCode = 1;
    } finally {
        await closeDB();
    }
}

await main();
