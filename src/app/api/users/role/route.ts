import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const roleSchema = z.object({
  role: z.enum(["CREATOR", "CLIPPER"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = roleSchema.parse(body);

    // Check if user already exists in our DB
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    let dbUser;
    if (existingUser) {
      // Update existing user
      const [updated] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      dbUser = updated;
    } else {
      // Create new user
      const [created] = await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split("@")[0],
          avatarUrl: user.user_metadata?.avatar_url,
          role,
        })
        .returning();
      dbUser = created;
    }

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error setting user role:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
