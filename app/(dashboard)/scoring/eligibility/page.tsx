"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CompactLoading } from "@/components/ui/loading";
import { formatDate } from "@/components/dashboard/scoring-shared";
import {
  ScoringExplainCard,
  ScoringPageShell,
  ScoringStatCard,
  explainDecisionSource,
  explainEligibilityStatus,
  explainReasonCode,
  shortId,
} from "@/components/dashboard/scoring-page-shell";
import { useBorrowersList } from "@/hooks/use-borrowers";
import {
  EligibilityRow,
  useEligibilityDecisions,
} from "@/hooks/use-scoring";

type StatusFilter =
  | "all"
  | "eligible"
  | "not_eligible"
  | "under_review"
  | "pending";

function statusVariant(
  status: string
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status.toLowerCase()) {
    case "eligible":
      return "success";
    case "not_eligible":
      return "danger";
    case "under_review":
      return "warning";
    case "pending":
      return "info";
    default:
      return "default";
  }
}

function sourceVariant(
  source: string
): "default" | "success" | "warning" | "info" {
  switch (source.toLowerCase()) {
    case "system_score":
      return "info";
    case "supervisor_override":
      return "warning";
    case "manual":
      return "default";
    default:
      return "default";
  }
}

export default function ScoringEligibilityPage() {
  const eligQ = useEligibilityDecisions(1, 100);
  const borrowersQ = useBorrowersList(1, 200);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const borrowerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of borrowersQ.data?.items ?? []) {
      if (b.id) map.set(b.id, b.full_name || b.phone || b.id);
    }
    return map;
  }, [borrowersQ.data?.items]);

  const items = eligQ.data?.items ?? [];

  const counts = useMemo(() => {
    const eligible = items.filter((i) => i.status === "eligible").length;
    const notEligible = items.filter((i) => i.status === "not_eligible").length;
    const underReview = items.filter((i) => i.status === "under_review").length;
    const pending = items.filter((i) => i.status === "pending").length;
    return {
      eligible,
      notEligible,
      underReview,
      pending,
      total: items.length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (!q) return true;
        const name = (
          borrowerNameById.get(item.borrower_profile_id) || ""
        ).toLowerCase();
        return (
          name.includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.borrower_profile_id.toLowerCase().includes(q) ||
          (item.wallet_id || "").toLowerCase().includes(q) ||
          (item.reason_code || "").toLowerCase().includes(q) ||
          (item.decision_source || "").toLowerCase().includes(q) ||
          (item.status || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
      );
  }, [items, search, statusFilter, borrowerNameById]);

  return (
    <ScoringPageShell
      activeStep="decide"
      title="Eligibility decisions"
      description="After each score run, the system records whether the borrower can borrow. This page is the audit trail of those decisions — who qualified, who did not, and whether a human overrode the engine."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoringStatCard
          label="Eligible"
          value={counts.eligible}
          hint="Can apply for loans"
          tone="success"
        />
        <ScoringStatCard
          label="Not eligible"
          value={counts.notEligible}
          hint="Blocked from new loans"
          tone="danger"
        />
        <ScoringStatCard
          label="Under review"
          value={counts.underReview}
          hint="Waiting on staff"
          tone="warning"
        />
        <ScoringStatCard
          label="Decisions loaded"
          value={eligQ.data?.total ?? counts.total}
          hint={`${counts.pending} pending`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search borrower, wallet, reason, or status…"
                  className="h-9 pl-9"
                />
              </div>
              {(
                [
                  ["all", "All"],
                  ["eligible", "Eligible"],
                  ["not_eligible", "Not eligible"],
                  ["under_review", "Under review"],
                  ["pending", "Pending"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === value
                      ? "bg-[#08163d] text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {eligQ.isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <CompactLoading message="Loading eligibility decisions…" />
              </div>
            ) : eligQ.error ? (
              <p className="px-4 py-10 text-center text-sm text-rose-600">
                {(eligQ.error as Error).message || "Failed to load decisions"}
              </p>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <ShieldQuestion className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No decisions match this view
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Run scoring from Borrowers or Score results to create
                  decisions.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Borrower</th>
                      <th className="px-4 py-3 font-medium">Decision</th>
                      <th className="px-4 py-3 font-medium">Why</th>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item: EligibilityRow) => {
                      const name =
                        borrowerNameById.get(item.borrower_profile_id) ||
                        "Unknown borrower";
                      return (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#08163d]/10 text-[#08163d]">
                                <UserRound className="size-3.5" />
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={`/borrowers/${item.borrower_profile_id}`}
                                  className="block truncate font-medium text-slate-900 hover:text-[#08163d] hover:underline"
                                >
                                  {name}
                                </Link>
                                <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                                  <Wallet className="size-3 shrink-0" />
                                  {item.wallet_id
                                    ? shortId(item.wallet_id, 12)
                                    : "No wallet"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(item.status)}>
                              {item.status.replaceAll("_", " ")}
                            </Badge>
                            <p className="mt-1 max-w-[180px] text-[10px] leading-snug text-slate-400">
                              {explainEligibilityStatus(item.status)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                              {item.reason_code || "—"}
                            </code>
                            <p className="mt-1 max-w-[200px] text-[10px] leading-snug text-slate-500">
                              {explainReasonCode(item.reason_code)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={sourceVariant(item.decision_source)}>
                              {(item.decision_source || "—").replaceAll(
                                "_",
                                " "
                              )}
                            </Badge>
                            <p className="mt-1 max-w-[160px] text-[10px] leading-snug text-slate-400">
                              {explainDecisionSource(item.decision_source)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {formatDate(item.checked_at)}
                            {item.status === "under_review" ? (
                              <Link
                                href="/scoring/manual-review"
                                className="mt-1 block text-[11px] font-medium text-amber-700 hover:underline"
                              >
                                Open review queue →
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <ScoringExplainCard
            title="How to read this page"
            items={[
              {
                label: "Eligible",
                body: "Borrower may apply for loan products (limits still apply).",
              },
              {
                label: "Not eligible",
                body: "Score or staff decision blocked new lending for now.",
              },
              {
                label: "Under review",
                body: "Needs a human on Manual review before a final answer.",
              },
              {
                label: "Source",
                body: "system_score = engine; supervisor_override = staff after review.",
              },
            ]}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Decision badges
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-600" />
                <span>
                  <strong className="text-slate-800">Eligible</strong> — green
                  light for applications
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 size-4 text-rose-600" />
                <span>
                  <strong className="text-slate-800">Not eligible</strong> —
                  cannot take new loans
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldQuestion className="mt-0.5 size-4 text-amber-600" />
                <span>
                  <strong className="text-slate-800">Under review</strong> —
                  resolve in Manual review
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-600">
            Each score run writes a new eligibility decision for that wallet.
            Older rows stay for audit — sort is newest first.
          </div>
        </div>
      </div>
    </ScoringPageShell>
  );
}
