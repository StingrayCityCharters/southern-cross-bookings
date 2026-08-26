import { requireAdmin } from "@/lib/auth";
import { uniqueFourDigitPin } from "@/lib/pins";
import { isProtectedOwnerName } from "@/lib/roles";
import { withDb } from "@/lib/store";

export const dynamic = "force-dynamic";

type Action = "deny" | "allow" | "resetPin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = (await request.json()) as { action?: Action };
  const action = body.action;

  if (action !== "deny" && action !== "allow" && action !== "resetPin") {
    return Response.json({ error: "Choose reset, deny, or allow." }, { status: 400 });
  }

  const result = await withDb((db) => {
    const user = (db.users ?? []).find((item) => item.id === id);
    if (!user) {
      return { error: "That account was not found." } as const;
    }

    if (action === "deny") {
      if (isProtectedOwnerName(user.name) || user.id === session.userId) {
        return { error: "You cannot deny your own account." } as const;
      }
      const otherAdmins = (db.users ?? []).filter(
        (item) => item.role === "admin" && item.access !== "denied" && item.id !== user.id,
      );
      if (user.role === "admin" && otherAdmins.length === 0) {
        return { error: "Keep at least one active administrator." } as const;
      }
      user.access = "denied";
      db.sessions = db.sessions.filter((item) => item.userId !== user.id);
      return { user } as const;
    }

    if (action === "allow") {
      user.access = "active";
      return { user } as const;
    }

    const taken = (db.users ?? []).map((item) => item.pin);
    const pin = uniqueFourDigitPin(taken);
    user.pin = pin;
    db.sessions = db.sessions.filter((item) => item.userId !== user.id);
    return { user, pin } as const;
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({
    user: {
      id: result.user.id,
      role: result.user.role,
      name: result.user.name,
      hotelName: result.user.hotelName,
      pin: result.user.pin,
      access: result.user.access,
      createdAt: result.user.createdAt,
    },
    newPin: "pin" in result ? result.pin : undefined,
  });
}
