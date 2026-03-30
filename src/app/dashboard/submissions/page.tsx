"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Clip {
  id: string;
  platform: string;
  videoUrl: string;
  currentViews: number;
  earnings: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  submittedAt: string;
  campaign: {
    id: string;
    title: string;
    creator: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  clipper: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

type FilterType = "all" | "PENDING" | "APPROVED" | "REJECTED";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Rejeitadas" },
];

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

const platformLabels: Record<string, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [receivedClips, setReceivedClips] = useState<Clip[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/clips");
      const data = await response.json();

      if (response.ok) {
        setReceivedClips(data.received || []);
      }
    } catch {
      toast.error("Erro ao carregar submissões");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (clipId: string) => {
    setActionLoading(clipId);
    try {
      const response = await fetch(`/api/clips/${clipId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (response.ok) {
        toast.success("Clip aprovado com sucesso!");
        fetchSubmissions();
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao aprovar clip");
      }
    } catch {
      toast.error("Erro ao aprovar clip");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (clipId: string) => {
    setActionLoading(clipId);
    try {
      const response = await fetch(`/api/clips/${clipId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (response.ok) {
        toast.success("Clip rejeitado");
        fetchSubmissions();
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao rejeitar clip");
      }
    } catch {
      toast.error("Erro ao rejeitar clip");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffHours < 48) return "Ontem";
    return date.toLocaleDateString("pt-BR");
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return String(views);
  };

  const pendingCount = receivedClips.filter(
    (c) => c.status === "PENDING"
  ).length;
  const approvedCount = receivedClips.filter(
    (c) => c.status === "APPROVED"
  ).length;
  const rejectedCount = receivedClips.filter(
    (c) => c.status === "REJECTED"
  ).length;

  const filteredClips =
    activeFilter === "all"
      ? receivedClips
      : receivedClips.filter((clip) => clip.status === activeFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Submissões
          </h1>
          {pendingCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-semibold text-warning">
              {pendingCount}
            </span>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">
          Revise e aprove clips submetidos para suas campanhas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total recebidas</p>
              <p className="text-2xl font-bold">{receivedClips.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aprovadas</p>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejeitadas</p>
              <p className="text-2xl font-bold">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
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
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {receivedClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground mb-2">
            Nenhuma submissão recebida ainda.
          </p>
          <p className="text-sm text-muted-foreground">
            Crie uma campanha para começar a receber submissões de clippers.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="text-primary hover:underline text-sm mt-4"
          >
            Criar campanha →
          </Link>
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground">
            Nenhuma submissão encontrada para este filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={clip.clipper.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {getInitials(clip.clipper.name || clip.clipper.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">
                      {clip.clipper.name || clip.clipper.email}
                    </p>
                    <Badge variant="secondary" className={statusColors[clip.status]}>
                      {statusLabels[clip.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {clip.campaign.title}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {formatViews(clip.currentViews)} views
                    </span>
                    <span className="font-medium text-success">
                      R$ {Number(clip.earnings).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="secondary" className={platformColors[clip.platform]}>
                    {platformLabels[clip.platform] || clip.platform}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(clip.submittedAt)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                  <a
                    href={clip.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Ver vídeo
                  </a>
                </Button>
                {clip.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleReject(clip.id)}
                      disabled={actionLoading === clip.id}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(clip.id)}
                      disabled={actionLoading === clip.id}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      {actionLoading === clip.id ? "..." : "Aprovar"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
