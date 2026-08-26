import Link from "next/link";
import { HomeScreenQr } from "@/components/HomeScreenQr";
import { InstallHomeScreen } from "@/components/InstallHomeScreen";

export default function InstallPage() {
  return (
    <main className="min-h-full bg-gradient-to-b from-cyan-900 via-cyan-800 to-teal-800 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Southern Cross Bookings</p>
          <h1 className="font-serif text-4xl leading-tight">Add to your phone</h1>
          <p className="text-cyan-100">
            Scan this code, then add Southern Cross Bookings to the home screen. It opens like an app. No App Store
            download.
          </p>
        </header>
        <HomeScreenQr path="/install" />
        <InstallHomeScreen />
        <p className="text-center text-sm text-cyan-100">
          Already installed?{" "}
          <Link href="/" className="font-semibold text-amber-200 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
