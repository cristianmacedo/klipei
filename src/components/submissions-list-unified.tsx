"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Clip, User, Campaign } from "@/db/schema";

interface ClipWithRelations extends Clip {
  clipper: User;
  campaign: Campaign & {
    creator: User;
  };
}

interface SubmissionsListUnifiedProps {
  clips: ClipWithRelations[];
  mode: "received" | "sent";
  showCampaign?: boolean;
}

export function SubmissionsListUnified({
  clips,
  mode,
  showCampaign = false,
}: SubmissionsListUnifiedProps) {
  const [selectedClip, setSelectedClip] = useState<ClipWithRelations | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isCreator = mode === "received";

  const handleApprove = async (clipId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clips/${clipId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao aprovar");
        return;
      }

      toast.success("Clip aprovado!");
      setSelectedClip(null);
      router.refresh();
    } catch {
      toast.error("Erro ao aprovar");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (clipId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clips/${clipId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao rejeitar");
        return;
      }

      toast.success("Clip rejeitado");
      setSelectedClip(null);
      setRejectionReason("");
      router.refresh();
    } catch {
      toast.error("Erro ao rejeitar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {clips.map((clip) => (
          <Card
            key={clip.id}
            className="bg-zinc-800 border-zinc-700 cursor-pointer hover:border-zinc-600 transition-colors"
            onClick={() => setSelectedClip(clip)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="border-zinc-600 text-zinc-400"
                    >
                      {clip.platform}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`${
                        clip.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : clip.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                      } border-0`}
                    >
                      {clip.status === "PENDING"
                        ? "Pendente"
                        : clip.status === "APPROVED"
                          ? "Aprovado"
                          : "Rejeitado"}
                    </Badge>
                  </div>

                  {showCampaign && (
                    <Link
                      href={
                        isCreator
                          ? `/dashboard/campaigns/${clip.campaignId}`
                          : `/campaigns/${clip.campaignId}`
                      }
                      className="text-white font-medium hover:text-emerald-400 block truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {clip.campaign.title}
                    </Link>
                  )}

                  <a
                    href={clip.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 hover:text-zinc-300 truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {clip.videoUrl}
                  </a>

                  <p className="text-sm text-zinc-500 mt-1">
                    {isCreator
                      ? `por ${clip.clipper.name || clip.clipper.email}`
                      : `para ${clip.campaign.creator.name || clip.campaign.creator.email}`}
                  </p>

                  {clip.status === "APPROVED" && (
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">
                        Views:{" "}
                        {(
                          clip.currentViews - clip.viewsAtSubmission
                        ).toLocaleString()}
                      </span>
                      <span className="text-emerald-400">
                        {isCreator ? "Pago" : "Ganhos"}: R${" "}
                        {Number(clip.earnings).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {clip.status === "REJECTED" && clip.rejectionReason && (
                    <p className="mt-2 text-sm text-red-400">
                      Motivo: {clip.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="text-right text-sm text-zinc-500 shrink-0">
                  {new Date(clip.submittedAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedClip} onOpenChange={() => setSelectedClip(null)}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Detalhes da Submissão
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {isCreator
                ? "Revise o clip e aprove ou rejeite"
                : "Detalhes do clip submetido"}
            </DialogDescription>
          </DialogHeader>

          {selectedClip && (
            <div className="space-y-4">
              <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden">
                {selectedClip.platform === "YOUTUBE" && (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedClip.videoId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                )}
                {selectedClip.platform === "TIKTOK" && (
                  <div className="flex items-center justify-center h-full">
                    <a
                      href={selectedClip.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      Abrir no TikTok →
                    </a>
                  </div>
                )}
                {!["YOUTUBE", "TIKTOK"].includes(selectedClip.platform) && (
                  <div className="flex items-center justify-center h-full">
                    <a
                      href={selectedClip.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      Abrir vídeo →
                    </a>
                  </div>
                )}
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Campanha</p>
                <Link
                  href={
                    isCreator
                      ? `/dashboard/campaigns/${selectedClip.campaignId}`
                      : `/campaigns/${selectedClip.campaignId}`
                  }
                  className="text-white font-medium hover:text-emerald-400"
                >
                  {selectedClip.campaign.title}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-400">
                    {isCreator ? "Clipper" : "Criador"}
                  </p>
                  <p className="text-white">
                    {isCreator
                      ? selectedClip.clipper.name || selectedClip.clipper.email
                      : selectedClip.campaign.creator.name ||
                        selectedClip.campaign.creator.email}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Plataforma</p>
                  <p className="text-white">{selectedClip.platform}</p>
                </div>
                <div>
                  <p className="text-zinc-400">Views no submit</p>
                  <p className="text-white">
                    {selectedClip.viewsAtSubmission.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Views atuais</p>
                  <p className="text-white">
                    {selectedClip.currentViews.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedClip.status === "APPROVED" && (
                <div className="p-3 bg-emerald-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">
                      {isCreator ? "Pago ao clipper" : "Seus ganhos"}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      R$ {Number(selectedClip.earnings).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {selectedClip.status === "REJECTED" &&
                selectedClip.rejectionReason && (
                  <div className="p-3 bg-red-900/20 rounded-lg">
                    <p className="text-red-400 text-sm">
                      <strong>Motivo da rejeição:</strong>{" "}
                      {selectedClip.rejectionReason}
                    </p>
                  </div>
                )}

              {isCreator && selectedClip.status === "PENDING" && (
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleApprove(selectedClip.id)}
                      disabled={loading}
                    >
                      {loading ? "Processando..." : "Aprovar"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-600/20"
                      onClick={() => {
                        if (rejectionReason) {
                          handleReject(selectedClip.id);
                        }
                      }}
                      disabled={loading || !rejectionReason}
                    >
                      Rejeitar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Motivo da rejeição (obrigatório para rejeitar)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
