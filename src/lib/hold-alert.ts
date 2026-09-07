import { formatDate, formatTimeRange } from "./format";
import type { Booking } from "./types";

export function holdMessage(booking: Booking) {
  const lines = [
    "New Southern Cross hold",
    `${formatDate(booking.date)} · ${booking.tripName} · ${formatTimeRange(booking.charterStartTime, booking.charterEndTime)}`,
    `Guest: ${booking.guestName} (${booking.guestCount})`,
    `Charter: ${booking.charterType}`,
    `Concierge: ${booking.conciergeName} · ${booking.hotelName}`,
  ];
  if (booking.phone) lines.push(`Guest phone: ${booking.phone}`);
  if (booking.notes) lines.push(`Notes: ${booking.notes}`);
  lines.push("", "Open the captain board to approve or decline.");
  return lines.join("\n");
}
