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

interface ExploreCampaignsProps {
  campaigns: CampaignData[];
}

type FilterType = "all" | "TIKTOK" | "YOUTUBE" | "INSTAGRAM";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "INSTAGRAM", label: "Instagram" },
];

export function ExploreCampaigns({ campaigns }: ExploreCampaignsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredCampaigns =
    activeFilter === "all"
      ? campaigns
      : campaigns.filter((campaign) =>
          campaign.platforms.includes(activeFilter)
        );

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
            Nenhuma campanha encontrada para esta plataforma.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} isExplore />
          ))}
        </div>
      )}
    </div>
  );
}
