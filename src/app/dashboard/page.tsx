export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, users, campaigns, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { StatCard } from "@/components/dashboard/stat-card";
import { CampaignCard } from "@/components/dashboard/campaign-card";
import { ViewsChart } from "@/components/dashboard/views-chart";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { SubmitClipModal } from "@/components/dashboard/submit-clip-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      campaign: {
        with: {
          creator: true,
        },
      },
    },
    orderBy: [desc(clips.submittedAt)],
  });

  // Stats
  const activeCampaignsCount = userCampaigns.filter(
    (c) => c.status === "ACTIVE"
  ).length;
  const pendingSubmissionsAsCreator = userCampaigns
    .flatMap((c) => c.clips)
    .filter((c) => c.status === "PENDING").length;

  const pendingSubmissionsAsClipper = userClips.filter(
    (c) => c.status === "PENDING"
  ).length;

  const totalViews = userClips.reduce((acc, c) => acc + c.currentViews, 0);
  const totalEarnings = userClips.reduce(
    (acc, c) => acc + Number(c.earnings),
    0
  );
  const pendingEarnings = userClips
    .filter((c) => c.status === "PENDING")
    .reduce((acc, c) => acc + Number(c.earnings), 0);

  const balance = Number(dbUser.balance);

  // Recent data
  const recentCampaigns = userCampaigns.slice(0, 2);
  const recentClips = userClips.slice(0, 3);

  // Prepare campaign cards data
  const campaignCardsData = recentCampaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    cpm: Number(campaign.ratePerMil),
    budget: Number(campaign.budget),
    spent: Number(campaign.spent),
    views: campaign.clips.reduce((acc, c) => acc + c.currentViews, 0),
    clippers: new Set(campaign.clips.map((c) => c.clipperId)).size,
    platforms: campaign.platforms,
    status: campaign.status,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Bem-vindo de volta, {dbUser.name || dbUser.email}!
          </p>
        </div>
        <div className="flex gap-3">
          <SubmitClipModal />
          <Link href="/dashboard/campaigns/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Views totais"
          value={
            totalViews >= 1000
              ? `${(totalViews / 1000).toFixed(1)}k`
              : String(totalViews)
          }
          change={`${userClips.length} clips submetidos`}
          changeType="neutral"
          icon="eye"
          iconColor="text-primary"
        />
        <StatCard
          title="Ganhos totais"
          value={`R$ ${totalEarnings.toFixed(2)}`}
          change={
            pendingEarnings > 0
              ? `R$ ${pendingEarnings.toFixed(2)} pendentes`
              : "de clips aprovados"
          }
          changeType={pendingEarnings > 0 ? "neutral" : "positive"}
          icon="trending-up"
          iconColor="text-success"
        />
        <StatCard
          title="Clips ativos"
          value={String(userClips.length)}
          change={`${pendingSubmissionsAsClipper} aguardando aprovação`}
          changeType="neutral"
          icon="film"
          iconColor="text-accent"
        />
        <StatCard
          title="Campanhas ativas"
          value={String(activeCampaignsCount)}
          change={`${pendingSubmissionsAsCreator} submissões pendentes`}
          changeType="neutral"
          icon="megaphone"
          iconColor="text-chart-4"
        />
      </div>

      {/* Chart and Wallet */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ViewsChart totalViews={totalViews} totalEarnings={totalEarnings} />
        </div>
        <WalletCard balance={balance} pendingEarnings={pendingEarnings} />
      </div>

      {/* Campaigns and Recent Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* My Campaigns */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Minhas campanhas</h2>
            <Link
              href="/dashboard/campaigns"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {campaignCardsData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhuma campanha.
              </p>
              <Link href="/dashboard/campaigns/new">
                <Button>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nova Campanha
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignCardsData.map((campaign) => (
                <CampaignCard key={campaign.id} {...campaign} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Atividade recente</h2>
            <Link
              href="/dashboard/submissions"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {recentClips.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não submeteu nenhum clip.
              </p>
              <Link
                href="/dashboard/explore"
                className="text-primary hover:underline"
              >
                Explorar campanhas →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClips.map((clip) => (
                <div
                  key={clip.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {clip.campaign.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {clip.currentViews.toLocaleString()} views •{" "}
                        {clip.platform}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          clip.status === "PENDING"
                            ? "bg-warning/20 text-warning"
                            : clip.status === "APPROVED"
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {clip.status === "PENDING"
                          ? "Pendente"
                          : clip.status === "APPROVED"
                            ? "Aprovado"
                            : "Rejeitado"}
                      </span>
                      {clip.status === "APPROVED" && (
                        <p className="text-sm text-success mt-1">
                          + R$ {Number(clip.earnings).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
