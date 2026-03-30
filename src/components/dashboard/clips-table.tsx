"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

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
}

interface ClipsTableProps {
  clips: Clip[];
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

const platformLabels: Record<string, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter",
};

type FilterType = "all" | "APPROVED" | "PENDING" | "REJECTED";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "PENDING", label: "Pendentes" },
  { value: "REJECTED", label: "Rejeitados" },
];

export function ClipsTable({ clips }: ClipsTableProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredClips =
    activeFilter === "all"
      ? clips
      : clips.filter((clip) => clip.status === activeFilter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24) return "Hoje";
    if (diffHours < 48) return "Ontem";
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return String(views);
  };

  return (
    <div className="space-y-4">
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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground">Campanha</TableHead>
              <TableHead className="text-muted-foreground">Plataforma</TableHead>
              <TableHead className="text-muted-foreground">Views</TableHead>
              <TableHead className="text-muted-foreground">Ganhos</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum clip encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filteredClips.map((clip) => (
                <TableRow key={clip.id} className="border-border">
                  <TableCell className="font-medium">
                    {clip.campaign.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={platformColors[clip.platform]}
                    >
                      {platformLabels[clip.platform] || clip.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatViews(clip.currentViews)}</TableCell>
                  <TableCell className="text-success font-medium">
                    R$ {Number(clip.earnings).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[clip.status]}
                    >
                      {statusLabels[clip.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(clip.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={clip.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
