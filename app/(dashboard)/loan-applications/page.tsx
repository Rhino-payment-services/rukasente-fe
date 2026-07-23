"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  FileText,
  BadgeCheck,
  Clock3,
  Ban,
  ClipboardList,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useLoanApplications } from "@/hooks/use-loan";
import type { LoanApplication } from "@/types/loan";
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const appsQ = useLoanApplications({
    page: 1,
    page_size: 100,
    status: status || undefined,
  });

  const items = appsQ.data?.items ?? [];

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
        <Kpi title="Total" value={stats.total} hint="All applications" icon={FileText} tone="navy" loading={appsQ.isLoading} />
        <Kpi title="Submitted" value={stats.submitted} hint="Awaiting intake" icon={ClipboardList} tone="blue" loading={appsQ.isLoading} />
        <Kpi title="Under review" value={stats.underReview} hint="In progress" icon={Clock3} tone="amber" loading={appsQ.isLoading} />
        <Kpi title="Approved" value={stats.approved} hint="Decisioned yes" icon={BadgeCheck} tone="green" loading={appsQ.isLoading} />
        <Kpi title="Declined" value={stats.declined} hint="Decisioned no" icon={Ban} tone="rose" loading={appsQ.isLoading} />
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="space-y-3 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Search & Filters</p>
            <p className="text-xs text-slate-500">
              Search by application #, borrower, product, or status
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[rgba(8,22,61,0.25)] focus:bg-white focus:ring-4 focus:ring-[rgba(8,22,61,0.05)]"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)] sm:w-48"
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
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
                <thead className="border-b border-slate-100 bg-slate-50/90">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="sticky left-0 z-[1] min-w-[150px] bg-slate-50/95 px-3 py-2.5 font-medium">
                      Application
                    </th>
                    <th className="min-w-[180px] px-3 py-2.5 font-medium">Borrower</th>
                    <th className="min-w-[160px] px-3 py-2.5 font-medium">Product</th>
                    <th className="min-w-[120px] px-3 py-2.5 font-medium">Amount</th>
                    <th className="min-w-[80px] px-3 py-2.5 font-medium">Tenor</th>
                    <th className="min-w-[110px] px-3 py-2.5 font-medium">Status</th>
                    <th className="min-w-[140px] px-3 py-2.5 font-medium">Submitted</th>
                    <th className="sticky right-0 z-[1] w-12 bg-slate-50/95 px-2 py-2.5 text-center font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <ApplicationRow key={app.id} app={app} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {appsQ.data ? (
            <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              Showing {filtered.length} of {appsQ.data.total} applications
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationRow({ app }: { app: LoanApplication }) {
  const borrowerLabel = app.borrower_name?.trim() || "Unknown borrower";
  const productLabel = app.product_name?.trim() || "Unknown product";
  const initials = borrowerLabel
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <tr className="group border-b border-slate-50 transition-colors hover:bg-slate-50/90">
      <td className="sticky left-0 z-[1] bg-white px-3 py-2.5 group-hover:bg-slate-50/90">
        <p className="font-semibold tabular-nums text-slate-900">
          {app.application_number}
        </p>
        <p className="text-[10px] capitalize text-slate-400">
          {app.submission_channel?.replace(/_/g, " ") || "—"}
        </p>
      </td>
      <td className="px-3 py-2.5">
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
      <td className="px-3 py-2.5">
        <p className="truncate text-[12px] font-medium text-slate-800">{productLabel}</p>
        <p className="truncate text-[11px] tabular-nums text-slate-400">
          {app.product_code || "—"}
        </p>
      </td>
      <td className="px-3 py-2.5">
        <p className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-slate-900">
          {formatMoney(app.requested_amount, app.currency || "UGX")}
        </p>
      </td>
      <td className="px-3 py-2.5 text-[12px] text-slate-700">
        {app.requested_tenor_days} days
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={app.status} />
      </td>
      <td className="px-3 py-2.5 text-[12px] text-slate-600">
        {formatDate(app.submitted_at)}
      </td>
      <td className="sticky right-0 z-[1] bg-white px-2 py-2.5 text-center group-hover:bg-slate-50/90">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-slate-400 hover:text-slate-900"
        >
          <Link href={`/loan-applications/${app.id}`} aria-label="View application">
            <Eye className="size-4" />
          </Link>
        </Button>
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
