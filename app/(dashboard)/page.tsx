"use client";

import {
  AlertTriangle,
  Banknote,
  CircleCheck,
  FileClock,
  FolderOpen,
  Gauge,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useMe } from "@/hooks/use-me";
import {
  formatUgx,
  useDashboardStats,
} from "@/hooks/use-dashboard-stats";
import { useWalletBalances } from "@/hooks/use-escrow-balance";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { KpiStrip, type KPIItem } from "@/components/dashboard/kpi-strip";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { RecentLoanApplicationsTable } from "@/components/dashboard/performance-history-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SystemAlerts } from "@/components/dashboard/system-alerts";

function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

export default function OverviewPage() {
  const { data: me } = useMe();
  const stats = useDashboardStats();
  const walletQ = useWalletBalances();

  const topStats: KPIItem[] = [];
  if (me) {
    const disbursement = walletQ.data?.disbursement;
    const collection = walletQ.data?.collection;

    if (walletQ.isLoading) {
      topStats.push(
        {
          title: "Disbursement wallet",
          value: "—",
          subtitle: me.is_platform
            ? "Main disbursement available"
            : "Linked disbursement available",
          icon: Banknote,
          tone: "emerald",
        },
        {
          title: "Collection wallet",
          value: "—",
          subtitle: me.is_platform
            ? "Main collection available"
            : "Linked collection available",
          icon: Wallet,
          tone: "blue",
        },
      );
    } else {
      if (disbursement?.configured) {
        const available = disbursement.available;
        topStats.push({
          title: "Disbursement wallet",
          value:
            available == null || walletQ.isError
              ? "—"
              : formatUgx(Number(available)),
          subtitle: me.is_platform
            ? "Main disbursement available"
            : "Linked disbursement available",
          icon: Banknote,
          tone: "emerald",
        });
      }
      if (collection?.configured) {
        const available = collection.available;
        topStats.push({
          title: "Collection wallet",
          value:
            available == null || walletQ.isError
              ? "—"
              : formatUgx(Number(available)),
          subtitle: me.is_platform
            ? "Main collection available"
            : "Linked collection available",
          icon: Wallet,
          tone: "blue",
        });
      }
    }
  }
  if (stats.canBorrowers) {
    topStats.push({
      title: "Total Borrowers",
      value: formatCount(stats.borrowersTotal),
      subtitle: "Enrolled profiles",
      icon: Users,
      tone: "violet",
    });
  }
  if (stats.canApps) {
    topStats.push(
      {
        title: "Active Loans",
        value: formatCount(stats.activeLoans),
        subtitle: "Approved / outstanding",
        icon: FolderOpen,
        tone: "blue",
      },
      {
        title: "Total Loan Portfolio",
        value: formatUgx(stats.portfolioAmount),
        subtitle: "Active + repaid book",
        icon: Wallet,
        tone: "violet",
      },
      {
        title: "Loans Approved Today",
        value: formatCount(stats.approvedToday),
        subtitle: "Decisions today",
        icon: ShieldCheck,
        tone: "emerald",
      },
      {
        title: "Pending Applications",
        value: formatCount(stats.pendingApps),
        subtitle: "Awaiting review",
        icon: FileClock,
        tone: "blue",
      },
      {
        title: "Overdue Loans",
        value: formatCount(stats.overdueLoans),
        subtitle: "Past due date",
        icon: AlertTriangle,
        tone: "rose",
      },
      {
        title: "Repayment Rate",
        value:
          stats.repaymentRate == null ? "—" : `${stats.repaymentRate}%`,
        subtitle: "Repaid vs closed / overdue",
        icon: CircleCheck,
        tone: "violet",
      }
    );
  }
  if (stats.canScoring) {
    topStats.push({
      title: "Average Credit Score",
      value: formatCount(stats.avgScore),
      subtitle:
        stats.scoresTotal != null
          ? `From ${stats.scoresTotal.toLocaleString()} scores`
          : "Portfolio mean",
      icon: Gauge,
      tone: "amber",
    });
  }

  return (
    <div className="flex w-full max-w-[1600px] flex-1 flex-col gap-5">
      <GreetingSection fullName={me?.full_name} />
      <QuickActions />
      {topStats.length ? (
        <KpiStrip
          items={topStats}
          loading={
            stats.isLoading &&
            !walletQ.data?.disbursement?.configured &&
            !walletQ.data?.collection?.configured
          }
        />
      ) : null}
      {stats.canApps || stats.canScoring ? (
        <AnalyticsCharts
          disbursementTrend={stats.disbursementTrend}
          applicationTrend={stats.applicationTrend}
          statusBreakdown={stats.statusBreakdown}
          riskBands={stats.canScoring ? stats.riskBands : []}
          loading={stats.isLoading}
        />
      ) : null}
      {stats.canApps ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActivityFeed apps={stats.recentApps} loading={stats.isLoading} />
          <SystemAlerts
            overdueLoans={stats.overdueLoans}
            pendingApps={stats.pendingApps}
            repaymentRate={stats.repaymentRate}
            loading={stats.isLoading}
          />
        </div>
      ) : null}
      {stats.canApps ? (
        <RecentLoanApplicationsTable
          apps={stats.recentApps}
          scoreByBorrower={stats.scoreByBorrower}
          loading={stats.isLoading}
        />
      ) : null}
    </div>
  );
}
