import { requireAdmin } from "@/lib/auth";
import { readOnlyDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await readOnlyDb((db) =>
    (db.users ?? [])
      .map((user) => ({
        id: user.id,
        role: user.role,
        name: user.name,
        hotelName: user.hotelName,
        pin: user.pin,
        access: user.access,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name) || a.role.localeCompare(b.role)),
  );

  return Response.json({ users });
}
