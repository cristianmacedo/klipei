export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, users, campaigns, clips } from "@/db";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MINIMUM_WITHDRAWAL_AMOUNT } from "@/types";

export default async function ClipperDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  // Get clips
  const userClips = await db.query.clips.findMany({
    where: eq(clips.clipperId, user.id),
    with: {
      campaign: true,
    },
    orderBy: [desc(clips.submittedAt)],
  });

  const totalSubmissions = userClips.length;
  const approvedSubmissions = userClips.filter(
    (c) => c.status === "APPROVED"
  ).length;
  const pendingSubmissions = userClips.filter(
    (c) => c.status === "PENDING"
  ).length;
  const totalEarnings = userClips.reduce(
    (acc, c) => acc + Number(c.earnings),
    0
  );
  const balance = Number(dbUser.balance);

  const recentClips = userClips.slice(0, 5);

  // Get available campaigns count
  const activeCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.status, "ACTIVE"),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">
            Bem-vindo de volta, {dbUser.name || "Clipper"}!
          </p>
        </div>
        <Link href="/campaigns">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Ver Campanhas
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              R$ {balance.toFixed(2)}
            </p>
            {balance >= MINIMUM_WITHDRAWAL_AMOUNT ? (
              <Link href="/dashboard/clipper/earnings">
                <Button
                  size="sm"
                  variant="link"
                  className="text-emerald-400 p-0 h-auto"
                >
                  Sacar agora →
                </Button>
              </Link>
            ) : (
              <p className="text-xs text-zinc-500">
                Mínimo R$ {MINIMUM_WITHDRAWAL_AMOUNT} para saque
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Ganhos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">desde o início</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Submissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{totalSubmissions}</p>
            <p className="text-xs text-zinc-500">
              {approvedSubmissions} aprovadas, {pendingSubmissions} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Campanhas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {activeCampaigns.length}
            </p>
            <Link href="/campaigns">
              <Button
                size="sm"
                variant="link"
                className="text-emerald-400 p-0 h-auto"
              >
                Explorar →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            Minhas Submissões Recentes
          </CardTitle>
          <Link href="/dashboard/clipper/submissions">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              Ver todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentClips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 mb-4">
                Você ainda não submeteu nenhum clip.
              </p>
              <Link href="/campaigns">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Encontrar Campanhas
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentClips.map((clip) => (
                <div
                  key={clip.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/50"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {clip.campaign.title}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {clip.currentViews.toLocaleString()} views
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        clip.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : clip.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {clip.status === "PENDING"
                        ? "Pendente"
                        : clip.status === "APPROVED"
                        ? "Aprovado"
                        : "Rejeitado"}
                    </span>
                    {clip.status === "APPROVED" && (
                      <p className="text-sm text-emerald-400 mt-1">
                        + R$ {Number(clip.earnings).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
