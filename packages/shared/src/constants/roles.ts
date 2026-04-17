export const APP_ROLES = ['admin', 'moderator', 'user', 'sponsor'] as const;
export type AppRole = (typeof APP_ROLES)[number];
