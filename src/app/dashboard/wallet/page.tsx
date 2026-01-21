"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionsList } from "@/components/dashboard/transactions-list";
import { DepositButton } from "@/components/deposit-button";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import {
  MINIMUM_WITHDRAWAL_AMOUNT,
  WITHDRAWAL_FEE_PERCENTAGE,
} from "@/types";

interface WalletData {
  balance: number;
  totalEarnings: number;
  totalSpent: number;
  pixKey: string | null;
  withdrawals: Array<{
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: string;
    createdAt: string;
    processedAt: string | null;
  }>;
  deposits: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  earnings: Array<{
    id: string;
    amount: number;
    campaignTitle: string;
    clipId: string;
    createdAt: string;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    campaignTitle: string;
    type: "campaign_created" | "clipper_payout";
    createdAt: string;
  }>;
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const depositStatus = searchParams.get("deposit");
    if (depositStatus === "success") {
      toast.success("Depósito realizado com sucesso!");
      router.replace("/dashboard/wallet");
    } else if (depositStatus === "cancelled") {
      toast.error("Depósito cancelado");
      router.replace("/dashboard/wallet");
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const earningsRes = await fetch("/api/earnings");
      const earningsData = await earningsRes.json();

      if (earningsRes.ok) {
        setData({
          balance: earningsData.balance,
          totalEarnings: earningsData.totalEarnings,
          totalSpent: earningsData.totalSpent || 0,
          pixKey: earningsData.pixKey,
          withdrawals: earningsData.withdrawals || [],
          deposits: earningsData.deposits || [],
          earnings: earningsData.earningsHistory || [],
          expenses: earningsData.expenses || [],
        });
        if (earningsData.pixKey) {
          setPixKey(earningsData.pixKey);
        }
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          pixKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erro ao solicitar saque");
        return;
      }

      toast.success("Saque solicitado com sucesso!");
      setWithdrawOpen(false);
      setAmount("");
      fetchWalletData();
      router.refresh();
    } catch {
      toast.error("Erro ao solicitar saque");
    } finally {
      setSubmitting(false);
    }
  };

  const fee = parseFloat(amount || "0") * WITHDRAWAL_FEE_PERCENTAGE;
  const netAmount = parseFloat(amount || "0") - fee;

  // Prepare transactions for the list
  const transactions = data
    ? [
        ...data.withdrawals.map((w) => ({
          id: `w-${w.id}`,
          type: "withdrawal" as const,
          description: "Saque via PIX",
          amount: -w.netAmount,
          date: new Date(w.createdAt).toLocaleDateString("pt-BR"),
          status:
            w.status === "COMPLETED"
              ? ("completed" as const)
              : w.status === "PENDING"
                ? ("pending" as const)
                : ("failed" as const),
        })),
        ...data.earnings.map((e) => ({
          id: `e-${e.id}`,
          type: "earning" as const,
          description: `Ganhos - ${e.campaignTitle}`,
          amount: e.amount,
          date: new Date(e.createdAt).toLocaleDateString("pt-BR"),
          status: "completed" as const,
        })),
        ...data.deposits.map((d) => ({
          id: `d-${d.id}`,
          type: "deposit" as const,
          description: "Depósito via Stripe",
          amount: d.amount,
          date: new Date(d.createdAt).toLocaleDateString("pt-BR"),
          status:
            d.status === "COMPLETED"
              ? ("completed" as const)
              : ("pending" as const),
        })),
        ...data.expenses.map((ex) => ({
          id: `ex-${ex.id}`,
          type: "expense" as const,
          description:
            ex.type === "campaign_created"
              ? `Campanha - ${ex.campaignTitle}`
              : `Pagamento clipper - ${ex.campaignTitle}`,
          amount: -ex.amount,
          date: new Date(ex.createdAt).toLocaleDateString("pt-BR"),
          status: "completed" as const,
        })),
      ].sort(
        (a, b) =>
          new Date(b.date.split("/").reverse().join("-")).getTime() -
          new Date(a.date.split("/").reverse().join("-")).getTime()
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Carteira
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie seu saldo, deposite e saque via PIX.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Balance and Actions */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Saldo disponível</p>
            <p className="mt-2 text-4xl font-bold">
              R$ {data.balance.toFixed(2)}
            </p>
            {data.totalEarnings > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Total ganho: R$ {data.totalEarnings.toFixed(2)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="grid gap-3">
            <DepositButton />

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full justify-start"
                  disabled={data.balance < MINIMUM_WITHDRAWAL_AMOUNT}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  {data.balance < MINIMUM_WITHDRAWAL_AMOUNT
                    ? `Mínimo R$ ${MINIMUM_WITHDRAWAL_AMOUNT} para saque`
                    : "Sacar via PIX"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sacar via PIX</DialogTitle>
                  <DialogDescription>
                    Informe sua chave PIX e o valor para saque.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdraw}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="pixKey">Sua chave PIX</Label>
                      <Input
                        id="pixKey"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="CPF, E-mail ou Telefone"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        min={MINIMUM_WITHDRAWAL_AMOUNT}
                        max={data.balance}
                        step="0.01"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Mínimo: R$ {MINIMUM_WITHDRAWAL_AMOUNT.toFixed(2)} •
                        Disponível: R$ {data.balance.toFixed(2)}
                      </p>
                    </div>

                    {parseFloat(amount) > 0 && (
                      <div className="p-4 rounded-lg bg-secondary space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valor</span>
                          <span>R$ {parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Taxa ({(WITHDRAWAL_FEE_PERCENTAGE * 100).toFixed(0)}
                            %)
                          </span>
                          <span className="text-destructive">
                            - R$ {fee.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-border">
                          <span className="font-medium">Você recebe</span>
                          <span className="text-success font-medium">
                            R$ {netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setWithdrawOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !amount || !pixKey}
                    >
                      {submitting ? "Processando..." : "Solicitar saque"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">Como funciona</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  1
                </span>
                Ganhos de clips são creditados em até 24h após aprovação
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  2
                </span>
                Views são atualizadas a cada 6 horas
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  3
                </span>
                Saques via PIX são processados em até 1 hora útil
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Transactions */}
        <div className="lg:col-span-2">
          <TransactionsList transactions={transactions.slice(0, 20)} />
        </div>
      </div>
    </div>
  );
}
