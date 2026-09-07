import { formatDate, formatTimeRange } from "./format";
import { holdMessage } from "./hold-alert";
import type { Booking } from "./types";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export async function sendHoldWhatsApp(booking: Booking) {
  if (booking.status !== "pending") return;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = digits(process.env.WHATSAPP_ADMIN_NUMBER ?? "");
  if (!token || !phoneNumberId || !to) return;

  const templateName = (process.env.WHATSAPP_TEMPLATE_NAME ?? "").trim();
  const templateLang = (process.env.WHATSAPP_TEMPLATE_LANG ?? "en_US").trim() || "en_US";
  const templateParamCount = Number(process.env.WHATSAPP_TEMPLATE_PARAMS ?? "0");
  const template =
    templateParamCount > 0
      ? {
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
              ].slice(0, templateParamCount),
            },
          ],
        }
      : {
          name: templateName,
          language: { code: templateLang },
        };
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template,
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
