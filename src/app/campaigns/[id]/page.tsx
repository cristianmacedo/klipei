export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db, campaigns, users } from "@/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SubmitClipModal } from "@/components/dashboard/submit-clip-modal";
import { Scissors, ArrowLeft } from "lucide-react";

interface CampaignPageProps {
  params: Promise<{ id: string }>;
}

const statusColors = {
  ACTIVE: "bg-success/20 text-success",
  PAUSED: "bg-warning/20 text-warning",
  COMPLETED: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
};

const statusLabels = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  DRAFT: "Rascunho",
};

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

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params;

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: {
      creator: true,
      clips: true,
    },
  });

  if (!campaign) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dbUser = null;
  if (user) {
    dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
  }

  const isOwner = dbUser?.id === campaign.creatorId;
  const budgetRemaining = Number(campaign.budget) - Number(campaign.spent);

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
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Entrar</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Criar conta</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard/explore"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar para campanhas
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                  {campaign.title}
                </h1>
                <Badge variant="secondary" className={statusColors[campaign.status]}>
                  {statusLabels[campaign.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                por {campaign.creator.name || campaign.creator.email}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </CardContent>
            </Card>

            {campaign.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Instruções</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {campaign.instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            {campaign.sourceContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {campaign.sourceContent}
                  </p>
                </CardContent>
              </Card>
            )}

            {campaign.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {campaign.requirements.map((req, i) => (
                      <Badge key={i} variant="secondary">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recompensa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-primary">
                    R$ {Number(campaign.ratePerMil).toFixed(2)}
                  </p>
                  <p className="text-muted-foreground">por 1.000 views</p>
                </div>

                {campaign.maxPayoutPerClip && (
                  <div className="text-sm text-muted-foreground">
                    Máximo por clip: R${" "}
                    {Number(campaign.maxPayoutPerClip).toFixed(2)}
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span>{campaign.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orçamento restante</span>
                    <span>R$ {budgetRemaining.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clips submetidos</span>
                    <span>{campaign.clips.length}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Plataformas aceitas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="secondary"
                        className={platformColors[platform]}
                      >
                        {platformLabels[platform] || platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {campaign.status === "ACTIVE" && (
              <Card>
                <CardContent className="pt-6">
                  {!user ? (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        Faça login para participar desta campanha
                      </p>
                      <Link
                        href={`/login?redirectTo=/campaigns/${campaign.id}`}
                      >
                        <Button className="w-full">Entrar</Button>
                      </Link>
                    </div>
                  ) : isOwner ? (
                    <Link href={`/dashboard/campaigns/${campaign.id}`}>
                      <Button className="w-full" variant="outline">
                        Gerenciar Campanha
                      </Button>
                    </Link>
                  ) : (
                    <SubmitClipModal
                      campaignId={campaign.id}
                      campaignTitle={campaign.title}
                      allowedPlatforms={campaign.platforms}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
