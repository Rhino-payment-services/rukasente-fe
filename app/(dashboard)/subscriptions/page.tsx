"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Play,
  Loader2,
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
import {
  ScoreResultFeedback,
  ScoreResultModal,
} from "@/components/dashboard/score-result-modal";
import { SubscriptionRow, useSubscriptionsList } from "@/hooks/use-subscriptions";
import { useRunScoring } from "@/hooks/use-scoring";
import { scoringErrorMessage } from "@/lib/scoring-errors";

type ScoreRunCtx = {
  runningUserId: string | null;
  runScore: (s: SubscriptionRow) => Promise<void>;
};

const ScoreRunContext = createContext<ScoreRunCtx | null>(null);

function useScoreRun() {
  const ctx = useContext(ScoreRunContext);
  if (!ctx) throw new Error("ScoreRunContext missing");
  return ctx;
}

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
type StatusFilterValue =
  | "all"
  | "pending_consent"
  | "pending_eligibility"
  | "eligible"
  | "not_eligible"
  | "under_review"
  | "suspended"
  | "unsubscribed";
type KycFilterValue = "all" | "verified" | "pending" | "rejected";

function statusVariant(s: string): BadgeVariant {
  switch (s) {
    case "eligible":
      return "success";
    case "pending_consent":
    case "pending_eligibility":
    case "under_review":
      return "warning";
    case "not_eligible":
    case "suspended":
      return "danger";
    case "unsubscribed":
      return "default";
    default:
      return "info";
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { data, isLoading, error } = useSubscriptionsList(page, pageSize);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [kycFilter, setKycFilter] = useState<KycFilterValue>("all");

  const { mutateAsync } = useRunScoring();
  const mutateAsyncRef = useRef(mutateAsync);
  useEffect(() => {
    mutateAsyncRef.current = mutateAsync;
  }, [mutateAsync]);

  const [runningUserId, setRunningUserId] = useState<string | null>(null);
  const runningUserIdRef = useRef<string | null>(null);
  const [feedback, setFeedback] = useState<ScoreResultFeedback | null>(null);

  const runScore = useCallback(async (s: SubscriptionRow) => {
    const id = s.rukapay_user_id?.trim();
    if (!id || runningUserIdRef.current) return;
    const name = s.full_name?.trim() || id;
    setFeedback(null);
    runningUserIdRef.current = id;
    setRunningUserId(id);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });
    try {
      const result = await mutateAsyncRef.current({ rukapay_user_id: id });
      const score = result.credit_score_result;
      setFeedback({
        kind: "success",
        name,
        score: score.total_score,
        band: score.risk_band,
        decision: String(score.suggested_decision || "").replace(/_/g, " "),
        limit: score.recommended_limit,
      });
    } catch (err) {
      const message = scoringErrorMessage(err);
      if (message) setFeedback({ kind: "error", name, message });
    } finally {
      runningUserIdRef.current = null;
      setRunningUserId(null);
    }
  }, []);

  const scoreCtx = useMemo(
    () => ({ runningUserId, runScore }),
    [runningUserId, runScore]
  );

  const columns = useMemo<ColumnDef<SubscriptionRow>[]>(
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
        accessorKey: "status",
        header: "Subscription status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "subscribed_at",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="inline-flex items-center gap-2 text-slate-700"
          >
            Subscribed
            <ArrowUpDown className="size-4 text-slate-400" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatDate(row.original.subscribed_at)}
          </span>
        ),
      },
      {
        accessorKey: "last_eligibility_check_at",
        header: "Last check",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatDate(row.original.last_eligibility_check_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RunScoreAction row={row.original} />,
      },
    ],
    []
  );

  const raw = useMemo(() => data?.items ?? [], [data?.items]);
  const filtered = raw.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (s.full_name ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").toLowerCase().includes(q) ||
      s.rukapay_user_id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesKyc = kycFilter === "all" || s.kyc_status === kycFilter;
    return matchesSearch && matchesStatus && matchesKyc;
  });

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

  const stats = useMemo(() => {
    const counts = {
      total: raw.length,
      eligible: 0,
      pending: 0,
      under_review: 0,
      not_eligible: 0,
      unsubscribed: 0,
    };
    for (const s of raw) {
      if (s.status === "eligible") counts.eligible++;
      else if (
        s.status === "pending_consent" ||
        s.status === "pending_eligibility"
      )
        counts.pending++;
      else if (s.status === "under_review") counts.under_review++;
      else if (s.status === "not_eligible") counts.not_eligible++;
      else if (s.status === "unsubscribed") counts.unsubscribed++;
    }
    return counts;
  }, [raw]);

  return (
    <ScoreRunContext.Provider value={scoreCtx}>
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tracks which enrolled borrowers have an active Ruka Sente credit
          subscription. A borrower can exist without a subscription — a
          subscription confirms they have opted in to credit access.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Eligible" value={stats.eligible} variant="success" />
        <StatCard label="Pending" value={stats.pending} variant="warning" />
        <StatCard
          label="Under review"
          value={stats.under_review}
          variant="info"
        />
        <StatCard
          label="Unsubscribed"
          value={stats.unsubscribed}
          variant="default"
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
                placeholder="Search by name, phone, email, or RukaPay user id"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-main-200"
              />
            </div>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilterValue)
              }
            >
              <option value="all">All statuses</option>
              <option value="pending_consent">Pending consent</option>
              <option value="pending_eligibility">Pending eligibility</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not eligible</option>
              <option value="under_review">Under review</option>
              <option value="suspended">Suspended</option>
              <option value="unsubscribed">Unsubscribed</option>
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
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:bg-slate-50"
              title="Date filter is coming soon"
              disabled
            >
              <Calendar className="size-4" />
              Date
            </button>
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
                        No subscriptions match your filters.
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

      <ScoreResultModal
        feedback={feedback}
        onClose={() => setFeedback(null)}
      />
    </div>
    </ScoreRunContext.Provider>
  );
}

function RunScoreAction({ row }: { row: SubscriptionRow }) {
  const { runningUserId, runScore } = useScoreRun();
  const id = row.rukapay_user_id;
  if (!id) return null;
  const busy = runningUserId === id;
  const anyBusy = !!runningUserId;

  return (
    <div className="flex justify-end">
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-lg"
        disabled={anyBusy}
        onClick={() => void runScore(row)}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Play className="size-3.5" />
        )}
        {busy ? "Running…" : "Run score"}
      </Button>
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
