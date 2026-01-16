"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Campaign } from "@/db/schema";

interface CampaignActionsProps {
  campaign: Campaign;
}

export function CampaignActions({ campaign }: CampaignActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao atualizar campanha");
        return;
      }

      toast.success("Campanha atualizada!");
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-zinc-600"
          disabled={loading}
        >
          Ações
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-zinc-800 border-zinc-700" align="end">
        {campaign.status === "DRAFT" && (
          <DropdownMenuItem
            className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
            onClick={() => updateStatus("ACTIVE")}
          >
            Ativar campanha
          </DropdownMenuItem>
        )}

        {campaign.status === "ACTIVE" && (
          <DropdownMenuItem
            className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
            onClick={() => updateStatus("PAUSED")}
          >
            Pausar campanha
          </DropdownMenuItem>
        )}

        {campaign.status === "PAUSED" && (
          <>
            <DropdownMenuItem
              className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
              onClick={() => updateStatus("ACTIVE")}
            >
              Reativar campanha
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
              onClick={() => updateStatus("COMPLETED")}
            >
              Encerrar campanha
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-zinc-700" />

        <DropdownMenuItem
          className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
          onClick={() => router.push(`/campaigns/${campaign.id}`)}
        >
          Ver página pública
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
