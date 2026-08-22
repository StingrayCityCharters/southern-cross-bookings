import { redirect } from "next/navigation";
import { OwnerApp } from "@/components/OwnerApp";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "owner") redirect("/concierge");

  return (
    <main className="min-h-full">
      <OwnerApp
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
