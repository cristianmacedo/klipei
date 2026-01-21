"use client";

import { ArrowUpRight, ArrowDownLeft, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "earning" | "expense";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface TransactionsListProps {
  transactions: Transaction[];
}

const typeIcons = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  earning: Film,
  expense: ArrowUpRight,
};

const typeColors = {
  deposit: "bg-primary/20 text-primary",
  withdrawal: "bg-destructive/20 text-destructive",
  earning: "bg-success/20 text-success",
  expense: "bg-destructive/20 text-destructive",
};

export function TransactionsList({ transactions }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h3 className="font-semibold">Transações recentes</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma transação ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <h3 className="font-semibold">Transações recentes</h3>
      </div>
      <div className="divide-y divide-border">
        {transactions.map((transaction) => {
          const Icon = typeIcons[transaction.type];
          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-4"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  typeColors[transaction.type]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">
                  {transaction.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transaction.date}
                  {transaction.status === "pending" && (
                    <span className="ml-2 text-warning">• Pendente</span>
                  )}
                  {transaction.status === "failed" && (
                    <span className="ml-2 text-destructive">• Falhou</span>
                  )}
                </p>
              </div>
              <p
                className={cn(
                  "font-semibold",
                  transaction.amount > 0 ? "text-success" : "text-foreground"
                )}
              >
                {transaction.amount > 0 ? "+" : ""}R${" "}
                {Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
