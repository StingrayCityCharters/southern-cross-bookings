import { cookies } from "next/headers";
import { readOnlyDb } from "./store";
import type { Session } from "./types";

export const SESSION_COOKIE = "scc_session";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return readOnlyDb((db) => db.sessions.find((session) => session.id === id) ?? null);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: Response.json({ error: "Please sign in." }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireOwner() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (session.role !== "owner") {
    return {
      session: null,
      error: Response.json({ error: "Owner access only." }, { status: 403 }),
    };
  }
  return { session, error: null };
}
