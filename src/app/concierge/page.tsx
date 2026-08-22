import { redirect } from "next/navigation";
import { ConciergeApp } from "@/components/ConciergeApp";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConciergePage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "concierge") redirect("/owner");

  return (
    <main className="min-h-full">
      <ConciergeApp
        session={{
          role: session.role,
          name: session.name,
          hotelName: session.hotelName,
          createdAt: session.createdAt,
        }}
      />
    </main>
  );
}
