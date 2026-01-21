"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ApiCampaign {
  id: string;
  title: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  platforms: string[];
}

interface Campaign {
  id: string;
  title: string;
  creator: string;
  platforms: string[];
}

interface SubmitClipModalProps {
  campaignId?: string;
  campaignTitle?: string;
  allowedPlatforms?: string[];
}

export function SubmitClipModal({
  campaignId,
  campaignTitle,
  allowedPlatforms,
}: SubmitClipModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    campaignId: campaignId || "",
    platform: "",
    videoUrl: "",
    comment: "",
  });

  useEffect(() => {
    if (open && !campaignId) {
      fetchCampaigns();
    }
  }, [open, campaignId]);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const response = await fetch("/api/campaigns?status=ACTIVE");
      const data = await response.json();
      if (response.ok) {
        // Map API response to component format
        const mappedCampaigns: Campaign[] = (data.campaigns || []).map(
          (c: ApiCampaign) => ({
            id: c.id,
            title: c.title,
            creator: c.creator.name || c.creator.email,
            platforms: c.platforms,
          })
        );
        setCampaigns(mappedCampaigns);
      }
    } catch {
      console.error("Error fetching campaigns");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const selectedCampaign = campaigns.find((c) => c.id === formData.campaignId);
  const availablePlatforms =
    allowedPlatforms || selectedCampaign?.platforms || [];

  const handleVerifyUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/clips/verify-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: formData.videoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao processar URL");
        return;
      }

      setVerificationCode(data.verificationCode);
      setStep("verify");
    } catch {
      toast.error("Erro ao processar URL");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: formData.campaignId,
          videoUrl: formData.videoUrl,
          verificationCode,
          comment: formData.comment || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao submeter clip");
        return;
      }

      toast.success("Clip submetido com sucesso!");
      handleClose();
      router.refresh();
    } catch {
      toast.error("Erro ao submeter clip");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep("form");
    setVerificationCode("");
    setCopied(false);
    setFormData({
      campaignId: campaignId || "",
      platform: "",
      videoUrl: "",
      comment: "",
    });
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Upload className="mr-1.5 h-4 w-4" />
          Submeter Clip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "form" ? "Submeter novo clip" : "Verificar vídeo"}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? campaignTitle
                ? `Submeta seu vídeo para a campanha "${campaignTitle}"`
                : "Cole o link do vídeo publicado para começar a ganhar."
              : "Adicione o código na descrição do seu vídeo para verificar."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleVerifyUrl}>
            <div className="grid gap-4 py-4">
              {!campaignId && (
                <div className="grid gap-2">
                  <Label htmlFor="campaign">Campanha</Label>
                  <Select
                    value={formData.campaignId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, campaignId: value, platform: "" })
                    }
                    disabled={loadingCampaigns}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingCampaigns
                            ? "Carregando..."
                            : "Selecione uma campanha"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title} - {campaign.creator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                  disabled={!campaignId && !formData.campaignId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Onde você postou?" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="videoUrl">Link do vídeo</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://www.tiktok.com/@usuario/video/..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link público do vídeo que você postou.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comment">Comentário (opcional)</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  placeholder="Alguma mensagem para o criador..."
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.platform ||
                  !formData.videoUrl ||
                  (!campaignId && !formData.campaignId)
                }
              >
                {loading ? "Processando..." : "Continuar"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Adicione este código na descrição do seu vídeo:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-lg font-bold text-primary">
                  {verificationCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Vá até seu vídeo no YouTube/TikTok</p>
              <p>2. Edite a descrição e adicione o código acima</p>
              <p>3. Salve as alterações</p>
              <p>4. Clique em &quot;Verificar e Submeter&quot;</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("form")}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Verificando..." : "Verificar e Submeter"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
