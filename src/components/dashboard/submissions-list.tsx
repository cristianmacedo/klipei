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

type FilterType = "all" | "PENDING" | "APPROVED" | "REJECTED";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Rejeitadas" },
];

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
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

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

  const pendingCount = clips.filter((c) => c.status === "PENDING").length;

  const filteredClips =
    activeFilter === "all"
      ? clips
      : clips.filter((clip) => {
          if (activeFilter === "REJECTED") {
            return clip.status === "REJECTED" || clip.status === "FLAGGED";
          }
          return clip.status === activeFilter;
        });

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
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === filter.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
              {filter.value === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning/20 text-xs font-semibold text-warning">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Grid */}
      {filteredClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground">
            Nenhuma submissão encontrada para este filtro.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredClips.map((clip) => (
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
              isOwner={isOwner && clip.status === "PENDING"}
              isLoading={loadingIds.has(clip.id)}
              onApprove={(id) => handleReview(id, "approve")}
              onReject={(id) => handleReview(id, "reject")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
