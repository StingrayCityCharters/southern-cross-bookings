import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { newId, withDb } from "@/lib/store";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    role?: Role;
    accessCode?: string;
    name?: string;
    hotelName?: string;
  };

  const role = body.role;
  const accessCode = (body.accessCode ?? "").trim();
  const name = (body.name ?? "").trim();
  const hotelName = (body.hotelName ?? "").trim();

  if (role !== "owner" && role !== "concierge") {
    return Response.json({ error: "Choose owner or concierge." }, { status: 400 });
  }
  if (!accessCode) {
    return Response.json({ error: "Enter the access code." }, { status: 400 });
  }
  if (role === "concierge" && (!name || !hotelName)) {
    return Response.json(
      { error: "Enter your name and property so the owner knows who held the spot." },
      { status: 400 },
    );
  }

  const session = await withDb((db) => {
    const expected = db.accessCodes[role];
    if (accessCode !== expected) {
      return null;
    }
    const created = {
      id: newId("ses"),
      role,
      name: role === "owner" ? name || "Owner" : name,
      hotelName: role === "owner" ? "Stingray City Charters" : hotelName,
      createdAt: new Date().toISOString(),
    };
    db.sessions = db.sessions.filter(
      (item) => Date.now() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14,
    );
    db.sessions.push(created);
    return created;
  });

  if (!session) {
    return Response.json({ error: "That access code is not correct." }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return Response.json({
    session: {
      role: session.role,
      name: session.name,
      hotelName: session.hotelName,
      createdAt: session.createdAt,
    },
  });
}
