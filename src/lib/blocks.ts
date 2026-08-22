export const BLOCK_REASONS = [
  "Weather",
  "Boat maintenance",
  "Crew or owner off",
  "Holiday / closed",
  "Private use",
  "Other",
] as const;

export type BlockReason = (typeof BLOCK_REASONS)[number];
