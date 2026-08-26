import { formatTimeRange } from "@/lib/format";
import { roleLabel } from "@/lib/roles";
import type { Booking, Role } from "@/lib/types";

export function BookingNotes({ booking }: { booking: Booking }) {
  const phone = booking.phone.trim();
  const notes = booking.notes.trim();

  return (
    <dl className="mt-3 space-y-2 rounded-xl bg-cyan-50 px-3 py-3 text-sm text-cyan-900">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Type of charter</dt>
        <dd className="mt-0.5">{(booking.charterType ?? "").trim() || "Not specified"}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Charter time</dt>
        <dd className="mt-0.5">
          {formatTimeRange(booking.charterStartTime ?? "", booking.charterEndTime ?? "") ||
            "Not specified"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Guest phone</dt>
        <dd className="mt-0.5">{phone || "None entered"}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Notes for the boat</dt>
        <dd className="mt-0.5 whitespace-pre-wrap">{notes || "None entered"}</dd>
      </div>
      {booking.status === "cancelled" ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
            Cancellation reason
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap">
            {booking.cancelReason.trim() || "None entered"}
            {booking.cancelledByName
              ? ` — cancelled by ${booking.cancelledByName} (${
                  booking.cancelledByRole ? roleLabel(booking.cancelledByRole as Role) : "unknown"
                })`
              : ""}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
