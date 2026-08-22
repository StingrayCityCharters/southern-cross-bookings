import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ session: null });
  }
  return Response.json({
    session: {
      role: session.role,
      name: session.name,
      hotelName: session.hotelName,
      createdAt: session.createdAt,
    },
  });
}
