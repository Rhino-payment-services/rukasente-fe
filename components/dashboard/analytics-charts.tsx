"use client";

import { useRouter } from "next/navigation";
import {
  trendsPageHref,
  type ChartTrendKind,
} from "@/components/dashboard/chart-trend-detail";
import { ChartCard } from "@/components/dashboard/chart-card";
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

function formatAxisTick(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function buildTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0];
  const step = max / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(step * i));
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-xs text-slate-400">
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

  const disburseTicks = buildTicks(disburseMax);
  const appTicks = buildTicks(appMax);

  const openMonth = (kind: ChartTrendKind, monthKey: string) => {
    router.push(trendsPageHref(kind, monthKey));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-[14px] border border-slate-200/80 bg-white p-5 ${i < 2 ? "xl:col-span-6" : i === 2 ? "xl:col-span-4" : "xl:col-span-8"}`}
          >
            <div className="h-[240px] animate-pulse rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ChartCard
          title="Loan Disbursement Trend"
          description="Click a month bar to open daily detail"
          className="xl:col-span-6"
          delay={0.12}
        >
          {!hasDisbursement ? (
            <EmptyChart label="No disbursements in the last 7 months yet" />
          ) : (
            <div className="flex h-[240px] gap-3">
              <div className="flex w-10 shrink-0 flex-col justify-between pb-6 pt-1 text-right text-[10px] tabular-nums text-slate-400">
                {[...disburseTicks].reverse().map((t) => (
                  <span key={t}>{formatAxisTick(t)}</span>
                ))}
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                  {disburseTicks.map((t) => (
                    <div
                      key={t}
                      className="border-t border-dashed border-slate-200/80"
                    />
                  ))}
                </div>
                <div className="relative flex h-full items-end gap-2 pb-6">
                  {disbursementTrend.map((d) => {
                    const h =
                      d.amount > 0
                        ? Math.max(8, (d.amount / disburseMax) * 100)
                        : 1;
                    return (
                      <button
                        key={d.monthKey}
                        type="button"
                        onClick={() => openMonth("disbursement", d.monthKey)}
                        className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
                        title={`${d.month}: ${formatUgx(d.amount)} — open daily view`}
                      >
                        <div
                          className="w-[70%] max-w-[36px] rounded-t-md bg-[#4f46e5] transition group-hover:bg-[#4338ca]"
                          style={{
                            height: `${h}%`,
                            opacity: d.amount > 0 ? 1 : 0.2,
                          }}
                        />
                        <span className="absolute -bottom-5 text-[10px] font-medium text-slate-500 group-hover:text-slate-800">
                          {d.month}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Applications vs Approvals"
          description="Click a month to open daily submitted / approved"
          className="xl:col-span-6"
          delay={0.15}
          legend={
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#c4b5fd]" /> Applications
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#4f46e5]" /> Approvals
              </span>
            </div>
          }
        >
          {!hasApps ? (
            <EmptyChart label="No applications in the last 7 months yet" />
          ) : (
            <div className="flex h-[240px] gap-3">
              <div className="flex w-8 shrink-0 flex-col justify-between pb-6 pt-1 text-right text-[10px] tabular-nums text-slate-400">
                {[...appTicks].reverse().map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                  {appTicks.map((t) => (
                    <div
                      key={t}
                      className="border-t border-dashed border-slate-200/80"
                    />
                  ))}
                </div>
                <div className="relative flex h-full items-end gap-2.5 pb-6">
                  {applicationTrend.map((d) => (
                    <button
                      key={d.monthKey}
                      type="button"
                      onClick={() => openMonth("applications", d.monthKey)}
                      className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
                      title={`${d.month}: ${d.submitted} submitted, ${d.approved} approved — open daily view`}
                    >
                      <div className="flex h-[100%] w-full max-w-[44px] items-end justify-center gap-1">
                        <div
                          className="w-[42%] rounded-t-md bg-[#c4b5fd] transition group-hover:bg-[#a78bfa]"
                          style={{
                            height: `${Math.max(
                              4,
                              (d.submitted / appMax) * 100
                            )}%`,
                          }}
                        />
                        <div
                          className="w-[42%] rounded-t-md bg-[#4f46e5] transition group-hover:bg-[#4338ca]"
                          style={{
                            height: `${Math.max(
                              4,
                              (d.approved / appMax) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="absolute -bottom-5 text-[10px] font-medium text-slate-500 group-hover:text-slate-800">
                        {d.month}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ChartCard
          title="Application Status"
          description="Live pipeline breakdown"
          filterLabel="Live"
          className="xl:col-span-4"
          delay={0.18}
        >
          {!hasStatus ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No applications yet
            </p>
          ) : (
            <div className="space-y-2.5">
              {statusBreakdown.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="flex-1 capitalize text-slate-600">{d.name}</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {d.value}
                  </span>
                  <span className="w-10 text-right tabular-nums text-slate-400">
                    {Math.round((d.value / statusTotal) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Credit Risk Bands"
          description="From latest scored borrowers in the portfolio"
          filterLabel="Portfolio"
          className="xl:col-span-8"
          delay={0.2}
        >
          {!hasRisk ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No credit scores yet — run scoring from Borrowers
            </p>
          ) : (
            <div className="space-y-3.5">
              {riskBands.map((b) => (
                <div key={b.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className={`font-medium ${b.text}`}>{b.label}</span>
                    <span className="font-semibold tabular-nums text-slate-700">
                      {b.pct}%
                    </span>
                  </div>
                  <div className={`h-2.5 overflow-hidden rounded-full ${b.track}`}>
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </>
  );
}
