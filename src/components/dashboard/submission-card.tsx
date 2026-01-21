"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, ExternalLink, Check, X } from "lucide-react";

interface SubmissionCardProps {
  id: string;
  clipper: string;
  clipperAvatar?: string | null;
  campaign: string;
  platform: string;
  videoUrl: string;
  views: number;
  earnings: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  submittedAt: string;
  isOwner?: boolean;
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SubmissionCard({
  id,
  clipper,
  clipperAvatar,
  campaign,
  platform,
  videoUrl,
  views,
  earnings,
  status,
  submittedAt,
  isOwner = false,
  isLoading = false,
  onApprove,
  onReject,
}: SubmissionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={clipperAvatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {getInitials(clipper)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{clipper}</h3>
            <Badge variant="secondary" className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{campaign}</p>
        </div>
        <Badge variant="secondary" className={platformColors[platform]}>
          {platform}
        </Badge>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views} views
          </span>
          <span className="font-medium text-success">
            R$ {earnings.toFixed(2)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{submittedAt}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" size="sm" asChild>
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Ver vídeo
          </a>
        </Button>
        {isOwner && status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => onReject?.(id)}
              disabled={isLoading}
            >
              <X className="mr-1.5 h-4 w-4" />
              Rejeitar
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove?.(id)}
              disabled={isLoading}
            >
              <Check className="mr-1.5 h-4 w-4" />
              {isLoading ? "..." : "Aprovar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
