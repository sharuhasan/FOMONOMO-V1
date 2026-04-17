import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['info', 'warning', 'update']).default('info'),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
