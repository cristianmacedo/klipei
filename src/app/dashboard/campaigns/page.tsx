export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, Pause, CheckCircle2 } from "lucide-react";
import { CampaignsList } from "@/components/dashboard/campaigns-list";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's campaigns
  const myCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.creatorId, user.id),
    with: {
      clips: true,
    },
    orderBy: [desc(campaigns.createdAt)],
  });

  // Prepare campaign cards data
  const campaignCardsData = myCampaigns.map((campaign) => ({
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

  const activeCampaigns = campaignCardsData.filter(
    (c) => c.status === "ACTIVE"
  );
  const pausedCampaigns = campaignCardsData.filter(
    (c) => c.status === "PAUSED"
  );
  const completedCampaigns = campaignCardsData.filter(
    (c) => c.status === "COMPLETED" || c.status === "DRAFT"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Minhas Campanhas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie suas campanhas e acompanhe o desempenho.
          </p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold">{activeCampaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
              <Pause className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pausadas</p>
              <p className="text-2xl font-bold">{pausedCampaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold">{completedCampaigns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaignCardsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
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
        <CampaignsList campaigns={campaignCardsData} />
      )}
    </div>
  );
}
