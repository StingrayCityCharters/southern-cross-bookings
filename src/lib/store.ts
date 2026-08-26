import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AccessStatus, Booking, Database, Session, Trip, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const seed: Database = {
  accessCodes: {
    owner: "2468",
    concierge: "1357",
    ownerSignup: "1388",
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
      startTime: "14:00",
      endTime: "18:00",
      boats: 1,
      active: true,
      details:
        "Private afternoon charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
    },
  ],
  bookings: [],
  users: [],
  sessions: [],
  blockedRanges: [],
};

const defaultDetails: Record<string, string> = {
  "am-stingray":
    "Private morning charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
  "pm-stingray":
    "Private afternoon charter. The boat is exclusive to this guest party. Typical run to the Stingray City sandbar, with snorkeling time as conditions allow.",
};

function normalizeTrip(trip: Trip & { capacity?: number }): Trip {
  const preset =
    trip.id === "am-stingray"
      ? { startTime: "08:00", endTime: "12:00", active: true }
      : trip.id === "pm-stingray"
        ? { startTime: "14:00", endTime: "18:00", active: true }
        : null;
  return {
    id: trip.id,
    name: trip.name,
    startTime: preset?.startTime ?? trip.startTime,
    endTime: preset?.endTime ?? trip.endTime,
    boats: trip.boats >= 1 ? trip.boats : 1,
    active: preset ? true : false,
    details: typeof trip.details === "string" ? trip.details : (defaultDetails[trip.id] ?? ""),
  };
}

function normalizeRole(role: User["role"]): User["role"] {
  if (role === "admin") return "admin";
  if (role === "owner") return "owner";
  return "concierge";
}

function normalizeUser(user: User & { access?: AccessStatus }): User {
  return {
    id: user.id,
    role: normalizeRole(user.role),
    name: user.name ?? "",
    hotelName: user.hotelName ?? "",
    pin: String(user.pin ?? "").trim(),
    access: user.access === "denied" ? "denied" : "active",
    createdAt: user.createdAt,
  };
}

function normalizeSession(session: Session & { userId?: string }): Session {
  return {
    id: session.id,
    userId: session.userId ?? "",
    role: session.role === "admin" ? "admin" : session.role === "owner" ? "owner" : "concierge",
    name: session.name ?? "",
    hotelName: session.hotelName ?? "",
    createdAt: session.createdAt,
  };
}
function normalizeBooking(
  booking: Booking & { partySize?: number },
): Booking {
  const { partySize, ...rest } = booking;
  return {
    ...rest,
    guestCount: rest.guestCount >= 1 ? rest.guestCount : partySize ?? 1,
    charterType: rest.charterType ?? "",
    charterStartTime: rest.charterStartTime ?? "",
    charterEndTime: rest.charterEndTime ?? "",
    cancelReason: rest.cancelReason ?? "",
    cancelledByName: rest.cancelledByName ?? "",
    cancelledByRole: rest.cancelledByRole ?? "",
  };
}

function withCharterTimes(booking: Booking, trips: Trip[]): Booking {
  const trip = trips.find((item) => item.id === booking.tripId);
  return {
    ...booking,
    charterStartTime: booking.charterStartTime || trip?.startTime || "",
    charterEndTime: booking.charterEndTime || trip?.endTime || "",
  };
}

let queue: Promise<void> = Promise.resolve();

async function readDb(): Promise<Database> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Database;
    const trips = (parsed.trips?.length ? parsed.trips : seed.trips).map(normalizeTrip);
    return {
      ...seed,
      ...parsed,
      accessCodes: { ...seed.accessCodes, ...parsed.accessCodes },
      trips,
      bookings: (parsed.bookings ?? [])
        .map(normalizeBooking)
        .map((booking) => withCharterTimes(booking, trips)),
      users: (parsed.users ?? []).map(normalizeUser),
      sessions: (parsed.sessions ?? []).map(normalizeSession),
      blockedRanges: parsed.blockedRanges ?? [],
    };
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DB_PATH, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }
}

async function writeDb(db: Database) {
  await mkdir(DATA_DIR, { recursive: true });
  const trips = db.trips.map(normalizeTrip);
  const clean: Database = {
    ...db,
    trips,
    bookings: db.bookings.map(normalizeBooking).map((booking) => withCharterTimes(booking, trips)),
    users: (db.users ?? []).map(normalizeUser),
    sessions: (db.sessions ?? []).map(normalizeSession),
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
