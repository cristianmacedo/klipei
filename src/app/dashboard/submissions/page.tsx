"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubmissionCard } from "@/components/dashboard/submission-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export default function SubmissionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [receivedClips, setReceivedClips] = useState<Clip[]>([]);
  const [sentClips, setSentClips] = useState<Clip[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/clips");
      const data = await response.json();

      if (response.ok) {
        setReceivedClips(data.received || []);
        setSentClips(data.sent || []);
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

    if (diffHours < 1) return "Agora há pouco";
    if (diffHours < 24) return `Há ${diffHours} horas`;
    if (diffHours < 48) return "Ontem";
    return date.toLocaleDateString("pt-BR");
  };

  const pendingReceivedCount = receivedClips.filter(
    (c) => c.status === "PENDING"
  ).length;
  const pendingSentCount = sentClips.filter(
    (c) => c.status === "PENDING"
  ).length;

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
          {pendingReceivedCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-semibold text-warning">
              {pendingReceivedCount}
            </span>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">
          Revise e aprove clips submetidos para suas campanhas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{receivedClips.length}</p>
          <p className="text-sm text-muted-foreground">Recebidas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{sentClips.length}</p>
          <p className="text-sm text-muted-foreground">Enviadas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-success">
            {receivedClips.filter((c) => c.status === "APPROVED").length}
          </p>
          <p className="text-sm text-muted-foreground">Aprovadas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">
            {pendingReceivedCount + pendingSentCount}
          </p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="received" className="space-y-6">
        <TabsList>
          <TabsTrigger value="received">
            Recebidas ({receivedClips.length})
          </TabsTrigger>
          <TabsTrigger value="sent">Enviadas ({sentClips.length})</TabsTrigger>
        </TabsList>

        {/* Received Tab */}
        <TabsContent value="received">
          {receivedClips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <p className="text-muted-foreground mb-2">
                Nenhuma submissão recebida ainda.
              </p>
              <p className="text-sm text-muted-foreground">
                Crie uma campanha para começar a receber submissões de clippers.
              </p>
              <Link
                href="/dashboard/campaigns"
                className="text-primary hover:underline text-sm mt-4"
              >
                Criar campanha →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {receivedClips.map((clip) => (
                <SubmissionCard
                  key={clip.id}
                  id={clip.id}
                  clipper={clip.clipper.name || clip.clipper.email}
                  clipperAvatar={clip.clipper.avatarUrl}
                  campaign={clip.campaign.title}
                  platform={clip.platform}
                  videoUrl={clip.videoUrl}
                  views={clip.currentViews}
                  earnings={Number(clip.earnings)}
                  status={clip.status}
                  submittedAt={formatDate(clip.submittedAt)}
                  isOwner
                  isLoading={actionLoading === clip.id}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Tab */}
        <TabsContent value="sent">
          {sentClips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <p className="text-muted-foreground mb-2">
                Você ainda não enviou nenhuma submissão.
              </p>
              <p className="text-sm text-muted-foreground">
                Explore campanhas e submeta seus clips para ganhar.
              </p>
              <Link
                href="/dashboard/explore"
                className="text-primary hover:underline text-sm mt-4"
              >
                Explorar campanhas →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sentClips.map((clip) => (
                <SubmissionCard
                  key={clip.id}
                  id={clip.id}
                  clipper={clip.clipper.name || clip.clipper.email}
                  clipperAvatar={clip.clipper.avatarUrl}
                  campaign={clip.campaign.title}
                  platform={clip.platform}
                  videoUrl={clip.videoUrl}
                  views={clip.currentViews}
                  earnings={Number(clip.earnings)}
                  status={clip.status}
                  submittedAt={formatDate(clip.submittedAt)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
