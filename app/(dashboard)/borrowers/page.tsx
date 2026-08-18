"use client";

import Link from "next/link";
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
  Play,
  Loader2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompactTableShell } from "@/components/dashboard/compact-table-shell";
import {
  DetailGrid,
  DetailSection,
  formatDetailValue,
} from "@/components/dashboard/detail-fields";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import {
  ScoreResultFeedback,
  ScoreResultModal,
} from "@/components/dashboard/score-result-modal";
import {
  BorrowerRow,
  borrowerSourceLabel,
  useBorrowersList,
  useSyncBorrowerFromRukaPay,
  useUpdateBorrowerKYC,
} from "@/hooks/use-borrowers";
import {
  getLatestScoringResultForUser,
  useActiveBulkScoringRun,
  useLatestScoringResultForUser,
  useRunQueuedScoring,
  useRunScoring,
} from "@/hooks/use-scoring";
import { scoringErrorMessage } from "@/lib/scoring-errors";
import { Perm } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";

type ScoreRunCtx = {
  runningUserId: string | null;
  runScore: (b: BorrowerRow) => Promise<void>;
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

export default function BorrowersPage() {
  const { can, isPlatform } = usePermissions();
  const canUpdateKyc = can(Perm.BorrowerUpdate);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { data, isLoading, error } = useBorrowersList(page, pageSize);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "suspended"
  >("all");
  const [kycFilter, setKycFilter] = useState<
    "all" | "verified" | "pending" | "rejected"
  >("all");
  const [drawerRow, setDrawerRow] = useState<BorrowerRow | null>(null);
  const [drawerShowActions, setDrawerShowActions] = useState(false);

  const closeDrawer = useCallback(() => {
    setDrawerRow(null);
    setDrawerShowActions(false);
  }, []);

  const openDrawerActions = useCallback((borrower: BorrowerRow) => {
    setDrawerRow(borrower);
    setDrawerShowActions(true);
  }, []);

  const { mutateAsync } = useRunScoring();
  const runQueued = useRunQueuedScoring();
  const { data: activeBulkRun } = useActiveBulkScoringRun(can(Perm.ScoringRun));
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

  const runScore = useCallback(async (b: BorrowerRow) => {
    const id = b.rukapay_user_id?.trim();
    if (!id || runningUserIdRef.current) return;

    const name = b.full_name || id;
    setFeedback(null);
    setPendingScoreRun(null);
    runningUserIdRef.current = id;
    setRunningUserId(id);

    // Let React paint "Running…" before starting the request.
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });

    try {
      const baseline = await getLatestScoringResultForUser(id);
      const result = await mutateAsyncRef.current({
        rukapay_user_id: id,
      });
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

  const bulkBusy =
    activeBulkRun?.status === "queued" || activeBulkRun?.status === "running";

  const handleRunQueued = useCallback(async () => {
    try {
      const res = await runQueued.mutateAsync();
      toast.success(
        `Queued bulk scoring for ${res.total_jobs.toLocaleString()} borrowers`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start queued scoring";
      toast.error(message);
    }
  }, [runQueued]);

  const scoreCtx = useMemo(
    () => ({ runningUserId, runScore }),
    [runningUserId, runScore]
  );

  const columns = useMemo<ColumnDef<BorrowerRow>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Borrower
            <ArrowUpDown className="size-3.5 opacity-50" />
          </button>
        ),
        cell: ({ row }) => {
          const displayName =
            row.original.full_name?.trim() ||
            row.original.phone ||
            row.original.rukapay_user_id ||
            "Unnamed borrower";
          return row.original.id ? (
            <Link
              href={`/borrowers/${row.original.id}`}
              className="whitespace-nowrap text-[13px] font-semibold text-slate-900 hover:text-main-600 hover:underline"
            >
              {displayName}
            </Link>
          ) : (
            <p className="whitespace-nowrap text-[13px] font-semibold text-slate-900">
              {displayName}
            </p>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-700">
            {row.original.phone}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate text-xs text-slate-600">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      ...(isPlatform
        ? [
            {
              id: "source",
              header: "Source",
              cell: ({ row }: { row: { original: BorrowerRow } }) => {
                const label = borrowerSourceLabel(row.original);
                const code = row.original.partner?.code;
                return (
                  <Badge
                    variant={row.original.partner_id ? "default" : "info"}
                    title={code ? `${label} (${code})` : label}
                  >
                    {label}
                  </Badge>
                );
              },
            } satisfies ColumnDef<BorrowerRow>,
          ]
        : []),
      {
        accessorKey: "kyc_status",
        header: "KYC",
        cell: ({ row }) => {
          const v = String(row.original.kyc_status || "").toLowerCase();
          const variant =
            v === "verified"
              ? "success"
              : v === "pending"
                ? "warning"
                : "danger";
          return <Badge variant={variant}>{v || "—"}</Badge>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const v = String(row.original.status || "").toLowerCase();
          const variant =
            v === "active" ? "info" : v === "inactive" ? "warning" : "danger";
          return <Badge variant={variant}>{v || "—"}</Badge>;
        },
      },
      {
        id: "actions",
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              title="Open borrower actions"
              aria-label="Open borrower actions"
              className="h-7 rounded-md px-2 text-[11px]"
              onClick={() => openDrawerActions(row.original)}
            >
              Actions
            </Button>
          </div>
        ),
      },
    ],
    [isPlatform, openDrawerActions]
  );

  const filtered = useMemo(() => {
    const raw = data?.items ?? [];
    const q = search.trim().toLowerCase();
    return raw.filter((b) => {
      const matchesSearch =
        !q ||
        b.full_name.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        (b.email ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      const matchesKyc = kycFilter === "all" || b.kyc_status === kycFilter;
      return matchesSearch && matchesStatus && matchesKyc;
    });
  }, [data?.items, search, statusFilter, kycFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

  if (!can(Perm.BorrowerView)) {
    return <NoAccess description="You need borrower.view to open borrowers." />;
  }

  return (
    <ScoreRunContext.Provider value={scoreCtx}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h1 className="text-2xl font-semibold text-slate-900">Borrowers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Approve or reject KYC, then run a credit score. Filter by pending
            KYC to review the queue.
          </p>
        </div>

        <ScoreResultModal
          feedback={feedback}
          onClose={() => setFeedback(null)}
        />

        <Card className="gap-0 border-slate-200 py-0 shadow-none">
          <CardContent className="px-4 py-4">
            <CompactTableShell
              table={table}
              columns={columns}
              isLoading={isLoading}
              error={error ? (error as Error).message : null}
              emptyMessage="No borrowers found."
              minWidth={isPlatform ? "860px" : "720px"}
              toolbar={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, phone, or email"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-main-200"
                    />
                  </div>
                  <select
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as
                          | "all"
                          | "active"
                          | "inactive"
                          | "suspended"
                      )
                    }
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <select
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    value={kycFilter}
                    onChange={(e) =>
                      setKycFilter(
                        e.target.value as
                          | "all"
                          | "verified"
                          | "pending"
                          | "rejected"
                      )
                    }
                  >
                    <option value="all">All KYC</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg"
                    onClick={() => void handleRunQueued()}
                    disabled={
                      !can(Perm.ScoringRun) ||
                      bulkBusy ||
                      runQueued.isPending ||
                      !!runningUserId
                    }
                  >
                    {runQueued.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Run score for all in queue
                  </Button>
                </div>
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-xs text-slate-500">
                    Total: {data?.total ?? 0} · Page {data?.page ?? page} ·
                    Showing {filtered.length}
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
                      disabled={!!data?.total_pages && page >= data.total_pages}
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
          open={!!drawerRow}
          onClose={closeDrawer}
          title={
            drawerRow?.full_name?.trim() ||
            drawerRow?.phone ||
            drawerRow?.rukapay_user_id ||
            "Borrower"
          }
          description={drawerRow?.phone}
          footer={
            drawerShowActions && drawerRow ? (
              <BorrowerDrawerActions
                borrower={drawerRow}
                canUpdateKyc={canUpdateKyc}
                onBorrowerUpdated={setDrawerRow}
              />
            ) : null
          }
        >
          {drawerRow ? (
            <>
              <DetailSection title="Identity">
                <DetailGrid
                  fields={[
                    { label: "Full name", value: drawerRow.full_name },
                    { label: "Phone", value: drawerRow.phone, mono: true },
                    {
                      label: "Email",
                      value: formatDetailValue(drawerRow.email),
                      fullWidth: true,
                    },
                    {
                      label: "National ID",
                      value: formatDetailValue(drawerRow.national_id),
                      mono: true,
                    },
                  ]}
                />
              </DetailSection>
              <DetailSection title="Account">
                <DetailGrid
                  fields={[
                    {
                      label: "RukaPay user ID",
                      value: formatDetailValue(drawerRow.rukapay_user_id),
                      mono: true,
                      fullWidth: true,
                    },
                    {
                      label: "Profile ID",
                      value: formatDetailValue(drawerRow.id),
                      mono: true,
                    },
                    {
                      label: "Source platform",
                      value: (
                        <Badge
                          variant={drawerRow.partner_id ? "default" : "info"}
                          title={
                            drawerRow.partner?.code
                              ? `${borrowerSourceLabel(drawerRow)} (${drawerRow.partner.code})`
                              : borrowerSourceLabel(drawerRow)
                          }
                        >
                          {borrowerSourceLabel(drawerRow)}
                        </Badge>
                      ),
                    },
                    {
                      label: "Scoring wallet ID",
                      value: formatDetailValue(drawerRow.scoring_wallet_id),
                      mono: true,
                      fullWidth: true,
                    },
                  ]}
                />
              </DetailSection>
              <DetailSection title="Status">
                <DetailGrid
                  fields={[
                    {
                      label: "KYC status",
                      value: (
                        <Badge
                          variant={
                            String(drawerRow.kyc_status || "").toLowerCase() ===
                            "verified"
                              ? "success"
                              : String(
                                    drawerRow.kyc_status || ""
                                  ).toLowerCase() === "pending"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {drawerRow.kyc_status || "—"}
                        </Badge>
                      ),
                    },
                    {
                      label: "Account status",
                      value: (
                        <Badge
                          variant={
                            String(drawerRow.status || "").toLowerCase() ===
                            "active"
                              ? "info"
                              : String(drawerRow.status || "").toLowerCase() ===
                                  "inactive"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {drawerRow.status || "—"}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </DetailSection>
            </>
          ) : null}
        </DetailsDrawer>
      </div>
    </ScoreRunContext.Provider>
  );
}

function BorrowerDrawerActions({
  borrower,
  canUpdateKyc,
  onBorrowerUpdated,
}: {
  borrower: BorrowerRow;
  canUpdateKyc: boolean;
  onBorrowerUpdated: (updated: BorrowerRow) => void;
}) {
  const { runningUserId, runScore } = useScoreRun();
  const updateKyc = useUpdateBorrowerKYC();
  const syncBorrower = useSyncBorrowerFromRukaPay();
  const id = borrower.rukapay_user_id ?? "";
  const profileId = borrower.id?.trim() ?? "";
  const busy = runningUserId === id;
  const anyBusy = !!runningUserId;
  const kycBusy = updateKyc.isPending;
  const syncBusy = syncBorrower.isPending;
  const kyc = String(borrower.kyc_status || "").toLowerCase();
  const showKyc = canUpdateKyc && !!profileId;

  async function setKyc(status: "verified" | "rejected" | "pending") {
    if (!profileId) {
      toast.error("Missing borrower profile id");
      return;
    }
    try {
      const updated = await updateKyc.mutateAsync({
        id: profileId,
        kyc_status: status,
      });
      onBorrowerUpdated(updated);
      toast.success(
        status === "verified"
          ? "KYC approved"
          : status === "rejected"
            ? "KYC rejected"
            : "KYC reset to pending"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update KYC");
    }
  }

  async function syncFromRukaPay() {
    if (!profileId) {
      toast.error("Missing borrower profile id");
      return;
    }
    try {
      const updated = await syncBorrower.mutateAsync({ id: profileId });
      onBorrowerUpdated(updated);
      toast.success("Borrower profile synced from RukaPay");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sync borrower from RukaPay"
      );
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {showKyc ? (
        <>
          <Button
            size="sm"
            variant="outline"
            title="Sync profile/KYC from RukaPay"
            aria-label="Sync borrower from RukaPay"
            className="h-9 w-full gap-2 rounded-lg text-sm"
            disabled={kycBusy || anyBusy || syncBusy}
            onClick={() => void syncFromRukaPay()}
          >
            {syncBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Sync KYC from RukaPay
          </Button>
          {kyc !== "verified" ? (
            <Button
              size="sm"
              title="Approve KYC"
              aria-label="Approve KYC"
              className="h-9 w-full gap-2 rounded-lg bg-emerald-600 text-sm text-white hover:bg-emerald-700"
              disabled={kycBusy || anyBusy || syncBusy}
              onClick={() => void setKyc("verified")}
            >
              {kycBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Approve KYC
            </Button>
          ) : null}
          {kyc !== "rejected" ? (
            <Button
              size="sm"
              variant="outline"
              title="Reject KYC"
              aria-label="Reject KYC"
              className="h-9 w-full gap-2 rounded-lg border-rose-200 text-sm text-rose-700 hover:bg-rose-50"
              disabled={kycBusy || anyBusy || syncBusy}
              onClick={() => void setKyc("rejected")}
            >
              <X className="size-4" />
              Reject KYC
            </Button>
          ) : null}
        </>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        title="Run credit score"
        aria-label={busy ? "Running score" : "Run score"}
        className="h-9 w-full gap-2 rounded-lg text-sm"
        disabled={anyBusy || kycBusy || syncBusy}
        onClick={() => void runScore(borrower)}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {busy ? "Running score…" : "Run score"}
      </Button>
    </div>
  );
}
