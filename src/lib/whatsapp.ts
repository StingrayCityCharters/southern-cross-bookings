import { formatDate, formatTimeRange } from "./format";
import type { Booking } from "./types";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function holdMessage(booking: Booking) {
  const lines = [
    "New Southern Cross hold",
    `${formatDate(booking.date)} · ${booking.tripName} · ${formatTimeRange(booking.charterStartTime, booking.charterEndTime)}`,
    `Guest: ${booking.guestName} (${booking.guestCount})`,
    `Charter: ${booking.charterType}`,
    `Concierge: ${booking.conciergeName} · ${booking.hotelName}`,
  ];
  if (booking.phone) lines.push(`Guest phone: ${booking.phone}`);
  if (booking.notes) lines.push(`Notes: ${booking.notes}`);
  return lines.join("\n");
}

export async function notifyAdminOfHold(booking: Booking) {
  if (booking.status !== "pending") return;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = digits(process.env.WHATSAPP_ADMIN_NUMBER ?? "");
  if (!token || !phoneNumberId || !to) return;

  const templateName = (process.env.WHATSAPP_TEMPLATE_NAME ?? "").trim();
  const templateLang = (process.env.WHATSAPP_TEMPLATE_LANG ?? "en").trim() || "en";
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: formatDate(booking.date) },
                {
                  type: "text",
                  text: `${booking.tripName} ${formatTimeRange(booking.charterStartTime, booking.charterEndTime)}`,
                },
                { type: "text", text: `${booking.guestName} (${booking.guestCount})` },
                { type: "text", text: booking.conciergeName || "-" },
                { type: "text", text: booking.hotelName || "-" },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: holdMessage(booking), preview_url: false },
      };

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      console.error("WhatsApp admin alert failed", response.status, detail);
    }
  } catch (error) {
    console.error("WhatsApp admin alert failed", error);
  }
}
