import { z } from 'zod';
import { ACTIVITY_CATEGORY_VALUES } from '../constants/categories';

export const createActivitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(1000).optional(),
  category: z.enum(ACTIVITY_CATEGORY_VALUES),
  societyTag: z.string().optional(),
  apartmentCommunity: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  scheduledTime: z.string().datetime(),
  maxParticipants: z.number().int().min(2).max(100).default(10),
  genderFilter: z.enum(['any', 'women-only', 'men-only']).optional(),
  minAge: z.number().int().min(13).optional(),
  maxAge: z.number().int().max(120).optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const activityQuerySchema = z.object({
  category: z.enum(ACTIVITY_CATEGORY_VALUES).optional(),
  search: z.string().optional(),
  time: z.enum(['today', 'tomorrow', 'week']).optional(),
  societyTag: z.string().optional(),
  genderFilter: z.enum(['any', 'women-only', 'men-only']).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().positive().default(10).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;
