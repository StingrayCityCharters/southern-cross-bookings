import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const serif = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Southern Cross Bookings",
  description: "Concierge holds and captain approvals for Southern Cross.",
  applicationName: "Southern Cross Bookings",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Southern Cross Bookings",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: "/icons/icon-512.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#155e75",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#e7f3f4] font-sans text-cyan-950">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
