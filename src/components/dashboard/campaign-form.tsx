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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, Info, AlertTriangle } from "lucide-react";
import {
  MINIMUM_BUDGET,
  MINIMUM_RATE_PER_MIL,
  MAXIMUM_RATE_PER_MIL,
} from "@/types";

const PLATFORMS = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "TWITTER"] as const;
const CAMPAIGN_TYPES = ["CLIPPING", "UGC"] as const;

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: "CLIPPING" | "UGC";
  platforms: string[];
  budget: string;
  spent: string;
  ratePerMil: string;
  maxPayoutPerClip: string;
  requirements: string[];
  instructions: string | null;
  sourceContent: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
}

interface CampaignFormProps {
  mode: "create" | "edit";
  campaignId?: string;
}

export function CampaignForm({ mode, campaignId }: CampaignFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
    if (isEditMode && campaignId) {
      fetchCampaign();
    }
  }, [isEditMode, campaignId]);

  const fetchCampaign = async () => {
    if (!campaignId) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao carregar campanha");
        router.push("/dashboard/campaigns");
        return;
      }

      const c = data.campaign as Campaign;
      setCampaign(c);
      setFormData({
        title: c.title,
        description: c.description,
        type: c.type,
        platforms: c.platforms,
        budget: c.budget,
        ratePerMil: c.ratePerMil,
        maxPayoutPerClip: c.maxPayoutPerClip || "",
        instructions: c.instructions || "",
        sourceContent: c.sourceContent || "",
      });
      setRequirements(c.requirements || []);
    } catch {
      toast.error("Erro ao carregar campanha");
      router.push("/dashboard/campaigns");
    } finally {
      setFetching(false);
    }
  };

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

  // Locking logic (only applies in edit mode)
  const isLocked = isEditMode && campaign?.status !== "DRAFT";
  const isCompleted = isEditMode && campaign?.status === "COMPLETED";

  // Budget calculations
  const currentBudget = campaign ? Number(campaign.budget) : 0;
  const newBudgetValue = parseFloat(formData.budget) || 0;
  const budgetDifference = isEditMode ? newBudgetValue - currentBudget : 0;

  // For create mode, check if budget exceeds balance
  // For edit mode, check if the additional amount exceeds balance
  const hasInsufficientBalance = isEditMode
    ? budgetDifference > userBalance
    : newBudgetValue > userBalance;

  // Calculate the amount that will be charged
  const amountToCharge = isEditMode
    ? budgetDifference > 0 ? budgetDifference : 0
    : newBudgetValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.platforms.length === 0) {
      toast.error("Selecione pelo menos uma plataforma");
      return;
    }

    if (hasInsufficientBalance) {
      toast.error(
        isEditMode
          ? "Saldo insuficiente para adicionar fundos"
          : "Saldo insuficiente na carteira"
      );
      return;
    }

    // Show confirmation dialog if there's a financial movement
    if (amountToCharge > 0) {
      setShowConfirmDialog(true);
      return;
    }

    // No financial movement, submit directly
    await performSubmit();
  };

  const performSubmit = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      if (isEditMode && campaign) {
        // UPDATE existing campaign
        const payload: Record<string, unknown> = {
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions || null,
          sourceContent: formData.sourceContent || null,
          requirements,
        };

        if (!isLocked) {
          // DRAFT: all fields editable
          payload.type = formData.type;
          payload.platforms = formData.platforms;
          payload.ratePerMil = parseFloat(formData.ratePerMil);
          payload.budget = parseFloat(formData.budget);
          payload.maxPayoutPerClip = parseFloat(formData.maxPayoutPerClip);
        } else if (!isCompleted) {
          // ACTIVE/PAUSED: only budget and maxPayoutPerClip can increase
          if (newBudgetValue > currentBudget) {
            payload.budget = newBudgetValue;
          }
          const currentMaxPayout = Number(campaign.maxPayoutPerClip);
          const newMaxPayout = parseFloat(formData.maxPayoutPerClip);
          if (newMaxPayout > currentMaxPayout) {
            payload.maxPayoutPerClip = newMaxPayout;
          }
        }

        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Erro ao atualizar campanha");
          return;
        }

        toast.success("Campanha atualizada com sucesso!");
        router.push(`/dashboard/campaigns/${campaignId}`);
        router.refresh();
      } else {
        // CREATE new campaign
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            type: formData.type,
            platforms: formData.platforms,
            budget: parseFloat(formData.budget),
            ratePerMil: parseFloat(formData.ratePerMil),
            maxPayoutPerClip: parseFloat(formData.maxPayoutPerClip),
            instructions: formData.instructions || undefined,
            sourceContent: formData.sourceContent || undefined,
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
        router.refresh();
      }
    } catch {
      toast.error(isEditMode ? "Erro ao atualizar campanha" : "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (isEditMode && !campaign) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={
            isEditMode
              ? `/dashboard/campaigns/${campaignId}`
              : "/dashboard/campaigns"
          }
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← {isEditMode ? "Voltar para campanha" : "Voltar para campanhas"}
        </Link>
        <h1 className="text-3xl font-bold mt-4">
          {isEditMode ? "Editar Campanha" : "Nova Campanha"}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? isCompleted
              ? "Campanha finalizada - apenas título e descrição podem ser editados"
              : isLocked
                ? "Alguns campos estão bloqueados após a ativação"
                : "Edite todos os campos da sua campanha"
            : "Configure sua campanha de Content Rewards"}
        </p>
      </div>

      {/* Locked fields warning (edit mode only) */}
      {isLocked && !isCompleted && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  Campos bloqueados após ativação
                </p>
                <p className="text-muted-foreground mt-1">
                  CPM, tipo e plataformas não podem ser alterados para proteger
                  os clippers que já estão trabalhando. Orçamento e payout
                  máximo só podem ser aumentados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Balance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isLocked ? "Saldo disponível para adicionar" : "Saldo na carteira"}
                </p>
                <p className="text-2xl font-bold text-primary">
                  R$ {userBalance.toFixed(2)}
                </p>
              </div>
              <Link href="/dashboard/wallet">
                <Button variant="outline">Adicionar Fundos</Button>
              </Link>
            </div>
            {hasInsufficientBalance && (
              <p className="text-sm text-destructive mt-2">
                {isEditMode
                  ? `Saldo insuficiente para adicionar R$ ${budgetDifference.toFixed(2)}`
                  : "Saldo insuficiente para o orçamento selecionado"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Campanha *</Label>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
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
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Tipo de Campanha *</Label>
                {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex gap-4">
                {CAMPAIGN_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.type === type ? "default" : "outline"}
                    disabled={isLocked}
                    onClick={() => setFormData({ ...formData, type })}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              {isLocked && (
                <p className="text-xs text-muted-foreground">
                  Tipo não pode ser alterado após ativação
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Plataformas</CardTitle>
              {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            <CardDescription>
              {isLocked
                ? "Plataformas não podem ser alteradas após ativação"
                : "Selecione onde os clips podem ser publicados"}
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
                  className={`${isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                  onClick={() => {
                    if (isLocked) return;
                    setFormData((prev) => ({
                      ...prev,
                      platforms: prev.platforms.includes(platform)
                        ? prev.platforms.filter((p) => p !== platform)
                        : [...prev.platforms, platform],
                    }));
                  }}
                >
                  {platform}
                </Badge>
              ))}
            </div>
            {!isLocked && formData.platforms.length === 0 && (
              <p className="text-sm text-destructive mt-2">
                Selecione pelo menos uma plataforma
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle>Orçamento e Pagamento</CardTitle>
            <CardDescription>
              {isLocked
                ? "Você pode adicionar mais fundos, mas não pode reduzir o orçamento"
                : "O valor será deduzido da sua carteira ao criar a campanha"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento Total (R$) *</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min={isLocked ? currentBudget : MINIMUM_BUDGET}
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder={`Mínimo R$ ${MINIMUM_BUDGET}`}
                  required
                  disabled={isCompleted}
                />
                {isLocked && !isCompleted && campaign && (
                  <p className="text-xs text-muted-foreground">
                    Atual: R$ {currentBudget.toFixed(2)} (gasto: R${" "}
                    {Number(campaign.spent).toFixed(2)})
                  </p>
                )}
                {isEditMode && budgetDifference > 0 && (
                  <p
                    className={`text-xs ${hasInsufficientBalance ? "text-destructive" : "text-primary"}`}
                  >
                    Adicionando R$ {budgetDifference.toFixed(2)} ao orçamento
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ratePerMil">Valor por 1.000 views (R$) *</Label>
                  {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
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
                  disabled={isLocked}
                />
                {isLocked && campaign && (
                  <p className="text-xs text-muted-foreground">
                    CPM travado em R$ {Number(campaign.ratePerMil).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPayoutPerClip">
                Payout máximo por clip (R$) *
              </Label>
              <Input
                id="maxPayoutPerClip"
                type="number"
                step="0.01"
                min={
                  isLocked && campaign?.maxPayoutPerClip
                    ? Number(campaign.maxPayoutPerClip)
                    : 1
                }
                value={formData.maxPayoutPerClip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPayoutPerClip: e.target.value,
                  })
                }
                placeholder="Ex: 50.00"
                required
                disabled={isCompleted}
              />
              <p className="text-xs text-muted-foreground">
                {isLocked && campaign?.maxPayoutPerClip
                  ? `Atual: R$ ${Number(campaign.maxPayoutPerClip).toFixed(2)} (só pode aumentar)`
                  : "Limita quanto um único clip pode ganhar no máximo"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        {!isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle>Requisitos</CardTitle>
              <CardDescription>
                Adicione requisitos para os clips (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Ex: Mínimo 30 segundos"
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
                      className="cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleRemoveRequirement(req)}
                    >
                      {req} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        {!isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções para clippers</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  placeholder="Instruções específicas sobre como criar os clips..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceContent">Conteúdo fonte (links)</Label>
                <Textarea
                  id="sourceContent"
                  value={formData.sourceContent}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceContent: e.target.value })
                  }
                  placeholder="Links do Google Drive, Dropbox, YouTube com o material..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Links externos onde os clippers podem baixar o material
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={
              loading ||
              formData.platforms.length === 0 ||
              hasInsufficientBalance
            }
          >
            {loading
              ? isEditMode
                ? "Salvando..."
                : "Criando..."
              : isEditMode
                ? "Salvar Alterações"
                : "Criar Campanha"}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirmar {isEditMode ? "Aumento de Orçamento" : "Criação"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Você está prestes a adicionar fundos ao orçamento desta campanha."
                : "Você está prestes a criar uma campanha. O valor será debitado da sua carteira."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              {isEditMode && budgetDifference > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Orçamento atual</span>
                    <span>R$ {currentBudget.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Novo orçamento</span>
                    <span>R$ {newBudgetValue.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Valor a debitar</span>
                    <span className="text-destructive">- R$ {budgetDifference.toFixed(2)}</span>
                  </div>
                </>
              )}
              {!isEditMode && (
                <div className="flex justify-between font-medium">
                  <span>Valor a debitar</span>
                  <span className="text-destructive">- R$ {newBudgetValue.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo atual</span>
                <span>R$ {userBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Saldo após operação</span>
                <span className={userBalance - amountToCharge < 0 ? "text-destructive" : "text-primary"}>
                  R$ {(userBalance - amountToCharge).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={performSubmit}
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
