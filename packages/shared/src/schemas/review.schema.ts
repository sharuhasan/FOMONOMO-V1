import { z } from 'zod';

export const createReviewSchema = z.object({
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
