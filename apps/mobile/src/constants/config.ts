// How many minutes after activity start time reviews become available (when no duration is set)
export const DEFAULT_REVIEW_DELAY_MINUTES = 1;

// Duration options for the picker (in minutes)
export const DURATION_OPTIONS = [
  { label: 'No duration', value: null },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
] as const;

// Units for custom duration input — extensible (add { label: 'days', multiplier: 1440 } etc.)
export const DURATION_UNITS = [
  { label: 'minutes', multiplier: 1 },
  { label: 'hours', multiplier: 60 },
] as const;

export type DurationUnit = (typeof DURATION_UNITS)[number];
