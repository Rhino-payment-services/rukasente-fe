"use client";

import { useQueries } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type { BorrowerListResponse } from "@/hooks/use-borrowers";
import type { CreditScoreListResponse } from "@/hooks/use-scoring";
import type { LoanApplication, Paginated } from "@/types/loan";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

const ACTIVE_LOAN_STATUSES = new Set([
  "approved",
  "disbursing",
  "disbursed",
  "repaying",
  "overdue",
]);

const PENDING_STATUSES = new Set(["draft", "submitted", "under_review"]);

function isSameDay(iso: string | undefined | null, now = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short" });
}

function monthTitle(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function daysInMonth(key: string): string[] {
  const [y, m] = key.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const keys: string[] = [];
  for (let day = 1; day <= last; day++) {
    keys.push(
      `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  return keys;
}

function appAmount(a: LoanApplication): number {
  const amt =
    a.disbursed_amount != null
      ? Number(a.disbursed_amount)
      : Number(a.requested_amount || 0);
  return Number.isFinite(amt) ? amt : 0;
}

const DISBURSEMENT_STATUSES = new Set([
  "approved",
  "disbursing",
  "disbursed",
  "repaying",
  "overdue",
  "repaid",
]);

function riskBucket(band: string): "Low" | "Medium" | "High" | "Critical" {
  const b = band.trim().toUpperCase();
  if (["A", "EXCELLENT", "LOW", "LOW_RISK"].includes(b)) return "Low";
  if (["B", "GOOD", "MEDIUM", "MEDIUM_RISK"].includes(b)) return "Medium";
  if (["C", "FAIR", "AVERAGE"].includes(b)) return "High";
  if (["D", "E", "POOR", "HIGH_RISK", "CRITICAL", "VERY_HIGH"].includes(b)) {
    return "Critical";
  }
  // numeric-ish fallbacks from letter bands
  if (b.startsWith("A")) return "Low";
  if (b.startsWith("B")) return "Medium";
  if (b.startsWith("C")) return "High";
  return "Critical";
}

export type DashboardMonthPoint = {
  month: string;
  monthKey: string;
  amount: number;
};

export type DashboardApplicationMonthPoint = {
  month: string;
  monthKey: string;
  submitted: number;
  approved: number;
};

export type DashboardDayPoint = {
  dayKey: string;
  day: number;
  label: string;
  amount: number;
  count: number;
  submitted: number;
  approved: number;
};

export type DashboardTrendDetailRow = {
  id: string;
  applicationNumber: string;
  borrowerName: string;
  status: string;
  amount: number;
  when: string;
};

export type DashboardStatusPoint = {
  name: string;
  value: number;
  color: string;
};
export type DashboardRiskPoint = {
  label: string;
  pct: number;
  color: string;
  track: string;
  text: string;
};

/**
 * Portfolio overview metrics from admin list endpoints (real backend data).
 * Each query is enabled only when the caller has the matching view permission.
 */
export function useDashboardStats() {
  const { can } = usePermissions();
  const canBorrowers = can(Perm.BorrowerView);
  const canApps = can(Perm.LoanApplicationView);
  const canScoring = can(Perm.ScoringView);

  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard-stats", "borrowers"],
        enabled: canBorrowers,
        queryFn: async () => {
          const res = await apiClient.get("/admin/borrowers", {
            params: { page: 1, page_size: 1 },
          });
          return unwrapEnvelope<BorrowerListResponse>(res);
        },
        retry: 1,
      },
      {
        queryKey: ["dashboard-stats", "loan-applications"],
        enabled: canApps,
        queryFn: async () => {
          const res = await apiClient.get("/admin/loan-applications", {
            params: { page: 1, page_size: 200 },
          });
          return unwrapEnvelope<Paginated<LoanApplication>>(res);
        },
        retry: 1,
      },
      {
        queryKey: ["dashboard-stats", "scoring-results"],
        enabled: canScoring,
        queryFn: async () => {
          const res = await apiClient.get("/admin/scoring/results", {
            params: { page: 1, page_size: 200 },
          });
          return unwrapEnvelope<CreditScoreListResponse>(res);
        },
        retry: 1,
      },
    ],
  });

  const [borrowersQ, appsQ, scoresQ] = queries;
  const apps = canApps ? appsQ.data?.items ?? [] : [];
  const scores = canScoring ? scoresQ.data?.items ?? [] : [];

  const borrowersTotal = canBorrowers ? borrowersQ.data?.total ?? null : null;
  const appsTotal = canApps ? appsQ.data?.total ?? null : null;

  const pendingApps = apps.filter((a) => PENDING_STATUSES.has(a.status)).length;
  const approvedToday = apps.filter(
    (a) => a.status === "approved" && isSameDay(a.decisioned_at)
  ).length;
  const activeLoans = apps.filter((a) => ACTIVE_LOAN_STATUSES.has(a.status))
    .length;
  const overdueLoans = apps.filter((a) => a.status === "overdue").length;
  const repaidLoans = apps.filter((a) => a.status === "repaid").length;
  const closedOrRepaid = repaidLoans + apps.filter((a) => a.status === "defaulted").length;
  const repaymentRate =
    closedOrRepaid + overdueLoans > 0
      ? Math.round((repaidLoans / (closedOrRepaid + overdueLoans)) * 1000) / 10
      : null;

  const portfolioAmount = apps.reduce((sum, a) => {
    if (!ACTIVE_LOAN_STATUSES.has(a.status) && a.status !== "repaid") return sum;
    const amt =
      a.disbursed_amount != null
        ? Number(a.disbursed_amount)
        : Number(a.requested_amount || 0);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);

  const avgScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((s, r) => s + Number(r.total_score || 0), 0) /
            scores.length
        )
      : null;

  // Last 7 calendar months of disbursed/approved amounts
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(monthKey(d));
  }
  const byMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  const disbursementByDay = new Map<string, { amount: number; count: number }>();
  const disbursementDetailByMonth = new Map<string, DashboardTrendDetailRow[]>();

  for (const a of apps) {
    const when = a.disbursed_at || a.decisioned_at || a.submitted_at;
    if (!when) continue;
    if (!DISBURSEMENT_STATUSES.has(a.status)) continue;
    const d = new Date(when);
    if (Number.isNaN(d.getTime())) continue;
    const mk = monthKey(d);
    if (!byMonth.has(mk)) continue;
    const amt = appAmount(a);
    byMonth.set(mk, (byMonth.get(mk) || 0) + amt);

    const dk = dayKey(d);
    const dayPrev = disbursementByDay.get(dk) || { amount: 0, count: 0 };
    disbursementByDay.set(dk, {
      amount: dayPrev.amount + amt,
      count: dayPrev.count + 1,
    });

    const row: DashboardTrendDetailRow = {
      id: a.id,
      applicationNumber: a.application_number,
      borrowerName: a.borrower_name || "—",
      status: a.status,
      amount: amt,
      when: d.toISOString(),
    };
    const list = disbursementDetailByMonth.get(mk) || [];
    list.push(row);
    disbursementDetailByMonth.set(mk, list);
  }

  const disbursementTrend: DashboardMonthPoint[] = monthKeys.map((k) => ({
    month: monthLabel(k),
    monthKey: k,
    amount: byMonth.get(k) || 0,
  }));

  // Applications submitted / approved per month + daily
  const submittedByMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  const approvedByMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  const appsByDay = new Map<string, { submitted: number; approved: number }>();
  const applicationDetailByMonth = new Map<string, DashboardTrendDetailRow[]>();

  for (const a of apps) {
    const sub = a.submitted_at ? new Date(a.submitted_at) : null;
    if (sub && !Number.isNaN(sub.getTime())) {
      const mk = monthKey(sub);
      if (submittedByMonth.has(mk)) {
        submittedByMonth.set(mk, (submittedByMonth.get(mk) || 0) + 1);
        const dk = dayKey(sub);
        const prev = appsByDay.get(dk) || { submitted: 0, approved: 0 };
        appsByDay.set(dk, { ...prev, submitted: prev.submitted + 1 });

        const list = applicationDetailByMonth.get(mk) || [];
        list.push({
          id: a.id,
          applicationNumber: a.application_number,
          borrowerName: a.borrower_name || "—",
          status: a.status,
          amount: appAmount(a),
          when: sub.toISOString(),
        });
        applicationDetailByMonth.set(mk, list);
      }
    }
    if (
      a.status === "approved" ||
      ACTIVE_LOAN_STATUSES.has(a.status) ||
      a.status === "repaid"
    ) {
      const dec = a.decisioned_at ? new Date(a.decisioned_at) : null;
      if (dec && !Number.isNaN(dec.getTime())) {
        const mk = monthKey(dec);
        if (approvedByMonth.has(mk)) {
          approvedByMonth.set(mk, (approvedByMonth.get(mk) || 0) + 1);
          const dk = dayKey(dec);
          const prev = appsByDay.get(dk) || { submitted: 0, approved: 0 };
          appsByDay.set(dk, { ...prev, approved: prev.approved + 1 });

          // Include approval-day rows so daily filter can show them
          const list = applicationDetailByMonth.get(mk) || [];
          const already = list.some(
            (r) => r.id === a.id && r.when === dec.toISOString()
          );
          if (!already) {
            list.push({
              id: a.id,
              applicationNumber: a.application_number,
              borrowerName: a.borrower_name || "—",
              status: a.status,
              amount: appAmount(a),
              when: dec.toISOString(),
            });
            applicationDetailByMonth.set(mk, list);
          }
        }
      }
    }
  }

  const applicationTrend: DashboardApplicationMonthPoint[] = monthKeys.map(
    (k) => ({
      month: monthLabel(k),
      monthKey: k,
      submitted: submittedByMonth.get(k) || 0,
      approved: approvedByMonth.get(k) || 0,
    })
  );

  function dailySeriesForMonth(mk: string): DashboardDayPoint[] {
    return daysInMonth(mk).map((dk) => {
      const disb = disbursementByDay.get(dk) || { amount: 0, count: 0 };
      const appsDay = appsByDay.get(dk) || { submitted: 0, approved: 0 };
      const dayNum = Number(dk.slice(-2));
      return {
        dayKey: dk,
        day: dayNum,
        label: String(dayNum),
        amount: disb.amount,
        count: disb.count,
        submitted: appsDay.submitted,
        approved: appsDay.approved,
      };
    });
  }

  function detailRowsForMonth(
    kind: "disbursement" | "applications",
    mk: string
  ): DashboardTrendDetailRow[] {
    const source =
      kind === "disbursement"
        ? disbursementDetailByMonth.get(mk) || []
        : applicationDetailByMonth.get(mk) || [];
    return [...source].sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
    );
  }

  const statusCounts: Record<string, number> = {};
  for (const a of apps) {
    const s = a.status || "unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const statusColors: Record<string, string> = {
    approved: "#10b981",
    submitted: "#f59e0b",
    under_review: "#f59e0b",
    draft: "#94a3b8",
    declined: "#f43f5e",
    cancelled: "#64748b",
    disbursed: "#3b82f6",
    disbursing: "#3b82f6",
    repaying: "#0ea5e9",
    overdue: "#ef4444",
    repaid: "#22c55e",
    defaulted: "#64748b",
    disbursement_failed: "#f43f5e",
  };
  const statusBreakdown: DashboardStatusPoint[] = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
      color: statusColors[name] || "#94a3b8",
    }));

  const riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  for (const s of scores) {
    riskCounts[riskBucket(s.risk_band || "")] += 1;
  }
  const riskTotal = scores.length || 1;
  const riskBands: DashboardRiskPoint[] = [
    {
      label: "Low Risk",
      pct: Math.round((riskCounts.Low / riskTotal) * 100),
      color: "bg-emerald-500",
      track: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Medium Risk",
      pct: Math.round((riskCounts.Medium / riskTotal) * 100),
      color: "bg-amber-500",
      track: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      label: "High Risk",
      pct: Math.round((riskCounts.High / riskTotal) * 100),
      color: "bg-orange-500",
      track: "bg-orange-50",
      text: "text-orange-700",
    },
    {
      label: "Critical Risk",
      pct: Math.round((riskCounts.Critical / riskTotal) * 100),
      color: "bg-rose-500",
      track: "bg-rose-50",
      text: "text-rose-700",
    },
  ];

  const recentApps = [...apps]
    .sort(
      (a, b) =>
        new Date(b.submitted_at || b.created_at).getTime() -
        new Date(a.submitted_at || a.created_at).getTime()
    )
    .slice(0, 8);

  const scoreByBorrower = new Map(
    scores.map((s) => [s.borrower_profile_id, s] as const)
  );

  return {
    borrowersTotal,
    appsTotal,
    pendingApps,
    approvedToday,
    activeLoans,
    overdueLoans,
    repaymentRate,
    portfolioAmount,
    avgScore,
    scoresTotal: canScoring ? scoresQ.data?.total ?? scores.length : null,
    canBorrowers,
    canApps,
    canScoring,
    monthKeys,
    disbursementTrend,
    applicationTrend,
    dailySeriesForMonth,
    detailRowsForMonth,
    monthTitle,
    statusBreakdown,
    riskBands,
    recentApps,
    scoreByBorrower,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    error: queries.find((q) => q.error)?.error,
    refetch: async () => {
      await Promise.all(queries.map((q) => q.refetch()));
    },
  };
}

export function formatUgx(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "UGX 0";
  if (amount >= 1_000_000_000) {
    return `UGX ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `UGX ${Math.round(amount).toLocaleString()}`;
}
