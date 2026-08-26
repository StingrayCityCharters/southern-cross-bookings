export const BLOCK_REASONS = [
  "Weather",
  "Boat maintenance",
  "Crew or captain off",
  "Holiday / closed",
  "Private use",
  "Other",
] as const;

export type BlockReason = (typeof BLOCK_REASONS)[number];
