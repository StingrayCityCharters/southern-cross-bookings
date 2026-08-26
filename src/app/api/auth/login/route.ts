import { setSessionCookie } from "@/lib/auth";
import { isFourDigitPin, namesMatch, normalizePin } from "@/lib/pins";
import { newId, withDb } from "@/lib/store";
import type { Role, Session } from "@/lib/types";

export const dynamic = "force-dynamic";

function pruneSessions(sessions: Session[]) {
  return sessions.filter(
    (item) => Date.now() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14,
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    role?: Role;
    accessCode?: string;
    name?: string;
    hotelName?: string;
  };

  const role = body.role;
  const accessCode = normalizePin(body.accessCode ?? "");
  const name = (body.name ?? "").trim();
  const hotelName = (body.hotelName ?? "").trim();

  if (role !== "owner" && role !== "concierge" && role !== "admin") {
    return Response.json({ error: "Choose captain, concierge, or administrator." }, { status: 400 });
  }
  if (!name) {
    return Response.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!isFourDigitPin(accessCode)) {
    return Response.json({ error: "Enter your 4-digit PIN." }, { status: 400 });
  }

  const session = await withDb((db) => {
    const matches = (db.users ?? []).filter(
      (item) => item.pin === accessCode && item.role === role && namesMatch(name, item.name),
    );
    const user =
      matches.length === 1
        ? matches[0]
        : matches.length > 1
          ? matches.find((item) => item.hotelName.trim().toLowerCase() === hotelName.toLowerCase())
          : undefined;
    if (matches.length > 1 && !user) {
      return { error: "That name and PIN match more than one account. Add the hotel name.", status: 401 } as const;
    }
    if (user) {
      if (user.access === "denied") {
        return { error: "This account cannot sign in.", status: 403 } as const;
      }
      if (user.role !== role || !namesMatch(name, user.name)) {
        return { error: "That name and PIN do not match.", status: 401 } as const;
      }
      const created = {
        id: newId("ses"),
        userId: user.id,
        role: user.role,
        name: user.name,
        hotelName: user.hotelName,
        createdAt: new Date().toISOString(),
      };
      db.sessions = pruneSessions(db.sessions);
      db.sessions.push(created);
      return { session: created } as const;
    }

    if (role === "admin") {
      return { error: "That name and PIN do not match.", status: 401 } as const;
    }

    const expected = db.accessCodes[role];
    if (accessCode !== expected) {
      return { error: "That name and PIN do not match.", status: 401 } as const;
    }
    if (role === "concierge" && !hotelName) {
      return {
        error: "Enter your hotel or property so the captain knows who held the spot.",
        status: 400,
      } as const;
    }

    const created = {
      id: newId("ses"),
      userId: "",
      role,
      name: role === "owner" ? name || "Captain" : name,
      hotelName: role === "owner" ? "Stingray City Charters" : hotelName,
      createdAt: new Date().toISOString(),
    };
    db.sessions = pruneSessions(db.sessions);
    db.sessions.push(created);
    return { session: created } as const;
  });

  if ("error" in session) {
    return Response.json({ error: session.error }, { status: session.status });
  }

  await setSessionCookie(session.session.id);

  return Response.json({
    session: {
      role: session.session.role,
      name: session.session.name,
      hotelName: session.session.hotelName,
      createdAt: session.session.createdAt,
    },
  });
}
