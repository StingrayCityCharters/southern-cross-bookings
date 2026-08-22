import { requireSession } from "@/lib/auth";
import { availabilityForDate, availabilityForMonth } from "@/lib/availability";
import { readOnlyDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const month = params.get("month") ?? "";
  const date = params.get("date") ?? "";

  if (/^\d{4}-\d{2}$/.test(month)) {
    const year = Number(month.slice(0, 4));
    const monthNumber = Number(month.slice(5, 7));
    const data = await readOnlyDb((db) => availabilityForMonth(db, year, monthNumber));
    return Response.json(data);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Pick a month or a date." }, { status: 400 });
  }

  const trips = await readOnlyDb((db) => availabilityForDate(db, date));
  return Response.json({ date, trips });
}
