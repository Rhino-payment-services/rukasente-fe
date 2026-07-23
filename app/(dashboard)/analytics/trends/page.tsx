"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  ChartTrendDetail,
  trendsPageHref,
  type ChartTrendKind,
} from "@/components/dashboard/chart-trend-detail";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { CompactLoading } from "@/components/ui/loading";

function parseKind(raw: string | null): ChartTrendKind {
  return raw === "applications" ? "applications" : "disbursement";
}

function TrendsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stats = useDashboardStats();

  const kind = parseKind(searchParams.get("kind"));
  const monthFromUrl = searchParams.get("month");

  const monthKey = useMemo(() => {
    if (monthFromUrl && /^\d{4}-\d{2}$/.test(monthFromUrl)) {
      return monthFromUrl;
    }
    if (kind === "disbursement") {
      const hit = [...stats.disbursementTrend]
        .reverse()
        .find((d) => d.amount > 0);
      return (
        hit?.monthKey ||
        stats.monthKeys[stats.monthKeys.length - 1] ||
        monthKeyFallback()
      );
    }
    const hit = [...stats.applicationTrend]
      .reverse()
      .find((d) => d.submitted > 0 || d.approved > 0);
    return (
      hit?.monthKey ||
      stats.monthKeys[stats.monthKeys.length - 1] ||
      monthKeyFallback()
    );
  }, [
    monthFromUrl,
    kind,
    stats.disbursementTrend,
    stats.applicationTrend,
    stats.monthKeys,
  ]);

  const title =
    kind === "disbursement"
      ? "Loan disbursement trend"
      : "Applications vs approvals";

  if (stats.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <CompactLoading message="Loading trend details…" />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[1200px] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" />
            Back to overview
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">
              Daily view and application list for the selected month
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <TabLink
            active={kind === "disbursement"}
            href={trendsPageHref("disbursement", monthKey)}
            label="Disbursements"
          />
          <TabLink
            active={kind === "applications"}
            href={trendsPageHref("applications", monthKey)}
            label="Applications"
          />
        </div>
      </div>

      <ChartTrendDetail
        kind={kind}
        monthKey={monthKey}
        monthTitle={stats.monthTitle(monthKey)}
        monthKeys={stats.monthKeys}
        daily={stats.dailySeriesForMonth(monthKey)}
        rows={stats.detailRowsForMonth(kind, monthKey)}
        onMonthChange={(next) => {
          router.push(trendsPageHref(kind, next));
        }}
      />
    </div>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-[#08163d] text-white"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

function monthKeyFallback() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AnalyticsTrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <CompactLoading message="Loading…" />
        </div>
      }
    >
      <TrendsPageInner />
    </Suspense>
  );
}
