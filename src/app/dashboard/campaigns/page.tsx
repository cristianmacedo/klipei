export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { db, campaigns } from "@/db";
import { eq, desc } from "drizzle-orm";
import { CampaignCard } from "@/components/dashboard/campaign-card";
import { CreateCampaignModal } from "@/components/dashboard/create-campaign-modal";
import { users } from "@/db";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user balance for the modal
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  const userBalance = Number(dbUser?.balance || 0);

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
        <CreateCampaignModal userBalance={userBalance} />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{activeCampaigns.length}</p>
          <p className="text-sm text-muted-foreground">Ativas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{pausedCampaigns.length}</p>
          <p className="text-sm text-muted-foreground">Pausadas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{completedCampaigns.length}</p>
          <p className="text-sm text-muted-foreground">Concluídas</p>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaignCardsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground mb-4">
            Você ainda não criou nenhuma campanha.
          </p>
          <CreateCampaignModal userBalance={userBalance} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Campaigns */}
          {activeCampaigns.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Campanhas Ativas</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} {...campaign} />
                ))}
              </div>
            </div>
          )}

          {/* Paused Campaigns */}
          {pausedCampaigns.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Campanhas Pausadas</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pausedCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} {...campaign} />
                ))}
              </div>
            </div>
          )}

          {/* Completed/Draft Campaigns */}
          {completedCampaigns.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Concluídas / Rascunhos
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completedCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} {...campaign} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
