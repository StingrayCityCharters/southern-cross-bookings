import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { withDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    await withDb((db) => {
      db.sessions = db.sessions.filter((session) => session.id !== id);
    });
  }
  jar.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
