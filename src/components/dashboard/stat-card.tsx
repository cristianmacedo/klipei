"use client";

import { cn } from "@/lib/utils";
import {
  Eye,
  TrendingUp,
  Film,
  Megaphone,
  Wallet,
  Users,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  eye: Eye,
  "trending-up": TrendingUp,
  film: Film,
  megaphone: Megaphone,
  wallet: Wallet,
  users: Users,
  "check-circle": CheckCircle2,
};

const iconBgColors: Record<string, string> = {
  primary: "bg-primary/20",
  success: "bg-success/20",
  warning: "bg-warning/20",
  accent: "bg-accent/20",
  "chart-4": "bg-chart-4/20",
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
  icon,
  iconColor = "text-primary",
}: StatCardProps) {
  const Icon = iconMap[icon] || Eye;
  const colorKey = iconColor.replace("text-", "");
  const bgColor = iconBgColors[colorKey] || "bg-secondary";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            bgColor,
            iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {change && (
            <p
              className={cn(
                "mt-0.5 text-xs",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
