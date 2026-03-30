"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpRight } from "lucide-react";

interface WalletCardProps {
  balance: number;
  pendingEarnings?: number;
}

export function WalletCard({ balance, pendingEarnings = 0 }: WalletCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">Carteira</h3>
        </div>
        <Link href="/dashboard/wallet">
          <Button variant="ghost" size="sm">
            Ver tudo
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="mt-1 text-3xl font-bold">R$ {balance.toFixed(2)}</p>
        {pendingEarnings > 0 && (
          <p className="mt-2 text-sm text-warning">
            R$ {pendingEarnings.toFixed(2)} em ganhos pendentes
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/dashboard/wallet">
          <Button variant="secondary" className="w-full">
            Depositar
          </Button>
        </Link>
        <Link href="/dashboard/wallet">
          <Button className="w-full">Sacar</Button>
        </Link>
      </div>
    </div>
  );
}
