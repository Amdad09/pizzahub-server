import pino, { type LevelWithSilent } from 'pino';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const LOG_LEVELS = {
    development: 'debug',
    test: 'silent',
    production: 'info',
} as const satisfies Record<string, LevelWithSilent>;

const logLevel = Object.hasOwn(LOG_LEVELS, NODE_ENV)
    ? LOG_LEVELS[NODE_ENV as keyof typeof LOG_LEVELS]
    : 'info';

export const logger = pino({
    level: logLevel,

    transport:
        NODE_ENV === 'development'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,

    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'password',
            'token',
            '*.password',
            '*.token',
            '*.accessToken',
            '*.refreshToken',
            '*.secret',
        ],
        censor: '[REDACTED]',
    },
});
