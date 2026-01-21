export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";
import { SubmitClipModal } from "@/components/dashboard/submit-clip-modal";

export default async function ClipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's clips (as clipper)
  const userClips = await db.query.clips.findMany({
    where: eq(clips.clipperId, user.id),
    with: {
      campaign: {
        with: {
          creator: true,
        },
      },
    },
    orderBy: [desc(clips.submittedAt)],
  });

  // Stats
  const totalViews = userClips.reduce((acc, c) => acc + c.currentViews, 0);
  const totalEarnings = userClips.reduce(
    (acc, c) => acc + Number(c.earnings),
    0
  );
  const pendingClips = userClips.filter((c) => c.status === "PENDING");

  const statusColors: Record<string, string> = {
    PENDING: "bg-warning/20 text-warning",
    APPROVED: "bg-success/20 text-success",
    REJECTED: "bg-destructive/20 text-destructive",
    FLAGGED: "bg-destructive/20 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    FLAGGED: "Marcado",
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Meus Clips
          </h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe o desempenho dos seus clips submetidos.
          </p>
        </div>
        <SubmitClipModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{userClips.length}</p>
          <p className="text-sm text-muted-foreground">Total de clips</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            {totalViews >= 1000
              ? `${(totalViews / 1000).toFixed(1)}k`
              : totalViews}
          </p>
          <p className="text-sm text-muted-foreground">Views totais</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-success">
            R$ {totalEarnings.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">Ganhos totais</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">{pendingClips.length}</p>
          <p className="text-sm text-muted-foreground">Aguardando aprovação</p>
        </div>
      </div>

      {/* Clips List */}
      {userClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground mb-2">
            Você ainda não submeteu nenhum clip.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Explore campanhas e comece a ganhar por views.
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard/explore">
              <Button variant="secondary">Explorar campanhas</Button>
            </Link>
            <SubmitClipModal />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {userClips.map((clip) => (
            <div
              key={clip.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">
                      {clip.campaign.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={statusColors[clip.status]}
                    >
                      {statusLabels[clip.status]}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={platformColors[clip.platform]}
                    >
                      {clip.platform}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    por {clip.campaign.creator.name || clip.campaign.creator.email}
                  </p>
                </div>
                <div className="text-right">
                  {clip.status === "APPROVED" && (
                    <p className="text-lg font-bold text-success">
                      + R$ {Number(clip.earnings).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {clip.currentViews >= 1000
                      ? `${(clip.currentViews / 1000).toFixed(1)}k`
                      : clip.currentViews}{" "}
                    views
                  </span>
                  <span>
                    Submetido em{" "}
                    {new Date(clip.submittedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={clip.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Ver vídeo
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
