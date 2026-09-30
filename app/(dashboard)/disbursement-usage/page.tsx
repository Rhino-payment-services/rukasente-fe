"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ComponentType } from "react";
import axios from "axios";
import { Ban, Download, Loader2, RefreshCw, Search, Undo2, Users, Wallet } from "lucide-react";
import { downloadDisbursementUsageExport } from "@/lib/loan-export";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { useDisbursementUsage, useReverseDisbursementById } from "@/hooks/use-loan";
import { Perm } from "@/lib/permissions";
import type { DisbursementUsageItem } from "@/types/loan";
import { ugandaPhoneLocalDisplay } from "@/lib/uganda-phone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatMoney(amount: number, currency = "UGX") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function walletLabel(row: { wallet_number?: string }) {
  const number = (row.wallet_number || "").trim();
  return number || "—";
}

function WalletActivityProgress({
  progress,
}: {
  progress: {
    message: string;
    checked: number;
    total: number;
    percent: number;
    phase: string;
  } | null;
}) {
  const percent = Math.max(0, Math.min(100, progress?.percent ?? 4));
  const message = progress?.message || "Checking wallet activity";
  const detail =
    progress?.phase === "numbers" && progress.total > 0
      ? `${progress.checked} of ${progress.total} wallet numbers`
      : progress?.phase === "wallets" && progress.total > 0
        ? `${progress.checked} of ${progress.total} wallets`
        : progress?.phase === "done"
          ? "Done"
          : "Reading the latest disbursements";
  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Loader2 className="size-4 shrink-0 animate-spin text-[#08163d]" aria-hidden />
          <p className="truncate text-sm font-medium text-slate-800">{message}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-[#08163d]">{percent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#08163d] transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function apiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    const msg = data?.error?.message ?? data?.message;
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const FILTERS = [
  { id: "unused", label: "Haven't used" },
  { id: "used", label: "Used" },
  { id: "reversed", label: "Reversed" },
  { id: "unknown", label: "Unconfirmed" },
  { id: "all", label: "All" },
] as const;

function UsageBadge({ usage }: { usage: string }) {
  const map: Record<string, string> = {
    unused: "border-amber-200 bg-amber-50 text-amber-800",
    used: "border-emerald-200 bg-emerald-50 text-emerald-700",
    reversed: "border-slate-200 bg-slate-100 text-slate-600",
    unknown: "border-rose-200 bg-rose-50 text-rose-700",
    pending: "border-slate-200 bg-slate-50 text-slate-600",
  };
  const labels: Record<string, string> = {
    unused: "Not used",
    used: "Used",
    reversed: "Reversed",
    unknown: "Unconfirmed",
    pending: "Checking",
  };
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
        map[usage] ?? "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {labels[usage] ?? usage}
    </span>
  );
}

function Kpi({
  title,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
  active,
  onClick,
}: {
  title: string;
  value: number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone: "amber" | "green" | "navy" | "rose";
  loading?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    navy: "bg-[rgba(8,22,61,0.07)] text-[#08163d]",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card
        className={cn(
          "group gap-0 border-slate-200/80 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          active && "ring-2 ring-[#08163d]/20"
        )}
      >
        <CardContent className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">{title}</p>
              {loading ? (
                <div className="mt-2 h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {value}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
            </div>
            <span className={cn("flex size-8 items-center justify-center rounded-lg", tones[tone])}>
              <Icon className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function DisbursementUsagePage() {
  const { can } = usePermissions();
  const [usage, setUsage] = useState("unused");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [target, setTarget] = useState<DisbursementUsageItem | null>(null);
  const [reason, setReason] = useState("");
  const [exporting, setExporting] = useState(false);
  const pageSize = 20;
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const usageQ = useDisbursementUsage({
    search: debouncedSearch || undefined,
    refresh: refreshKey,
  });
  const reverse = useReverseDisbursementById();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, usage]);

  if (!can(Perm.LoanApplicationView)) {
    return (
      <NoAccess description="You need loan.application.view to see disbursement wallets." />
    );
  }

  const summary = usageQ.data?.summary;
  const scanned = usageQ.data?.items ?? [];
  const filtered = scanned.filter((row) => {
    if (row.usage === "pending") return usage === "all" || usage === "unused";
    return usage === "all" || row.usage === usage;
  });
  const total = filtered.length;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  const checkingWallets = (usageQ.progress?.total ?? 0) > 0 && (usageQ.progress?.percent ?? 0) < 100;
  const canReverse = can(Perm.LoanReverseDisbursement);

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadDisbursementUsageExport({
        usage: usage === "all" ? "all" : usage,
        search: debouncedSearch || undefined,
      });
      toast.success("Disbursement usage exported");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to export disbursement usage"));
    } finally {
      setExporting(false);
    }
  }

  async function submitReverse(e: FormEvent) {
    e.preventDefault();
    if (!target) return;
    if (!canReverse) {
      toast.error("You do not have permission to reverse disbursement.");
      return;
    }
    try {
      await reverse.mutateAsync({
        id: target.loan_application_id,
        reason: reason.trim() || undefined,
      });
      toast.success("Disbursement reversed — funds returned to partner escrow");
      setTarget(null);
      setReason("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to reverse disbursement"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Disbursement usage
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Wallets that received loan funds, who has spent them, and unused balances you can reverse.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
          onClick={() => void exportCsv()}
          disabled={exporting || usageQ.isLoading}
        >
          <Download className="size-3.5" />
          {exporting ? "Exporting…" : "Export"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
          onClick={() => {
            setRefreshKey((key) => key + 1);
          }}
          disabled={usageQ.isFetching}
        >
          <RefreshCw className={cn("size-3.5", usageQ.isFetching && "animate-spin")} />
          Refresh
        </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          title="Haven't used"
          value={summary?.people_unused ?? 0}
          hint={
            summary
              ? `${summary.unused_loans} loans · ${formatMoney(summary.unused_amount)}`
              : "People"
          }
          icon={Wallet}
          tone="amber"
          loading={!usageQ.data && usageQ.isLoading}
          active={usage === "unused"}
          onClick={() => setUsage("unused")}
        />
        <Kpi
          title="Used the loan"
          value={summary?.people_used ?? 0}
          hint={summary ? `${summary.used_loans} loans` : "People"}
          icon={Users}
          tone="green"
          loading={!usageQ.data && usageQ.isLoading}
          active={usage === "used"}
          onClick={() => setUsage("used")}
        />
        <Kpi
          title="Reversed"
          value={summary?.reversed_loans ?? 0}
          hint="Already clawed back"
          icon={Undo2}
          tone="navy"
          loading={!usageQ.data && usageQ.isLoading}
          active={usage === "reversed"}
          onClick={() => setUsage("reversed")}
        />
        <Kpi
          title="Unconfirmed"
          value={summary?.unknown_loans ?? 0}
          hint="Wallet activity unavailable"
          icon={Ban}
          tone="rose"
          loading={!usageQ.data && usageQ.isLoading}
          active={usage === "unknown"}
          onClick={() => setUsage("unknown")}
        />
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Disbursed wallets</p>
              <p className="text-xs text-slate-500">
                {usageQ.data?.note ||
                  "Unused means no debit on the wallet after the loan was credited."}
              </p>
            </div>
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, phone, wallet, application"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[rgba(8,22,61,0.25)] focus:bg-white focus:ring-4 focus:ring-[rgba(8,22,61,0.05)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={usage === filter.id ? "default" : "outline"}
                className="h-7 rounded-lg text-xs"
                onClick={() => setUsage(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {usageQ.isFetching && checkingWallets ? (
            <WalletActivityProgress progress={usageQ.progress} />
          ) : null}

          {!usageQ.data && usageQ.isLoading ? null : usageQ.error && !usageQ.data ? (
            <p className="text-sm text-rose-600">
              {apiErrorMessage(usageQ.error, "Could not load disbursement usage")}
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {usage === "unused" && checkingWallets
                ? "Wallets are still being checked. Confirmed rows stay on screen."
                : usage === "unused"
                  ? "No unused disbursements in this view."
                  : "No disbursements match this filter."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/95">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Borrower
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Wallet
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Disbursed
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Spent
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Still in wallet
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Usage
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Disbursed at
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={row.loan_application_id}
                      className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/90"
                    >
                      <td className="px-3 py-2 align-top">
                        <p className="font-medium text-slate-900">
                          {row.borrower_name || row.recipient_label || "—"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {ugandaPhoneLocalDisplay(row.borrower_phone) || row.borrower_phone || "—"}
                        </p>
                        <Link
                          href={`/loan-applications/${row.loan_application_id}`}
                          className="text-[11px] text-[#08163d] underline-offset-2 hover:underline"
                        >
                          {row.application_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <p className="font-mono text-[11px]" title={row.wallet_id || ""}>
                          {walletLabel(row)}
                        </p>
                        <p className="text-[11px] capitalize text-slate-400">
                          {row.recipient_type === "merchant" ? "Merchant" : "Borrower"}
                          {row.loan_kind && row.loan_kind !== "cash" ? ` · ${row.loan_kind}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top font-medium">
                        {formatMoney(row.disbursed_amount, row.currency)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {formatMoney(row.spent_amount, row.currency)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {formatMoney(row.remaining_estimate, row.currency)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <UsageBadge usage={row.usage} />
                        {row.note ? (
                          <p className="mt-1 max-w-[220px] text-[11px] text-slate-400">{row.note}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-500">
                        {formatDate(row.disbursed_at)}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {row.can_reverse && canReverse ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 rounded-lg bg-amber-700 px-2.5 text-xs text-white hover:bg-amber-800"
                            onClick={() => {
                              setTarget(row);
                              setReason("");
                            }}
                          >
                            Reverse
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {row.reverse_block_reason || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <span>
                Page {page} of {totalPages} · {total} loans
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {target ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Reverse unused loan</h2>
            <p className="mt-1 text-xs text-slate-500">
              {target.borrower_name || "This borrower"} has not spent this disbursement. Reversing
              returns {formatMoney(target.disbursed_amount, target.currency)} from wallet{" "}
              <span className="font-mono">{walletLabel(target)}</span> to partner escrow
              and marks the loan reversed.
            </p>
            <form className="mt-3 space-y-3" onSubmit={submitReverse}>
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[rgba(8,22,61,0.25)]"
                placeholder="Reason for reverse"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={reverse.isPending}
                  className="h-9 rounded-xl bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  {reverse.isPending ? "Reversing…" : "Confirm reverse"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl"
                  onClick={() => setTarget(null)}
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
