import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  interests: z.array(z.string()).optional(),
  societies: z.array(z.string()).optional(),
  profilePrimary: z.string().optional(),
  profileSecondary: z.string().optional(),
  profileAccent: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
