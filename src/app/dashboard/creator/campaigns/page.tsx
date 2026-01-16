export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, users } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CreatorCampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userCampaigns = await db.query.campaigns.findMany({
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
          <h1 className="text-3xl font-bold text-white">Minhas Campanhas</h1>
          <p className="text-zinc-400">
            Gerencie suas campanhas de Content Rewards
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Nova Campanha
          </Button>
        </Link>
      </div>

      {userCampaigns.length === 0 ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500 mb-4">
              Você ainda não criou nenhuma campanha
            </p>
            <Link href="/campaigns/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Criar minha primeira campanha
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/dashboard/creator/campaigns/${campaign.id}`}
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
                      <p className="text-zinc-500">Clips</p>
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
    </div>
  );
}
