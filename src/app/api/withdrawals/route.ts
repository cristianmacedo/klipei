import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users, withdrawals } from "@/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { MINIMUM_WITHDRAWAL_AMOUNT, WITHDRAWAL_FEE_PERCENTAGE } from "@/types";

const withdrawalSchema = z.object({
  amount: z.number().min(MINIMUM_WITHDRAWAL_AMOUNT),
  pixKey: z.string().min(1),
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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, pixKey } = withdrawalSchema.parse(body);

    // Check if user has enough balance
    if (Number(dbUser.balance) < amount) {
      return NextResponse.json(
        { error: "Saldo insuficiente" },
        { status: 400 }
      );
    }

    // Calculate fee and net amount
    const fee = amount * WITHDRAWAL_FEE_PERCENTAGE;
    const netAmount = amount - fee;

    // Create withdrawal and update user balance in a transaction
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({
        id: nanoid(),
        userId: user.id,
        amount: String(amount),
        fee: String(fee),
        netAmount: String(netAmount),
        pixKey,
        status: "PENDING",
      })
      .returning();

    await db
      .update(users)
      .set({
        balance: sql`${users.balance} - ${amount}`,
        pixKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating withdrawal:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
