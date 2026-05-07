"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useRealtimeTraffic } from "@/hooks/use-realtime-traffic";

const pulseData = [
  { month: "Jul", desktop: 320, mobile: 260 },
  { month: "Aug", desktop: 280, mobile: 290 },
  { month: "Sep", desktop: 360, mobile: 300 },
  { month: "Oct", desktop: 330, mobile: 325 },
  { month: "Nov", desktop: 410, mobile: 340 },
  { month: "Dec", desktop: 390, mobile: 360 },
  { month: "Jan", desktop: 460, mobile: 390 },
];

const growthData = [
  { day: "Jan 01", growth: 21 },
  { day: "Jan 06", growth: 26 },
  { day: "Jan 11", growth: 18 },
  { day: "Jan 16", growth: 38 },
  { day: "Jan 21", growth: 44 },
  { day: "Jan 26", growth: 31 },
  { day: "Jan 31", growth: 36 },
];

const trafficData = [
  { name: "GitHub", value: 36.7, color: "#2563eb" },
  { name: "Google", value: 29, color: "#22c55e" },
  { name: "Bing", value: 8.3, color: "#f59e0b" },
  { name: "Other", value: 26, color: "#94a3b8" },
];

export function AnalyticsCharts() {
  const { points, latestValue } = useRealtimeTraffic();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="gap-0 border-slate-200 py-0 shadow-none xl:col-span-6">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm">Web pulse</CardTitle>
            <p className="text-xs text-slate-500">Monthly traffic overview</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ChartContainer
              config={{
                desktop: { color: "#64748b" },
                mobile: { color: "#2563eb" },
              }}
              className="h-[220px]"
            >
              <LineChart data={pulseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="desktop"
                  stroke="var(--color-desktop)"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mobile"
                  stroke="var(--color-mobile)"
                  dot={false}
                  strokeWidth={2.2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200 py-0 shadow-none xl:col-span-3">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm">User growth</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ChartContainer config={{ growth: { color: "#3b82f6" } }} className="h-[220px]">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="growth"
                  stroke="var(--color-growth)"
                  fill="var(--color-growth)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200 py-0 shadow-none xl:col-span-3">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm">Traffic statistic</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ChartContainer config={{ traffic: { color: "#2563eb" } }} className="h-[220px]">
              <PieChart>
                <Pie
                  data={trafficData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={2}
                >
                  {trafficData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
              {trafficData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>
                    {item.name} {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 border-slate-200 py-0 shadow-none">
        <CardHeader className="px-4 py-4">
          <CardTitle className="text-sm">Real-time traffic</CardTitle>
          <p className="text-xs text-slate-500">Live stream updates every 4 seconds</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="mb-3 text-sm text-slate-600">
            Current requests/minute:{" "}
            <span className="font-semibold text-slate-900">{latestValue}</span>
          </div>
          <ChartContainer config={{ live: { color: "#16a34a" } }} className="h-[220px]">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-live)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}

