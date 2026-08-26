"use client";

import { useEffect, useState } from "react";

type Props = {
  path?: string;
};

export function HomeScreenQr({ path = "/install" }: Props) {
  const [src, setSrc] = useState("");
  const [href, setHref] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}${path}`;
    setHref(url);
    void import("qrcode").then((mod) => {
      const toDataURL = mod.toDataURL ?? mod.default.toDataURL;
      return toDataURL(url, {
        width: 420,
        margin: 1,
        color: { dark: "#083344", light: "#ffffff" },
      }).then(setSrc);
    });
  }, [path]);

  if (!src) {
    return <div className="mx-auto aspect-square w-full max-w-xs rounded-2xl bg-white/20" />;
  }

  return (
    <a href={href} className="mx-auto block w-full max-w-xs">
      <img
        src={src}
        alt="QR code to open Southern Cross Bookings on a phone"
        className="w-full rounded-2xl bg-white p-3"
      />
    </a>
  );
}
