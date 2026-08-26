"use client";

import { useEffect, useState } from "react";
import { SignOutButton } from "./SignOutButton";
import { formatDate } from "@/lib/format";
import { isProtectedOwnerName, roleLabel } from "@/lib/roles";
import type { AccessStatus, PublicSession, Role } from "@/lib/types";

type Props = {
  session: PublicSession;
};

type AdminUser = {
  id: string;
  role: Role;
  name: string;
  hotelName: string;
  pin: string;
  access: AccessStatus;
  createdAt: string;
};

export function AdminApp({ session }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const response = await fetch("/api/admin/users");
    const data = (await response.json()) as { users?: AdminUser[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not load accounts.");
      return;
    }
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "deny" | "allow" | "resetPin") {
    setBusyId(id);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json()) as {
      error?: string;
      newPin?: string;
      user?: AdminUser;
    };
    setBusyId("");
    if (!response.ok) {
      setError(data.error ?? "Could not update that account.");
      return;
    }
    if (data.newPin && data.user) {
      setNotice(`New PIN for ${data.user.name}: ${data.newPin}`);
    }
    await load();
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-5 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Southern Cross Bookings</p>
          <h1 className="font-serif text-3xl text-cyan-950">Administrator</h1>
          <p className="text-sm text-cyan-800">Signed in as {session.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href="/owner"
            className="rounded-full border border-cyan-800/20 px-3 py-1.5 text-sm text-cyan-900"
          >
            Bookings
          </a>
          <SignOutButton />
        </div>
      </header>

      <p className="text-sm text-cyan-800">
        Every registered account is listed here. Reset a PIN if someone is locked out. Deny access to
        stop sign-in.
      </p>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-cyan-950">{notice}</p> : null}

      {users.length === 0 ? (
        <p className="text-sm text-cyan-800">No registered accounts yet.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-cyan-950">{user.name}</p>
                  <p className="text-sm text-cyan-800">
                    {roleLabel(user.role)}
                    {user.hotelName ? ` · ${user.hotelName}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.access === "denied" ? "bg-rose-100 text-rose-800" : "bg-teal-100 text-teal-800"
                  }`}
                >
                  {user.access === "denied" ? "Denied" : "Active"}
                </span>
              </div>
              <p className="mt-2 text-sm text-cyan-900">
                PIN {user.pin}
                {user.createdAt ? ` · joined ${formatDate(user.createdAt.slice(0, 10))}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === user.id}
                  onClick={() => {
                    if (window.confirm(`Reset PIN for ${user.name}? They will need the new PIN to sign in.`)) {
                      void act(user.id, "resetPin");
                    }
                  }}
                  className="min-h-10 rounded-xl border border-cyan-800/20 px-3 text-sm font-semibold text-cyan-900 touch-manipulation disabled:opacity-60"
                >
                  Reset PIN
                </button>
                {isProtectedOwnerName(user.name) ? null : user.access === "denied" ? (
                  <button
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => void act(user.id, "allow")}
                    className="min-h-10 rounded-xl border border-cyan-800/20 px-3 text-sm font-semibold text-cyan-900 touch-manipulation disabled:opacity-60"
                  >
                    Allow access
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => {
                      if (window.confirm(`Deny access for ${user.name}? They will not be able to sign in.`)) {
                        void act(user.id, "deny");
                      }
                    }}
                    className="min-h-10 rounded-xl border border-rose-300 px-3 text-sm font-semibold text-rose-800 touch-manipulation disabled:opacity-60"
                  >
                    Deny access
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
