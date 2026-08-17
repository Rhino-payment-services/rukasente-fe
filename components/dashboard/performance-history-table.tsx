"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="surface-card overflow-hidden"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
    >
      <header className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Loan Applications
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest applications from the live pipeline
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 rounded-xl border-slate-200"
        >
          <Link href="/loan-applications">View all</Link>
        </Button>
      </header>
      <div className="px-5 py-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/95">
              <tr>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Borrower</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Phone</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Score</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Requested</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Disbursed</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Risk</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Due</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Actions</th>
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
                      className="border-b border-slate-50 text-slate-700 transition-colors last:border-0 hover:bg-slate-50/90"
                    >
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{row.borrower_name || "—"}</span>
                          {row.product_name ? (
                            <span className="mt-0.5 text-[10px] font-normal text-slate-400">
                              {row.product_name}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">
                        {row.borrower_phone || "—"}
                      </td>
                      <td
                        className={`px-3 py-2 font-semibold tabular-nums ${
                          totalScore != null ? scoreTone(totalScore) : "text-slate-400"
                        }`}
                      >
                        {totalScore != null ? totalScore : "—"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatMoney(row.requested_amount, row.currency)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {row.disbursed_amount != null
                          ? formatMoney(row.disbursed_amount, row.currency)
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={risk.variant}>{risk.label}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <LoanStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">
                        {formatDate(row.due_date)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-slate-500 hover:text-[#08163d]"
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
      </div>
    </motion.section>
  );
}
