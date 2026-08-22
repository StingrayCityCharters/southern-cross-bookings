"use client";

import { FormEvent, useState } from "react";
import type { Booking } from "@/lib/types";

type Props = {
  booking: Booking;
  onCancelled: () => Promise<void> | void;
};

export function CancelTourForm({ booking, onCancelled }: Props) {
  const [reason, setReason] = useState(booking.cancelReason);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return null;
  }

  async function cancelTour(event: FormEvent) {
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
    await onCancelled();
  }

  return (
    <form onSubmit={cancelTour} className="mt-3 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
      <label className="block space-y-1 text-sm text-red-900">
        Cancel reason
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Weather, guest no-show, boat issue, guest request…"
          className="min-h-20 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-cyan-950"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-red-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Cancelling…" : "Cancel this tour"}
      </button>
    </form>
  );
}
