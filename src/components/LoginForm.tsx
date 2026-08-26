"use client";

import { FormEvent, useEffect, useState } from "react";
import { readSignInMemory, writeSignInMemory, type SignInRole } from "@/lib/login-memory";
import { pathForRole, roleTabLabel } from "@/lib/roles";

export function LoginForm() {
  const [role, setRole] = useState<SignInRole>("concierge");
  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remembered, setRemembered] = useState(false);

  useEffect(() => {
    const saved = readSignInMemory();
    if (saved.role) setRole(saved.role);
    if (saved.name) setName(saved.name);
    if (saved.hotelName) setHotelName(saved.hotelName);
    setRemembered(Boolean(saved.name || saved.hotelName));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, hotelName, accessCode }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setBusy(false);
        setError(data.error ?? "Could not sign in.");
        return;
      }
      writeSignInMemory({ role, name: name.trim(), hotelName: hotelName.trim() });
      window.location.assign(pathForRole(role));
    } catch {
      setBusy(false);
      setError("Could not reach the server. Stay on this Wi-Fi and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white/10 p-1">
        {(["concierge", "owner", "admin"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            aria-pressed={role === option}
            className={`flex min-h-12 items-center justify-center rounded-xl px-2 text-xs font-semibold capitalize touch-manipulation sm:text-sm ${
              role === option ? "bg-white text-cyan-950" : "text-cyan-50"
            }`}
          >
            {roleTabLabel(option)}
          </button>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-cyan-100">Your name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-base text-cyan-950"
          autoComplete="name"
          required
        />
      </label>

      {role === "concierge" ? (
        <label className="block space-y-1">
          <span className="text-sm text-cyan-100">Hotel or property</span>
          <input
            value={hotelName}
            onChange={(event) => setHotelName(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-base text-cyan-950"
          />
        </label>
      ) : null}

      {remembered ? (
        <p className="text-xs text-cyan-200">Saved on this phone. Change only if needed, then enter your PIN.</p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm text-cyan-100">4-digit PIN</span>
        <input
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-base text-cyan-950 tracking-widest"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          pattern="\d{4}"
          required
        />
      </label>

      {error ? <p className="text-sm text-amber-200">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-amber-300 px-4 py-3 text-base font-semibold text-cyan-950 touch-manipulation disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Open bookings"}
      </button>
    </form>
  );
}
