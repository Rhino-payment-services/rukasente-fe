"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/components/dashboard/scoring-shared";
import { RunScoreDialog } from "@/components/dashboard/run-score-dialog";
import {
  CreditScoreResultSummary,
  useScoringResults,
} from "@/hooks/use-scoring";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
type DecisionFilterValue =
  | "all"
  | "eligible"
  | "under_review"
  | "not_eligible";
type BandFilterValue = "all" | "A" | "B" | "C" | "D" | "E";
type KycFilterValue = "all" | "verified" | "pending" | "rejected";

function decisionVariant(s: string): BadgeVariant {
  const v = s.toLowerCase();
  if (v === "eligible") return "success";
  if (v === "under_review") return "warning";
  if (v === "not_eligible") return "danger";
  return "default";
}

function bandVariant(b: string): BadgeVariant {
  switch (b) {
    case "A":
      return "success";
    case "B":
      return "info";
    case "C":
      return "warning";
    case "D":
    case "E":
      return "danger";
    default:
      return "default";
  }
}

function kycVariant(s?: string): BadgeVariant {
  switch ((s ?? "").toLowerCase()) {
    case "verified":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function ScoringResultsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { data, isLoading, error } = useScoringResults(page, pageSize);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] =
    useState<DecisionFilterValue>("all");
  const [bandFilter, setBandFilter] = useState<BandFilterValue>("all");
  const [kycFilter, setKycFilter] = useState<KycFilterValue>("all");

  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [runTarget, setRunTarget] = useState<{
    rukapayUserId: string;
    label: string | null;
    locked: boolean;
  } | null>(null);

  const openRunDialog = (
    target?: { rukapayUserId: string; label?: string | null }
  ) => {
    setRunTarget(
      target?.rukapayUserId
        ? {
            rukapayUserId: target.rukapayUserId,
            label: target.label ?? null,
            locked: true,
          }
        : { rukapayUserId: "", label: null, locked: false }
    );
    setRunDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<CreditScoreResultSummary>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="inline-flex items-center gap-2 text-slate-700"
          >
            Borrower
            <ArrowUpDown className="size-4 text-slate-400" />
          </button>
        ),
        cell: ({ row }) => {
          const name =
            row.original.full_name?.trim() ||
            row.original.rukapay_user_id ||
            "—";
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {initials(row.original.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {name}
                </p>
                {row.original.email ? (
                  <p className="truncate text-xs text-slate-500">
                    {row.original.email}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "kyc_status",
        header: "KYC",
        cell: ({ row }) => (
          <Badge variant={kycVariant(row.original.kyc_status)}>
            {row.original.kyc_status || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "total_score",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="inline-flex items-center gap-2 text-slate-700"
          >
            Score
            <ArrowUpDown className="size-4 text-slate-400" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {row.original.total_score}
          </span>
        ),
      },
      {
        accessorKey: "risk_band",
        header: "Band",
        cell: ({ row }) => (
          <Badge variant={bandVariant(row.original.risk_band)}>
            {row.original.risk_band}
          </Badge>
        ),
      },
      {
        accessorKey: "suggested_decision",
        header: "Decision",
        cell: ({ row }) => (
          <Badge variant={decisionVariant(row.original.suggested_decision)}>
            {row.original.suggested_decision.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "recommended_limit",
        header: "Limit",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatCurrency(row.original.recommended_limit)}
          </span>
        ),
      },
      {
        accessorKey: "max_tenor_days",
        header: "Tenor",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.max_tenor_days}d
          </span>
        ),
      },
      {
        accessorKey: "scored_at",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="inline-flex items-center gap-2 text-slate-700"
          >
            Scored on
            <ArrowUpDown className="size-4 text-slate-400" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatDate(row.original.scored_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const id = row.original.rukapay_user_id;
          if (!id) return null;
          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={() =>
                  openRunDialog({
                    rukapayUserId: id,
                    label: row.original.full_name || id,
                  })
                }
              >
                <RotateCw className="size-3.5" />
                Re-run
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const raw = useMemo(() => data?.items ?? [], [data?.items]);
  const filtered = raw.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (r.full_name ?? "").toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.phone ?? "").toLowerCase().includes(q) ||
      (r.rukapay_user_id ?? "").toLowerCase().includes(q) ||
      r.reason_codes.some((c) => c.toLowerCase().includes(q));
    const matchesDecision =
      decisionFilter === "all" || r.suggested_decision === decisionFilter;
    const matchesBand = bandFilter === "all" || r.risk_band === bandFilter;
    const matchesKyc = kycFilter === "all" || r.kyc_status === kycFilter;
    return matchesSearch && matchesDecision && matchesBand && matchesKyc;
  });

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const stats = useMemo(() => {
    const counts = {
      total: raw.length,
      eligible: 0,
      under_review: 0,
      not_eligible: 0,
      avg_score: 0,
    };
    let scoreSum = 0;
    for (const r of raw) {
      if (r.suggested_decision === "eligible") counts.eligible++;
      else if (r.suggested_decision === "under_review") counts.under_review++;
      else if (r.suggested_decision === "not_eligible") counts.not_eligible++;
      scoreSum += r.total_score;
    }
    counts.avg_score = raw.length ? Math.round(scoreSum / raw.length) : 0;
    return counts;
  }, [raw]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Score results
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Credit score outcomes generated from the currently active scoring
            rules. Each row is one immutable scoring run.
          </p>
        </div>
        <Button onClick={() => openRunDialog()} className="shrink-0">
          <Play className="size-4" />
          Run score
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total scores" value={stats.total} />
        <StatCard label="Eligible" value={stats.eligible} variant="success" />
        <StatCard
          label="Under review"
          value={stats.under_review}
          variant="warning"
        />
        <StatCard
          label="Not eligible"
          value={stats.not_eligible}
          variant="danger"
        />
        <StatCard
          label="Avg score"
          value={stats.avg_score}
          variant="info"
        />
      </div>

      <Card className="gap-0 border-slate-200 py-0 shadow-none">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, email, RukaPay user id, or reason code"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-main-200"
              />
            </div>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={decisionFilter}
              onChange={(e) =>
                setDecisionFilter(e.target.value as DecisionFilterValue)
              }
            >
              <option value="all">All decisions</option>
              <option value="eligible">Eligible</option>
              <option value="under_review">Under review</option>
              <option value="not_eligible">Not eligible</option>
            </select>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value as BandFilterValue)}
            >
              <option value="all">All bands</option>
              <option value="A">Band A</option>
              <option value="B">Band B</option>
              <option value="C">Band C</option>
              <option value="D">Band D</option>
              <option value="E">Band E</option>
            </select>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value as KycFilterValue)}
            >
              <option value="all">All KYC</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              {(error as Error).message}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="py-10 text-center text-sm text-slate-500"
                      >
                        No score results match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-slate-500">
              Total: {data?.total ?? 0} · Page {data?.page ?? page} of{" "}
              {data?.total_pages ?? 1} · Showing {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  !!data?.total_pages && page >= data.total_pages
                }
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RunScoreDialog
        open={runDialogOpen}
        onOpenChange={(next) => {
          setRunDialogOpen(next);
          if (!next) setRunTarget(null);
        }}
        initialRukapayUserId={runTarget?.rukapayUserId}
        lockRukapayUserId={runTarget?.locked ?? false}
        borrowerLabel={runTarget?.label ?? null}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: BadgeVariant;
}) {
  const dot: Record<BadgeVariant, string> = {
    default: "bg-slate-300",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
  };
  return (
    <Card className="gap-0 border-slate-200 bg-white py-0 shadow-none">
      <CardContent className="px-4 py-3.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`size-1.5 rounded-full ${dot[variant]}`} />
          {label}
        </div>
        <p className="mt-1 text-3xl font-semibold leading-none text-slate-900">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
