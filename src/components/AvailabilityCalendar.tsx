"use client";

import { monthTitle, monthWeeks, shiftMonth } from "@/lib/calendar";
import { todayIso } from "@/lib/format";
import type { SlotAvailability, SlotStatus, Trip } from "@/lib/types";

type CalendarTrip = Pick<Trip, "id" | "startTime"> & { shortLabel: string };

type Props = {
  year: number;
  month: number;
  trips: CalendarTrip[];
  days: Record<string, Record<string, SlotAvailability>>;
  selectedDate: string;
  selectedTripId: string;
  onMonthChange: (year: number, month: number) => void;
  onSelectSlot: (date: string, tripId: string, status: SlotStatus) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function chipClass(status: SlotStatus, selected: boolean) {
  if (selected) return "bg-cyan-800 text-white";
  if (status === "available") return "bg-emerald-100 text-emerald-900";
  if (status === "pending") return "bg-amber-100 text-amber-900";
  return "bg-slate-200 text-slate-500";
}

export function AvailabilityCalendar({
  year,
  month,
  trips,
  days,
  selectedDate,
  selectedTripId,
  onMonthChange,
  onSelectSlot,
}: Props) {
  const today = todayIso();
  const weeks = monthWeeks(year, month);
  const orderedTrips = [...trips].sort((a, b) => a.startTime.localeCompare(b.startTime));

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
          const isSelectedDay = date === selectedDate;
          return (
            <div
              key={date}
              className={`min-h-20 rounded-xl p-1 ${
                isSelectedDay ? "ring-2 ring-cyan-700" : "bg-cyan-50/70"
              }`}
            >
              <p className="mb-1 text-right text-xs font-semibold text-cyan-900">
                {Number(date.slice(-2))}
              </p>
              <div className="flex flex-col gap-1">
                {orderedTrips.map((trip) => {
                  const slot = days[date]?.[trip.id];
                  const status = slot?.status ?? "available";
                  const selected = selectedDate === date && selectedTripId === trip.id;
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      disabled={isPast}
                      onClick={() => onSelectSlot(date, trip.id, status)}
                      className={`rounded-md px-0.5 py-0.5 text-[10px] font-semibold leading-tight ${chipClass(status, selected)} ${isPast ? "opacity-30" : ""}`}
                    >
                      {trip.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-cyan-800">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" /> Open
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-300" /> Hold pending
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-200 ring-1 ring-slate-300" /> Booked
        </span>
      </div>
    </section>
  );
}
