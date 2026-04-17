import { z } from 'zod';

export const createCampaignSchema = z.object({
  activityId: z.string().uuid().optional(),
  campaignType: z.enum(['boost', 'sponsored', 'banner']).default('boost'),
  budget: z.number().positive('Budget must be positive'),
  durationDays: z.number().int().min(1).max(90).default(3),
  targetCategories: z.array(z.string()).optional(),
  targetRadiusKm: z.number().int().positive().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
