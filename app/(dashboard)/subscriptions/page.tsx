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
import { Button } from "@/components/ui/button";
import { CompactTableShell } from "@/components/dashboard/compact-table-shell";
import {
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
import {
  ScoreResultFeedback,
  ScoreResultModal,
} from "@/components/dashboard/score-result-modal";
import { SubscriptionRow, useSubscriptionsList } from "@/hooks/use-subscriptions";
import {
  getLatestScoringResultForUser,
  useLatestScoringResultForUser,
  useRunScoring,
} from "@/hooks/use-scoring";
import { scoringErrorMessage } from "@/lib/scoring-errors";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

type ScoreRunCtx = {
  runningUserId: string | null;
  runScore: (s: SubscriptionRow) => Promise<void>;
};

type PendingScoreRun = {
  rukapayUserId: string;
  name: string;
  jobId?: string;
  baselineResultId: string | null;
  queuedAtMs: number;
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
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { data, isLoading, error } = useSubscriptionsList(page, pageSize);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [kycFilter, setKycFilter] = useState<KycFilterValue>("all");
  const [viewRow, setViewRow] = useState<SubscriptionRow | null>(null);

  const { mutateAsync } = useRunScoring();
  const mutateAsyncRef = useRef(mutateAsync);
  useEffect(() => {
    mutateAsyncRef.current = mutateAsync;
  }, [mutateAsync]);

  const [runningUserId, setRunningUserId] = useState<string | null>(null);
  const runningUserIdRef = useRef<string | null>(null);
  const [feedback, setFeedback] = useState<ScoreResultFeedback | null>(null);
  const [pendingScoreRun, setPendingScoreRun] = useState<PendingScoreRun | null>(
    null
  );

  const latestScoringResultQ = useLatestScoringResultForUser(
    pendingScoreRun?.rukapayUserId ?? null,
    pendingScoreRun?.baselineResultId ?? null,
    pendingScoreRun?.queuedAtMs ?? null,
    can(Perm.ScoringView)
  );

  useEffect(() => {
    const result = latestScoringResultQ.data;
    if (!pendingScoreRun || !result) return;
    setFeedback({
      kind: "success",
      name: pendingScoreRun.name,
      score: result.total_score,
      band: result.risk_band,
      decision: String(result.suggested_decision || "—").replace(/_/g, " "),
      limit: result.recommended_limit,
    });
    setPendingScoreRun(null);
  }, [latestScoringResultQ.data, pendingScoreRun]);

  useEffect(() => {
    if (!pendingScoreRun) return;
    const timeoutId = window.setTimeout(() => {
      setFeedback((current) => {
        if (current?.kind !== "queued") return current;
        return {
          kind: "error",
          name: pendingScoreRun.name,
          message:
            "Scoring is taking longer than expected. The job may already be completed in the background but results are still syncing. Refresh and try again shortly.",
        };
      });
      setPendingScoreRun((current) =>
        current?.jobId === pendingScoreRun.jobId ? null : current
      );
    }, 90_000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingScoreRun]);

  const runScore = useCallback(async (s: SubscriptionRow) => {
    const id = s.rukapay_user_id?.trim();
    if (!id || runningUserIdRef.current) return;
    const name = s.full_name?.trim() || id;
    setFeedback(null);
    setPendingScoreRun(null);
    runningUserIdRef.current = id;
    setRunningUserId(id);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });
    try {
      const baseline = await getLatestScoringResultForUser(id);
      const result = await mutateAsyncRef.current({ rukapay_user_id: id });
      setPendingScoreRun({
        rukapayUserId: id,
        name,
        jobId: result.job_id,
        baselineResultId: baseline?.id ?? null,
        queuedAtMs: Date.now(),
      });
      setFeedback({
        kind: "queued",
        name,
        jobId: result.job_id,
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
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                {initials(row.original.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">
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
          <span className="text-xs tabular-nums text-slate-700">
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
          <span className="text-xs text-slate-700">
            {formatDate(row.original.subscribed_at)}
          </span>
        ),
      },
      {
        accessorKey: "last_eligibility_check_at",
        header: "Last check",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700">
            {formatDate(row.original.last_eligibility_check_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RunScoreAction
            row={row.original}
            onView={() => setViewRow(row.original)}
          />
        ),
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

  if (!can(Perm.SubscriptionView)) {
    return (
      <NoAccess description="You need subscription.view to open subscriptions." />
    );
  }

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
        <CardContent className="px-4 py-4">
          <CompactTableShell
            table={table}
            columns={columns}
            isLoading={isLoading}
            error={error ? (error as Error).message : null}
            emptyMessage="No subscriptions match your filters."
            minWidth="900px"
            toolbar={
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
                  onChange={(e) =>
                    setKycFilter(e.target.value as KycFilterValue)
                  }
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
            }
            footer={
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
            }
          />
        </CardContent>
      </Card>

      <DetailsDrawer
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={
          viewRow?.full_name?.trim() ||
          viewRow?.rukapay_user_id ||
          "Subscription"
        }
        description={viewRow?.phone ?? undefined}
        widthClassName="max-w-lg"
      >
        {viewRow ? (
          <>
            <DetailSection title="Borrower">
              <DetailGrid
                fields={[
                  {
                    label: "Full name",
                    value: formatDetailValue(viewRow.full_name),
                  },
                  {
                    label: "Phone",
                    value: formatDetailValue(viewRow.phone),
                    mono: true,
                  },
                  {
                    label: "Email",
                    value: formatDetailValue(viewRow.email),
                    fullWidth: true,
                  },
                  {
                    label: "KYC status",
                    value: (
                      <Badge variant={kycVariant(viewRow.kyc_status)}>
                        {viewRow.kyc_status || "—"}
                      </Badge>
                    ),
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Subscription">
              <DetailGrid
                fields={[
                  {
                    label: "Status",
                    value: (
                      <Badge variant={statusVariant(viewRow.status)}>
                        {viewRow.status.replace(/_/g, " ")}
                      </Badge>
                    ),
                    fullWidth: true,
                  },
                  {
                    label: "Subscribed at",
                    value: formatDate(viewRow.subscribed_at),
                  },
                  {
                    label: "Unsubscribed at",
                    value: formatDate(viewRow.unsubscribed_at),
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Eligibility">
              <DetailGrid
                fields={[
                  {
                    label: "Last check",
                    value: formatDate(viewRow.last_eligibility_check_at),
                  },
                  {
                    label: "Next check",
                    value: formatDate(viewRow.next_eligibility_check_at),
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="System">
              <DetailGrid
                fields={[
                  {
                    label: "Subscription ID",
                    value: viewRow.id,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "Borrower profile ID",
                    value: viewRow.borrower_profile_id,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "RukaPay user ID",
                    value: viewRow.rukapay_user_id,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "Created at",
                    value: formatDate(viewRow.created_at),
                  },
                  {
                    label: "Updated at",
                    value: formatDate(viewRow.updated_at),
                  },
                ]}
              />
            </DetailSection>
          </>
        ) : null}
      </DetailsDrawer>

      <ScoreResultModal
        feedback={feedback}
        onClose={() => {
          setFeedback(null);
          setPendingScoreRun(null);
        }}
      />
    </div>
    </ScoreRunContext.Provider>
  );
}

function RunScoreAction({
  row,
  onView,
}: {
  row: SubscriptionRow;
  onView: () => void;
}) {
  const { runningUserId, runScore } = useScoreRun();
  const id = row.rukapay_user_id;
  const busy = !!id && runningUserId === id;
  const anyBusy = !!runningUserId;

  return (
    <RowActions slots={[ACTION_SLOT.sm, ACTION_SLOT.md]}>
      <ActionSlot>
        <TableViewButton onClick={onView} />
      </ActionSlot>
      <ActionSlot>
        {id ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 rounded-md px-2 text-[11px]"
            disabled={anyBusy}
            onClick={() => void runScore(row)}
          >
            {busy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
            {busy ? "…" : "Score"}
          </Button>
        ) : null}
      </ActionSlot>
    </RowActions>
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
