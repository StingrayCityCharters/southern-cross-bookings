"use client";

import { useMemo, useState } from "react";
import { datesBetween, monthTitle, monthWeeks, shiftMonth } from "@/lib/calendar";
import { formatDate, todayIso } from "@/lib/format";
import type { Booking, SlotAvailability, Trip } from "@/lib/types";

type CalendarTrip = Pick<Trip, "id" | "startTime"> & { shortLabel: string };

type Props = {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  alreadyBlocked: Set<string>;
  trips: CalendarTrip[];
  days: Record<string, Record<string, SlotAvailability>>;
  bookings: Booking[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function chipClass(status: string) {
  if (status === "pending") return "bg-amber-100 text-amber-900";
  if (status === "booked") return "bg-slate-200 text-slate-700";
  if (status === "blocked") return "bg-rose-100 text-rose-900";
  return "bg-white/70 text-cyan-800";
}

export function BlockDaysCalendar({
  year,
  month,
  onMonthChange,
  startDate,
  endDate,
  onRangeChange,
  alreadyBlocked,
  trips,
  days,
  bookings,
}: Props) {
  const [hoverDate, setHoverDate] = useState("");
  const today = todayIso();
  const weeks = monthWeeks(year, month);
  const orderedTrips = [...trips].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const highlighted = useMemo(() => {
    const end = endDate || (startDate && hoverDate ? hoverDate : startDate);
    if (!startDate || !end) return new Set<string>();
    return new Set(datesBetween(startDate, end));
  }, [startDate, endDate, hoverDate]);

  function pickDay(date: string) {
    if (date < today) return;
    if (!startDate || endDate) {
      onRangeChange(date, "");
      return;
    }
    onRangeChange(startDate, date);
  }

  return (
    <section className="rounded-3xl bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            const next = shiftMonth(year, month, -1);
            onMonthChange(next.year, next.month);
          }}
          className="rounded-full px-3 py-1 text-sm text-cyan-800"
        >
          Prev
        </button>
        <h2 className="font-serif text-xl text-cyan-950">{monthTitle(year, month)}</h2>
        <button
          type="button"
          onClick={() => {
            const next = shiftMonth(year, month, 1);
            onMonthChange(next.year, next.month);
          }}
          className="rounded-full px-3 py-1 text-sm text-cyan-800"
        >
          Next
        </button>
      </div>
      <p className="mb-2 text-sm text-cyan-800">
        Tap a start day, then tap an end day to highlight the range. Pending and confirmed trips stay
        visible.
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-20 rounded-xl bg-cyan-50/40" />;
          }
          const isPast = date < today;
          const selected = highlighted.has(date);
          const blocked = alreadyBlocked.has(date);
          return (
            <button
              key={date}
              type="button"
              disabled={isPast}
              onClick={() => pickDay(date)}
              onMouseEnter={() => setHoverDate(date)}
              className={`min-h-20 rounded-xl p-1 text-left disabled:opacity-30 ${
                selected
                  ? "bg-cyan-800 text-white"
                  : blocked
                    ? "bg-rose-50"
                    : "bg-cyan-50"
              }`}
            >
              <p className={`mb-1 text-right text-xs font-semibold ${selected ? "text-white" : "text-cyan-900"}`}>
                {Number(date.slice(-2))}
              </p>
              <div className="flex flex-col gap-1">
                {orderedTrips.map((trip) => {
                  const booking = bookings.find(
                    (item) =>
                      item.date === date &&
                      item.tripId === trip.id &&
                      (item.status === "pending" || item.status === "confirmed"),
                  );
                  const status = booking
                    ? booking.status === "pending"
                      ? "pending"
                      : "booked"
                    : days[date]?.[trip.id]?.status === "blocked"
                      ? "blocked"
                      : "";
                  if (!status) return null;
                  return (
                    <span
                      key={trip.id}
                      className={`block rounded-md px-0.5 py-0.5 text-center text-[10px] font-semibold leading-tight ${chipClass(status)}`}
                    >
                      {trip.shortLabel}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-cyan-800">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-300" /> Pending
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-200 ring-1 ring-slate-300" /> Confirmed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300" /> Already blocked
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-cyan-800" /> Highlighted
        </span>
      </div>
      {startDate ? (
        <p className="mt-3 text-sm text-cyan-800">
          {endDate
            ? `${formatDate(startDate <= endDate ? startDate : endDate)} – ${formatDate(startDate <= endDate ? endDate : startDate)} (${datesBetween(startDate, endDate).length} days)`
            : `Start: ${formatDate(startDate)}. Tap the last day to finish.`}
        </p>
      ) : null}
    </section>
  );
}
