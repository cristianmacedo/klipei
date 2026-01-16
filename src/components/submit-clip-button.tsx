"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SubmitClipButtonProps {
  campaignId: string;
}

export function SubmitClipButton({ campaignId }: SubmitClipButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"url" | "verify">("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [comment, setComment] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/clips/verify-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
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

  const handleVerifyAndSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          videoUrl,
          verificationCode,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao submeter clip");
        return;
      }

      toast.success("Clip submetido com sucesso!");
      setOpen(false);
      setStep("url");
      setVideoUrl("");
      setComment("");
      setVerificationCode("");
      router.refresh();
    } catch {
      toast.error("Erro ao submeter clip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
          Submeter Clip
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-800 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Submeter Clip</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === "url"
              ? "Informe a URL do seu vídeo no YouTube ou TikTok"
              : "Adicione o código de verificação na descrição do vídeo"}
          </DialogDescription>
        </DialogHeader>

        {step === "url" ? (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-zinc-300">
                URL do Vídeo
              </Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
                className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500"
              />
              <p className="text-xs text-zinc-500">
                Aceito: YouTube, TikTok
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-zinc-300">
                Comentário (opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Alguma mensagem para o criador..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? "Processando..." : "Continuar"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-700/50 border border-zinc-600">
              <p className="text-sm text-zinc-400 mb-2">
                Adicione este código na descrição do seu vídeo:
              </p>
              <p className="text-lg font-mono font-bold text-emerald-400">
                {verificationCode}
              </p>
            </div>

            <div className="space-y-2 text-sm text-zinc-400">
              <p>1. Vá até seu vídeo no YouTube/TikTok</p>
              <p>2. Edite a descrição e adicione o código acima</p>
              <p>3. Salve as alterações</p>
              <p>4. Clique em &quot;Verificar e Submeter&quot;</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-zinc-600"
                onClick={() => setStep("url")}
              >
                Voltar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleVerifyAndSubmit}
                disabled={loading}
              >
                {loading ? "Verificando..." : "Verificar e Submeter"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
