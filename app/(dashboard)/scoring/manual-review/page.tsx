"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  UserRound,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompactLoading } from "@/components/ui/loading";
import { formatDate } from "@/components/dashboard/scoring-shared";
import {
  ScoringExplainCard,
  ScoringPageShell,
  ScoringStatCard,
  explainReviewStatus,
  shortId,
} from "@/components/dashboard/scoring-page-shell";
import { useBorrowersList } from "@/hooks/use-borrowers";
import {
  ManualReviewCaseResponse,
  useManualReviewCases,
  useUpdateManualReviewCase,
} from "@/hooks/use-scoring";

type StatusFilter = "all" | "open" | "in_review" | "resolved";

function statusVariant(
  status: string
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status.toLowerCase()) {
    case "open":
      return "warning";
    case "in_review":
      return "info";
    case "resolved":
      return "success";
    default:
      return "default";
  }
}

function resolutionVariant(
  resolution: string
): "default" | "success" | "danger" {
  switch (resolution.toLowerCase()) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

export default function ScoringManualReviewPage() {
  const manualQ = useManualReviewCases(1, 100);
  const borrowersQ = useBorrowersList(1, 200);
  const updateCase = useUpdateManualReviewCase();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ManualReviewCaseResponse | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [busyAction, setBusyAction] = useState<"approve" | "reject" | null>(
    null
  );

  const borrowerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of borrowersQ.data?.items ?? []) {
      if (b.id) map.set(b.id, b.full_name || b.phone || b.id);
    }
    return map;
  }, [borrowersQ.data?.items]);

  const items = manualQ.data?.items ?? [];

  const counts = useMemo(() => {
    const open = items.filter((i) => i.status === "open").length;
    const inReview = items.filter((i) => i.status === "in_review").length;
    const resolved = items.filter((i) => i.status === "resolved").length;
    return { open, inReview, resolved, total: items.length };
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
          (item.review_notes || "").toLowerCase().includes(q) ||
          (item.resolution || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [items, search, statusFilter, borrowerNameById]);

  const openResolve = (item: ManualReviewCaseResponse) => {
    setSelected(item);
    setNotes(item.review_notes || "");
  };

  const resolve = async (resolution: "approved" | "rejected") => {
    if (!selected) return;
    setBusyAction(resolution === "approved" ? "approve" : "reject");
    try {
      await updateCase.mutateAsync({
        id: selected.id,
        status: "resolved",
        resolution,
        review_notes: notes.trim() || undefined,
      });
      toast.success(
        resolution === "approved"
          ? "Case approved — borrower is now eligible"
          : "Case rejected — borrower marked not eligible"
      );
      setSelected(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not resolve this case"
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <ScoringPageShell
      activeStep="review"
      title="Manual review cases"
      description="Borderline score outcomes land here. Staff review the borrower, then approve (make eligible) or reject (block lending) — which updates eligibility automatically."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoringStatCard
          label="Open queue"
          value={counts.open}
          hint="Needs a first look"
          tone="warning"
        />
        <ScoringStatCard
          label="In review"
          value={counts.inReview}
          hint="Currently being worked"
          tone="info"
        />
        <ScoringStatCard
          label="Resolved"
          value={counts.resolved}
          hint="Closed decisions"
          tone="success"
        />
        <ScoringStatCard
          label="Total cases"
          value={manualQ.data?.total ?? counts.total}
          hint="Loaded for this view"
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
                  placeholder="Search borrower, notes, or case id…"
                  className="h-9 pl-9"
                />
              </div>
              {(
                [
                  ["all", "All"],
                  ["open", "Open"],
                  ["in_review", "In review"],
                  ["resolved", "Resolved"],
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
            {manualQ.isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <CompactLoading message="Loading review cases…" />
              </div>
            ) : manualQ.error ? (
              <p className="px-4 py-10 text-center text-sm text-rose-600">
                {(manualQ.error as Error).message || "Failed to load cases"}
              </p>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <Clock3 className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No cases match this view
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cases appear when a score suggests{" "}
                  <span className="font-medium">under review</span>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Borrower</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Resolution</th>
                      <th className="px-4 py-3 font-medium">Opened</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const name =
                        borrowerNameById.get(item.borrower_profile_id) ||
                        "Unknown borrower";
                      const openable = item.status !== "resolved";
                      return (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#08163d]/10 text-[11px] font-semibold text-[#08163d]">
                                <UserRound className="size-3.5" />
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={`/borrowers/${item.borrower_profile_id}`}
                                  className="block truncate font-medium text-slate-900 hover:text-[#08163d] hover:underline"
                                >
                                  {name}
                                </Link>
                                <p className="truncate text-[11px] text-slate-400">
                                  Case {shortId(item.id)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(item.status)}>
                              {item.status.replaceAll("_", " ")}
                            </Badge>
                            <p className="mt-1 max-w-[160px] text-[10px] leading-snug text-slate-400">
                              {explainReviewStatus(item.status)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {item.resolution ? (
                              <Badge variant={resolutionVariant(item.resolution)}>
                                {item.resolution}
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">Pending</span>
                            )}
                            {item.review_notes ? (
                              <p
                                className="mt-1 max-w-[180px] truncate text-[10px] text-slate-500"
                                title={item.review_notes}
                              >
                                {item.review_notes}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div>{formatDate(item.created_at)}</div>
                            {item.resolved_at ? (
                              <div className="text-[10px] text-slate-400">
                                Closed {formatDate(item.resolved_at)}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {openable ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => openResolve(item)}
                              >
                                Resolve
                              </Button>
                            ) : (
                              <Link
                                href={`/borrowers/${item.borrower_profile_id}`}
                                className="text-xs font-medium text-[#08163d] hover:underline"
                              >
                                View borrower
                              </Link>
                            )}
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
            title="What is this page?"
            items={[
              {
                label: "When cases appear",
                body: "A scoring run returns “under review” for a borderline or flagged borrower.",
              },
              {
                label: "Approve",
                body: "Marks eligibility as eligible and uses the recommended limit from the score.",
              },
              {
                label: "Reject",
                body: "Marks eligibility as not eligible so they cannot take new loans.",
              },
              {
                label: "Notes",
                body: "Saved on the case and copied into the eligibility reason description.",
              },
            ]}
          />
          <ScoringExplainCard
            title="Status meanings"
            items={[
              {
                label: "Open",
                body: explainReviewStatus("open"),
              },
              {
                label: "In review",
                body: explainReviewStatus("in_review"),
              },
              {
                label: "Resolved",
                body: explainReviewStatus("resolved"),
              },
            ]}
          />
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-600">
            Tip: open the borrower profile to check KYC and score history before
            you decide. Eligibility updates as soon as you resolve.
          </div>
        </div>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve manual review</DialogTitle>
            <DialogDescription>
              {selected
                ? `${borrowerNameById.get(selected.borrower_profile_id) || "Borrower"} · case ${shortId(selected.id)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 py-4">
            <p className="text-xs text-slate-500">
              Approving sets the borrower to <strong>eligible</strong>. Rejecting
              sets them to <strong>not eligible</strong>. Add a short note for
              audit trail.
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">
                Review notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#08163d]/40 focus:ring-2 focus:ring-[#08163d]/15"
                placeholder="Why are you approving or rejecting?"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={!!busyAction}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              disabled={!!busyAction}
              onClick={() => void resolve("rejected")}
            >
              {busyAction === "reject" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Reject
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={!!busyAction}
              onClick={() => void resolve("approved")}
            >
              {busyAction === "approve" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScoringPageShell>
  );
}
