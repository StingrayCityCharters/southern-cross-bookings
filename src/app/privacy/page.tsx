import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy · Southern Cross Bookings",
  description: "How Southern Cross Bookings collects and uses information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-full bg-[#e7f3f4] px-4 py-10 text-cyan-950">
      <article className="mx-auto w-full max-w-2xl space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Stingray City Charters</p>
        <h1 className="font-serif text-3xl text-cyan-950">Privacy policy</h1>
        <p className="text-sm text-cyan-800">Last updated 30 August 2026</p>
        <p>
          Southern Cross Bookings is a private charter calendar for hotel concierges and the boat operator. It is
          operated by Stingray City Charters in the Cayman Islands. This page describes the information the app
          handles. It is not legal advice.
        </p>

        <h2 className="font-serif text-xl">Who this is for</h2>
        <p>
          The app is used by concierges, captains, and administrators. Guests do not create accounts. A guest name
          and optional guest phone may be entered by a concierge when holding a charter.
        </p>

        <h2 className="font-serif text-xl">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Sign-in details: name, hotel or property (for concierges), role, and a 4-digit PIN used only to sign in.</li>
          <li>
            Booking details: date and time, charter type, guest name, guest count, optional guest phone, notes, and
            who placed or cancelled the hold.
          </li>
          <li>Blocked dates and related notes entered by the boat operator.</li>
          <li>A sign-in cookie on the device so you stay logged in.</li>
          <li>
            On the sign-in screen, this device may remember your name and hotel in the browser. The PIN is not saved
            there.
          </li>
        </ul>

        <h2 className="font-serif text-xl">How we use it</h2>
        <p>We use this information to run the boat calendar: holds, approvals, cancellations, and blocked days.</p>
        <p>
          When a concierge submits a hold, we may send an alert to the boat operator on WhatsApp. That message can
          include the date, time, guest name, guest count, charter type, hotel, concierge name, and any guest phone
          or notes entered with the hold. WhatsApp is provided by Meta. Meta’s own terms and privacy policy apply to
          that delivery.
        </p>
        <p>We do not sell this information. We do not use it for ads.</p>

        <h2 className="font-serif text-xl">Who can see it</h2>
        <p>
          Concierges see the calendar and their own holds. Captains and administrators see bookings as needed to run
          the boat. Hosting and database providers that keep the app online may process the same records to store and
          serve them.
        </p>

        <h2 className="font-serif text-xl">How long we keep it</h2>
        <p>
          Booking and account records stay until the operator removes them or the service is shut down. You can ask
          the operator to correct or delete a record that relates to you.
        </p>

        <h2 className="font-serif text-xl">Contact</h2>
        <p>
          Questions about this policy or a booking record: ask the boat operator at Stingray City Charters, or ask
          the concierge who placed the hold.
        </p>

        <p>
          <Link href="/" className="font-semibold text-cyan-800 underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </article>
    </main>
  );
}
