import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-full bg-gradient-to-b from-cyan-900 via-cyan-800 to-teal-800 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl leading-tight">Southern Cross Bookings</h1>
          <p className="text-cyan-100">
            See which private charter days and times are open, pencil in a hold, and wait for the boat operator to approve.
          </p>
        </header>
        <LoginForm />
        <p className="text-center text-sm text-cyan-100">
          Need a PIN?{" "}
          <Link href="/signup" className="font-semibold text-amber-200 underline underline-offset-2">
            Create one
          </Link>
        </p>
        <p className="text-center text-sm text-cyan-100">
          Put this on a phone home screen?{" "}
          <Link href="/install" className="font-semibold text-amber-200 underline underline-offset-2">
            Scan or install
          </Link>
        </p>
      </div>
    </main>
  );
}
