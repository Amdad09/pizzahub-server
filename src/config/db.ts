import { MongoClient } from 'mongodb';

import { env } from './env.js';
import { logger } from '../shared/logger/logger.js';

export const mongoClient = new MongoClient(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
});

export const db = mongoClient.db(env.DB_NAME);

export async function connectDB(): Promise<void> {
    await mongoClient.connect();
    await db.command({ ping: 1 });

    logger.info({ database: env.DB_NAME }, 'MongoDB connected');
}

export async function closeDB(): Promise<void> {
    await mongoClient.close();

    logger.info('MongoDB connection closed');
}
