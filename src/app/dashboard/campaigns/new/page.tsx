"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MINIMUM_BUDGET,
  MINIMUM_RATE_PER_MIL,
  MAXIMUM_RATE_PER_MIL,
} from "@/types";

const PLATFORMS = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "TWITTER"] as const;
const CAMPAIGN_TYPES = ["CLIPPING", "UGC"] as const;

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "CLIPPING" as (typeof CAMPAIGN_TYPES)[number],
    platforms: [] as string[],
    budget: "",
    ratePerMil: "",
    maxPayoutPerClip: "",
    instructions: "",
    sourceContent: "",
  });

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/users/me");
      const data = await response.json();
      if (response.ok) {
        setUserBalance(Number(data.user.balance));
      }
    } catch {
      console.error("Error fetching balance");
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleAddRequirement = () => {
    if (
      newRequirement.trim() &&
      !requirements.includes(newRequirement.trim())
    ) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const budgetValue = parseFloat(formData.budget) || 0;
  const hasInsufficientBalance =
    userBalance !== null && budgetValue > userBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          ...formData,
          budget: parseFloat(formData.budget),
          ratePerMil: parseFloat(formData.ratePerMil),
          maxPayoutPerClip: formData.maxPayoutPerClip
            ? parseFloat(formData.maxPayoutPerClip)
            : undefined,
          requirements,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Saldo insuficiente") {
          toast.error(
            `Saldo insuficiente. Você tem R$ ${data.balance?.toFixed(2) || "0.00"}`
          );
        } else {
          toast.error(data.error || "Erro ao criar campanha");
        }
        return;
      }

      toast.success("Campanha criada com sucesso!");
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch {
      toast.error("Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/campaigns"
          className="text-zinc-400 hover:text-white text-sm"
        >
          ← Voltar para campanhas
        </Link>
        <h1 className="text-3xl font-bold text-white mt-4">Nova Campanha</h1>
        <p className="text-zinc-400">
          Configure sua campanha de Content Rewards
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Balance Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Saldo na carteira</p>
                <p className="text-2xl font-bold text-emerald-400">
                  R$ {userBalance?.toFixed(2) ?? "..."}
                </p>
              </div>
              <Link href="/dashboard/wallet">
                <Button variant="outline" className="border-zinc-600">
                  Adicionar Fundos
                </Button>
              </Link>
            </div>
            {hasInsufficientBalance && (
              <p className="text-sm text-red-400 mt-2">
                Saldo insuficiente para o orçamento selecionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">
                Título da Campanha *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Clips do meu canal de gaming"
                required
                minLength={5}
                maxLength={100}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">
                Descrição *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o que você espera dos clips..."
                required
                minLength={20}
                maxLength={2000}
                rows={4}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Tipo de Campanha *</Label>
              <div className="flex gap-4">
                {CAMPAIGN_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.type === type ? "default" : "outline"}
                    className={
                      formData.type === type
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-zinc-600"
                    }
                    onClick={() => setFormData({ ...formData, type })}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Plataformas</CardTitle>
            <CardDescription className="text-zinc-400">
              Selecione onde os clips podem ser publicados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <Badge
                  key={platform}
                  variant={
                    formData.platforms.includes(platform) ? "default" : "outline"
                  }
                  className={`cursor-pointer ${
                    formData.platforms.includes(platform)
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "border-zinc-600 hover:bg-zinc-700"
                  }`}
                  onClick={() => handlePlatformToggle(platform)}
                >
                  {platform}
                </Badge>
              ))}
            </div>
            {formData.platforms.length === 0 && (
              <p className="text-sm text-red-400 mt-2">
                Selecione pelo menos uma plataforma
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Orçamento e Pagamento</CardTitle>
            <CardDescription className="text-zinc-400">
              O valor será deduzido da sua carteira ao criar a campanha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-zinc-300">
                  Orçamento Total (R$) *
                </Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min={MINIMUM_BUDGET}
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder={`Mínimo R$ ${MINIMUM_BUDGET}`}
                  required
                  className={`bg-zinc-700 border-zinc-600 text-white ${
                    hasInsufficientBalance ? "border-red-500" : ""
                  }`}
                />
                {hasInsufficientBalance && (
                  <p className="text-xs text-red-400">
                    Você precisa de mais R${" "}
                    {(budgetValue - (userBalance || 0)).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ratePerMil" className="text-zinc-300">
                  Valor por 1.000 views (R$) *
                </Label>
                <Input
                  id="ratePerMil"
                  type="number"
                  step="0.01"
                  min={MINIMUM_RATE_PER_MIL}
                  max={MAXIMUM_RATE_PER_MIL}
                  value={formData.ratePerMil}
                  onChange={(e) =>
                    setFormData({ ...formData, ratePerMil: e.target.value })
                  }
                  placeholder={`R$ ${MINIMUM_RATE_PER_MIL} - ${MAXIMUM_RATE_PER_MIL}`}
                  required
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPayoutPerClip" className="text-zinc-300">
                Payout máximo por clip (R$) - opcional
              </Label>
              <Input
                id="maxPayoutPerClip"
                type="number"
                step="0.01"
                min="0"
                value={formData.maxPayoutPerClip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPayoutPerClip: e.target.value,
                  })
                }
                placeholder="Deixe em branco para não limitar"
                className="bg-zinc-700 border-zinc-600 text-white"
              />
              <p className="text-xs text-zinc-500">
                Se definido, limita quanto um único clip pode ganhar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Requisitos</CardTitle>
            <CardDescription className="text-zinc-400">
              Adicione requisitos para os clips (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Ex: Mínimo 30 segundos"
                className="bg-zinc-700 border-zinc-600 text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRequirement}
                className="border-zinc-600"
              >
                Adicionar
              </Button>
            </div>

            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {requirements.map((req) => (
                  <Badge
                    key={req}
                    variant="secondary"
                    className="bg-zinc-700 text-zinc-300 cursor-pointer hover:bg-red-600/20 hover:text-red-400"
                    onClick={() => handleRemoveRequirement(req)}
                  >
                    {req} ×
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-zinc-300">
                Instruções para clippers
              </Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                placeholder="Instruções específicas sobre como criar os clips..."
                rows={4}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceContent" className="text-zinc-300">
                Conteúdo fonte (links)
              </Label>
              <Textarea
                id="sourceContent"
                value={formData.sourceContent}
                onChange={(e) =>
                  setFormData({ ...formData, sourceContent: e.target.value })
                }
                placeholder="Links do Google Drive, Dropbox, YouTube com o material..."
                rows={3}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
              <p className="text-xs text-zinc-500">
                Links externos onde os clippers podem baixar o material
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-600"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={
              loading ||
              formData.platforms.length === 0 ||
              hasInsufficientBalance
            }
          >
            {loading ? "Criando..." : "Criar Campanha"}
          </Button>
        </div>
      </form>
    </div>
  );
}
