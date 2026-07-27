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
import { useSession } from "next-auth/react";
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
  Play,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  BorrowerRow,
  useBorrowersList,
  useUpdateBorrowerKYC,
} from "@/hooks/use-borrowers";
import { useRunScoring } from "@/hooks/use-scoring";
import { scoringErrorMessage } from "@/lib/scoring-errors";
import { hasPermission, Perm } from "@/lib/permissions";

type ScoreRunCtx = {
  runningUserId: string | null;
  runScore: (b: BorrowerRow) => Promise<void>;
};

const ScoreRunContext = createContext<ScoreRunCtx | null>(null);

function useScoreRun() {
  const ctx = useContext(ScoreRunContext);
  if (!ctx) throw new Error("ScoreRunContext missing");
  return ctx;
}

export default function BorrowersPage() {
  const { data: session } = useSession();
  const canUpdateKyc = hasPermission(
    session?.user?.permissions,
    Perm.BorrowerUpdate
  );

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

  const { mutateAsync } = useRunScoring();
  const mutateAsyncRef = useRef(mutateAsync);
  useEffect(() => {
    mutateAsyncRef.current = mutateAsync;
  }, [mutateAsync]);

  const [runningUserId, setRunningUserId] = useState<string | null>(null);
  const runningUserIdRef = useRef<string | null>(null);
  const [feedback, setFeedback] = useState<ScoreResultFeedback | null>(null);

  const runScore = useCallback(async (b: BorrowerRow) => {
    const id = b.rukapay_user_id?.trim();
    if (!id || runningUserIdRef.current) return;

    const name = b.full_name || id;
    setFeedback(null);
    runningUserIdRef.current = id;
    setRunningUserId(id);

    // Let React paint "Running…" before starting the request.
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });

    try {
      // Omit wallet_id so the backend merges activity across all linked wallets.
      const result = await mutateAsyncRef.current({
        rukapay_user_id: id,
      });
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
        cell: ({ row }) =>
          row.original.id ? (
            <Link
              href={`/borrowers/${row.original.id}`}
              className="font-medium text-slate-900 whitespace-nowrap hover:text-main-600 hover:underline"
            >
              {row.original.full_name}
            </Link>
          ) : (
            <p className="font-medium text-slate-900 whitespace-nowrap">
              {row.original.full_name}
            </p>
          ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {row.original.phone}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate text-sm text-slate-700">
            {row.original.email ?? "—"}
          </span>
        ),
      },
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
        header: "Actions",
        cell: ({ row }) => (
          <BorrowerActions borrower={row.original} canUpdateKyc={canUpdateKyc} />
        ),
      },
    ],
    [canUpdateKyc]
  );

  const raw = data?.items ?? [];
  const filtered = useMemo(() => {
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
  }, [raw, search, statusFilter, kycFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

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
          <CardContent className="space-y-3 px-4 py-4">
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
                    e.target.value as "all" | "active" | "inactive" | "suspended"
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
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-full animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">
                {(error as Error).message}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table className="min-w-[720px]">
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
                          No borrowers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-slate-500">
                Total: {data?.total ?? 0} · Page {data?.page ?? page} · Showing{" "}
                {filtered.length}
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
          </CardContent>
        </Card>
      </div>
    </ScoreRunContext.Provider>
  );
}

function BorrowerActions({
  borrower,
  canUpdateKyc,
}: {
  borrower: BorrowerRow;
  canUpdateKyc: boolean;
}) {
  const { runningUserId, runScore } = useScoreRun();
  const updateKyc = useUpdateBorrowerKYC();
  const id = borrower.rukapay_user_id ?? "";
  const profileId = borrower.id?.trim() ?? "";
  const busy = runningUserId === id;
  const anyBusy = !!runningUserId;
  const kycBusy = updateKyc.isPending;
  const kyc = String(borrower.kyc_status || "").toLowerCase();

  async function setKyc(status: "verified" | "rejected" | "pending") {
    if (!profileId) {
      toast.error("Missing borrower profile id");
      return;
    }
    try {
      await updateKyc.mutateAsync({ id: profileId, kyc_status: status });
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

  return (
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      {canUpdateKyc && profileId ? (
        <>
          {kyc !== "verified" ? (
            <Button
              size="sm"
              title="Approve KYC"
              aria-label="Approve KYC"
              className="h-7 gap-1 rounded-md bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700"
              disabled={kycBusy || anyBusy}
              onClick={() => void setKyc("verified")}
            >
              {kycBusy ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              Approve
            </Button>
          ) : null}
          {kyc !== "rejected" ? (
            <Button
              size="sm"
              variant="outline"
              title="Reject KYC"
              aria-label="Reject KYC"
              className="size-7 rounded-md border-rose-200 p-0 text-rose-700 hover:bg-rose-50"
              disabled={kycBusy || anyBusy}
              onClick={() => void setKyc("rejected")}
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
        </>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        title="Run credit score"
        aria-label={busy ? "Running score" : "Run score"}
        className="h-7 gap-1 rounded-md px-2 text-xs"
        disabled={anyBusy || kycBusy}
        onClick={() => void runScore(borrower)}
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Play className="size-3" />
        )}
        {busy ? "…" : "Score"}
      </Button>
    </div>
  );
}
