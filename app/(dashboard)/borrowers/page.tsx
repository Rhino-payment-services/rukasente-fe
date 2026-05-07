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
import { BorrowerRow, useBorrowersList } from "@/hooks/use-borrowers";
import { RunScoreDialog } from "@/components/dashboard/run-score-dialog";

export default function BorrowersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { data, isLoading, error } = useBorrowersList(page, pageSize);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">(
    "all"
  );
  const [kycFilter, setKycFilter] = useState<"all" | "verified" | "pending" | "rejected">("all");

  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [runTarget, setRunTarget] = useState<{
    rukapayUserId: string;
    label: string | null;
    walletId?: string;
  } | null>(null);

  const openRunDialog = (b: BorrowerRow) => {
    if (!b.rukapay_user_id) return;
    setRunTarget({
      rukapayUserId: b.rukapay_user_id,
      label: b.full_name || b.rukapay_user_id,
      walletId: b.scoring_wallet_id ?? undefined,
    });
    setRunDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<BorrowerRow>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2 text-slate-700"
          >
            Full name
            <ArrowUpDown className="size-4 text-slate-400" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-slate-900">{row.original.full_name}</p>
            {row.original.email ? (
              <p className="text-xs text-slate-500">{row.original.email}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone number",
        cell: ({ row }) => <span className="text-sm">{row.original.phone}</span>,
      },
      {
        accessorKey: "email",
        header: "Email address",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">{row.original.email ?? "—"}</span>
        ),
      },
      {
        accessorKey: "kyc_status",
        header: "KYC status",
        cell: ({ row }) => {
          const v = String(row.original.kyc_status || "").toLowerCase();
          const variant =
            v === "verified"
              ? "success"
              : v === "pending"
                ? "warning"
                : "danger";
          return <Badge variant={variant as any}>{v || "—"}</Badge>;
        },
      },
      {
        accessorKey: "status",
        header: "Account status",
        cell: ({ row }) => {
          const v = String(row.original.status || "").toLowerCase();
          const variant =
            v === "active" ? "info" : v === "inactive" ? "warning" : "danger";
          return <Badge variant={variant as any}>{v || "—"}</Badge>;
        },
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
                onClick={() => openRunDialog(row.original)}
              >
                <Play className="size-3.5" />
                Run score
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const raw = data?.items ?? [];
  const filtered = raw.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.full_name.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q) ||
      (b.email ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesKyc = kycFilter === "all" || b.kyc_status === kycFilter;
    return matchesSearch && matchesStatus && matchesKyc;
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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Borrowers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Borrower profiles enrolled in the credit program. Manage KYC and account
          status visibility at a glance.
        </p>
      </div>

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
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value as any)}
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
            <p className="text-sm text-destructive">{(error as Error).message}</p>
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
                      <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-slate-500">
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

      <RunScoreDialog
        open={runDialogOpen}
        onOpenChange={(next) => {
          setRunDialogOpen(next);
          if (!next) setRunTarget(null);
        }}
        initialRukapayUserId={runTarget?.rukapayUserId}
        initialWalletId={runTarget?.walletId}
        lockRukapayUserId
        borrowerLabel={runTarget?.label ?? null}
      />
    </div>
  );
}
