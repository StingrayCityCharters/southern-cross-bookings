import { holdMessage } from "./hold-alert";
import { sendEmail } from "@/server/email";
import type { Booking } from "./types";

export async function sendHoldEmail(booking: Booking) {
  const to = (process.env.ADMIN_NOTIFY_EMAIL ?? "").trim();
  if (!to) {
    console.error("email.hold.recipient_unset");
    return;
  }

  try {
    await sendEmail({
      to,
      subject: `Southern Cross hold · ${booking.guestName} · ${booking.date}`,
      text: holdMessage(booking),
    });
  } catch {
    console.error("Admin hold email failed");
  }
}
