"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubmissionCard } from "./submission-card";
import { toast } from "sonner";

interface Clip {
  id: string;
  clipper: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  platform: string;
  videoUrl: string;
  currentViews: number;
  earnings: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  submittedAt: Date;
}

interface SubmissionsListProps {
  clips: Clip[];
  campaignTitle: string;
  isOwner?: boolean;
}

function formatDate(dateString: Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffHours < 1) return "Agora há pouco";
  if (diffHours < 24) return `Há ${diffHours} horas`;
  if (diffHours < 48) return "Ontem";
  return date.toLocaleDateString("pt-BR");
}

export function SubmissionsList({
  clips,
  campaignTitle,
  isOwner = false,
}: SubmissionsListProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleReview = async (clipId: string, action: "approve" | "reject") => {
    setLoadingIds((prev) => new Set(prev).add(clipId));

    try {
      const response = await fetch(`/api/clips/${clipId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao processar ação");
        return;
      }

      toast.success(
        action === "approve" ? "Clip aprovado!" : "Clip rejeitado"
      );
      router.refresh();
    } catch {
      toast.error("Erro ao processar ação");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(clipId);
        return next;
      });
    }
  };

  const pendingClips = clips.filter((c) => c.status === "PENDING");
  const approvedClips = clips.filter((c) => c.status === "APPROVED");
  const rejectedClips = clips.filter(
    (c) => c.status === "REJECTED" || c.status === "FLAGGED"
  );

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <p className="text-muted-foreground">
          Nenhuma submissão recebida ainda.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Compartilhe sua campanha para começar a receber clips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Submissions */}
      {pendingClips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Pendentes
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-semibold text-warning">
              {pendingClips.length}
            </span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingClips.map((clip) => (
              <SubmissionCard
                key={clip.id}
                id={clip.id}
                clipper={clip.clipper.name || clip.clipper.email}
                clipperAvatar={clip.clipper.avatarUrl}
                campaign={campaignTitle}
                platform={clip.platform}
                videoUrl={clip.videoUrl}
                views={clip.currentViews}
                earnings={Number(clip.earnings)}
                status={clip.status}
                submittedAt={formatDate(clip.submittedAt)}
                isOwner={isOwner}
                isLoading={loadingIds.has(clip.id)}
                onApprove={(id) => handleReview(id, "approve")}
                onReject={(id) => handleReview(id, "reject")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Submissions */}
      {approvedClips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Aprovados ({approvedClips.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {approvedClips.map((clip) => (
              <SubmissionCard
                key={clip.id}
                id={clip.id}
                clipper={clip.clipper.name || clip.clipper.email}
                clipperAvatar={clip.clipper.avatarUrl}
                campaign={campaignTitle}
                platform={clip.platform}
                videoUrl={clip.videoUrl}
                views={clip.currentViews}
                earnings={Number(clip.earnings)}
                status={clip.status}
                submittedAt={formatDate(clip.submittedAt)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Submissions */}
      {rejectedClips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Rejeitados ({rejectedClips.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {rejectedClips.map((clip) => (
              <SubmissionCard
                key={clip.id}
                id={clip.id}
                clipper={clip.clipper.name || clip.clipper.email}
                clipperAvatar={clip.clipper.avatarUrl}
                campaign={campaignTitle}
                platform={clip.platform}
                videoUrl={clip.videoUrl}
                views={clip.currentViews}
                earnings={Number(clip.earnings)}
                status={clip.status}
                submittedAt={formatDate(clip.submittedAt)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
