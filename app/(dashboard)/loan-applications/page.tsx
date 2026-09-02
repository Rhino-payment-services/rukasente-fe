"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  FileText,
  BadgeCheck,
  Clock3,
  Ban,
  ClipboardList,
  Plus,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import {
  DetailGrid,
  DetailSection,
} from "@/components/dashboard/detail-fields";
import { TableViewButton } from "@/components/dashboard/table-view-button";
import { LoanExportDialog } from "@/components/dashboard/loan-export-dialog";
import { useLoanApplications } from "@/hooks/use-loan";
import type { LoanApplication } from "@/types/loan";
import { cn } from "@/lib/utils";
import { ugandaPhoneLocalDisplay } from "@/lib/uganda-phone";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

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

function StatusBadge({ status }: { status: string }) {
  const s = String(status || "").toLowerCase();
  const map: Record<string, string> = {
    submitted: "border-blue-200 bg-blue-50 text-blue-700",
    under_review: "border-amber-200 bg-amber-50 text-amber-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    declined: "border-rose-200 bg-rose-50 text-rose-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
    disbursed: "border-violet-200 bg-violet-50 text-violet-700",
    disbursing: "border-indigo-200 bg-indigo-50 text-indigo-700",
    disbursement_failed: "border-rose-200 bg-rose-50 text-rose-700",
    pending_retry: "border-amber-200 bg-amber-50 text-amber-800",
    repaid: "border-slate-200 bg-slate-50 text-slate-600",
    overdue: "border-orange-200 bg-orange-50 text-orange-700",
    defaulted: "border-zinc-300 bg-zinc-100 text-zinc-700",
    draft: "border-slate-200 bg-slate-50 text-slate-500",
  };
  const label = s.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        map[s] ?? "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {label || "unknown"}
    </span>
  );
}

