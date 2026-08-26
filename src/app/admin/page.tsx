import { redirect } from "next/navigation";
import { AdminApp } from "@/components/AdminApp";
import { getSession } from "@/lib/auth";
import { pathForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "admin") redirect(pathForRole(session.role));

  return (
    <main className="min-h-full">
      <AdminApp
        session={{
          userId: session.userId,
          role: session.role,
          name: session.name,
          hotelName: session.hotelName,
          createdAt: session.createdAt,
        }}
      />
    </main>
  );
}
