"use client";

import { FormEvent, useState } from "react";

type Role = "concierge" | "owner";

export function LoginForm() {
  const [role, setRole] = useState<Role>("concierge");
  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      window.location.assign(role === "owner" ? "/owner" : "/concierge");
    } catch {
      setBusy(false);
      setError("Could not reach the server. Stay on this Wi-Fi and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset className="grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1">
        <legend className="sr-only">Sign in as</legend>
        {(["concierge", "owner"] as const).map((option) => (
          <label
            key={option}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-semibold capitalize touch-manipulation ${
              role === option ? "bg-white text-cyan-950" : "text-cyan-50"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={option}
              checked={role === option}
              onChange={() => setRole(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </fieldset>

      {role === "concierge" ? (
        <>
          <label className="block space-y-1">
            <span className="text-sm text-cyan-100">Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-base text-cyan-950"
              placeholder="Alex Rivera"
              autoComplete="name"
              required={role === "concierge"}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-cyan-100">Hotel or property</span>
            <input
              value={hotelName}
              onChange={(event) => setHotelName(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-base text-cyan-950"
              placeholder="Grand Cayman Resort"
              required={role === "concierge"}
            />
          </label>
        </>
      ) : (
        <p className="text-sm text-cyan-100">Owner sign-in. Enter the owner access code below.</p>
      )}

      <label className="block space-y-1">
        <span className="text-sm text-cyan-100">Access code</span>
        <input
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-base text-cyan-950 tracking-widest"
          inputMode="numeric"
          autoComplete="one-time-code"
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
