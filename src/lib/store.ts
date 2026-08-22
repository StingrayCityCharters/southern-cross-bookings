import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Booking, Database, Trip } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const seed: Database = {
  accessCodes: {
    owner: "2468",
    concierge: "1357",
  },
  trips: [
    {
      id: "am-stingray",
      name: "Stingray City — Morning",
      startTime: "08:00",
      endTime: "12:00",
      boats: 1,
      active: true,
      details:
        "Private morning charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
    },
    {
      id: "pm-stingray",
      name: "Stingray City — Afternoon",
      startTime: "13:00",
      endTime: "17:00",
      boats: 1,
      active: true,
      details:
        "Private afternoon charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
    },
  ],
  bookings: [],
  sessions: [],
};

const defaultDetails: Record<string, string> = {
  "am-stingray":
    "Private morning charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
  "pm-stingray":
    "Private afternoon charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
};

function normalizeTrip(trip: Trip & { capacity?: number }): Trip {
  return {
    id: trip.id,
    name: trip.name,
    startTime: trip.startTime,
    endTime: trip.endTime,
    boats: trip.boats >= 1 ? trip.boats : 1,
    active: trip.active,
    details: typeof trip.details === "string" ? trip.details : (defaultDetails[trip.id] ?? ""),
  };
}

function normalizeBooking(
  booking: Booking & { partySize?: number },
): Booking {
  const { partySize, ...rest } = booking;
  return {
    ...rest,
    guestCount: rest.guestCount >= 1 ? rest.guestCount : partySize ?? 1,
    cancelReason: rest.cancelReason ?? "",
    cancelledByName: rest.cancelledByName ?? "",
    cancelledByRole: rest.cancelledByRole ?? "",
  };
}

let queue: Promise<void> = Promise.resolve();

async function readDb(): Promise<Database> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Database;
    return {
      ...seed,
      ...parsed,
      accessCodes: { ...seed.accessCodes, ...parsed.accessCodes },
      trips: (parsed.trips?.length ? parsed.trips : seed.trips).map(normalizeTrip),
      bookings: (parsed.bookings ?? []).map(normalizeBooking),
      sessions: parsed.sessions ?? [],
    };
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DB_PATH, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }
}

async function writeDb(db: Database) {
  await mkdir(DATA_DIR, { recursive: true });
  const clean: Database = {
    ...db,
    trips: db.trips.map(normalizeTrip),
    bookings: db.bookings.map(normalizeBooking),
  };
  await writeFile(DB_PATH, JSON.stringify(clean, null, 2));
}

export function withDb<T>(fn: (db: Database) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readOnlyDb<T>(fn: (db: Database) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    return fn(db);
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
