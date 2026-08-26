export type SignInRole = "concierge" | "owner" | "admin";

export type SignInMemory = {
  role?: SignInRole;
  name?: string;
  hotelName?: string;
};

const KEY = "scc_sign_in";

function asRole(value: unknown): SignInRole | undefined {
  if (value === "owner" || value === "concierge" || value === "admin") return value;
  return undefined;
}

export function readSignInMemory(): SignInMemory {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SignInMemory;
    return {
      role: asRole(parsed.role),
      name: typeof parsed.name === "string" ? parsed.name : "",
      hotelName: typeof parsed.hotelName === "string" ? parsed.hotelName : "",
    };
  } catch {
    return {};
  }
}

export function writeSignInMemory(memory: SignInMemory) {
  try {
    const current = readSignInMemory();
    localStorage.setItem(
      KEY,
      JSON.stringify({
        role: memory.role ?? current.role,
        name: memory.name ?? current.name ?? "",
        hotelName:
          memory.hotelName !== undefined ? memory.hotelName : (current.hotelName ?? ""),
      }),
    );
  } catch {
    // Private browsing or blocked storage; sign-in still works without memory.
  }
}
