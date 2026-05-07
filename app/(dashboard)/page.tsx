"use client";

import { useMe } from "@/hooks/use-me";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { PerformanceHistoryTable } from "@/components/dashboard/performance-history-table";

export default function OverviewPage() {
  const { data: me } = useMe();
  const {
    staffTotal,
    borrowersTotal,
    subscriptionsTotal,
    activeIntegrations,
    isLoading: statsLoading,
  } = useDashboardStats();

  const showStat = (n: number | null): string | number => (n === null ? "—" : n);
  const topStats = [
    { title: "Unique users", value: showStat(borrowersTotal), delta: "+3.4%", up: true },
    { title: "Sessions", value: showStat(staffTotal), delta: "-1.2%", up: false },
    { title: "Page views", value: showStat(subscriptionsTotal), delta: "+5.8%", up: true },
    {
      title: "Active integrations",
      value: showStat(activeIntegrations),
      delta: "+2.1%",
      up: true,
    },
    { title: "Session duration", value: "5m 50s", delta: "-0.6%", up: false },
  ];

  return (
    <div className="flex w-full max-w-[1600px] flex-1 flex-col gap-4">
      <GreetingSection fullName={me?.full_name} />
      <KpiStrip items={topStats} loading={statsLoading} />
      <AnalyticsCharts />
      <PerformanceHistoryTable />
    </div>
  );
}
