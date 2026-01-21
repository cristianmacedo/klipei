import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, users, transactions, withdrawals, campaigns } from "@/db";
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

    // Get all user transactions with relations
    const userTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, user.id),
      with: {
        campaign: true,
        clip: true,
        deposit: true,
        withdrawal: true,
      },
      orderBy: [desc(transactions.createdAt)],
    });

    // Calculate totals from transactions
    const totalEarnings = userTransactions
      .filter((t) => t.type === "EARNING")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalDeposits = userTransactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalCampaignFunds = userTransactions
      .filter((t) => t.type === "CAMPAIGN_FUND")
      .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

    const totalCampaignRefunds = userTransactions
      .filter((t) => t.type === "CAMPAIGN_REFUND")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalWithdrawals = userTransactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

    // Get withdrawals for detailed info (status, processedAt, etc)
    const userWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.userId, user.id),
      orderBy: [desc(withdrawals.createdAt)],
    });

    // Get campaigns for totalSpent (clipper payouts from budget)
    const userCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.creatorId, user.id),
    });

    const totalSpent = userCampaigns.reduce(
      (acc, c) => acc + Number(c.spent),
      0
    );

    // Build earnings history from EARNING transactions
    const earningsHistory = userTransactions
      .filter((t) => t.type === "EARNING")
      .map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        campaignTitle: t.campaign?.title || "Campanha",
        clipId: t.clipId,
        createdAt: t.createdAt.toISOString(),
      }));

    // Build deposits from DEPOSIT transactions
    const depositsHistory = userTransactions
      .filter((t) => t.type === "DEPOSIT")
      .map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        status: t.deposit?.status || "COMPLETED",
        createdAt: t.createdAt.toISOString(),
      }));

    // Build expenses from CAMPAIGN_FUND transactions
    const expensesHistory = userTransactions
      .filter((t) => t.type === "CAMPAIGN_FUND")
      .map((t) => ({
        id: t.id,
        amount: Math.abs(Number(t.amount)),
        campaignTitle: t.campaign?.title || "Campanha",
        type: "campaign_created" as const,
        createdAt: t.createdAt.toISOString(),
      }));

    return NextResponse.json({
      balance: Number(dbUser.balance),
      totalEarnings,
      totalDeposits,
      totalCampaignFunds,
      totalCampaignRefunds,
      totalWithdrawals,
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
      deposits: depositsHistory,
      expenses: expensesHistory,
      // Full transaction history for detailed view
      transactions: userTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        campaignTitle: t.campaign?.title || null,
        clipId: t.clipId,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
