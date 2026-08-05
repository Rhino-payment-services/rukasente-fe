"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  RotateCcw,
  WalletCards,
  BadgeCheck,
  PauseCircle,
  ClipboardCheck,
  Percent,
  MoreHorizontal,
  Pencil,
  ListChecks,
  Power,
  Eye,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useLoanProducts, useSetLoanProductStatus, useDeleteLoanProduct } from "@/hooks/use-loan";
import type { LoanProduct } from "@/types/loan";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

function formatMoney(n: number, currency = "UGX") {
  return `${currency} ${n.toLocaleString()}`;
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ReviewPill({ required }: { required: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        required
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-500"
      )}
    >
      {required ? "Required" : "Auto"}
    </span>
  );
}

export default function LoanProductsPage() {
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const productsQ = useLoanProducts({
    page: 1,
    page_size: 100,
    search: search || undefined,
    active: activeFilter || undefined,
  });
  const setStatus = useSetLoanProductStatus();
  const deleteProduct = useDeleteLoanProduct();

  const items = productsQ.data?.items ?? [];

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const byInterest =
        interestFilter === "all" || p.interest_type === interestFilter;
      const byReview =
        reviewFilter === "all" ||
        (reviewFilter === "required" && p.requires_manual_review) ||
        (reviewFilter === "auto" && !p.requires_manual_review);
      return byInterest && byReview;
    });
  }, [items, interestFilter, reviewFilter]);

  const stats = useMemo(() => {
    const active = items.filter((p) => p.is_active).length;
    const inactive = items.length - active;
    const manual = items.filter((p) => p.requires_manual_review).length;
    const avgRate =
      items.length > 0
        ? items.reduce((s, p) => s + Number(p.interest_rate || 0), 0) / items.length
        : 0;
    return { total: items.length, active, inactive, manual, avgRate };
  }, [items]);

  function resetFilters() {
    setSearch("");
    setActiveFilter("");
    setInterestFilter("all");
    setReviewFilter("all");
  }

  async function toggleStatus(product: LoanProduct) {
    try {
      await setStatus.mutateAsync({
        id: product.id,
        isActive: !product.is_active,
      });
      toast.success(
        product.is_active ? "Product deactivated" : "Product activated"
      );
    } catch (err) {
      toast.error((err as Error).message || "Failed to update status");
    }
  }

  async function removeProduct(product: LoanProduct) {
    if (!window.confirm(`Delete loan product "${product.name}"?`)) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Product deleted");
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete product");
    }
  }

  if (!can(Perm.LoanProductView)) {
    return (
      <NoAccess description="You need loan.product.view to open loan products." />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Loan Products
          </h1>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            Configure lending products, rates, tenors, and eligibility rules for
            RukaSente.{" "}
            <Link href="/loan-score-limits" className="text-main-700 underline-offset-2 hover:underline">
              Manage score loan limits
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
            onClick={resetFilters}
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-lg bg-[#08163d] px-2.5 text-xs text-white hover:bg-[#06102a]"
          >
            <Link href="/loan-products/new">
              <Plus className="size-3.5" />
              Create product
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          title="Total Products"
          value={stats.total}
          hint="All configured"
          icon={WalletCards}
          tone="navy"
          loading={productsQ.isLoading}
        />
        <Kpi
          title="Active"
          value={stats.active}
          hint="Available to borrowers"
          icon={BadgeCheck}
          tone="green"
          loading={productsQ.isLoading}
        />
        <Kpi
          title="Inactive"
          value={stats.inactive}
          hint="Not offered"
          icon={PauseCircle}
          tone="slate"
          loading={productsQ.isLoading}
        />
        <Kpi
          title="Manual Review"
          value={stats.manual}
          hint="Needs officer check"
          icon={ClipboardCheck}
          tone="amber"
          loading={productsQ.isLoading}
        />
        <Kpi
          title="Avg Interest"
          value={`${stats.avgRate.toFixed(1)}%`}
          hint="Across catalog"
          icon={Percent}
          tone="blue"
          loading={productsQ.isLoading}
        />
      </div>

      {/* Filters */}
      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="space-y-3 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Search & Filters</p>
            <p className="text-xs text-slate-500">
              Find products by name or code, then refine by status and rules
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or product code…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[rgba(8,22,61,0.25)] focus:bg-white focus:ring-4 focus:ring-[rgba(8,22,61,0.05)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <FilterSelect
              label="Status"
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { value: "", label: "All statuses" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
            <FilterSelect
              label="Interest type"
              value={interestFilter}
              onChange={setInterestFilter}
              options={[
                { value: "all", label: "All types" },
                { value: "percentage", label: "Percentage" },
                { value: "flat", label: "Flat" },
              ]}
            />
            <FilterSelect
              label="Manual review"
              value={reviewFilter}
              onChange={setReviewFilter}
              options={[
                { value: "all", label: "All" },
                { value: "required", label: "Required" },
                { value: "auto", label: "Auto-approve eligible" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="gap-0 overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="p-0">
          {productsQ.isLoading ? (
            <div className="p-6">
              <CompactLoading message="Loading products…" />
            </div>
          ) : productsQ.error ? (
            <p className="p-6 text-sm text-rose-600">
              {(productsQ.error as Error).message}
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <WalletCards className="size-5" />
              </div>
              <p className="text-sm font-medium text-slate-900">No loan products found</p>
              <p className="text-xs text-slate-500">
                Try adjusting filters or create a new product.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-2 h-8 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
              >
                <Link href="/loan-products/new">
                  <Plus className="size-3.5" />
                  Create product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/90">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="sticky left-0 z-[1] min-w-[200px] bg-slate-50/95 px-3 py-2.5 font-medium">
                      Product
                    </th>
                    <th className="min-w-[140px] px-3 py-2.5 font-medium">Amount</th>
                    <th className="min-w-[100px] px-3 py-2.5 font-medium">Tenor</th>
                    <th className="min-w-[100px] px-3 py-2.5 font-medium">Interest</th>
                    <th className="min-w-[90px] px-3 py-2.5 font-medium">Status</th>
                    <th className="hidden min-w-[100px] px-3 py-2.5 font-medium lg:table-cell">
                      Review
                    </th>
                    <th className="sticky right-0 z-[1] w-12 bg-slate-50/95 px-2 py-2.5 text-center font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="group border-b border-slate-50 transition-colors hover:bg-slate-50/90"
                    >
                      <td className="sticky left-0 z-[1] bg-white px-3 py-2.5 group-hover:bg-slate-50/90">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(8,22,61,0.06)] text-[#08163d]">
                            <WalletCards className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="truncate text-[11px] tabular-nums text-slate-400">
                              {product.code}
                              <span className="mx-1 text-slate-300">·</span>
                              {product.currency}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="whitespace-nowrap text-[12px] font-medium text-slate-800">
                          {formatMoney(product.min_amount, product.currency)}
                        </p>
                        <p className="whitespace-nowrap text-[11px] text-slate-400">
                          to {formatMoney(product.max_amount, product.currency)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="whitespace-nowrap text-[12px] text-slate-700">
                          {product.min_tenor_days}–{product.max_tenor_days} days
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-[12px] font-semibold tabular-nums text-slate-900">
                          {product.interest_rate}%
                        </p>
                        <p className="capitalize text-[11px] text-slate-400">
                          {(product.interest_calculation_method || "SIMPLE").toLowerCase()}
                          {product.interest_calculation_method === "COMPOUND" &&
                          product.compounding_frequency
                            ? ` · ${product.compounding_frequency.toLowerCase()}`
                            : ` · ${product.interest_type}`}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill active={product.is_active} />
                      </td>
                      <td className="hidden px-3 py-2.5 lg:table-cell">
                        <ReviewPill required={product.requires_manual_review} />
                      </td>
                      <td className="sticky right-0 z-[1] bg-white px-2 py-2.5 text-center group-hover:bg-slate-50/90">
                        <ProductActions
                          open={openMenuId === product.id}
                          onOpenChange={(o) =>
                            setOpenMenuId(o ? product.id : null)
                          }
                          product={product}
                          onToggleStatus={() => {
                            setOpenMenuId(null);
                            void toggleStatus(product);
                          }}
                          onDelete={() => {
                            setOpenMenuId(null);
                            void removeProduct(product);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {productsQ.data ? (
            <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              Showing {filtered.length} of {productsQ.data.total} products
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
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
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone: "navy" | "green" | "slate" | "amber" | "blue";
  loading?: boolean;
}) {
  const tones = {
    navy: "bg-[rgba(8,22,61,0.07)] text-[#08163d]",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductActions({
  open,
  onOpenChange,
  product,
  onToggleStatus,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LoanProduct;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  const items = [
    {
      label: "View / Edit",
      icon: Pencil,
      href: `/loan-products/${product.id}/edit`,
    },
    {
      label: "Eligibility rules",
      icon: ListChecks,
      href: `/loan-products/${product.id}/rules`,
    },
    {
      label: "Preview details",
      icon: Eye,
      href: `/loan-products/${product.id}/edit`,
    },
    {
      label: product.is_active ? "Deactivate" : "Activate",
      icon: Power,
      onClick: onToggleStatus,
      danger: product.is_active,
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: onDelete,
      danger: true,
    },
  ];

  return (
    <div className="relative inline-flex" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-lg text-slate-400 hover:text-slate-900"
        onClick={() => onOpenChange(!open)}
        aria-label="Actions"
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((item) => {
            const Icon = item.icon;
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Icon className="size-3.5 opacity-70" />
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50",
                  item.danger ? "text-rose-600" : "text-slate-700"
                )}
              >
                <Icon className="size-3.5 opacity-70" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
