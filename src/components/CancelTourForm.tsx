"use client";

import { FormEvent, useState } from "react";
import type { Booking } from "@/lib/types";

type Props = {
  booking: Booking;
  onCancelled: () => Promise<void> | void;
};

export function CancelTourForm({ booking, onCancelled }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return null;
  }

  function close() {
    if (busy) return;
    setOpen(false);
    setError("");
    setReason("");
  }

  async function confirmCancel(event: FormEvent) {
    event.preventDefault();
    const cancelReason = reason.trim();
    if (!cancelReason) {
      setError("Enter a reason for cancelling this tour.");
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled", cancelReason }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not cancel this tour.");
      return;
    }
    setOpen(false);
    setReason("");
    await onCancelled();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm text-cyan-700 underline underline-offset-2"
      >
        Cancel
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-cyan-950/40 p-4 sm:items-center"
          onClick={close}
        >
          <form
            onSubmit={confirmCancel}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-lg"
          >
            <h2 className="font-serif text-2xl text-cyan-950">Cancel this tour?</h2>
            <p className="text-sm text-cyan-800">
              {booking.guestName} · {booking.hotelName}
            </p>
            <label className="block space-y-1 text-sm text-cyan-800">
              Reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Weather, guest request, boat issue…"
                className="min-h-24 w-full rounded-xl border border-cyan-900/15 px-3 py-2 text-cyan-950"
                autoFocus
                required
              />
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="rounded-xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900"
              >
                Keep tour
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-cyan-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
