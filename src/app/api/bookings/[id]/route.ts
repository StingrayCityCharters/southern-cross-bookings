import { requireOwner, requireSession } from "@/lib/auth";
import { remainingCharters } from "@/lib/availability";
import { withDb } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status?: BookingStatus; cancelReason?: string };
  const status = body.status;

  if (status === "cancelled") {
    const { session, error } = await requireSession();
    if (error) return error;
    const cancelReason = (body.cancelReason ?? "").trim();
    if (!cancelReason) {
      return Response.json({ error: "Enter a reason for cancelling this tour." }, { status: 400 });
    }

    const booking = await withDb((db) => {
      const existing = db.bookings.find((item) => item.id === id);
      if (!existing) return null;
      if (session.role === "concierge" && existing.conciergeName !== session.name) {
        return { forbidden: true as const };
      }
      if (existing.status !== "pending" && existing.status !== "confirmed") {
        return { error: "This tour is already closed." };
      }
      existing.status = "cancelled";
      existing.cancelReason = cancelReason;
      existing.cancelledByName = session.name;
      existing.cancelledByRole = session.role;
      existing.updatedAt = new Date().toISOString();
      return { booking: existing };
    });

    if (!booking) return Response.json({ error: "Booking not found." }, { status: 404 });
    if ("forbidden" in booking) {
      return Response.json({ error: "You can only cancel your own tours." }, { status: 403 });
    }
    if ("error" in booking) {
      return Response.json({ error: booking.error }, { status: 409 });
    }
    return Response.json(booking);
  }

  if (status !== "confirmed" && status !== "declined") {
    return Response.json({ error: "Choose confirm, decline, or cancel." }, { status: 400 });
  }

  const { error } = await requireOwner();
  if (error) return error;

  const result = await withDb((db) => {
    const existing = db.bookings.find((item) => item.id === id);
    if (!existing) return { notFound: true as const };
    if (existing.status !== "pending") {
      return { error: "This request is no longer pending." };
    }
    if (status === "confirmed" && remainingCharters(db, existing.tripId, existing.date, existing.id) < 1) {
      return {
        error: "This private charter is no longer open. Decline this hold or free the time first.",
      };
    }
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    return { booking: existing };
  });

  if ("notFound" in result) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 409 });
  }
  return Response.json(result);
}
