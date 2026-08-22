import { requireOwner } from "@/lib/auth";
import { withDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireOwner();
  if (error) return error;
  const { id } = await context.params;

  const removed = await withDb((db) => {
    const existing = db.blockedRanges.find((item) => item.id === id);
    if (!existing) return null;
    db.blockedRanges = db.blockedRanges.filter((item) => item.id !== id);
    return existing;
  });

  if (!removed) {
    return Response.json({ error: "Block not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
