import { slotLabel, yearMonthIso } from "./calendar";
import type {
  Booking,
  Database,
  SlotAvailability,
  SlotStatus,
  TripAvailability,
} from "./types";

const ACTIVE_STATUSES = new Set(["pending", "confirmed"]);

export function activeCharters(
  db: Database,
  tripId: string,
  date: string,
  excludeId?: string,
) {
  return db.bookings.filter(
    (booking) =>
      booking.tripId === tripId &&
      booking.date === date &&
      ACTIVE_STATUSES.has(booking.status) &&
      booking.id !== excludeId,
  );
}

export function remainingCharters(
  db: Database,
  tripId: string,
  date: string,
  excludeId?: string,
) {
  const trip = db.trips.find((item) => item.id === tripId);
  if (!trip) return 0;
  return Math.max(0, trip.boats - activeCharters(db, tripId, date, excludeId).length);
}

function statusFor(active: Booking[], remaining: number): SlotStatus {
  if (remaining > 0) return "available";
  if (active.some((booking) => booking.status === "confirmed")) return "booked";
  return "pending";
}

export function slotForTrip(
  db: Database,
  tripId: string,
  date: string,
  excludeId?: string,
): SlotAvailability | null {
  const trip = db.trips.find((item) => item.id === tripId && item.active);
  if (!trip) return null;
  const active = activeCharters(db, tripId, date, excludeId);
  const remaining = Math.max(0, trip.boats - active.length);
  return {
    tripId: trip.id,
    shortLabel: slotLabel(trip.startTime),
    status: statusFor(active, remaining),
    remaining,
    boats: trip.boats,
  };
}

export function availabilityForDate(db: Database, date: string): TripAvailability[] {
  return db.trips
    .filter((trip) => trip.active)
    .map((trip) => {
      const slot = slotForTrip(db, trip.id, date);
      return {
        ...trip,
        shortLabel: slot?.shortLabel ?? slotLabel(trip.startTime),
        status: slot?.status ?? "available",
        remaining: slot?.remaining ?? trip.boats,
      };
    });
}

export function availabilityForMonth(db: Database, year: number, month: number) {
  const trips = db.trips.filter((trip) => trip.active);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: Record<string, Record<string, SlotAvailability>> = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${yearMonthIso(year, month)}-${String(day).padStart(2, "0")}`;
    days[date] = {};
    for (const trip of trips) {
      const slot = slotForTrip(db, trip.id, date);
      if (slot) days[date][trip.id] = slot;
    }
  }

  return {
    month: yearMonthIso(year, month),
    trips: trips.map((trip) => ({ ...trip, shortLabel: slotLabel(trip.startTime) })),
    days,
  };
}

export function visibleBookings(
  db: Database,
  role: "owner" | "concierge",
  conciergeName?: string,
): Booking[] {
  const list =
    role === "owner"
      ? db.bookings
      : db.bookings.filter((booking) => booking.conciergeName === conciergeName);

  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });
}
