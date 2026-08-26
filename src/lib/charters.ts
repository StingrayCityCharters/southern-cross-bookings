export const CHARTER_TYPES = [
  "Deep sea fishing",
  "Inshore fishing/Stingray city",
  "Kaibo evening cruise",
] as const;

export type CharterType = (typeof CHARTER_TYPES)[number];

export function isCharterType(value: string): value is CharterType {
  return (CHARTER_TYPES as readonly string[]).includes(value);
}
