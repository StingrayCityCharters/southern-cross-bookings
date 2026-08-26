import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "mysql2/promise";
import type { AccessStatus, Booking, Database, Session, Trip, User } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

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

function usesMysql() {
  return Boolean(DB_HOST && DB_NAME && DB_USER && DB_PASSWORD);
}

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
function normalizeBooking(booking: Booking & { partySize?: number }): Booking {
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

function hydrate(parsed: Partial<Database> | null): Database {
  const trips = (parsed?.trips?.length ? parsed.trips : seed.trips).map(normalizeTrip);
  return {
    ...seed,
    ...parsed,
    accessCodes: { ...seed.accessCodes, ...parsed?.accessCodes },
    trips,
    bookings: (parsed?.bookings ?? [])
      .map(normalizeBooking)
      .map((booking) => withCharterTimes(booking, trips)),
    users: (parsed?.users ?? []).map(normalizeUser),
    sessions: (parsed?.sessions ?? []).map(normalizeSession),
    blockedRanges: parsed?.blockedRanges ?? [],
  };
}

function cleaned(db: Database): Database {
  const trips = db.trips.map(normalizeTrip);
  return {
    ...db,
    trips,
    bookings: db.bookings.map(normalizeBooking).map((booking) => withCharterTimes(booking, trips)),
    users: (db.users ?? []).map(normalizeUser),
    sessions: (db.sessions ?? []).map(normalizeSession),
  };
}

let mysqlPool: Pool | undefined;
let mysqlReady: Promise<void> | undefined;

async function getMysqlPool(): Promise<Pool> {
  if (mysqlPool) return mysqlPool;
  const mysql = await import("mysql2/promise");
  mysqlPool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || "3306"),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 4,
  });
  return mysqlPool;
}

async function ensureMysqlTable() {
  if (mysqlReady) return mysqlReady;
  mysqlReady = (async () => {
    const pool = await getMysqlPool();
    await pool.query(
      `CREATE TABLE IF NOT EXISTS app_state (
        id TINYINT NOT NULL PRIMARY KEY,
        payload LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    );
  })();
  return mysqlReady;
}

async function readMysql(): Promise<Database> {
  await ensureMysqlTable();
  const pool = await getMysqlPool();
  const [rows] = await pool.query("SELECT payload FROM app_state WHERE id = ?", [1]);
  const record = Array.isArray(rows) ? (rows[0] as { payload?: string } | undefined) : undefined;
  if (!record?.payload) {
    const initial = structuredClone(seed);
    await writeMysql(initial);
    return initial;
  }
  return hydrate(JSON.parse(record.payload) as Database);
}

async function writeMysql(db: Database) {
  await ensureMysqlTable();
  const pool = await getMysqlPool();
  const payload = JSON.stringify(cleaned(db));
  await pool.query(
    `INSERT INTO app_state (id, payload) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
    [1, payload],
  );
}

async function readFileDb(): Promise<Database> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    return hydrate(JSON.parse(raw) as Database);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DB_PATH, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }
}

async function writeFileDb(db: Database) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(cleaned(db), null, 2));
}

let queue: Promise<void> = Promise.resolve();

async function readDb(): Promise<Database> {
  return usesMysql() ? readMysql() : readFileDb();
}

async function writeDb(db: Database) {
  if (usesMysql()) {
    await writeMysql(db);
    return;
  }
  await writeFileDb(db);
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
