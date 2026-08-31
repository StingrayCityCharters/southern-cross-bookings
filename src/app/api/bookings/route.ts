import { requireSession } from "@/lib/auth";
import { isDateBlocked, remainingCharters, visibleBookings } from "@/lib/availability";
import { isClockTime, normalizeClockTime } from "@/lib/calendar";
import { isCharterType } from "@/lib/charters";
import { hasOwnerAccess } from "@/lib/roles";
import { newId, readOnlyDb, withDb } from "@/lib/store";
import { notifyAdminOfHold } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const bookings = await readOnlyDb((db) =>
    visibleBookings(db, session.role, session.name),
  );
  return Response.json({ bookings });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.role !== "concierge" && !hasOwnerAccess(session.role)) {
    return Response.json({ error: "Please sign in to hold a charter." }, { status: 403 });
  }

  const body = (await request.json()) as {
    tripId?: string;
    date?: string;
    guestName?: string;
    guestCount?: number;
    charterType?: string;
    charterStartTime?: string;
    charterEndTime?: string;
    phone?: string;
    notes?: string;
  };

  const tripId = body.tripId ?? "";
  const date = body.date ?? "";
  const guestName = (body.guestName ?? "").trim();
  const guestCount = Number(body.guestCount);
  const charterType = (body.charterType ?? "").trim();
  const requestedStart = normalizeClockTime(body.charterStartTime ?? "");
  const requestedEnd = normalizeClockTime(body.charterEndTime ?? "");
  const phone = (body.phone ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!tripId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Choose a date and time on the calendar." }, { status: 400 });
  }
  if (!guestName) {
    return Response.json({ error: "Enter the guest name." }, { status: 400 });
  }
  if (!isCharterType(charterType)) {
    return Response.json({ error: "Choose the type of charter." }, { status: 400 });
  }
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 40) {
    return Response.json({ error: "Enter how many guests will be on the boat." }, { status: 400 });
  }

  const result = await withDb((db) => {
    const trip = db.trips.find((item) => item.id === tripId && item.active);
    if (!trip) {
      return { error: "That charter time is not available." };
    }
    if (isDateBlocked(db, date)) {
      return { error: "The boat is blocked on that date." };
    }
    if (remainingCharters(db, tripId, date) < 1) {
      return { error: "That private charter is already held or booked." };
    }

    const charterStartTime = requestedStart || trip.startTime;
    const charterEndTime = requestedEnd || trip.endTime;
    if (!isClockTime(charterStartTime) || !isClockTime(charterEndTime)) {
      return { error: "Enter a start and end time." };
    }
    if (charterStartTime >= charterEndTime) {
      return { error: "The end time must be after the start time." };
    }

    const booking = {
      id: newId("bk"),
      tripId,
      tripName: trip.name,
      date,
      guestName,
      guestCount,
      charterType,
      charterStartTime,
      charterEndTime,
      hotelName: session.hotelName,
      conciergeName: session.name,
      phone,
      notes,
      cancelReason: "",
      cancelledByName: "",
      cancelledByRole: "" as const,
      status: hasOwnerAccess(session.role) ? "confirmed" : "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    return { booking };
  });

  if ("error" in result && result.error) {
    return Response.json({ error: result.error }, { status: 409 });
  }
  if (result.booking?.status === "pending") {
    await notifyAdminOfHold(result.booking);
  }
  return Response.json(result);
}
