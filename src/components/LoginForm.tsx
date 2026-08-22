"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Role = "concierge" | "owner";

export function LoginForm() {
  const router = useRouter();
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
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, name, hotelName, accessCode }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not sign in.");
      return;
    }
    router.push(role === "owner" ? "/owner" : "/concierge");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1">
        <button
          type="button"
          onClick={() => setRole("concierge")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            role === "concierge" ? "bg-white text-cyan-950" : "text-cyan-50"
          }`}
        >
          Concierge
        </button>
        <button
          type="button"
          onClick={() => setRole("owner")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            role === "owner" ? "bg-white text-cyan-950" : "text-cyan-50"
          }`}
        >
          Owner
        </button>
      </div>

      {role === "concierge" ? (
        <>
          <label className="block space-y-1">
            <span className="text-sm text-cyan-100">Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-cyan-950"
              placeholder="Alex Rivera"
              autoComplete="name"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-cyan-100">Hotel or property</span>
            <input
              value={hotelName}
              onChange={(event) => setHotelName(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-cyan-950"
              placeholder="Grand Cayman Resort"
              required
            />
          </label>
        </>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm text-cyan-100">Access code</span>
        <input
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-3 text-cyan-950 tracking-widest"
          inputMode="numeric"
          autoComplete="off"
          required
        />
      </label>

      {error ? <p className="text-sm text-amber-200">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-amber-300 px-4 py-3 font-semibold text-cyan-950 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Open bookings"}
      </button>
    </form>
  );
}
