import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user already exists in our DB and has a role
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        // If user doesn't exist or doesn't have a role, go to onboarding
        if (!dbUser || !dbUser.role) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // User exists and has role, go to dashboard
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
