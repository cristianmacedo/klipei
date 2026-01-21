"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ViewsChartProps {
  data?: Array<{ day: string; views: number; earnings: number }>;
  totalViews?: number;
  totalEarnings?: number;
}

const defaultData = [
  { day: "Seg", views: 0, earnings: 0 },
  { day: "Ter", views: 0, earnings: 0 },
  { day: "Qua", views: 0, earnings: 0 },
  { day: "Qui", views: 0, earnings: 0 },
  { day: "Sex", views: 0, earnings: 0 },
  { day: "Sáb", views: 0, earnings: 0 },
  { day: "Dom", views: 0, earnings: 0 },
];

export function ViewsChart({
  data = defaultData,
  totalViews = 0,
  totalEarnings = 0,
}: ViewsChartProps) {
  const formattedViews =
    totalViews >= 1000
      ? `${(totalViews / 1000).toFixed(1)}k`
      : totalViews.toString();

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Views nos últimos 7 dias</h3>
          <p className="text-sm text-muted-foreground">
            Total: {formattedViews} views • R$ {totalEarnings.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Views</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="oklch(0.7 0.18 160)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="oklch(0.7 0.18 160)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.22 0.01 260)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="oklch(0.65 0 0)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.65 0 0)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `${value / 1000}k` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.13 0.01 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                borderRadius: "8px",
                color: "oklch(0.98 0 0)",
              }}
              formatter={(value) => {
                const numValue = Number(value) || 0;
                return [
                  numValue >= 1000 ? `${(numValue / 1000).toFixed(1)}k` : numValue,
                  "Views",
                ];
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="oklch(0.7 0.18 160)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
