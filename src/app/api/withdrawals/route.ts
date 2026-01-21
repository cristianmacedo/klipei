import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users, withdrawals, transactions } from "@/db";
import { eq } from "drizzle-orm";
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

    // Create withdrawal and update user balance atomically
    const withdrawal = await db.transaction(async (tx) => {
      // Re-fetch user inside transaction for accurate balance
      const [currentUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, user.id));

      const currentBalance = Number(currentUser.balance);
      if (currentBalance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const withdrawalId = nanoid();

      const [newWithdrawal] = await tx
        .insert(withdrawals)
        .values({
          id: withdrawalId,
          userId: user.id,
          amount: String(amount),
          fee: String(fee),
          netAmount: String(netAmount),
          pixKey,
          status: "PENDING",
        })
        .returning();

      // Calculate balances sequentially for proper ledger reconstruction
      const balanceAfterWithdrawal = currentBalance - netAmount;
      const balanceAfterFee = balanceAfterWithdrawal - fee; // Final balance after both deductions

      await tx
        .update(users)
        .set({
          balance: String(balanceAfterFee), // Final balance
          pixKey,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Create withdrawal transaction (net amount to user)
      await tx.insert(transactions).values({
        id: nanoid(),
        userId: user.id,
        type: "WITHDRAWAL",
        amount: String(-netAmount),
        balanceAfter: String(balanceAfterWithdrawal),
        withdrawalId: withdrawalId,
        description: `Saque via PIX`,
      });

      // Create withdrawal fee transaction (platform revenue)
      await tx.insert(transactions).values({
        id: nanoid(),
        userId: user.id,
        type: "WITHDRAWAL_FEE",
        amount: String(-fee),
        balanceAfter: String(balanceAfterFee),
        withdrawalId: withdrawalId,
        description: `Taxa de saque (${(WITHDRAWAL_FEE_PERCENTAGE * 100).toFixed(0)}%)`,
      });

      return newWithdrawal;
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    // Handle insufficient balance from transaction
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { error: "Saldo insuficiente" },
        { status: 400 }
      );
    }

    console.error("Error creating withdrawal:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
