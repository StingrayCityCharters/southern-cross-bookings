import { SignupForm } from "@/components/SignupForm";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-full bg-gradient-to-b from-cyan-900 via-cyan-800 to-teal-800 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200">Southern Cross Bookings</p>
          <h1 className="font-serif text-4xl leading-tight">Create your PIN</h1>
          <p className="text-cyan-100">
            Concierges, captains, and administrators each pick a unique 4-digit PIN. Captain and
            administrator sign-up also need the master PIN.
          </p>
        </header>
        <SignupForm />
        <p className="text-center text-sm text-cyan-100">
          Already have a PIN?{" "}
          <Link href="/" className="font-semibold text-amber-200 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
