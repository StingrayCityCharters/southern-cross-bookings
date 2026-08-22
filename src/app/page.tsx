import { LoginForm } from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="min-h-full bg-gradient-to-b from-cyan-900 via-cyan-800 to-teal-800 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200">Stingray City Charters</p>
          <h1 className="font-serif text-4xl leading-tight">Bookings for owners and concierges</h1>
          <p className="text-cyan-100">
            See which private charter days and times are open, pencil in a hold, and wait for the boat operator to approve.
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
