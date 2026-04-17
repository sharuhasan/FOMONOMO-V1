export const SOCIETIES = [
  'Photography Club',
  'Dance Society',
  'CSE Batch 2024',
  'Apartment Community',
  'Drama Club',
  'Music Society',
  'Sports Club',
  'Coding Club',
] as const;

export type Society = (typeof SOCIETIES)[number];
