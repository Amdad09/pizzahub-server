import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { APIError, betterAuth } from 'better-auth';

import { db, mongoClient } from './db.js';
import { env } from './env.js';
import { DEFAULT_ROLE, ROLES } from './roles.js';

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    database: mongodbAdapter(db, {
        client: mongoClient,
    }),

    trustedOrigins: [env.CLIENT_URL],

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
    },
    password: {
        minLength: 6,
        requireUppercase: true,
        requireLowercase: true,
    },
    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: false,
                defaultValue: DEFAULT_ROLE,
                input: true,
            },

            isBlocked: {
                type: 'boolean',
                required: false,
                defaultValue: false,
                input: false,
            },

            businessName: {
                type: 'string',
                required: false,
                input: true,
            },

            subscriptionPlan: {
                type: 'string',
                required: false,
                defaultValue: 'free',
                input: false,
            },

            subscriptionExpiresAt: {
                type: 'date',
                required: false,
                input: false,
            },
        },
    },
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
              socialProviders: {
                  google: {
                      clientId: env.GOOGLE_CLIENT_ID,
                      clientSecret: env.GOOGLE_CLIENT_SECRET,
                  },
              },
          }
        : {}),
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const requestedRole = user.role ?? DEFAULT_ROLE;

                    if (
                        !ROLES.includes(
                            requestedRole as (typeof ROLES)[number],
                        ) ||
                        requestedRole === 'admin'
                    ) {
                        throw new APIError('BAD_REQUEST', {
                            message: 'Invalid registration role',
                        });
                    }

                    return {
                        data: {
                            ...user,
                            role: requestedRole,
                            isBlocked: false,
                            subscriptionPlan: 'free',
                        },
                    };
                },
            },
        },
    },
});
