import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users, clips, withdrawals, campaigns } from "@/db";
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

    // Get approved clips (as clipper) with campaign info
    const clipperClips = await db.query.clips.findMany({
      where: eq(clips.clipperId, user.id),
      with: {
        campaign: true,
      },
      orderBy: [desc(clips.approvedAt)],
    });

    const approvedClips = clipperClips.filter((c) => c.status === "APPROVED");

    const totalEarnings = approvedClips.reduce(
      (acc, clip) => acc + Number(clip.earnings),
      0
    );

    // Get user's campaigns to calculate total spent
    const userCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.creatorId, user.id),
    });

    const totalSpent = userCampaigns.reduce(
      (acc, c) => acc + Number(c.spent),
      0
    );

    // Get withdrawals
    const userWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.userId, user.id),
      orderBy: [desc(withdrawals.createdAt)],
    });

    // Build earnings history from approved clips
    const earningsHistory = approvedClips.map((clip) => ({
      id: clip.id,
      amount: Number(clip.earnings),
      campaignTitle: clip.campaign.title,
      clipId: clip.id,
      createdAt: clip.approvedAt?.toISOString() || clip.submittedAt.toISOString(),
    }));

    return NextResponse.json({
      balance: Number(dbUser.balance),
      totalEarnings,
      totalSpent,
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
      earningsHistory,
      deposits: [], // TODO: Implement when deposits table exists
      expenses: [], // TODO: Implement expense tracking
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
