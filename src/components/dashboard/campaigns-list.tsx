"use client";

import { useState } from "react";
import { CampaignCard } from "./campaign-card";

interface CampaignData {
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
}

interface CampaignsListProps {
  campaigns: CampaignData[];
  isExplore?: boolean;
}

type FilterType = "all" | "ACTIVE" | "PAUSED" | "COMPLETED";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "ACTIVE", label: "Ativas" },
  { value: "PAUSED", label: "Pausadas" },
  { value: "COMPLETED", label: "Concluídas" },
];

export function CampaignsList({ campaigns, isExplore = false }: CampaignsListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredCampaigns =
    activeFilter === "all"
      ? campaigns
      : campaigns.filter((campaign) => {
          if (activeFilter === "COMPLETED") {
            return campaign.status === "COMPLETED" || campaign.status === "DRAFT";
          }
          return campaign.status === activeFilter;
        });

  return (
    <div className="space-y-6">
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

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground">
            Nenhuma campanha encontrada para este filtro.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} isExplore={isExplore} />
          ))}
        </div>
      )}
    </div>
  );
}
