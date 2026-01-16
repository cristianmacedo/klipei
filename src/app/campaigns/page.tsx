export const dynamic = "force-dynamic";

import Link from "next/link";
import { db, campaigns, users } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CampaignsPage() {
  const activeCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.status, "ACTIVE"),
    with: {
      creator: true,
      clips: true,
    },
    orderBy: [desc(campaigns.createdAt)],
  });

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-white">
              Klipei
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-white"
                >
                  Entrar
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Criar conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Campanhas Ativas
          </h1>
          <p className="text-zinc-400">
            Encontre campanhas para participar e ganhe por visualização
          </p>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg">
              Nenhuma campanha ativa no momento.
            </p>
            <p className="text-zinc-600 mt-2">
              Volte mais tarde para conferir novas oportunidades.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((campaign) => (
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

                    {campaign.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {campaign.requirements.slice(0, 3).map((req, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-zinc-700 text-zinc-300 text-xs"
                          >
                            {req}
                          </Badge>
                        ))}
                        {campaign.requirements.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="bg-zinc-700 text-zinc-300 text-xs"
                          >
                            +{campaign.requirements.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-zinc-700 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-emerald-400">
                          R$ {Number(campaign.ratePerMil).toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">por 1.000 views</p>
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
      </main>
    </div>
  );
}
