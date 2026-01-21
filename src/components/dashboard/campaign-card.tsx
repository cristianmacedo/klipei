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

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{title}</h3>
            <Badge variant="secondary" className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
          {creator && (
            <p className="mt-1 text-sm text-muted-foreground">{creator}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">R$ {cpm.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">por 1k views</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {platforms.map((platform) => (
          <Badge
            key={platform}
            variant="secondary"
            className={platformColors[platform] || "bg-secondary"}
          >
            {platform}
          </Badge>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Orçamento</span>
          <span className="font-medium">
            R$ {spent.toLocaleString("pt-BR")} / R${" "}
            {budget.toLocaleString("pt-BR")}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
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
        {isExplore ? (
          <Link href={href}>
            <Button size="sm">Participar</Button>
          </Link>
        ) : (
          <Link href={href}>
            <Button size="sm" variant="ghost">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Ver detalhes
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
