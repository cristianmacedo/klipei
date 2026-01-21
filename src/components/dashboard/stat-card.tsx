"use client";

import { cn } from "@/lib/utils";
import {
  Eye,
  TrendingUp,
  Film,
  Megaphone,
  Wallet,
  Users,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  eye: Eye,
  "trending-up": TrendingUp,
  film: Film,
  megaphone: Megaphone,
  wallet: Wallet,
  users: Users,
};

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconColor = "text-primary",
}: StatCardProps) {
  const Icon = iconMap[icon] || Eye;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-1 text-xs",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-secondary",
            iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
