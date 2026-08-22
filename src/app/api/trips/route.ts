import { requireOwner, requireSession } from "@/lib/auth";
import { newId, readOnlyDb, withDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const trips = await readOnlyDb((db) => db.trips);
  return Response.json({ trips });
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = (await request.json()) as {
    name?: string;
    startTime?: string;
    endTime?: string;
    boats?: number;
    details?: string;
  };

  const name = (body.name ?? "").trim();
  const startTime = (body.startTime ?? "").trim();
  const endTime = (body.endTime ?? "").trim();
  const boats = Number(body.boats ?? 1);
  const details = (body.details ?? "").trim();

  if (!name || !startTime || !endTime || !Number.isInteger(boats) || boats < 1) {
    return Response.json({ error: "Enter a trip name, times, and at least one boat." }, { status: 400 });
  }

  const trip = await withDb((db) => {
    const created = {
      id: newId("trip"),
      name,
      startTime,
      endTime,
      boats,
      active: true,
      details,
    };
    db.trips.push(created);
    return created;
  });

  return Response.json({ trip });
}

export async function PATCH(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = (await request.json()) as {
    id?: string;
    boats?: number;
    active?: boolean;
    name?: string;
    startTime?: string;
    endTime?: string;
    details?: string;
  };

  const trip = await withDb((db) => {
    const existing = db.trips.find((item) => item.id === body.id);
    if (!existing) return null;
    if (typeof body.boats === "number" && Number.isInteger(body.boats) && body.boats >= 1) {
      existing.boats = body.boats;
    }
    if (typeof body.active === "boolean") {
      existing.active = body.active;
    }
    if (typeof body.name === "string" && body.name.trim()) {
      existing.name = body.name.trim();
    }
    if (typeof body.startTime === "string" && body.startTime.trim()) {
      existing.startTime = body.startTime.trim();
    }
    if (typeof body.endTime === "string" && body.endTime.trim()) {
      existing.endTime = body.endTime.trim();
    }
    if (typeof body.details === "string") {
      existing.details = body.details;
    }
    return existing;
  });

  if (!trip) {
    return Response.json({ error: "Trip not found." }, { status: 404 });
  }
  return Response.json({ trip });
}
