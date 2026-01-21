export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";

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
    <div className="min-h-screen bg-background">
      <Sidebar user={dbUser} />
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <div className="pt-12 lg:pt-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
