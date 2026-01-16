import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users, clips, withdrawals } from "@/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
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
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Get total earnings from approved clips
    const approvedClips = await db.query.clips.findMany({
      where: eq(clips.clipperId, user.id),
    });

    const totalEarnings = approvedClips
      .filter((c) => c.status === "APPROVED")
      .reduce((acc, clip) => acc + Number(clip.earnings), 0);

    // Get withdrawals
    const userWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.userId, user.id),
      orderBy: [desc(withdrawals.createdAt)],
    });

    return NextResponse.json({
      balance: Number(dbUser.balance),
      totalEarnings,
      pixKey: dbUser.pixKey,
      withdrawals: userWithdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        fee: Number(w.fee),
        netAmount: Number(w.netAmount),
        status: w.status,
        createdAt: w.createdAt.toISOString(),
        processedAt: w.processedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
