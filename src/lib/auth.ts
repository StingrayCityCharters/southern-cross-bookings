import { cookies } from "next/headers";
import { readOnlyDb } from "./store";
import { hasOwnerAccess } from "./roles";
import type { Session } from "./types";

export const SESSION_COOKIE = "scc_session";

export async function setSessionCookie(sessionId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

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
  if (!hasOwnerAccess(session.role)) {
    return {
      session: null,
      error: Response.json({ error: "Captain access only." }, { status: 403 }),
    };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (session.role !== "admin") {
    return {
      session: null,
      error: Response.json({ error: "Administrator access only." }, { status: 403 }),
    };
  }
  return { session, error: null };
}
