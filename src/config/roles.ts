export const ROLES = ['customer', 'vendor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = 'customer';

