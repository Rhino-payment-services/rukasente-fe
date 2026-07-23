"use client";

import {
  BadgeCheck,
  ClipboardList,
  Gauge,
  HandCoins,
  Percent,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { useMe } from "@/hooks/use-me";
import {
  formatUgx,
  useDashboardStats,
} from "@/hooks/use-dashboard-stats";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { KpiStrip, type KPIItem } from "@/components/dashboard/kpi-strip";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { RecentLoanApplicationsTable } from "@/components/dashboard/performance-history-table";
import { QuickActions } from "@/components/dashboard/quick-actions";

function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

export default function OverviewPage() {
  const { data: me } = useMe();
  const stats = useDashboardStats();

  const topStats: KPIItem[] = [
    {
      title: "Total Borrowers",
      value: formatCount(stats.borrowersTotal),
      subtitle: "Enrolled profiles",
      icon: Users,
    },
    {
      title: "Active Loans",
      value: formatCount(stats.activeLoans),
      subtitle: "Approved / outstanding",
      icon: HandCoins,
    },
    {
      title: "Total Loan Portfolio",
      value: formatUgx(stats.portfolioAmount),
      subtitle: "Active + repaid book",
      icon: Wallet,
    },
    {
      title: "Loans Approved Today",
      value: formatCount(stats.approvedToday),
      subtitle: "Decisions today",
      icon: BadgeCheck,
    },
    {
      title: "Pending Applications",
      value: formatCount(stats.pendingApps),
      subtitle: "Awaiting review",
      icon: ClipboardList,
    },
    {
      title: "Overdue Loans",
      value: formatCount(stats.overdueLoans),
      subtitle: "Past due date",
      icon: Timer,
    },
    {
      title: "Repayment Rate",
      value:
        stats.repaymentRate == null ? "—" : `${stats.repaymentRate}%`,
      subtitle: "Repaid vs closed / overdue",
      icon: Percent,
    },
    {
      title: "Average Credit Score",
      value: formatCount(stats.avgScore),
      subtitle:
        stats.scoresTotal != null
          ? `From ${stats.scoresTotal.toLocaleString()} scores`
          : "Portfolio mean",
      icon: Gauge,
    },
  ];

  return (
    <div className="flex w-full max-w-[1600px] flex-1 flex-col gap-4">
      <GreetingSection fullName={me?.full_name} />
      <QuickActions />
      <KpiStrip items={topStats} loading={stats.isLoading} />
      <AnalyticsCharts
        disbursementTrend={stats.disbursementTrend}
        applicationTrend={stats.applicationTrend}
        statusBreakdown={stats.statusBreakdown}
        riskBands={stats.riskBands}
        loading={stats.isLoading}
      />
      <RecentLoanApplicationsTable
        apps={stats.recentApps}
        scoreByBorrower={stats.scoreByBorrower}
        loading={stats.isLoading}
      />
    </div>
  );
}
