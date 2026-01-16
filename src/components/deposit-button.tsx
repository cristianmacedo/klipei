"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MINIMUM_BUDGET } from "@/types";

interface DepositButtonProps {
  campaignId: string;
}

export function DepositButton({ campaignId }: DepositButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount: parseFloat(amount) * 100, // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao criar checkout");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          Adicionar Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-800 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar Orçamento</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Adicione fundos à sua campanha para ativá-la
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-zinc-300">
              Valor (R$)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={MINIMUM_BUDGET}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Mínimo R$ ${MINIMUM_BUDGET}`}
              required
              className="bg-zinc-700 border-zinc-600 text-white"
            />
          </div>

          <div className="text-sm text-zinc-400 space-y-1">
            <p>Você será redirecionado para o Stripe para completar o pagamento.</p>
            <p>Métodos aceitos: Cartão de crédito</p>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading || !amount}
          >
            {loading ? "Processando..." : `Pagar R$ ${amount || "0.00"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
