import { sendHoldEmail } from "./email";
import { sendHoldWhatsApp } from "./whatsapp";
import type { Booking } from "./types";

export async function notifyAdminOfHold(booking: Booking) {
  if (booking.status !== "pending") return;
  await Promise.all([sendHoldEmail(booking), sendHoldWhatsApp(booking)]);
}
