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

  // Get or create user in database
  let dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  // If user doesn't exist in DB, create them
  if (!dbUser) {
    const [newUser] = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      })
      .returning();
    dbUser = newUser;
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <DashboardNav user={dbUser} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
