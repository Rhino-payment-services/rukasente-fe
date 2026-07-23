"use client";

import { useRouter } from "next/navigation";
import { Expand } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  trendsPageHref,
  type ChartTrendKind,
} from "@/components/dashboard/chart-trend-detail";
import {
  formatUgx,
  type DashboardApplicationMonthPoint,
  type DashboardMonthPoint,
  type DashboardRiskPoint,
  type DashboardStatusPoint,
} from "@/hooks/use-dashboard-stats";

type AnalyticsChartsProps = {
  disbursementTrend: DashboardMonthPoint[];
  applicationTrend: DashboardApplicationMonthPoint[];
  statusBreakdown: DashboardStatusPoint[];
  riskBands: DashboardRiskPoint[];
  loading?: boolean;
};

function maxOf(nums: number[]) {
  return Math.max(...nums, 1);
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400">
      {label}
    </div>
  );
}

export function AnalyticsCharts({
  disbursementTrend,
  applicationTrend,
  statusBreakdown,
  riskBands,
  loading,
}: AnalyticsChartsProps) {
  const router = useRouter();

  const disburseMax = maxOf(disbursementTrend.map((d) => d.amount));
  const appMax = maxOf(
    applicationTrend.flatMap((d) => [d.submitted, d.approved])
  );
  const statusTotal = statusBreakdown.reduce((s, d) => s + d.value, 0) || 1;
  const hasDisbursement = disbursementTrend.some((d) => d.amount > 0);
  const hasApps = applicationTrend.some(
    (d) => d.submitted > 0 || d.approved > 0
  );
  const hasStatus = statusBreakdown.length > 0;
  const hasRisk = riskBands.some((b) => b.pct > 0);

  const openMonth = (kind: ChartTrendKind, monthKey: string) => {
    router.push(trendsPageHref(kind, monthKey));
  };

  const openLatestWithData = (kind: ChartTrendKind) => {
    if (kind === "disbursement") {
      const hit = [...disbursementTrend].reverse().find((d) => d.amount > 0);
      openMonth(
        kind,
        hit?.monthKey ||
          disbursementTrend[disbursementTrend.length - 1]?.monthKey ||
          currentMonthKey()
      );
      return;
    }
    const hit = [...applicationTrend]
      .reverse()
      .find((d) => d.submitted > 0 || d.approved > 0);
    openMonth(
      kind,
      hit?.monthKey ||
        applicationTrend[applicationTrend.length - 1]?.monthKey ||
        currentMonthKey()
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className={`gap-0 border-slate-200/80 py-0 shadow-sm ${i < 2 ? "xl:col-span-6" : i === 2 ? "xl:col-span-4" : "xl:col-span-8"}`}
          >
            <CardContent className="p-4">
              <div className="h-[240px] animate-pulse rounded-lg bg-slate-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm xl:col-span-6">
          <CardHeader className="flex flex-row items-start justify-between gap-2 px-4 py-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Loan Disbursement Trend
              </CardTitle>
              <p className="text-xs text-slate-500">
                Click a month bar to open daily detail
              </p>
            </div>
            <button
              type="button"
              onClick={() => openLatestWithData("disbursement")}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Expand className="size-3" />
              Open
            </button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!hasDisbursement ? (
              <EmptyChart label="No disbursements in the last 7 months yet" />
            ) : (
              <div className="flex h-[220px] items-end gap-2">
                {disbursementTrend.map((d) => (
                  <button
                    key={d.monthKey}
                    type="button"
                    onClick={() => openMonth("disbursement", d.monthKey)}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#08163d]/40"
                    title={`${d.month}: ${formatUgx(d.amount)} — open daily view`}
                  >
                    <div
                      className="w-full rounded-t-md bg-[#08163d] transition group-hover:bg-[#122a66]"
                      style={{
                        height:
                          d.amount > 0
                            ? `${Math.max(8, (d.amount / disburseMax) * 180)}px`
                            : "2px",
                        opacity: d.amount > 0 ? 1 : 0.25,
                      }}
                    />
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-800">
                      {d.month}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm xl:col-span-6">
          <CardHeader className="flex flex-row items-start justify-between gap-2 px-4 py-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Applications vs Approvals
              </CardTitle>
              <p className="text-xs text-slate-500">
                Click a month to open daily submitted / approved
              </p>
            </div>
            <button
              type="button"
              onClick={() => openLatestWithData("applications")}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Expand className="size-3" />
              Open
            </button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!hasApps ? (
              <EmptyChart label="No applications in the last 7 months yet" />
            ) : (
              <div className="flex h-[220px] items-end gap-3">
                {applicationTrend.map((d) => (
                  <button
                    key={d.monthKey}
                    type="button"
                    onClick={() => openMonth("applications", d.monthKey)}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#08163d]/40"
                    title={`${d.month}: ${d.submitted} submitted, ${d.approved} approved — open daily view`}
                  >
                    <div className="flex w-full items-end justify-center gap-1">
                      <div
                        className="w-1/2 rounded-t bg-slate-300 transition group-hover:bg-slate-400"
                        style={{
                          height: `${Math.max(8, (d.submitted / appMax) * 180)}px`,
                        }}
                      />
                      <div
                        className="w-1/2 rounded-t bg-[#08163d] transition group-hover:bg-[#122a66]"
                        style={{
                          height: `${Math.max(8, (d.approved / appMax) * 180)}px`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-800">
                      {d.month}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-sm bg-slate-300" /> Submitted
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-sm bg-[#08163d]" /> Approved
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm xl:col-span-4">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Application Status
            </CardTitle>
            <p className="text-xs text-slate-500">Live pipeline breakdown</p>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {!hasStatus ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No applications yet
              </p>
            ) : (
              statusBreakdown.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="flex-1 capitalize text-slate-600">
                    {d.name}
                  </span>
                  <span className="font-medium text-slate-900">{d.value}</span>
                  <span className="w-10 text-right text-slate-400">
                    {Math.round((d.value / statusTotal) * 100)}%
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm xl:col-span-8">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Credit Risk Bands
            </CardTitle>
            <p className="text-xs text-slate-500">
              From latest scored borrowers in the portfolio
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {!hasRisk ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No credit scores yet — run scoring from Borrowers
              </p>
            ) : (
              riskBands.map((b) => (
                <div key={b.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className={b.text}>{b.label}</span>
                    <span className="font-medium text-slate-700">{b.pct}%</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${b.track}`}>
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
