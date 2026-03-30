"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Users, ExternalLink } from "lucide-react";

interface CampaignCardProps {
  id: string;
  title: string;
  creator?: string;
  cpm: number;
  budget: number;
  spent: number;
  views: number;
  clippers: number;
  platforms: string[];
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "DRAFT";
  isExplore?: boolean;
}

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

export function CampaignCard({
  id,
  title,
  creator,
  cpm,
  budget,
  spent,
  views,
  clippers,
  platforms,
  status,
  isExplore = false,
}: CampaignCardProps) {
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const href = isExplore ? `/campaigns/${id}` : `/dashboard/campaigns/${id}`;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    });
  };

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base truncate">{title}</h3>
            <Badge variant="secondary" className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
          {creator && (
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {creator}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-primary">R$ {cpm.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">por 1k views</p>
        </div>
      </div>

      {/* Platforms */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {platforms.map((platform) => (
          <Badge
            key={platform}
            variant="secondary"
            className={platformColors[platform] || "bg-secondary"}
          >
            {platformLabels[platform] || platform}
          </Badge>
        ))}
      </div>

      {/* Budget Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Orçamento</span>
          <span className="font-medium">
            R$ {formatCurrency(spent)} / R$ {formatCurrency(budget)}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {clippers} clippers
          </span>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {isExplore ? "Participar" : "Ver detalhes"}
        </Link>
      </div>
    </div>
  );
}
