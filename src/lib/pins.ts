export const OWNER_SIGNUP_PIN = "1388";

export function normalizePin(value: string) {
  return value.trim();
}

export function isFourDigitPin(value: string) {
  return /^\d{4}$/.test(value);
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function namesMatch(a: string, b: string) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

export function uniqueFourDigitPin(taken: Iterable<string>) {
  const used = new Set(taken);
  used.add(OWNER_SIGNUP_PIN);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const pin = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    if (!used.has(pin)) return pin;
  }
  throw new Error("Could not assign a new PIN.");
}
