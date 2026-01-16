export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, clips, deposits } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositButton } from "@/components/deposit-button";
import { CampaignActions } from "@/components/campaign-actions";
import { SubmissionsList } from "@/components/submissions-list";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: {
      clips: {
        with: {
          clipper: true,
        },
        orderBy: [desc(clips.submittedAt)],
      },
      deposits: {
        orderBy: [desc(deposits.createdAt)],
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  if (campaign.creatorId !== user.id) {
    redirect("/dashboard");
  }

  const budgetRemaining = Number(campaign.budget) - Number(campaign.spent);
  const pendingClips = campaign.clips.filter((c) => c.status === "PENDING");
  const approvedClips = campaign.clips.filter((c) => c.status === "APPROVED");
  const totalViews = approvedClips.reduce(
    (acc, c) => acc + (c.currentViews - c.viewsAtSubmission),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/creator/campaigns"
            className="text-zinc-400 hover:text-white text-sm"
          >
            ← Voltar para campanhas
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">
            {campaign.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
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
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-400">{campaign.type}</span>
          </div>
        </div>

        <CampaignActions campaign={campaign} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              R$ {Number(campaign.budget).toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">
              R$ {budgetRemaining.toFixed(2)} restante
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Rate por 1k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">
              R$ {Number(campaign.ratePerMil).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Submissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {campaign.clips.length}
            </p>
            <p className="text-xs text-zinc-500">
              {pendingClips.length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Views Geradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {totalViews.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alert */}
      {campaign.status === "DRAFT" && (
        <Card className="bg-yellow-900/20 border-yellow-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 font-medium">
                  Campanha em rascunho
                </p>
                <p className="text-sm text-zinc-400">
                  Adicione orçamento para ativar a campanha
                </p>
              </div>
              <DepositButton campaignId={campaign.id} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger
            value="submissions"
            className="data-[state=active]:bg-zinc-700"
          >
            Submissões ({campaign.clips.length})
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-zinc-700"
          >
            Detalhes
          </TabsTrigger>
          <TabsTrigger
            value="deposits"
            className="data-[state=active]:bg-zinc-700"
          >
            Depósitos ({campaign.deposits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <SubmissionsList clips={campaign.clips} isCreator={true} />
        </TabsContent>

        <TabsContent value="details">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-white font-medium mb-2">Descrição</h3>
                <p className="text-zinc-400 whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </div>

              {campaign.instructions && (
                <div>
                  <h3 className="text-white font-medium mb-2">Instruções</h3>
                  <p className="text-zinc-400 whitespace-pre-wrap">
                    {campaign.instructions}
                  </p>
                </div>
              )}

              {campaign.sourceContent && (
                <div>
                  <h3 className="text-white font-medium mb-2">
                    Conteúdo Fonte
                  </h3>
                  <p className="text-zinc-400 whitespace-pre-wrap">
                    {campaign.sourceContent}
                  </p>
                </div>
              )}

              {campaign.requirements.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-2">Requisitos</h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.requirements.map((req, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-zinc-700 text-zinc-300"
                      >
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-white font-medium mb-2">Plataformas</h3>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                Histórico de Depósitos
              </CardTitle>
              <DepositButton campaignId={campaign.id} />
            </CardHeader>
            <CardContent>
              {campaign.deposits.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  Nenhum depósito realizado
                </p>
              ) : (
                <div className="space-y-2">
                  {campaign.deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/50"
                    >
                      <div>
                        <p className="text-white">
                          R$ {Number(deposit.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(deposit.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${
                          deposit.status === "COMPLETED"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : deposit.status === "PENDING"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-red-600/20 text-red-400"
                        } border-0`}
                      >
                        {deposit.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
