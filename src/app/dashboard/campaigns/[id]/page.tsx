export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, clips, users } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignActions } from "@/components/campaign-actions";
import { SubmissionsList } from "@/components/dashboard/submissions-list";
import { Eye, Users, ArrowLeft, Pencil } from "lucide-react";

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
    },
  });

  if (!campaign) {
    notFound();
  }

  if (campaign.creatorId !== user.id) {
    redirect("/dashboard/campaigns");
  }

  const budgetRemaining = Number(campaign.budget) - Number(campaign.spent);
  const progress = (Number(campaign.spent) / Number(campaign.budget)) * 100;
  const pendingClips = campaign.clips.filter((c) => c.status === "PENDING");
  const approvedClips = campaign.clips.filter((c) => c.status === "APPROVED");
  const totalViews = approvedClips.reduce(
    (acc, c) => acc + (c.currentViews - c.viewsAtSubmission),
    0
  );
  const uniqueClippers = new Set(campaign.clips.map((c) => c.clipperId)).size;

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar para campanhas
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {campaign.title}
            </h1>
            <Badge variant="secondary" className={statusColors[campaign.status]}>
              {statusLabels[campaign.status]}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{campaign.type}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/campaigns/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-1.5 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <CampaignActions campaign={campaign} />
        </div>
      </div>

      {/* Draft Alert */}
      {campaign.status === "DRAFT" && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-warning font-medium">Campanha em rascunho</p>
          <p className="text-sm text-muted-foreground">
            Ative a campanha para começar a receber submissões
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Orçamento</p>
          <p className="mt-2 text-2xl font-bold">
            R$ {Number(campaign.budget).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            R$ {budgetRemaining.toFixed(2)} restante
          </p>
          <Progress value={progress} className="mt-2 h-2" />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">CPM</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            R$ {Number(campaign.ratePerMil).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">por 1.000 views</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Submissões</p>
          <p className="mt-2 text-2xl font-bold">{campaign.clips.length}</p>
          <p className="text-xs text-warning">
            {pendingClips.length} pendentes
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Desempenho</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">
                {totalViews >= 1000
                  ? `${(totalViews / 1000).toFixed(1)}k`
                  : totalViews}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{uniqueClippers}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissões ({campaign.clips.length})
          </TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <SubmissionsList
            clips={campaign.clips}
            campaignTitle={campaign.title}
            isOwner
          />
        </TabsContent>

        <TabsContent value="details">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <h3 className="font-medium mb-2">Descrição</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>

            {campaign.instructions && (
              <div>
                <h3 className="font-medium mb-2">Instruções</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {campaign.instructions}
                </p>
              </div>
            )}

            {campaign.sourceContent && (
              <div>
                <h3 className="font-medium mb-2">Conteúdo Fonte</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {campaign.sourceContent}
                </p>
              </div>
            )}

            {campaign.requirements.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Requisitos</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.requirements.map((req, i) => (
                    <Badge key={i} variant="secondary">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">Plataformas</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.platforms.map((platform) => (
                  <Badge
                    key={platform}
                    variant="secondary"
                    className={platformColors[platform]}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
