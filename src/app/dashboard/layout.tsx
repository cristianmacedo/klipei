export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser || !dbUser.role) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <DashboardNav user={dbUser} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
