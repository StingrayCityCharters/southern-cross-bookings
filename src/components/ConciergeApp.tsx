"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { BookingNotes } from "./BookingNotes";
import { CancelTourForm } from "./CancelTourForm";
import { SignOutButton } from "./SignOutButton";
import { CHARTER_TYPES } from "@/lib/charters";
import { parseYearMonth, yearMonthIso } from "@/lib/calendar";
import { formatDate, formatTimeRange, statusLabel, todayIso } from "@/lib/format";
import type { Booking, PublicSession, SlotAvailability, SlotStatus, Trip } from "@/lib/types";

type Props = {
  session: PublicSession;
};

type MonthPayload = {
  trips?: Array<Trip & { shortLabel: string }>;
  days?: Record<string, Record<string, SlotAvailability>>;
};

export function ConciergeApp({ session }: Props) {
  const initial = parseYearMonth(todayIso());
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [days, setDays] = useState<Record<string, Record<string, SlotAvailability>>>({});
  const [trips, setTrips] = useState<Array<Trip & { shortLabel: string }>>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedTripId, setSelectedTripId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [charterType, setCharterType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [charterStartTime, setCharterStartTime] = useState("08:00");
  const [charterEndTime, setCharterEndTime] = useState("12:00");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId),
    [trips, selectedTripId],
  );
  const selectedSlot = selectedDate && selectedTripId ? days[selectedDate]?.[selectedTripId] : undefined;

  async function load() {
    const [availabilityRes, bookingsRes] = await Promise.all([
      fetch(`/api/availability?month=${yearMonthIso(year, month)}`),
      fetch("/api/bookings"),
    ]);
    const availability = (await availabilityRes.json()) as MonthPayload;
    const bookingData = (await bookingsRes.json()) as { bookings?: Booking[] };
    setTrips(availability.trips ?? []);
    setDays(availability.days ?? {});
    setBookings(bookingData.bookings ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => {
    if (!selectedTrip) return;
    setCharterStartTime(selectedTrip.startTime);
    setCharterEndTime(selectedTrip.endTime);
  }, [selectedTrip]);

  function selectSlot(date: string, tripId: string, status: SlotStatus, blocked: boolean) {
    setSelectedDate(date);
    setSelectedTripId(tripId);
    setMessage("");
    if (blocked) {
      setError("The boat is blocked on that date.");
      return;
    }
    if (status === "available") {
      setError("");
      return;
    }
    setError(
      status === "pending"
        ? "That private charter already has a pending hold."
        : "That private charter is already booked.",
    );
  }

  async function holdCharter(event: FormEvent) {
    event.preventDefault();
    if (!selectedTripId || !selectedDate) {
      setError("Tap an open time on the calendar.");
      return;
    }
    if (selectedSlot && (selectedSlot.blocked || selectedSlot.status !== "available")) {
      setError("That private charter is not open.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: selectedTripId,
        date: selectedDate,
        guestName,
        charterType,
        charterStartTime,
        charterEndTime,
        guestCount: Number(guestCount),
        phone,
        notes,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not hold that charter.");
      await load();
      return;
    }
    setMessage("Hold submitted. The boat is pending captain approval.");
    setGuestName("");
    setCharterType("");
    setGuestCount("");
    setNotes("");
    setPhone("");
    setSelectedTripId("");
    await load();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-6 sm:px-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Concierge</p>
          <h1 className="font-serif text-3xl text-cyan-950">Private charters</h1>
          <p className="text-sm text-cyan-800">
            {session.name} · {session.hotelName}
          </p>
        </div>
        <SignOutButton />
      </header>

      <AvailabilityCalendar
        year={year}
        month={month}
        trips={trips}
        days={days}
        selectedDate={selectedDate}
        selectedTripId={selectedTripId}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
        onSelectSlot={selectSlot}
      />

      <form onSubmit={holdCharter} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-cyan-950">Pencil in a private charter</h2>
        <p className="text-sm text-cyan-700">
          {selectedTrip && selectedDate
            ? `${formatDate(selectedDate)} · ${selectedTrip.name} · entire boat`
            : "Tap an open time (blue) on the calendar."}
        </p>
        <input
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Guest name"
          className="w-full rounded-xl border border-cyan-900/15 px-3 py-3"
          required
        />
        <label className="block space-y-1 text-sm font-medium text-cyan-900">
          Type of charter
          <select
            value={charterType}
            onChange={(event) => setCharterType(event.target.value)}
            className="w-full rounded-xl border border-cyan-900/15 bg-white px-3 py-3 text-base font-normal text-cyan-950"
            required
          >
            <option value="" disabled>
              Choose type of charter
            </option>
            {CHARTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <input
          value={guestCount}
          onChange={(event) => setGuestCount(event.target.value)}
          inputMode="numeric"
          placeholder="Number of guests"
          className="w-full rounded-xl border border-cyan-900/15 px-3 py-3"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1 text-sm font-medium text-cyan-900">
            Start
            <input
              type="time"
              value={charterStartTime}
              onChange={(event) => setCharterStartTime(event.target.value)}
              className="w-full rounded-xl border border-cyan-900/15 bg-white px-3 py-3 text-base font-normal text-cyan-950"
              required
            />
          </label>
          <label className="block space-y-1 text-sm font-medium text-cyan-900">
            End
            <input
              type="time"
              value={charterEndTime}
              onChange={(event) => setCharterEndTime(event.target.value)}
              className="w-full rounded-xl border border-cyan-900/15 bg-white px-3 py-3 text-base font-normal text-cyan-950"
              required
            />
          </label>
        </div>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Guest phone (optional)"
          className="w-full rounded-xl border border-cyan-900/15 px-3 py-3"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes for the boat (optional)"
          className="min-h-24 w-full rounded-xl border border-cyan-900/15 px-3 py-3"
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-cyan-800 px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Holding…" : "Request private hold"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold text-cyan-950">Your requests</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-cyan-700">No holds yet.</p>
        ) : (
          bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-cyan-950">{booking.guestName}</p>
              <p className="text-sm text-cyan-700">
                {booking.tripName} · {formatDate(booking.date)}
                {formatTimeRange(booking.charterStartTime ?? "", booking.charterEndTime ?? "")
                  ? ` · ${formatTimeRange(booking.charterStartTime ?? "", booking.charterEndTime ?? "")}`
                  : ""}{" "}
                · {booking.guestCount} guests · {statusLabel(booking.status)}
              </p>
              <BookingNotes booking={booking} />
              <CancelTourForm booking={booking} onCancelled={load} />
            </article>
          ))
        )}
      </section>
    </div>
  );
}
