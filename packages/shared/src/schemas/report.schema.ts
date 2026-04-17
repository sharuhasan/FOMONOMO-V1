import { z } from 'zod';

export const createReportSchema = z
  .object({
    reportedUserId: z.string().uuid().optional(),
    reportedActivityId: z.string().uuid().optional(),
    reason: z.string().min(1, 'Reason is required').max(1000),
  })
  .refine((data) => data.reportedUserId || data.reportedActivityId, {
    message: 'Must report either a user or an activity',
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;
