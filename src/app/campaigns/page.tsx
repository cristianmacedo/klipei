export const dynamic = "force-dynamic";

import Link from "next/link";
import { db, campaigns } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Scissors, Eye, Users } from "lucide-react";

const platformColors: Record<string, string> = {
  TIKTOK: "bg-[#ff0050]/20 text-[#ff0050]",
  YOUTUBE: "bg-[#ff0000]/20 text-[#ff4444]",
  INSTAGRAM: "bg-[#e4405f]/20 text-[#e4405f]",
  TWITTER: "bg-[#1da1f2]/20 text-[#1da1f2]",
};

const platformLabels: Record<string, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter",
};

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Scissors className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">Klipei</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/signup">
                <Button>Criar conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Campanhas Ativas</h1>
          <p className="text-muted-foreground">
            Encontre campanhas para participar e ganhe por visualização
          </p>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Nenhuma campanha ativa no momento.
            </p>
            <p className="text-muted-foreground mt-2">
              Volte mais tarde para conferir novas oportunidades.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((campaign) => {
              const budget = Number(campaign.budget);
              const spent = Number(campaign.spent);
              const progress = budget > 0 ? (spent / budget) * 100 : 0;
              const views = campaign.clips.reduce(
                (acc, c) => acc + c.currentViews,
                0
              );
              const clippers = new Set(campaign.clips.map((c) => c.clipperId))
                .size;

              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <div className="rounded-xl border border-border bg-card p-5 h-full transition-all hover:border-primary/50">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {campaign.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          {campaign.creator.name || campaign.creator.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-primary">
                          R$ {Number(campaign.ratePerMil).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          por 1k views
                        </p>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {campaign.platforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant="secondary"
                          className={platformColors[platform] || "bg-secondary"}
                        >
                          {platformLabels[platform] || platform}
                        </Badge>
                      ))}
                    </div>

                    {/* Budget Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Orçamento</span>
                        <span className="font-medium">
                          R$ {spent.toLocaleString("pt-BR")} / R${" "}
                          {budget.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <Progress value={progress} className="mt-2 h-2" />
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          {views >= 1000
                            ? `${(views / 1000).toFixed(1)}k`
                            : views}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {clippers} clippers
                        </span>
                      </div>
                      <span className="text-sm text-primary font-medium">
                        Participar →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
