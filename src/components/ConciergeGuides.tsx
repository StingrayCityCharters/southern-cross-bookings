const BOAT_PHOTOS = [
  {
    src: "/boat/southern-cross-anchored.jpg",
    alt: "Southern Cross at anchor in clear water",
  },
  {
    src: "/boat/stingray-encounter.jpg",
    alt: "Guests on Southern Cross with a stingray",
  },
  {
    src: "/boat/offshore-mahi.jpg",
    alt: "Mahi caught on an offshore fishing trip",
  },
];

const TOURS = [
  {
    name: "Offshore fishing",
    price: "$2,800",
    duration: "Half day",
    details:
      "Head out beyond the reef and troll for mahi, wahoo, dolphin, and marlin.",
  },
  {
    name: "Inshore",
    price: "$2,200",
    details:
      "Stay inside North Sound or just beyond the barrier reef. Includes reef fishing, stingrays, snorkeling, and Kaibo or Rum Point.",
  },
  {
    name: "Late evening run",
    price: "$1,500",
    details:
      "Can include a stop to see the stingrays, then over to Rum Point or Kaibo, with a relaxing return cruise at sunset.",
  },
];

export function ConciergeGuides() {
  return (
    <div className="space-y-3">
      <details className="rounded-3xl bg-white p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-cyan-950 [&::-webkit-details-marker]:hidden">
          Photos of the boat
          <span className="text-sm font-normal text-cyan-700">▾</span>
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {BOAT_PHOTOS.map((photo) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              className="h-40 w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      </details>

      <details className="rounded-3xl bg-white p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-cyan-950 [&::-webkit-details-marker]:hidden">
          Pricing
          <span className="text-sm font-normal text-cyan-700">▾</span>
        </summary>
        <ul className="mt-3 space-y-3">
          {TOURS.map((tour) => (
            <li key={tour.name} className="rounded-2xl bg-cyan-50 px-3 py-3">
              <p className="font-semibold text-cyan-950">
                {tour.name} · {tour.price}
                {tour.duration ? ` · ${tour.duration}` : ""}
              </p>
              <p className="mt-1 text-sm text-cyan-800">{tour.details}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
