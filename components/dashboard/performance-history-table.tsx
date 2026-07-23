"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreditScoreResultSummary } from "@/hooks/use-scoring";
import type { LoanApplication } from "@/types/loan";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";

function formatMoney(amount: number, currency = "UGX") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function riskFromScore(score?: number): {
  label: string;
  variant: "success" | "warning" | "danger" | "info";
} {
  if (score == null) return { label: "—", variant: "info" };
  if (score >= 700) return { label: "Low", variant: "success" };
  if (score >= 600) return { label: "Medium", variant: "warning" };
  if (score >= 500) return { label: "High", variant: "danger" };
  return { label: "Critical", variant: "danger" };
}

function scoreTone(score: number) {
  if (score >= 700) return "text-emerald-700";
  if (score >= 600) return "text-amber-700";
  if (score >= 500) return "text-orange-700";
  return "text-rose-700";
}

type Props = {
  apps: LoanApplication[];
  scoreByBorrower: Map<string, CreditScoreResultSummary>;
  loading?: boolean;
};

export function RecentLoanApplicationsTable({
  apps,
  scoreByBorrower,
  loading,
}: Props) {
  return (
    <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-4">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-900">
            Recent Loan Applications
          </CardTitle>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest applications from the live pipeline
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 rounded-lg border-slate-200"
        >
          <Link href="/loan-applications">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                <th className="px-3 py-2.5 font-medium">Borrower</th>
                <th className="px-3 py-2.5 font-medium">Phone</th>
                <th className="px-3 py-2.5 font-medium">Score</th>
                <th className="px-3 py-2.5 font-medium">Requested</th>
                <th className="px-3 py-2.5 font-medium">Disbursed</th>
                <th className="px-3 py-2.5 font-medium">Risk</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Due</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                    Loading applications…
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                    No loan applications yet. Create one from New application.
                  </td>
                </tr>
              ) : (
                apps.map((row) => {
                  const score = scoreByBorrower.get(row.borrower_profile_id);
                  const totalScore = score?.total_score;
                  const risk = riskFromScore(totalScore);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-50 text-slate-700 transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {row.borrower_name || "—"}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {row.borrower_phone || "—"}
                      </td>
                      <td
                        className={`px-3 py-3 font-semibold tabular-nums ${
                          totalScore != null ? scoreTone(totalScore) : "text-slate-400"
                        }`}
                      >
                        {totalScore != null ? totalScore : "—"}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {formatMoney(row.requested_amount, row.currency)}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {row.disbursed_amount != null
                          ? formatMoney(row.disbursed_amount, row.currency)
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={risk.variant}>{risk.label}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <LoanStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {formatDate(row.due_date)}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-500 hover:text-[#08163d]"
                        >
                          <Link
                            href={`/loan-applications/${row.id}`}
                            aria-label={`View ${row.application_number}`}
                          >
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
