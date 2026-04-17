import { z } from 'zod';

export const notificationTypeSchema = z.enum(['join', 'chat', 'nearby', 'reminder']);

export type NotificationType = z.infer<typeof notificationTypeSchema>;
