import { HomeScreenQr } from "@/components/HomeScreenQr";
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
        <section className="space-y-3 rounded-3xl bg-white/10 p-4">
          <h2 className="text-center font-semibold text-white">Add to a phone home screen</h2>
          <p className="text-center text-sm text-cyan-100">
            Scan this code, then tap Add to Home Screen. You can also open{" "}
            <Link href="/install" className="font-semibold text-amber-200 underline underline-offset-2">
              /install
            </Link>
            .
          </p>
          <HomeScreenQr path="/install" />
        </section>
        <p className="text-center text-xs text-cyan-200">
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy policy
          </Link>
        </p>
      </div>
    </main>
  );
}
