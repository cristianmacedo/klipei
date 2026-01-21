"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  MINIMUM_BUDGET,
  MINIMUM_RATE_PER_MIL,
  MAXIMUM_RATE_PER_MIL,
} from "@/types";

const platforms = [
  { id: "TIKTOK", label: "TikTok" },
  { id: "YOUTUBE", label: "YouTube Shorts" },
  { id: "INSTAGRAM", label: "Instagram Reels" },
  { id: "TWITTER", label: "Twitter/X" },
];

interface CreateCampaignModalProps {
  userBalance?: number;
}

export function CreateCampaignModal({
  userBalance = 0,
}: CreateCampaignModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    ratePerMil: "",
    sourceContent: "",
  });

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const budgetValue = parseFloat(formData.budget) || 0;
  const hasInsufficientBalance = budgetValue > userBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlatforms.length === 0) {
      toast.error("Selecione pelo menos uma plataforma");
      return;
    }

    if (hasInsufficientBalance) {
      toast.error("Saldo insuficiente na carteira");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: "CLIPPING",
          platforms: selectedPlatforms,
          budget: parseFloat(formData.budget),
          ratePerMil: parseFloat(formData.ratePerMil),
          sourceContent: formData.sourceContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao criar campanha");
        return;
      }

      toast.success("Campanha criada com sucesso!");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        budget: "",
        ratePerMil: "",
        sourceContent: "",
      });
      setSelectedPlatforms([]);
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch {
      toast.error("Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar nova campanha</DialogTitle>
          <DialogDescription>
            Configure sua campanha de vídeos curtos. Clippers poderão criar
            cortes e você paga apenas por views reais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título da campanha</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Lançamento Produto X"
                required
                minLength={5}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o que você espera dos vídeos..."
                rows={3}
                required
                minLength={20}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder={String(MINIMUM_BUDGET)}
                  min={MINIMUM_BUDGET}
                  step="0.01"
                  required
                />
                {hasInsufficientBalance && (
                  <p className="text-xs text-destructive">
                    Saldo insuficiente (R$ {userBalance.toFixed(2)})
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cpm">CPM - R$ por 1k views</Label>
                <Input
                  id="cpm"
                  type="number"
                  value={formData.ratePerMil}
                  onChange={(e) =>
                    setFormData({ ...formData, ratePerMil: e.target.value })
                  }
                  placeholder="3.00"
                  min={MINIMUM_RATE_PER_MIL}
                  max={MAXIMUM_RATE_PER_MIL}
                  step="0.5"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Plataformas permitidas</Label>
              <div className="flex flex-wrap gap-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <label
                      htmlFor={platform.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {platform.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Link do material de referência</Label>
              <Input
                id="reference"
                value={formData.sourceContent}
                onChange={(e) =>
                  setFormData({ ...formData, sourceContent: e.target.value })
                }
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Compartilhe vídeos ou materiais que os clippers podem usar como
                base.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || hasInsufficientBalance}
            >
              {loading ? "Criando..." : "Criar campanha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
