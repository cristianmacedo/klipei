export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, users, campaigns, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MINIMUM_WITHDRAWAL_AMOUNT } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User check is done in layout, but TypeScript needs this
  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser) return null;

  // Get user's campaigns (as creator)
  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.creatorId, user.id),
    with: {
      clips: true,
    },
    orderBy: [desc(campaigns.createdAt)],
  });

  // Get user's clips (as clipper)
  const userClips = await db.query.clips.findMany({
    where: eq(clips.clipperId, user.id),
    with: {
      campaign: true,
    },
    orderBy: [desc(clips.submittedAt)],
  });

  // Stats - as creator
  const activeCampaignsCount = userCampaigns.filter(
    (c) => c.status === "ACTIVE"
  ).length;
  const pendingSubmissionsAsCreator = userCampaigns
    .flatMap((c) => c.clips)
    .filter((c) => c.status === "PENDING").length;

  // Stats - as clipper
  const pendingSubmissionsAsClipper = userClips.filter(
    (c) => c.status === "PENDING"
  ).length;
  const totalEarnings = userClips.reduce(
    (acc, c) => acc + Number(c.earnings),
    0
  );
  const balance = Number(dbUser.balance);

  // Recent submissions (as clipper)
  const recentClips = userClips.slice(0, 3);

  // Recent campaigns (as creator)
  const recentCampaigns = userCampaigns.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400">
          Bem-vindo de volta, {dbUser.name || dbUser.email}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Campanhas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {activeCampaignsCount}
            </p>
            <p className="text-xs text-zinc-500">
              {pendingSubmissionsAsCreator} submissões pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Clips Submetidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{userClips.length}</p>
            <p className="text-xs text-zinc-500">
              {pendingSubmissionsAsClipper} aguardando revisão
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Ganhos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              R$ {totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">desde o início</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {balance.toFixed(2)}
            </p>
            {balance >= MINIMUM_WITHDRAWAL_AMOUNT ? (
              <Link href="/dashboard/wallet">
                <Button
                  size="sm"
                  variant="link"
                  className="text-emerald-400 p-0 h-auto"
                >
                  Sacar →
                </Button>
              </Link>
            ) : (
              <p className="text-xs text-zinc-500">
                Mínimo R$ {MINIMUM_WITHDRAWAL_AMOUNT} para saque
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Campaigns */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Minhas Campanhas</CardTitle>
            <Link href="/dashboard/campaigns?tab=minhas">
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
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-zinc-500 mb-4">
                  Você ainda não criou nenhuma campanha.
                </p>
                <Link href="/dashboard/campaigns/new">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Criar Campanha
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="block p-3 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {campaign.title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {campaign.clips.length} submissões
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${
                          campaign.status === "ACTIVE"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : campaign.status === "PAUSED"
                              ? "bg-yellow-600/20 text-yellow-400"
                              : "bg-zinc-600/20 text-zinc-400"
                        } border-0`}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Submissions */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Minhas Submissões</CardTitle>
            <Link href="/dashboard/submissions?tab=enviadas">
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
              <div className="text-center py-6">
                <p className="text-zinc-500 mb-4">
                  Você ainda não submeteu nenhum clip.
                </p>
                <Link href="/dashboard/campaigns">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Explorar Campanhas
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-lg bg-zinc-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {clip.campaign.title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {clip.currentViews.toLocaleString()} views
                        </p>
                      </div>
                      <div className="ml-2 text-right">
                        <Badge
                          variant="secondary"
                          className={`${
                            clip.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : clip.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                          } border-0`}
                        >
                          {clip.status === "PENDING"
                            ? "Pendente"
                            : clip.status === "APPROVED"
                              ? "Aprovado"
                              : "Rejeitado"}
                        </Badge>
                        {clip.status === "APPROVED" && (
                          <p className="text-xs text-emerald-400 mt-1">
                            + R$ {Number(clip.earnings).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
