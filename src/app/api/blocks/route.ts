import { BLOCK_REASONS } from "@/lib/blocks";
import { bookingsConflictingWithRange } from "@/lib/availability";
import { requireOwner, requireSession } from "@/lib/auth";
import { newId, readOnlyDb, withDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const blockedRanges = await readOnlyDb((db) =>
    [...db.blockedRanges].sort((a, b) => a.startDate.localeCompare(b.startDate)),
  );
  return Response.json({ blockedRanges });
}

export async function POST(request: Request) {
  const { session, error } = await requireOwner();
  if (error || !session) return error ?? Response.json({ error: "Captain access only." }, { status: 403 });

  const body = (await request.json()) as {
    startDate?: string;
    endDate?: string;
    reason?: string;
    notes?: string;
    acknowledgeConflicts?: boolean;
  };

  const startDate = (body.startDate ?? "").trim();
  const endDate = (body.endDate ?? "").trim();
  const reason = (body.reason ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return Response.json({ error: "Highlight a start day and an end day on the calendar." }, { status: 400 });
  }
  if (!(BLOCK_REASONS as readonly string[]).includes(reason)) {
    return Response.json({ error: "Choose a reason from the list." }, { status: 400 });
  }
  if (reason === "Other" && !notes) {
    return Response.json({ error: "Add a short note for “Other.”" }, { status: 400 });
  }

  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;

  const result = await withDb((db) => {
    const conflicts = bookingsConflictingWithRange(db, start, end);
    if (conflicts.length > 0 && !body.acknowledgeConflicts) {
      return {
        needsAck: true as const,
        conflicts: conflicts.map((booking) => ({
          id: booking.id,
          guestName: booking.guestName,
          hotelName: booking.hotelName,
          date: booking.date,
          tripName: booking.tripName,
          status: booking.status,
        })),
      };
    }
    const created = {
      id: newId("blk"),
      startDate: start,
      endDate: end,
      reason,
      notes,
      createdAt: new Date().toISOString(),
      createdBy: session.name,
    };
    db.blockedRanges.push(created);
    return { blockedRange: created };
  });

  if ("needsAck" in result) {
    const conflicts = result.conflicts ?? [];
    return Response.json(
      {
        error: `${conflicts.length} booking${conflicts.length === 1 ? "" : "s"} already sit on those days.`,
        conflicts,
      },
      { status: 409 },
    );
  }

  return Response.json(result);
}
