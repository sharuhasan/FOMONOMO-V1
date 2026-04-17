export const ACTIVITY_CATEGORIES = [
  { value: 'Sports', label: 'Sports', emoji: '⚽' },
  { value: 'Food', label: 'Food', emoji: '🍕' },
  { value: 'Study', label: 'Study', emoji: '📚' },
  { value: 'Music', label: 'Music', emoji: '🎵' },
  { value: 'Art', label: 'Art', emoji: '🎨' },
  { value: 'Social', label: 'Social', emoji: '🎉' },
  { value: 'Fitness', label: 'Fitness', emoji: '💪' },
  { value: 'Gaming', label: 'Gaming', emoji: '🎮' },
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]['value'];

export const ACTIVITY_CATEGORY_VALUES = ACTIVITY_CATEGORIES.map((c) => c.value) as [
  ActivityCategory,
  ...ActivityCategory[],
];
