"use client";

import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  UserRound,
  CheckCircle2,
  XCircle,
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
import { CompactTableShell } from "@/components/dashboard/compact-table-shell";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  formatDetailValue,
} from "@/components/dashboard/detail-fields";
import { TableViewButton } from "@/components/dashboard/table-view-button";
import {
  ACTION_SLOT,
  ActionSlot,
  RowActions,
} from "@/components/dashboard/row-actions";
import { DetailsDrawer } from "@/components/ui/details-drawer";
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
  const { can } = usePermissions();

  const manualQ = useManualReviewCases(1, 100);
  const borrowersQ = useBorrowersList(1, 200);
  const updateCase = useUpdateManualReviewCase();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewRow, setViewRow] = useState<ManualReviewCaseResponse | null>(null);
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

  const columns = useMemo<ColumnDef<ManualReviewCaseResponse>[]>(
    () => [
      {
        id: "borrower",
        header: "Borrower",
        cell: ({ row }) => {
          const item = row.original;
          const name =
            borrowerNameById.get(item.borrower_profile_id) ||
            "Unknown borrower";
          return (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#08163d]/10 text-[11px] font-semibold text-[#08163d]">
                <UserRound className="size-3.5" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/borrowers/${item.borrower_profile_id}`}
                  className="block truncate font-medium text-slate-900 hover:text-[#08163d] hover:underline"
                >
                  {name}
                </Link>
                <p className="truncate text-[10px] text-slate-400">
                  Case {shortId(item.id)}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <Badge variant={statusVariant(item.status)}>
                {item.status.replaceAll("_", " ")}
              </Badge>
              <p className="mt-1 max-w-[160px] text-[10px] leading-snug text-slate-400">
                {explainReviewStatus(item.status)}
              </p>
            </div>
          );
        },
      },
      {
        id: "resolution",
        header: "Resolution",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              {item.resolution ? (
                <Badge variant={resolutionVariant(item.resolution)}>
                  {item.resolution}
                </Badge>
              ) : (
                <span className="text-slate-400">Pending</span>
              )}
              {item.review_notes ? (
                <p
                  className="mt-1 max-w-[180px] truncate text-[10px] text-slate-500"
                  title={item.review_notes}
                >
                  {item.review_notes}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "opened",
        header: "Opened",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-slate-600">
              <div className="whitespace-nowrap">
                {formatDate(item.created_at)}
              </div>
              {item.resolved_at ? (
                <div className="text-[10px] text-slate-400">
                  Closed {formatDate(item.resolved_at)}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="text-right">Action</span>,
        cell: ({ row }) => {
          const item = row.original;
          const openable = item.status !== "resolved";
          return (
            <RowActions slots={[ACTION_SLOT.sm, ACTION_SLOT.md]}>
              <ActionSlot>
                <TableViewButton onClick={() => setViewRow(item)} />
              </ActionSlot>
              <ActionSlot>
                {openable ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-md px-2 text-[11px]"
                    onClick={() => openResolve(item)}
                  >
                    Resolve
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-md px-2 text-[11px]"
                  >
                    <Link href={`/borrowers/${item.borrower_profile_id}`}>
                      Borrower
                    </Link>
                  </Button>
                )}
              </ActionSlot>
            </RowActions>
          );
        },
      },
    ],
    [borrowerNameById]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!can(Perm.ManualReviewView)) {
    return <NoAccess description="You need manual.review.view to open manual review." />;
  }

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
            <CompactTableShell
              table={table}
              columns={columns}
              isLoading={manualQ.isLoading}
              error={
                manualQ.error
                  ? (manualQ.error as Error).message || "Failed to load cases"
                  : null
              }
              emptyMessage="No cases match this view"
              minWidth="720px"
              toolbar={
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
              }
            />
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

      <ManualReviewDetailsDrawer
        row={viewRow}
        borrowerName={
          viewRow
            ? borrowerNameById.get(viewRow.borrower_profile_id) ||
              "Unknown borrower"
            : ""
        }
        onClose={() => setViewRow(null)}
        onResolve={
          viewRow && viewRow.status !== "resolved"
            ? () => {
                openResolve(viewRow);
                setViewRow(null);
              }
            : undefined
        }
      />

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

function ManualReviewDetailsDrawer({
  row,
  borrowerName,
  onClose,
  onResolve,
}: {
  row: ManualReviewCaseResponse | null;
  borrowerName: string;
  onClose: () => void;
  onResolve?: () => void;
}) {
  if (!row) return null;

  return (
    <DetailsDrawer
      open={!!row}
      onClose={onClose}
      title="Manual review case"
      description={`${borrowerName} · ${shortId(row.id)}`}
      widthClassName="max-w-lg"
      footer={
        onResolve ? (
          <Button
            type="button"
            className="flex-1 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
            onClick={onResolve}
          >
            Resolve case
          </Button>
        ) : undefined
      }
    >
      <DetailSection title="Borrower">
        <DetailGrid
          fields={[
            { label: "Name", value: borrowerName },
            {
              label: "Profile ID",
              value: formatDetailValue(row.borrower_profile_id),
              mono: true,
              fullWidth: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="Case status">
        <DetailGrid
          fields={[
            {
              label: "Status",
              value: (
                <Badge variant={statusVariant(row.status)}>
                  {row.status.replaceAll("_", " ")}
                </Badge>
              ),
            },
            {
              label: "Meaning",
              value: explainReviewStatus(row.status),
              fullWidth: true,
            },
            {
              label: "Resolution",
              value: row.resolution ? (
                <Badge variant={resolutionVariant(row.resolution)}>
                  {row.resolution}
                </Badge>
              ) : (
                "Pending"
              ),
            },
            { label: "Opened", value: formatDate(row.created_at) },
            {
              label: "Updated",
              value: formatDate(row.updated_at),
            },
            {
              label: "Resolved",
              value: row.resolved_at ? formatDate(row.resolved_at) : "—",
            },
          ]}
        />
      </DetailSection>

      {row.review_notes ? (
        <DetailSection title="Review notes">
          <DetailField
            label="Notes"
            value={row.review_notes}
            fullWidth
          />
        </DetailSection>
      ) : null}

      <DetailSection title="References">
        <DetailGrid
          fields={[
            {
              label: "Case ID",
              value: formatDetailValue(row.id),
              mono: true,
              fullWidth: true,
            },
            {
              label: "Subscription ID",
              value: formatDetailValue(row.subscription_id),
              mono: true,
              fullWidth: true,
            },
            {
              label: "Score result ID",
              value: formatDetailValue(row.credit_score_result_id),
              mono: true,
              fullWidth: true,
            },
            {
              label: "Assigned staff",
              value: formatDetailValue(row.assigned_to_staff_user_id),
              mono: true,
              fullWidth: true,
            },
          ]}
        />
      </DetailSection>

      <Link
        href={`/borrowers/${row.borrower_profile_id}`}
        className="inline-flex text-xs font-medium text-[#08163d] hover:underline"
      >
        Open borrower profile →
      </Link>
    </DetailsDrawer>
  );
}
