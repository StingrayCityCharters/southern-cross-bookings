import { setSessionCookie } from "@/lib/auth";
import { isFourDigitPin, normalizePin, OWNER_SIGNUP_PIN } from "@/lib/pins";
import { needsMasterPin } from "@/lib/roles";
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
    name?: string;
    hotelName?: string;
    pin?: string;
    confirmPin?: string;
    ownerSignupPin?: string;
  };

  const role = body.role;
  const name = (body.name ?? "").trim();
  const hotelName = (body.hotelName ?? "").trim();
  const pin = normalizePin(body.pin ?? "");
  const confirmPin = normalizePin(body.confirmPin ?? "");
  const ownerSignupPin = normalizePin(body.ownerSignupPin ?? "");

  if (role !== "owner" && role !== "concierge" && role !== "admin") {
    return Response.json({ error: "Choose captain, concierge, or administrator." }, { status: 400 });
  }
  if (!name) {
    return Response.json({ error: "Enter your name." }, { status: 400 });
  }
  if (role === "concierge" && !hotelName) {
    return Response.json({ error: "Enter your hotel or property." }, { status: 400 });
  }
  if (needsMasterPin(role) && ownerSignupPin !== OWNER_SIGNUP_PIN) {
    return Response.json({ error: "That master PIN is not correct." }, { status: 400 });
  }
  if (!isFourDigitPin(pin)) {
    return Response.json({ error: "Choose a 4-digit PIN." }, { status: 400 });
  }
  if (pin !== confirmPin) {
    return Response.json({ error: "Those PINs do not match." }, { status: 400 });
  }

  const result = await withDb((db) => {
    if (pin === OWNER_SIGNUP_PIN) {
      return { error: "That PIN is reserved. Choose a different 4-digit PIN." } as const;
    }
    const taken = (db.users ?? []).some((user) => user.pin === pin);
    if (taken) {
      return { error: "That PIN is already in use. Choose another." } as const;
    }

    const user = {
      id: newId("usr"),
      role,
      name,
      hotelName:
        role === "concierge" ? hotelName : hotelName || "Stingray City Charters",
      pin,
      access: "active" as const,
      createdAt: new Date().toISOString(),
    };
    db.users = db.users ?? [];
    db.users.push(user);

    const created = {
      id: newId("ses"),
      userId: user.id,
      role: user.role,
      name: user.name,
      hotelName: user.hotelName,
      createdAt: user.createdAt,
    };
    db.sessions = pruneSessions(db.sessions);
    db.sessions.push(created);
    return { session: created } as const;
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  await setSessionCookie(result.session.id);

  return Response.json({
    session: {
      role: result.session.role,
      name: result.session.name,
      hotelName: result.session.hotelName,
      createdAt: result.session.createdAt,
    },
  });
}
