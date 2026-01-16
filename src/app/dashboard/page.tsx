export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser || !dbUser.role) {
    redirect("/onboarding");
  }

  // Redirect based on role
  if (dbUser.role === "CREATOR") {
    redirect("/dashboard/creator");
  } else {
    redirect("/dashboard/clipper");
  }
}
