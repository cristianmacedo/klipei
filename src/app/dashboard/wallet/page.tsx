"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DepositButton } from "@/components/deposit-button";
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
    // Check for deposit success/cancelled params
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
      // Fetch earnings data (which includes balance, withdrawals)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-400">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-400">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Carteira</h1>
        <p className="text-zinc-400">
          Gerencie seu saldo, depósitos e saques
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              R$ {data.balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Ganhos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {data.totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">de clips aprovados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {data.totalSpent.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">em campanhas</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Mínimo para Saque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {MINIMUM_WITHDRAWAL_AMOUNT.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white font-medium">Ações da Carteira</p>
              <p className="text-sm text-zinc-400">
                Adicione fundos ou solicite um saque
              </p>
            </div>

            <div className="flex gap-3">
              <DepositButton />

              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-zinc-600"
                    disabled={data.balance < MINIMUM_WITHDRAWAL_AMOUNT}
                  >
                    {data.balance < MINIMUM_WITHDRAWAL_AMOUNT
                      ? `Mínimo R$ ${MINIMUM_WITHDRAWAL_AMOUNT}`
                      : "Sacar"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-800 border-zinc-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Solicitar Saque
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      O saque será processado em até 48 horas úteis
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-zinc-300">
                        Valor (R$)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={MINIMUM_WITHDRAWAL_AMOUNT}
                        max={data.balance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                      <p className="text-xs text-zinc-500">
                        Disponível: R$ {data.balance.toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixKey" className="text-zinc-300">
                        Chave PIX
                      </Label>
                      <Input
                        id="pixKey"
                        type="text"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="CPF, email, telefone ou chave aleatória"
                        required
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>

                    {parseFloat(amount) > 0 && (
                      <div className="p-4 rounded-lg bg-zinc-700/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Valor</span>
                          <span className="text-white">
                            R$ {parseFloat(amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">
                            Taxa ({(WITHDRAWAL_FEE_PERCENTAGE * 100).toFixed(0)}
                            %)
                          </span>
                          <span className="text-red-400">
                            - R$ {fee.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-zinc-600">
                          <span className="text-zinc-300 font-medium">
                            Você recebe
                          </span>
                          <span className="text-emerald-400 font-medium">
                            R$ {netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={submitting || !amount || !pixKey}
                    >
                      {submitting ? "Processando..." : "Confirmar Saque"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
            Tudo
          </TabsTrigger>
          <TabsTrigger
            value="earnings"
            className="data-[state=active]:bg-zinc-700"
          >
            Ganhos
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="data-[state=active]:bg-zinc-700"
          >
            Saques
          </TabsTrigger>
        </TabsList>

        {/* All History */}
        <TabsContent value="all">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico Completo</CardTitle>
            </CardHeader>
            <CardContent>
              {data.withdrawals.length === 0 && data.earnings.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  Nenhuma movimentação ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Combine and sort by date */}
                  {[
                    ...data.withdrawals.map((w) => ({
                      ...w,
                      type: "withdrawal" as const,
                      date: new Date(w.createdAt),
                    })),
                    ...data.earnings.map((e) => ({
                      ...e,
                      type: "earning" as const,
                      date: new Date(e.createdAt),
                    })),
                  ]
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .slice(0, 20)
                    .map((item) =>
                      item.type === "withdrawal" ? (
                        <div
                          key={`w-${item.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/50"
                        >
                          <div>
                            <p className="text-white font-medium">Saque</p>
                            <p className="text-xs text-zinc-500">
                              {item.date.toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-medium">
                              - R$ {(item as typeof data.withdrawals[0]).netAmount.toFixed(2)}
                            </p>
                            <Badge
                              variant="secondary"
                              className={`${
                                (item as typeof data.withdrawals[0]).status === "COMPLETED"
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : (item as typeof data.withdrawals[0]).status === "PENDING"
                                    ? "bg-yellow-600/20 text-yellow-400"
                                    : "bg-red-600/20 text-red-400"
                              } border-0`}
                            >
                              {(item as typeof data.withdrawals[0]).status === "COMPLETED"
                                ? "Pago"
                                : (item as typeof data.withdrawals[0]).status === "PENDING"
                                  ? "Pendente"
                                  : "Falhou"}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={`e-${item.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/50"
                        >
                          <div>
                            <p className="text-white font-medium">
                              Ganho - {(item as typeof data.earnings[0]).campaignTitle}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {item.date.toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <p className="text-emerald-400 font-medium">
                            + R$ {(item as typeof data.earnings[0]).amount.toFixed(2)}
                          </p>
                        </div>
                      )
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings History */}
        <TabsContent value="earnings">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.earnings.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  Nenhum ganho ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {data.earnings.map((earning) => (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/50"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {earning.campaignTitle}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(earning.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <p className="text-emerald-400 font-medium">
                        + R$ {earning.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals History */}
        <TabsContent value="withdrawals">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              {data.withdrawals.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  Nenhum saque realizado
                </p>
              ) : (
                <div className="space-y-4">
                  {data.withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/50"
                    >
                      <div>
                        <p className="text-white font-medium">
                          R$ {withdrawal.netAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Taxa: R$ {withdrawal.fee.toFixed(2)} •{" "}
                          {new Date(withdrawal.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${
                          withdrawal.status === "COMPLETED"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : withdrawal.status === "PENDING"
                              ? "bg-yellow-600/20 text-yellow-400"
                              : "bg-red-600/20 text-red-400"
                        } border-0`}
                      >
                        {withdrawal.status === "COMPLETED"
                          ? "Pago"
                          : withdrawal.status === "PENDING"
                            ? "Pendente"
                            : "Falhou"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
