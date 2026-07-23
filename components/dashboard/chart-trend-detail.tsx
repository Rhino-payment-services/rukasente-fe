"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatUgx,
  type DashboardDayPoint,
  type DashboardTrendDetailRow,
} from "@/hooks/use-dashboard-stats";

export type ChartTrendKind = "disbursement" | "applications";

type ChartTrendDetailProps = {
  kind: ChartTrendKind;
  monthKey: string;
  monthTitle: string;
  monthKeys: string[];
  daily: DashboardDayPoint[];
  rows: DashboardTrendDetailRow[];
  onMonthChange?: (monthKey: string) => void;
};

function maxOf(nums: number[]) {
  return Math.max(...nums, 1);
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function localDayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ChartTrendDetail({
  kind,
  monthKey,
  monthTitle,
  monthKeys,
  daily,
  rows,
  onMonthChange,
}: ChartTrendDetailProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dayFromUrl = searchParams.get("day");
  const [selectedDay, setSelectedDay] = useState<string | null>(dayFromUrl);

  useEffect(() => {
    setSelectedDay(dayFromUrl);
  }, [dayFromUrl, monthKey, kind]);

  const isDisbursement = kind === "disbursement";
  const chartMax = maxOf(
    daily.map((d) =>
      isDisbursement ? d.amount : Math.max(d.submitted, d.approved)
    )
  );

  const filteredRows = useMemo(() => {
    if (!selectedDay) return rows;
    return rows.filter((r) => localDayKey(r.when) === selectedDay);
  }, [rows, selectedDay]);

  const monthTotalAmount = daily.reduce((s, d) => s + d.amount, 0);
  const monthSubmitted = daily.reduce((s, d) => s + d.submitted, 0);
  const monthApproved = daily.reduce((s, d) => s + d.approved, 0);
  const activeDays = daily.filter((d) =>
    isDisbursement ? d.amount > 0 : d.submitted > 0 || d.approved > 0
  ).length;

  const setDay = (day: string | null) => {
    setSelectedDay(day);
    const params = new URLSearchParams(searchParams.toString());
    if (day) params.set("day", day);
    else params.delete("day");
    router.replace(`/analytics/trends?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {monthTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedDay
              ? `Filtered to ${new Date(selectedDay + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`
              : "Click a day bar to filter the list"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] text-slate-500">Month</label>
          <select
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
            value={monthKey}
            onChange={(e) => {
              setSelectedDay(null);
              onMonthChange?.(e.target.value);
            }}
          >
            {monthKeys.map((mk) => {
              const [y, m] = mk.split("-").map(Number);
              const label = new Date(y, m - 1, 1).toLocaleString(undefined, {
                month: "short",
                year: "numeric",
              });
              return (
                <option key={mk} value={mk}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isDisbursement ? (
          <>
            <Stat label="Month total" value={formatUgx(monthTotalAmount)} />
            <Stat label="Loans" value={String(rows.length)} />
            <Stat label="Active days" value={String(activeDays)} />
            <Stat
              label="Avg / loan"
              value={
                rows.length ? formatUgx(monthTotalAmount / rows.length) : "—"
              }
            />
          </>
        ) : (
          <>
            <Stat label="Submitted" value={String(monthSubmitted)} />
            <Stat label="Approved" value={String(monthApproved)} />
            <Stat label="Active days" value={String(activeDays)} />
            <Stat
              label="Approval rate"
              value={
                monthSubmitted
                  ? `${Math.round((monthApproved / monthSubmitted) * 100)}%`
                  : "—"
              }
            />
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-700">Daily breakdown</p>
          {selectedDay ? (
            <button
              type="button"
              className="text-xs text-[#08163d] underline-offset-2 hover:underline"
              onClick={() => setDay(null)}
            >
              Clear day filter
            </button>
          ) : (
            <span className="text-[10px] text-slate-400">{monthKey}</span>
          )}
        </div>
        <div className="flex h-[160px] items-end gap-px overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/60 px-1 pb-1 pt-2">
          {daily.map((d) => {
            const value = isDisbursement
              ? d.amount
              : Math.max(d.submitted, d.approved);
            const selected = selectedDay === d.dayKey;
            const hasData = isDisbursement
              ? d.amount > 0
              : d.submitted > 0 || d.approved > 0;
            return (
              <button
                key={d.dayKey}
                type="button"
                title={
                  isDisbursement
                    ? `${d.dayKey}: ${formatUgx(d.amount)} (${d.count})`
                    : `${d.dayKey}: ${d.submitted} submitted, ${d.approved} approved`
                }
                onClick={() =>
                  setDay(selectedDay === d.dayKey ? null : d.dayKey)
                }
                className={`flex min-w-[10px] flex-1 flex-col items-center justify-end gap-0.5 rounded-sm transition ${
                  selected
                    ? "bg-[#08163d]/10 ring-1 ring-[#08163d]/30"
                    : "hover:bg-white"
                }`}
              >
                {isDisbursement ? (
                  <div
                    className="w-full max-w-[16px] rounded-t bg-[#08163d]"
                    style={{
                      height: hasData
                        ? `${Math.max(4, (value / chartMax) * 120)}px`
                        : "2px",
                      opacity: hasData ? 1 : 0.2,
                    }}
                  />
                ) : (
                  <div className="flex w-full max-w-[16px] items-end gap-px">
                    <div
                      className="w-1/2 rounded-t bg-slate-300"
                      style={{
                        height:
                          d.submitted > 0
                            ? `${Math.max(4, (d.submitted / chartMax) * 120)}px`
                            : "2px",
                        opacity: d.submitted > 0 ? 1 : 0.2,
                      }}
                    />
                    <div
                      className="w-1/2 rounded-t bg-[#08163d]"
                      style={{
                        height:
                          d.approved > 0
                            ? `${Math.max(4, (d.approved / chartMax) * 120)}px`
                            : "2px",
                        opacity: d.approved > 0 ? 1 : 0.2,
                      }}
                    />
                  </div>
                )}
                {(d.day === 1 || d.day % 5 === 0) && (
                  <span className="text-[8px] leading-none text-slate-400">
                    {d.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!isDisbursement && (
          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-sm bg-slate-300" /> Submitted
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-sm bg-[#08163d]" /> Approved
            </span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-medium text-slate-700">
            Applications ({filteredRows.length})
          </p>
        </div>
        {filteredRows.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            No applications for this selection
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Application</th>
                  <th className="px-4 py-2.5 font-medium">Borrower</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-4 py-2.5 font-medium text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr
                    key={`${r.id}-${r.when}`}
                    className="border-t border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/loan-applications/${r.id}`}
                        className="font-medium text-[#08163d] hover:underline"
                      >
                        {r.applicationNumber}
                      </Link>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-2.5 text-slate-600">
                      {r.borrowerName}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-600">
                      {r.status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-900">
                      {formatUgx(r.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-500">
                      {formatWhen(r.when)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function trendsPageHref(
  kind: ChartTrendKind,
  monthKey: string,
  day?: string | null
) {
  const params = new URLSearchParams({ kind, month: monthKey });
  if (day) params.set("day", day);
  return `/analytics/trends?${params.toString()}`;
}
