import type { Role } from '../../config/roles.js';

declare global {
    namespace Express {
        interface Request {
            auth?: {
                user: {
                    id: string;
                    role: Role;
                    isBlocked: boolean;
                };
                session: {
                    id: string;
                };
            };
        }
    }
}

export {};
