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
import {
  BorrowerRow,
  borrowerSourceLabel,
  useBorrowersList,
  useUpdateBorrowerKYC,
} from "@/hooks/use-borrowers";
import { useRunScoring } from "@/hooks/use-scoring";
import { scoringErrorMessage } from "@/lib/scoring-errors";
import { Perm } from "@/lib/permissions";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";

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
  const [viewRow, setViewRow] = useState<BorrowerRow | null>(null);

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
      const result = await mutateAsyncRef.current({
        rukapay_user_id: id,
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
              className="whitespace-nowrap text-[13px] font-semibold text-slate-900 hover:text-main-600 hover:underline"
            >
              {row.original.full_name}
            </Link>
          ) : (
            <p className="whitespace-nowrap text-[13px] font-semibold text-slate-900">
              {row.original.full_name}
            </p>
          ),
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
          <BorrowerActions
            borrower={row.original}
            canUpdateKyc={canUpdateKyc}
            onView={() => setViewRow(row.original)}
          />
        ),
      },
    ],
    [canUpdateKyc, isPlatform]
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
          open={!!viewRow}
          onClose={() => setViewRow(null)}
          title={viewRow?.full_name ?? "Borrower"}
          description={viewRow?.phone}
        >
          {viewRow ? (
            <>
              <DetailSection title="Identity">
                <DetailGrid
                  fields={[
                    { label: "Full name", value: viewRow.full_name },
                    { label: "Phone", value: viewRow.phone, mono: true },
                    {
                      label: "Email",
                      value: formatDetailValue(viewRow.email),
                      fullWidth: true,
                    },
                    {
                      label: "National ID",
                      value: formatDetailValue(viewRow.national_id),
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
                      value: formatDetailValue(viewRow.rukapay_user_id),
                      mono: true,
                      fullWidth: true,
                    },
                    {
                      label: "Profile ID",
                      value: formatDetailValue(viewRow.id),
                      mono: true,
                    },
                    {
                      label: "Source platform",
                      value: (
                        <Badge
                          variant={viewRow.partner_id ? "default" : "info"}
                          title={
                            viewRow.partner?.code
                              ? `${borrowerSourceLabel(viewRow)} (${viewRow.partner.code})`
                              : borrowerSourceLabel(viewRow)
                          }
                        >
                          {borrowerSourceLabel(viewRow)}
                        </Badge>
                      ),
                    },
                    {
                      label: "Scoring wallet ID",
                      value: formatDetailValue(viewRow.scoring_wallet_id),
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
                            String(viewRow.kyc_status || "").toLowerCase() ===
                            "verified"
                              ? "success"
                              : String(
                                    viewRow.kyc_status || ""
                                  ).toLowerCase() === "pending"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {viewRow.kyc_status || "—"}
                        </Badge>
                      ),
                    },
                    {
                      label: "Account status",
                      value: (
                        <Badge
                          variant={
                            String(viewRow.status || "").toLowerCase() ===
                            "active"
                              ? "info"
                              : String(viewRow.status || "").toLowerCase() ===
                                  "inactive"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {viewRow.status || "—"}
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

function BorrowerActions({
  borrower,
  canUpdateKyc,
  onView,
}: {
  borrower: BorrowerRow;
  canUpdateKyc: boolean;
  onView: () => void;
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

  const showKyc = canUpdateKyc && !!profileId;
  const slots = showKyc
    ? [ACTION_SLOT.sm, ACTION_SLOT.lg, ACTION_SLOT.icon, ACTION_SLOT.md]
    : [ACTION_SLOT.sm, ACTION_SLOT.md];

  return (
    <RowActions slots={slots}>
      <ActionSlot>
        <TableViewButton onClick={onView} />
      </ActionSlot>
      {showKyc ? (
        <>
          <ActionSlot>
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
          </ActionSlot>
          <ActionSlot>
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
          </ActionSlot>
        </>
      ) : null}
      <ActionSlot>
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
      </ActionSlot>
    </RowActions>
  );
}
