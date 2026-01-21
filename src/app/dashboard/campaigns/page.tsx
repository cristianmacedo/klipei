export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns } from "@/db";
import { eq, desc, ne, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CampaignsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function CampaignsPage({
  searchParams,
}: CampaignsPageProps) {
  const { tab } = await searchParams;
  const defaultTab = tab === "minhas" ? "minhas" : "explorar";

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
    orderBy: [desc(campaigns.createdAt)],
  });

  // Get user's own campaigns
  const myCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.creatorId, user.id),
    with: {
      clips: true,
    },
    orderBy: [desc(campaigns.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campanhas</h1>
          <p className="text-zinc-400">
            Explore campanhas ou gerencie as suas
          </p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Nova Campanha
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger
            value="explorar"
            className="data-[state=active]:bg-zinc-700"
          >
            Explorar ({marketplaceCampaigns.length})
          </TabsTrigger>
          <TabsTrigger
            value="minhas"
            className="data-[state=active]:bg-zinc-700"
          >
            Minhas Campanhas ({myCampaigns.length})
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="explorar">
          {marketplaceCampaigns.length === 0 ? (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500">
                  Nenhuma campanha disponível no momento.
                </p>
                <p className="text-zinc-600 mt-2 text-sm">
                  Volte mais tarde para conferir novas oportunidades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceCampaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <Card className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-white text-lg">
                          {campaign.title}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-600/20 text-emerald-400 border-0"
                        >
                          {campaign.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">
                        por {campaign.creator.name || campaign.creator.email}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-zinc-400 text-sm line-clamp-2">
                        {campaign.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {campaign.platforms.map((platform) => (
                          <Badge
                            key={platform}
                            variant="outline"
                            className="border-zinc-600 text-zinc-400"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-zinc-700 flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-emerald-400">
                            R$ {Number(campaign.ratePerMil).toFixed(2)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            por 1.000 views
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">
                            {campaign.clips.length} clips
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Campaigns Tab */}
        <TabsContent value="minhas">
          {myCampaigns.length === 0 ? (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500 mb-4">
                  Você ainda não criou nenhuma campanha.
                </p>
                <Link href="/dashboard/campaigns/new">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Criar minha primeira campanha
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                >
                  <Card className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-white text-lg">
                          {campaign.title}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`${
                            campaign.status === "ACTIVE"
                              ? "bg-emerald-600/20 text-emerald-400"
                              : campaign.status === "PAUSED"
                                ? "bg-yellow-600/20 text-yellow-400"
                                : campaign.status === "DRAFT"
                                  ? "bg-zinc-600/20 text-zinc-400"
                                  : "bg-red-600/20 text-red-400"
                          } border-0`}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-zinc-400 text-sm line-clamp-2">
                        {campaign.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {campaign.platforms.map((platform) => (
                          <Badge
                            key={platform}
                            variant="outline"
                            className="border-zinc-600 text-zinc-400 text-xs"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-zinc-700 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Orçamento</p>
                          <p className="text-white font-medium">
                            R$ {Number(campaign.budget).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Submissões</p>
                          <p className="text-white font-medium">
                            {campaign.clips.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
