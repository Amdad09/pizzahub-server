import { closeDB, connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { users } from '../database/collections.js';
import { logger } from '../shared/logger/logger.js';

async function main(): Promise<void> {
    try {
        if (!env.ADMIN_NAME || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
            throw new Error(
                'ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required',
            );
        }

        await connectDB();

        const existingUser = await users.findOne({
            email: env.ADMIN_EMAIL,
        });

        if (existingUser) {
            if (existingUser.role === 'admin') {
                logger.info('Admin account already exists');
                return;
            }

            throw new Error(
                'An account with this email already exists. Manual review required.',
            );
        }

        const { auth } = await import('../config/auth.js');

        await auth.api.signUpEmail({
            body: {
                name: env.ADMIN_NAME,
                email: env.ADMIN_EMAIL,
                password: env.ADMIN_PASSWORD,
            },
        });

        const result = await users.updateOne(
            { email: env.ADMIN_EMAIL },
            {
                $set: {
                    role: 'admin',
                    isBlocked: false,
                },
            },
        );

        if (result.matchedCount !== 1) {
            throw new Error('Failed to assign admin role');
        }

        logger.info(
            { email: env.ADMIN_EMAIL },
            'Admin account created successfully',
        );
    } catch (error) {
        logger.error({ err: error }, 'Admin seeding failed');
        process.exitCode = 1;
    } finally {
        await closeDB();
    }
}

await main();
