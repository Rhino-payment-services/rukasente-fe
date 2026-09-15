"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { NoAccess } from "@/components/auth/no-access";
import { useLoanProducts, useReviewLoanProduct } from "@/hooks/use-loan";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";
import type { LoanProduct } from "@/types/loan";
import { toast } from "sonner";

function money(n?: number, currency = "UGX") {
  return `${currency} ${Number(n || 0).toLocaleString()}`;
}

function DiffRow({
  label,
  live,
  proposed,
}: {
  label: string;
  live: string;
  proposed: string;
}) {
  const changed = live !== proposed;
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-slate-50 py-2 text-[12px] last:border-0">
      <div className="text-slate-500">{label}</div>
      <div className="text-slate-600">{live}</div>
      <div className={changed ? "font-semibold text-[#08163d]" : "text-slate-800"}>
        {proposed}
        {changed ? (
          <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            changed
          </span>
        ) : null}
      </div>
    </div>
  );
}

function productFromPayload(product: LoanProduct): Partial<LoanProduct> {
  return product.pending_changes?.proposed_payload?.product ?? product;
}

export default function LoanProductApprovalsPage() {
  const { can, isPlatform } = usePermissions();
  const pendingQ = useLoanProducts({
    page: 1,
    page_size: 100,
    approval_status: "pending",
  });
  const review = useReviewLoanProduct();
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const items = pendingQ.data?.items ?? [];
  const allowed = isPlatform && can(Perm.LoanProductApprove);

  const counts = useMemo(() => {
    const list = pendingQ.data?.items ?? [];
    const creates = list.filter((p) => p.pending_changes?.action === "create").length;
    return { total: list.length, creates, updates: list.length - creates };
  }, [pendingQ.data?.items]);

  async function approve(product: LoanProduct) {
    try {
      await review.mutateAsync({ id: product.id, decision: "approved" });
      toast.success(`${product.name} approved`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to approve");
    }
  }

  async function reject(product: LoanProduct) {
    const reason = (reasonById[product.id] || "").trim();
    if (!reason) {
      toast.error("Enter a rejection reason");
      setRejectingId(product.id);
      return;
    }
    try {
      await review.mutateAsync({ id: product.id, decision: "rejected", reason });
      toast.success(`${product.name} rejected`);
      setRejectingId(null);
    } catch (err) {
      toast.error((err as Error).message || "Failed to reject");
    }
  }

  if (!allowed) {
    return (
      <NoAccess description="Only RukaSente platform admins with loan.product.approve can review product submissions." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <nav className="flex items-center gap-1.5 text-[13px] text-slate-400">
          <Link href="/loan-products" className="transition-colors hover:text-slate-700">
            Loan products
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-700">Approvals</span>
        </nav>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Product approvals
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Review tenant product creates and updates before they change the live catalog.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-slate-500">Pending</p>
            <p className="text-2xl font-semibold tabular-nums">{counts.total}</p>
          </CardContent>
        </Card>
        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-slate-500">New products</p>
            <p className="text-2xl font-semibold tabular-nums">{counts.creates}</p>
          </CardContent>
        </Card>
        <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-slate-500">Updates</p>
            <p className="text-2xl font-semibold tabular-nums">{counts.updates}</p>
          </CardContent>
        </Card>
      </div>

      {pendingQ.isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <CompactLoading message="Loading pending products…" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm">
          <ClipboardCheck className="size-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-900">No pending product approvals</p>
          <p className="text-xs text-slate-500">Tenant submissions will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((product) => {
            const proposed = productFromPayload(product);
            const action = product.pending_changes?.action || "update";
            return (
              <Card key={product.id} className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
                <CardContent className="space-y-4 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                        {action === "create" ? "New product" : "Update"} · {product.partner_name || "Tenant"}
                      </p>
                      <h2 className="text-base font-semibold text-slate-900">{proposed.name || product.name}</h2>
                      <p className="text-[12px] text-slate-500">
                        {product.code} · {proposed.currency || product.currency}
                      </p>
                    </div>
                    <Link
                      href={`/loan-products/${product.id}/edit`}
                      className="text-[12px] text-main-700 underline-offset-2 hover:underline"
                    >
                      Open product
                    </Link>
                  </div>

                  <div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      <div>Field</div>
                      <div>Live</div>
                      <div>Proposed</div>
                    </div>
                    <DiffRow
                      label="Min amount"
                      live={money(product.min_amount, product.currency)}
                      proposed={money(proposed.min_amount, proposed.currency || product.currency)}
                    />
                    <DiffRow
                      label="Max amount"
                      live={money(product.max_amount, product.currency)}
                      proposed={money(proposed.max_amount, proposed.currency || product.currency)}
                    />
                    <DiffRow
                      label="Tenor"
                      live={`${product.min_tenor_days}–${product.max_tenor_days} days`}
                      proposed={`${proposed.min_tenor_days ?? product.min_tenor_days}–${proposed.max_tenor_days ?? product.max_tenor_days} days`}
                    />
                    <DiffRow
                      label="Interest"
                      live={`${product.interest_rate}%`}
                      proposed={`${proposed.interest_rate ?? product.interest_rate}%`}
                    />
                    <DiffRow
                      label="Guarantor"
                      live={product.requires_guarantor ? "Required" : "No"}
                      proposed={(proposed.requires_guarantor ?? product.requires_guarantor) ? "Required" : "No"}
                    />
                  </div>

                  {rejectingId === product.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={reasonById[product.id] ?? ""}
                        onChange={(e) =>
                          setReasonById((prev) => ({ ...prev, [product.id]: e.target.value }))
                        }
                        placeholder="Why is this being rejected?"
                        className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[rgba(8,22,61,0.25)]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => setRejectingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="h-8 rounded-lg bg-rose-600 text-xs text-white hover:bg-rose-700"
                          disabled={review.isPending}
                          onClick={() => void reject(product)}
                        >
                          Confirm reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => setRejectingId(product.id)}
                      >
                        <X className="size-3.5" />
                        Reject
                      </Button>
                      <Button
                        type="button"
                        className="h-8 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
                        disabled={review.isPending}
                        onClick={() => void approve(product)}
                      >
                        <Check className="size-3.5" />
                        Approve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
