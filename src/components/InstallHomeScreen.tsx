"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallHomeScreen() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  const standalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone))
    );
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua));
    if (standalone) setInstalled(true);

    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [standalone]);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
  }

  if (installed || standalone) {
    return (
      <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-cyan-50">
        This phone already has Southern Cross Bookings on the home screen. Open it from there and sign in.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white/10 px-4 py-4 text-sm text-cyan-50">
      {installEvent ? (
        <button
          type="button"
          onClick={() => void install()}
          className="min-h-12 w-full rounded-xl bg-amber-300 px-4 py-3 text-base font-semibold text-cyan-950"
        >
          Add to home screen
        </button>
      ) : null}
      {ios ? (
        <ol className="list-decimal space-y-1 pl-5">
          <li>Tap the Share button at the bottom of Safari.</li>
          <li>Tap Add to Home Screen.</li>
          <li>Tap Add. The Southern Cross icon will sit with your other apps.</li>
        </ol>
      ) : (
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open this page in Chrome.</li>
          <li>Tap the menu, then Install app or Add to Home screen.</li>
          <li>Confirm. The Southern Cross icon will sit with your other apps.</li>
        </ol>
      )}
      <p>
        A QR code can open this page. Phones do not allow a scan to install by itself; you still tap Add to Home
        Screen once.
      </p>
    </div>
  );
}