export default function LoanApplicationsPage() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const pageSize = 20;
  const [viewApplication, setViewApplication] = useState<LoanApplication | null>(
    null
  );
  const appsQ = useLoanApplications({
    page,
    page_size: pageSize,
    status: status || undefined,
  });

  const items = appsQ.data?.items ?? [];
  const total = appsQ.data?.total ?? 0;
  const totalPages = appsQ.data?.total_pages ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  useEffect(() => {
    if (searchParams.get("export") === "1") {
      setExportOpen(true);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      return (
        a.application_number?.toLowerCase().includes(q) ||
        a.borrower_name?.toLowerCase().includes(q) ||
        a.borrower_phone?.toLowerCase().includes(q) ||
        a.borrower_email?.toLowerCase().includes(q) ||
        a.product_name?.toLowerCase().includes(q) ||
        a.product_code?.toLowerCase().includes(q) ||
        a.status?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const submitted = items.filter((a) => a.status === "submitted").length;
    const underReview = items.filter((a) => a.status === "under_review").length;
    const approved = items.filter((a) => a.status === "approved").length;
    const declined = items.filter((a) => a.status === "declined").length;
    return {
      total: items.length,
      submitted,
      underReview,
      approved,
      declined,
    };
  }, [items]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  if (!can(Perm.LoanApplicationView)) {
    return (
      <NoAccess description="You need loan.application.view to open loan applications." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Loan Applications
          </h1>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            Review borrower requests, products, amounts, and credit decisions.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-lg bg-main-600 px-2.5 text-xs text-white hover:bg-main-700"
          >
            <Link href="/loan-applications/new">
              <Plus className="size-3.5" />
              New application
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
            onClick={resetFilters}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi title="Total" value={stats.total} hint="On this page" icon={FileText} tone="navy" loading={appsQ.isLoading} />
        <Kpi title="Submitted" value={stats.submitted} hint="On this page" icon={ClipboardList} tone="blue" loading={appsQ.isLoading} />
        <Kpi title="Under review" value={stats.underReview} hint="On this page" icon={Clock3} tone="amber" loading={appsQ.isLoading} />
        <Kpi title="Approved" value={stats.approved} hint="On this page" icon={BadgeCheck} tone="green" loading={appsQ.isLoading} />
        <Kpi title="Declined" value={stats.declined} hint="On this page" icon={Ban} tone="rose" loading={appsQ.isLoading} />
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="space-y-3 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Search & Filters</p>
            <p className="text-xs text-slate-500">
              Filter by status (server). Search filters the current page only.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this page…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[rgba(8,22,61,0.25)] focus:bg-white focus:ring-4 focus:ring-[rgba(8,22,61,0.05)]"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)] sm:w-48"
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="pending_customer_approval">Pending customer approval</option>
              <option value="customer_approved">Customer approved</option>
              <option value="customer_declined">Customer declined</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
              <option value="disbursing">Disbursing</option>
              <option value="disbursement_failed">Disbursement failed</option>
              <option value="pending_retry">Pending retry</option>
              <option value="disbursed">Disbursed</option>
              <option value="overdue">Overdue</option>
              <option value="defaulted">Defaulted</option>
              <option value="repaid">Repaid</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="p-0">
          {appsQ.isLoading ? (
            <div className="p-6">
              <CompactLoading message="Loading applications…" />
            </div>
          ) : appsQ.error ? (
            <p className="p-6 text-sm text-rose-600">
              {(appsQ.error as Error).message}
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <FileText className="size-5" />
              </div>
              <p className="text-sm font-medium text-slate-900">No applications found</p>
              <p className="text-xs text-slate-500">Try another status or search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="sticky left-0 z-[1] min-w-[150px] bg-slate-50/95 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400 backdrop-blur">
                      Application
                    </th>
                    <th className="min-w-[180px] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Borrower
                    </th>
                    <th className="min-w-[160px] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Product
                    </th>
                    <th className="min-w-[120px] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Amount
                    </th>
                    <th className="min-w-[80px] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Tenor
                    </th>
                    <th className="min-w-[110px] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="min-w-[140px] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Submitted
                    </th>
                    <th className="sticky right-0 z-[1] w-24 bg-slate-50/95 px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400 backdrop-blur">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <ApplicationRow
                      key={app.id}
                      app={app}
                      onView={() => setViewApplication(app)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {appsQ.data ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              <span>
                Showing {rangeStart}–{rangeEnd} of {total}
                {search.trim() ? ` (${filtered.length} match on this page)` : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={!!totalPages && page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DetailsDrawer
        open={!!viewApplication}
        onClose={() => setViewApplication(null)}
        title={viewApplication?.application_number ?? "Loan application"}
        description={viewApplication?.borrower_name}
        widthClassName="max-w-lg"
        footer={
          viewApplication ? (
            <Button asChild className="flex-1 rounded-lg bg-main-600 text-xs text-white hover:bg-main-700">
              <Link href={`/loan-applications/${viewApplication.id}`}>
                Open full application
              </Link>
            </Button>
          ) : null
        }
      >
        {viewApplication ? (
          <>
            <DetailSection title="Application">
              <DetailGrid
                fields={[
                  {
                    label: "Application #",
                    value: viewApplication.application_number,
                    mono: true,
                  },
                  {
                    label: "Status",
                    value: String(viewApplication.status).replace(/_/g, " "),
                  },
                  {
                    label: "Channel",
                    value: String(viewApplication.submission_channel).replace(/_/g, " "),
                  },
                  {
                    label: "Purpose",
                    value: viewApplication.purpose || "—",
                    fullWidth: true,
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Borrower">
              <DetailGrid
                fields={[
                  { label: "Name", value: viewApplication.borrower_name },
                  { label: "Phone", value: viewApplication.borrower_phone },
                  { label: "Email", value: viewApplication.borrower_email },
                  {
                    label: "Profile ID",
                    value: viewApplication.borrower_profile_id,
                    mono: true,
                    fullWidth: true,
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Loan request">
              <DetailGrid
                fields={[
                  { label: "Product", value: viewApplication.product_name },
                  { label: "Product code", value: viewApplication.product_code, mono: true },
                  {
                    label: "Amount",
                    value: formatMoney(
                      viewApplication.requested_amount,
                      viewApplication.currency || "UGX"
                    ),
                  },
                  {
                    label: "Tenor",
                    value: `${viewApplication.requested_tenor_days} days`,
                  },
                ]}
              />
            </DetailSection>
            {viewApplication.guarantor_phone || viewApplication.guarantor_full_name ? (
              <DetailSection title="Guarantor">
                <DetailGrid
                  fields={[
                    {
                      label: "Full name",
                      value: viewApplication.guarantor_full_name || "—",
                    },
                    {
                      label: "Phone",
                      value: viewApplication.guarantor_phone
                        ? ugandaPhoneLocalDisplay(viewApplication.guarantor_phone)
                        : "—",
                      mono: true,
                    },
                    {
                      label: "Network",
                      value: viewApplication.guarantor_network || "—",
                    },
                    {
                      label: "Validated",
                      value: formatDate(viewApplication.guarantor_validated_at),
                    },
                    {
                      label: "Relationship",
                      value: viewApplication.guarantor_relationship || "—",
                      fullWidth: true,
                    },
                  ]}
                />
              </DetailSection>
            ) : null}
            <DetailSection title="Decision & disbursement">
              <DetailGrid
                fields={[
                  { label: "Decision reason", value: viewApplication.decision_reason, fullWidth: true },
                  { label: "Submitted", value: formatDate(viewApplication.submitted_at) },
                  { label: "Decisioned", value: formatDate(viewApplication.decisioned_at) },
                  {
                    label: "Decisioned by",
                    value:
                      viewApplication.decisioned_by_staff_name?.trim() ||
                      viewApplication.decisioned_by_staff_user_id ||
                      "—",
                  },
                  {
                    label: "Disbursement error",
                    value: viewApplication.disbursement_error || "—",
                    fullWidth: true,
                  },
                  {
                    label: "Disbursement attempts",
                    value:
                      viewApplication.disbursement_attempts != null
                        ? String(viewApplication.disbursement_attempts)
                        : "—",
                  },
                  { label: "Disbursed", value: formatDate(viewApplication.disbursed_at) },
                  {
                    label: "Disbursed amount",
                    value: viewApplication.disbursed_amount
                      ? formatMoney(
                          viewApplication.disbursed_amount,
                          viewApplication.currency || "UGX"
                        )
                      : "—",
                  },
                  { label: "Due date", value: formatDate(viewApplication.due_date) },
                  { label: "Repaid", value: formatDate(viewApplication.repaid_at) },
                ]}
              />
            </DetailSection>
            <DetailSection title="References">
              <DetailGrid
                fields={[
                  {
                    label: "Credit score result",
                    value: viewApplication.credit_score_result_id,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "Eligibility decision",
                    value: viewApplication.eligibility_decision_id,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "Disbursement txn",
                    value: viewApplication.disbursement_txn_id,
                    mono: true,
                    fullWidth: true,
                  },
                  { label: "ID", value: viewApplication.id, mono: true, fullWidth: true },
                ]}
              />
            </DetailSection>
          </>
        ) : null}
      </DetailsDrawer>
      <LoanExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        initialStatus={status}
      />
    </div>
  );
}

function ApplicationRow({
  app,
  onView,
}: {
  app: LoanApplication;
  onView: () => void;
}) {
  const borrowerLabel = app.borrower_name?.trim() || "Unknown borrower";
  const productLabel = app.product_name?.trim() || "Unknown product";
  const initials = borrowerLabel
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <tr className="group border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/90">
      <td className="sticky left-0 z-[1] bg-white px-3 py-2 align-middle group-hover:bg-slate-50/90">
        <p className="font-semibold tabular-nums text-slate-900">
          {app.application_number}
        </p>
        <p className="text-[10px] capitalize text-slate-400">
          {app.submission_channel?.replace(/_/g, " ") || "—"}
        </p>
      </td>
      <td className="px-3 py-2 align-middle text-slate-700">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#08163d] to-[#1a2d5c] text-[10px] font-semibold text-white">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-900">
              {borrowerLabel}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {app.borrower_phone || app.borrower_email || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 align-middle text-slate-700">
        <p className="truncate text-[12px] font-medium text-slate-800">{productLabel}</p>
        <p className="truncate text-[11px] tabular-nums text-slate-400">
          {app.product_code || "—"}
        </p>
      </td>
      <td className="px-3 py-2 align-middle text-slate-700">
        <p className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-slate-900">
          {formatMoney(app.requested_amount, app.currency || "UGX")}
        </p>
      </td>
      <td className="px-3 py-2.5 text-[12px] text-slate-700">
        {app.requested_tenor_days} days
      </td>
      <td className="px-3 py-2 align-middle text-slate-700">
        <StatusBadge status={app.status} />
      </td>
      <td className="px-3 py-2.5 text-[12px] text-slate-600">
        {formatDate(app.submitted_at)}
      </td>
      <td className="sticky right-0 z-[1] bg-white px-2 py-2 text-center align-middle group-hover:bg-slate-50/90">
        <div className="flex items-center justify-center gap-1">
          <TableViewButton onClick={onView} label={`View ${app.application_number}`} />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 rounded-md px-2 text-[11px] text-slate-600"
          >
            <Link href={`/loan-applications/${app.id}`}>Open</Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function Kpi({
  title,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  title: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "navy" | "blue" | "amber" | "green" | "rose";
  loading?: boolean;
}) {
  const tones = {
    navy: "bg-[rgba(8,22,61,0.07)] text-[#08163d]",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <Card className="group gap-0 border-slate-200/80 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              tones[tone]
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
