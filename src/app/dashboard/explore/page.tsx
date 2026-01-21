export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns } from "@/db";
import { eq, desc, ne, and } from "drizzle-orm";
import { CampaignCard } from "@/components/dashboard/campaign-card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get marketplace campaigns (active, not created by user)
  const marketplaceCampaigns = await db.query.campaigns.findMany({
    where: and(
      eq(campaigns.status, "ACTIVE"),
      ne(campaigns.creatorId, user.id)
    ),
    with: {
      creator: true,
      clips: true,
    },
    orderBy: [desc(campaigns.ratePerMil), desc(campaigns.createdAt)],
  });

  // Prepare campaign cards data
  const campaignCardsData = marketplaceCampaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    creator: campaign.creator.name || campaign.creator.email,
    cpm: Number(campaign.ratePerMil),
    budget: Number(campaign.budget),
    spent: Number(campaign.spent),
    views: campaign.clips.reduce((acc, c) => acc + c.currentViews, 0),
    clippers: new Set(campaign.clips.map((c) => c.clipperId)).size,
    platforms: campaign.platforms,
    status: campaign.status,
  }));

  // Featured campaign (highest CPM with most budget remaining)
  const featuredCampaign = campaignCardsData.length > 0
    ? campaignCardsData.reduce((best, current) => {
        const bestRemaining = best.budget - best.spent;
        const currentRemaining = current.budget - current.spent;
        if (current.cpm > best.cpm) return current;
        if (current.cpm === best.cpm && currentRemaining > bestRemaining)
          return current;
        return best;
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Explorar Campanhas
        </h1>
        <p className="mt-1 text-muted-foreground">
          Encontre campanhas para participar e comece a ganhar por views.
        </p>
      </div>

      {/* Featured Campaign */}
      {featuredCampaign && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Em alta</span>
          </div>
          <h2 className="mt-2 text-xl font-bold">{featuredCampaign.title}</h2>
          <p className="mt-1 text-muted-foreground">
            {featuredCampaign.creator} está pagando R${" "}
            {featuredCampaign.cpm.toFixed(2)} por 1k views. Orçamento restante:
            R${" "}
            {(featuredCampaign.budget - featuredCampaign.spent).toLocaleString(
              "pt-BR"
            )}
          </p>
          <Link href={`/campaigns/${featuredCampaign.id}`}>
            <Button className="mt-4">Participar agora</Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{campaignCardsData.length}</p>
          <p className="text-sm text-muted-foreground">Campanhas disponíveis</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            R${" "}
            {campaignCardsData.length > 0
              ? Math.max(...campaignCardsData.map((c) => c.cpm)).toFixed(2)
              : "0.00"}
          </p>
          <p className="text-sm text-muted-foreground">Maior CPM</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            R${" "}
            {campaignCardsData
              .reduce((acc, c) => acc + (c.budget - c.spent), 0)
              .toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-muted-foreground">Orçamento total</p>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaignCardsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground">
            Nenhuma campanha disponível no momento.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Volte mais tarde para conferir novas oportunidades.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaignCardsData.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} isExplore />
          ))}
        </div>
      )}
    </div>
  );
}
