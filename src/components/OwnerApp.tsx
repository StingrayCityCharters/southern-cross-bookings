"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { BlockDaysCalendar } from "./BlockDaysCalendar";
import { BookingNotes } from "./BookingNotes";
import { CancelTourForm } from "./CancelTourForm";
import { SignOutButton } from "./SignOutButton";
import { BLOCK_REASONS } from "@/lib/blocks";
import { datesBetween, parseYearMonth, yearMonthIso } from "@/lib/calendar";
import { CHARTER_TYPES } from "@/lib/charters";
import { formatDate, formatTimeRange, statusLabel, todayIso } from "@/lib/format";
import type {
  BlockedRange,
  Booking,
  PublicSession,
  SlotAvailability,
  SlotStatus,
  Trip,
} from "@/lib/types";

type Props = {
  session: PublicSession;
};

type BlockConflict = {
  id: string;
  guestName: string;
  hotelName: string;
  date: string;
  tripName: string;
  status: string;
};

type MonthPayload = {
  trips?: Array<Trip & { shortLabel: string }>;
  days?: Record<string, Record<string, SlotAvailability>>;
};

export function OwnerApp({ session }: Props) {
  const initial = parseYearMonth(todayIso());
  const [tab, setTab] = useState<"calendar" | "pending" | "trips">("calendar");
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [days, setDays] = useState<Record<string, Record<string, SlotAvailability>>>({});
  const [calendarTrips, setCalendarTrips] = useState<Array<Trip & { shortLabel: string }>>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedTripId, setSelectedTripId] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");
  const [openBookingId, setOpenBookingId] = useState("");
  const [calendarTool, setCalendarTool] = useState<"view" | "block">("view");
  const [guestName, setGuestName] = useState("");
  const [charterType, setCharterType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [charterStartTime, setCharterStartTime] = useState("08:00");
  const [charterEndTime, setCharterEndTime] = useState("12:00");
  const [phone, setPhone] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [busyHold, setBusyHold] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState<(typeof BLOCK_REASONS)[number]>("Weather");
  const [blockNotes, setBlockNotes] = useState("");
  const [blockMessage, setBlockMessage] = useState("");
  const [conflictAlert, setConflictAlert] = useState<BlockConflict[]>([]);

  const pending = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings],
  );
  const selectedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.date === selectedDate &&
          (selectedTripId ? booking.tripId === selectedTripId : true) &&
          booking.status !== "cancelled" &&
          booking.status !== "declined",
      ),
    [bookings, selectedDate, selectedTripId],
  );
  const selectedTrip = calendarTrips.find((trip) => trip.id === selectedTripId);
  const selectedSlot =
    selectedDate && selectedTripId ? days[selectedDate]?.[selectedTripId] : undefined;
  const bookedTrips = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.status === "pending" ||
            booking.status === "confirmed" ||
            booking.status === "cancelled",
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
    [bookings],
  );
  const openBooking = bookings.find((booking) => booking.id === openBookingId);
  const selectedBlock = blockedRanges.find(
    (range) => range.startDate <= selectedDate && selectedDate <= range.endDate,
  );
  const alreadyBlocked = useMemo(() => {
    const dates = new Set<string>();
    for (const range of blockedRanges) {
      for (const date of datesBetween(range.startDate, range.endDate)) {
        dates.add(date);
      }
    }
    return dates;
  }, [blockedRanges]);
  const rangeEnd = blockEnd || blockStart;
  const blockConflicts = useMemo(() => {
    if (!blockStart || !rangeEnd) return [];
    const start = blockStart <= rangeEnd ? blockStart : rangeEnd;
    const end = blockStart <= rangeEnd ? rangeEnd : blockStart;
    return bookings
      .filter(
        (booking) =>
          (booking.status === "pending" || booking.status === "confirmed") &&
          booking.date >= start &&
          booking.date <= end,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bookings, blockStart, rangeEnd]);
  const openBookingTrip = trips.find((trip) => trip.id === openBooking?.tripId);

  async function load() {
    const [bookingsRes, availabilityRes, tripsRes, blocksRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch(`/api/availability?month=${yearMonthIso(year, month)}`),
      fetch("/api/trips"),
      fetch("/api/blocks"),
    ]);
    const bookingData = (await bookingsRes.json()) as { bookings?: Booking[] };
    const availability = (await availabilityRes.json()) as MonthPayload;
    const tripData = (await tripsRes.json()) as { trips?: Trip[] };
    const blockData = (await blocksRes.json()) as { blockedRanges?: BlockedRange[] };
    setBookings(bookingData.bookings ?? []);
    setDays(availability.days ?? {});
    setCalendarTrips(availability.trips ?? []);
    setTrips(tripData.trips ?? []);
    setBlockedRanges(blockData.blockedRanges ?? []);
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

  async function setStatus(id: string, status: "confirmed" | "declined") {
    setError("");
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not update that booking.");
    }
    await load();
  }

  async function saveBlock(acknowledgeConflicts = false, event?: FormEvent) {
    event?.preventDefault();
    setError("");
    setBlockMessage("");
    const response = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: blockStart,
        endDate: blockEnd || blockStart,
        reason: blockReason,
        notes: blockNotes,
        acknowledgeConflicts,
      }),
    });
    const data = (await response.json()) as { error?: string; conflicts?: BlockConflict[] };
    if (response.status === 409 && data.conflicts?.length) {
      setConflictAlert(data.conflicts);
      return;
    }
    if (!response.ok) {
      setError(data.error ?? "Could not block those days.");
      return;
    }
    setConflictAlert([]);
    setBlockStart("");
    setBlockEnd("");
    setBlockNotes("");
    setBlockMessage("Those days are now blocked.");
    await load();
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
    setBusyHold(true);
    setError("");
    setBookingMessage("");
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
        notes: bookingNotes,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setBusyHold(false);
    if (!response.ok) {
      setError(data.error ?? "Could not book that charter.");
      await load();
      return;
    }
    setBookingMessage("Private charter booked.");
    setGuestName("");
    setCharterType("");
    setGuestCount("");
    setBookingNotes("");
    setPhone("");
    setSelectedTripId("");
    await load();
  }

  async function removeBlock(id: string) {
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    await load();
  }

  function selectSlot(date: string, tripId: string, status: SlotStatus, blocked: boolean) {
    setSelectedDate(date);
    setSelectedTripId(tripId);
    setBookingMessage("");
    if (blocked) {
      setError("The boat is blocked on that date.");
      return;
    }
    if (status === "available") {
      setError("");
      return;
    }
    setError("");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-6 sm:px-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">
            {session.role === "admin" ? "Administrator" : "Captain"}
          </p>
          <h1 className="font-serif text-3xl text-cyan-950">Operations board</h1>
          <p className="text-sm text-cyan-800">{session.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {session.role === "admin" ? (
            <a
              href="/admin"
              className="rounded-full border border-cyan-800/20 px-3 py-1.5 text-sm text-cyan-900"
            >
              Accounts
            </a>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1">
        {(["calendar", "pending", "trips"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-xl px-2 py-2 text-sm font-semibold capitalize ${
              tab === item ? "bg-cyan-800 text-white" : "text-cyan-900"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {tab === "calendar" ? (
        <section className="space-y-3">
          <label className="block space-y-1 text-sm font-medium text-cyan-900">
            Calendar tools
            <select
              value={calendarTool}
              onChange={(event) => {
                setCalendarTool(event.target.value as "view" | "block");
                setError("");
                setBlockMessage("");
              }}
              className="w-full rounded-2xl border border-cyan-900/15 bg-white px-3 py-3 text-base font-normal text-cyan-950"
            >
              <option value="view">See bookings</option>
              <option value="block">Block days</option>
            </select>
          </label>

          {calendarTool === "view" ? (
            <>
          <AvailabilityCalendar
            year={year}
            month={month}
            trips={calendarTrips}
            days={days}
            selectedDate={selectedDate}
            selectedTripId={selectedTripId}
            onMonthChange={(nextYear, nextMonth) => {
              setYear(nextYear);
              setMonth(nextMonth);
            }}
            onSelectSlot={selectSlot}
          />
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-cyan-950">
              {selectedTrip
                ? `${formatDate(selectedDate)} · ${selectedTrip.name}`
                : formatDate(selectedDate)}
            </h2>
            {selectedBlock ? (
              <p className="mt-2 text-sm text-rose-800">
                Blocked: {selectedBlock.reason}
                {selectedBlock.notes ? ` — ${selectedBlock.notes}` : ""}
              </p>
            ) : null}
            {selectedBookings.length === 0 && !selectedBlock ? (
              <p className="mt-2 text-sm text-cyan-700">
                {selectedTrip ? "This private charter is open." : "Tap a time on the calendar."}
              </p>
            ) : (
              selectedBookings.map((booking) => (
                <article key={booking.id} className="mt-3 border-t border-cyan-100 pt-3">
                  <p className="font-semibold text-cyan-950">{booking.guestName}</p>
                  <p className="text-sm text-cyan-700">
                    {formatTimeRange(booking.charterStartTime, booking.charterEndTime)
                      ? `${formatTimeRange(booking.charterStartTime, booking.charterEndTime)} · `
                      : ""}
                    {booking.guestCount} guests · {statusLabel(booking.status)}
                  </p>
                  <p className="text-sm text-cyan-700">
                    {booking.conciergeName} · {booking.hotelName}
                  </p>
                  <BookingNotes booking={booking} />
                  {booking.status === "pending" ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus(booking.id, "confirmed")}
                        className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(booking.id, "declined")}
                        className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200"
                      >
                        Decline
                      </button>
                    </div>
                  ) : null}
                  <CancelTourForm booking={booking} onCancelled={load} />
                </article>
              ))
            )}
          </div>
          {selectedTrip && selectedSlot?.status === "available" && !selectedSlot.blocked ? (
            <form onSubmit={holdCharter} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-cyan-950">Book a private charter</h2>
              <p className="text-sm text-cyan-700">
                {formatDate(selectedDate)} · {selectedTrip.name} · entire boat
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
                value={bookingNotes}
                onChange={(event) => setBookingNotes(event.target.value)}
                placeholder="Notes for the boat (optional)"
                className="min-h-24 w-full rounded-xl border border-cyan-900/15 px-3 py-3"
              />
              {bookingMessage ? <p className="text-sm text-emerald-700">{bookingMessage}</p> : null}
              <button
                type="submit"
                disabled={busyHold}
                className="w-full rounded-xl bg-cyan-800 px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {busyHold ? "Booking…" : "Book private charter"}
              </button>
            </form>
          ) : null}
            </>
          ) : (
            <>
              <BlockDaysCalendar
                year={year}
                month={month}
                onMonthChange={(nextYear, nextMonth) => {
                  setYear(nextYear);
                  setMonth(nextMonth);
                }}
                startDate={blockStart}
                endDate={blockEnd}
                onRangeChange={(start, end) => {
                  setBlockStart(start);
                  setBlockEnd(end);
                  setConflictAlert([]);
                  setBlockMessage("");
                }}
                alreadyBlocked={alreadyBlocked}
                trips={calendarTrips}
                days={days}
                bookings={bookings}
              />
              <form onSubmit={(event) => saveBlock(false, event)} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                <label className="block space-y-1 text-sm font-medium text-cyan-900">
                  Reason
                  <select
                    value={blockReason}
                    onChange={(event) =>
                      setBlockReason(event.target.value as (typeof BLOCK_REASONS)[number])
                    }
                    className="w-full rounded-xl border border-cyan-900/15 bg-white px-3 py-3 text-base font-normal text-cyan-950"
                  >
                    {BLOCK_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm text-cyan-800">
                  Extra note {blockReason === "Other" ? "(required)" : "(optional)"}
                  <textarea
                    value={blockNotes}
                    onChange={(event) => setBlockNotes(event.target.value)}
                    className="min-h-20 w-full rounded-xl border border-cyan-900/15 px-3 py-3 text-cyan-950"
                    placeholder="Anything the office should know"
                  />
                </label>
                {blockConflicts.length > 0 ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-semibold">
                      {blockConflicts.length} booking
                      {blockConflicts.length === 1 ? "" : "s"} already on these days
                    </p>
                    <ul className="mt-2 space-y-1">
                      {blockConflicts.map((booking) => (
                        <li key={booking.id}>
                          {formatDate(booking.date)} · {booking.guestName} · {booking.hotelName} ·{" "}
                          {booking.tripName} · {statusLabel(booking.status)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2">Cancel those tours first, or confirm the conflict in the next step.</p>
                  </div>
                ) : null}
                {blockMessage ? <p className="text-sm text-emerald-700">{blockMessage}</p> : null}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-cyan-800 px-4 py-3 font-semibold text-white"
                >
                  Block highlighted days
                </button>
              </form>
              <section className="space-y-2">
                <h3 className="font-semibold text-cyan-950">Current blocks</h3>
                {blockedRanges.length === 0 ? (
                  <p className="text-sm text-cyan-700">No blocked days yet.</p>
                ) : (
                  blockedRanges.map((range) => (
                    <article key={range.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="font-semibold text-cyan-950">{range.reason}</p>
                      <p className="text-sm text-cyan-700">
                        {formatDate(range.startDate)}
                        {range.startDate !== range.endDate ? ` – ${formatDate(range.endDate)}` : ""}
                      </p>
                      {range.notes ? <p className="text-sm text-cyan-800">{range.notes}</p> : null}
                      <button
                        type="button"
                        onClick={() => removeBlock(range.id)}
                        className="mt-2 text-sm text-cyan-800 underline"
                      >
                        Remove block
                      </button>
                    </article>
                  ))
                )}
              </section>
            </>
          )}
        </section>
      ) : null}

      {tab === "pending" ? (
        <section className="space-y-3">
          <h2 className="font-semibold text-cyan-950">Pending holds ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-cyan-700">No concierge requests waiting.</p>
          ) : (
            pending.map((booking) => (
              <article key={booking.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-cyan-950">{booking.guestName}</p>
                <p className="text-sm text-cyan-700">
                  {booking.tripName} · {formatDate(booking.date)}
                  {formatTimeRange(booking.charterStartTime, booking.charterEndTime)
                    ? ` · ${formatTimeRange(booking.charterStartTime, booking.charterEndTime)}`
                    : ""}{" "}
                  · {booking.guestCount} guests
                </p>
                <p className="text-sm text-cyan-700">
                  {booking.conciergeName} · {booking.hotelName}
                </p>
                <BookingNotes booking={booking} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(booking.id, "confirmed")}
                    className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(booking.id, "declined")}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200"
                  >
                    Decline
                  </button>
                </div>
                <CancelTourForm booking={booking} onCancelled={load} />
              </article>
            ))
          )}
        </section>
      ) : null}

      {tab === "trips" ? (
        <section className="space-y-3">
          {openBooking ? (
            <>
              <button
                type="button"
                onClick={() => setOpenBookingId("")}
                className="text-sm font-semibold text-cyan-800"
              >
                ← All booked trips
              </button>
              <article className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="font-serif text-2xl text-cyan-950">
                  {openBooking.guestName} · {openBooking.hotelName}
                </h2>
                <p className="text-sm text-cyan-700">
                  {formatDate(openBooking.date)} · {openBooking.tripName}
                  {formatTimeRange(openBooking.charterStartTime, openBooking.charterEndTime)
                    ? ` · ${formatTimeRange(openBooking.charterStartTime, openBooking.charterEndTime)}`
                    : ""}
                </p>
                <p className="text-sm text-cyan-700">private charter</p>
                <p className="text-sm text-cyan-700">
                  {openBooking.guestCount} guests · {statusLabel(openBooking.status)}
                </p>
                <p className="text-sm text-cyan-700">Concierge: {openBooking.conciergeName}</p>
                {openBookingTrip?.details ? (
                  <p className="whitespace-pre-wrap text-sm text-cyan-800">{openBookingTrip.details}</p>
                ) : null}
                <BookingNotes booking={openBooking} />
                {openBooking.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(openBooking.id, "confirmed")}
                      className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(openBooking.id, "declined")}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200"
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
                <CancelTourForm booking={openBooking} onCancelled={load} />
              </article>
            </>
          ) : (
            <>
              {bookedTrips.length === 0 ? (
                <p className="text-sm text-cyan-700">No booked private charters yet.</p>
              ) : (
                bookedTrips.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setOpenBookingId(booking.id)}
                    className="w-full rounded-2xl bg-white p-4 text-left shadow-sm"
                  >
                    <p className="font-semibold text-cyan-950">
                      {booking.guestName} · {booking.hotelName}
                    </p>
                    <p className="text-sm text-cyan-700">
                      {formatDate(booking.date)} · {booking.tripName}
                      {formatTimeRange(booking.charterStartTime, booking.charterEndTime)
                        ? ` · ${formatTimeRange(booking.charterStartTime, booking.charterEndTime)}`
                        : ""}{" "}
                      · {statusLabel(booking.status)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-cyan-800">View details →</p>
                  </button>
                ))
              )}
            </>
          )}
        </section>
      ) : null}

      {conflictAlert.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-cyan-950/40 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-lg">
            <h2 className="font-serif text-2xl text-cyan-950">Booking conflict</h2>
            <p className="text-sm text-cyan-800">
              These days already have pending or confirmed charters. Blocking them will not cancel those
              tours.
            </p>
            <ul className="max-h-48 space-y-1 overflow-auto text-sm text-cyan-900">
              {conflictAlert.map((booking) => (
                <li key={booking.id}>
                  {formatDate(booking.date)} · {booking.guestName} · {booking.hotelName} ·{" "}
                  {booking.tripName} · {statusLabel(booking.status)}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConflictAlert([])}
                className="rounded-xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => saveBlock(true)}
                className="rounded-xl bg-cyan-800 px-3 py-2 text-sm font-semibold text-white"
              >
                Block anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
