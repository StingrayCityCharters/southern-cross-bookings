import nodemailer from "nodemailer";
import { holdMessage } from "./hold-alert";
import type { Booking } from "./types";

export async function sendHoldEmail(booking: Booking) {
  const to = (process.env.ADMIN_NOTIFY_EMAIL ?? "chipwhitney@gmail.com").trim();
  const user = (process.env.SMTP_USER ?? "chipwhitney@gmail.com").trim();
  const pass = process.env.SMTP_PASS ?? "";
  const host = (process.env.SMTP_HOST ?? "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!to || !user || !pass) return;

  const from = (process.env.SMTP_FROM ?? user).trim();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Southern Cross hold · ${booking.guestName} · ${booking.date}`,
      text: holdMessage(booking),
    });
  } catch (error) {
    console.error("Admin hold email failed", error);
  }
}
