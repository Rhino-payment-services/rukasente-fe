"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, FilePlus2, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBorrowersList } from "@/hooks/use-borrowers";
import {
  useCreateBorrowerLoanApplication,
  useLoanProducts,
} from "@/hooks/use-loan";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-main-500/30";

function formatMoney(n: number) {
  return `UGX ${n.toLocaleString()}`;
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

export default function NewLoanApplicationPage() {
  const router = useRouter();
  const borrowersQ = useBorrowersList(1, 100);
  const productsQ = useLoanProducts({ page: 1, page_size: 100, active: "true" });
  const createApp = useCreateBorrowerLoanApplication();

  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [rukapayUserId, setRukapayUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [tenorDays, setTenorDays] = useState("");
  const [purpose, setPurpose] = useState("");

  const borrowers = useMemo(() => {
    const rows = borrowersQ.data?.items ?? [];
    const q = borrowerSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (b) =>
        b.full_name?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.rukapay_user_id?.toLowerCase().includes(q)
    );
  }, [borrowersQ.data?.items, borrowerSearch]);

  const products = useMemo(
    () => (productsQ.data?.items ?? []).filter((p) => p.is_active),
    [productsQ.data?.items]
  );

  const selectedBorrower = useMemo(
    () => borrowersQ.data?.items?.find((b) => b.rukapay_user_id === rukapayUserId),
    [borrowersQ.data?.items, rukapayUserId]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p && !tenorDays) {
      setTenorDays(String(p.max_tenor_days || p.min_tenor_days || 30));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rukapayUserId) {
      toast.error("Select a Ruka Sente borrower with an existing profile");
      return;
    }
    if (!productId || !selectedProduct) {
      toast.error("Select a loan product");
      return;
    }
    const amountNum = Number(amount);
    const tenorNum = Number(tenorDays);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amountNum < selectedProduct.min_amount || amountNum > selectedProduct.max_amount) {
      toast.error(
        `Amount must be between ${formatMoney(selectedProduct.min_amount)} and ${formatMoney(selectedProduct.max_amount)}`
      );
      return;
    }
    if (!Number.isFinite(tenorNum) || tenorNum <= 0) {
      toast.error("Enter a valid tenor in days");
      return;
    }
    if (
      tenorNum < selectedProduct.min_tenor_days ||
      tenorNum > selectedProduct.max_tenor_days
    ) {
      toast.error(
        `Tenor must be between ${selectedProduct.min_tenor_days} and ${selectedProduct.max_tenor_days} days`
      );
      return;
    }

    try {
      const app = await createApp.mutateAsync({
        rukapay_user_id: rukapayUserId,
        loan_product_id: productId,
        requested_amount: amountNum,
        requested_tenor_days: tenorNum,
        purpose: purpose.trim(),
        submission_channel: "internal_admin",
      });
      toast.success(`Application ${app.application_number} created`);
      router.push(`/loan-applications/${app.id}`);
    } catch (err) {
      let message = "Failed to create loan application";
      if (axios.isAxiosError(err)) {
        message =
          (err.response?.data as { error?: { message?: string } } | undefined)?.error
            ?.message || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      // Friendly hints for common eligibility/score blockers
      if (/score/i.test(message)) {
        message += " — run scoring for this borrower first (Manual borrower or Borrowers).";
      } else if (/eligible/i.test(message)) {
        message += " — check product rules and score loan limits.";
      }
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <FilePlus2 className="size-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              New loan application
            </h1>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              Create an application for a borrower who already has a Ruka Sente profile.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
          <Link href="/loan-applications">
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
          <CardContent className="p-5">
            <form onSubmit={onSubmit} className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <UserRound className="size-3.5" />
                  Existing borrower
                </div>
                <Field label="Search borrowers" hint="Name, phone, email, or RukaPay user ID">
                  <Input
                    value={borrowerSearch}
                    onChange={(e) => setBorrowerSearch(e.target.value)}
                    placeholder="Search…"
                    className="h-10 rounded-xl border-slate-200"
                  />
                </Field>
                <Field label="Borrower profile" hint="Only users already enrolled in Ruka Sente">
                  <select
                    className={selectClass}
                    value={rukapayUserId}
                    onChange={(e) => setRukapayUserId(e.target.value)}
                    required
                  >
                    <option value="">Select borrower…</option>
                    {borrowers.map((b) => (
                      <option
                        key={b.rukapay_user_id || b.id}
                        value={b.rukapay_user_id || ""}
                        disabled={!b.rukapay_user_id}
                      >
                        {b.full_name} · {b.phone}
                        {b.kyc_status ? ` · KYC ${b.kyc_status}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                {borrowersQ.isLoading ? (
                  <p className="text-xs text-slate-500">Loading borrowers…</p>
                ) : borrowers.length === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    No matching borrowers. Enroll them first via Manual borrower.
                  </p>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <WalletCards className="size-3.5" />
                  Application details
                </div>
                <Field label="Loan product">
                  <select
                    className={selectClass}
                    value={productId}
                    onChange={(e) => onSelectProduct(e.target.value)}
                    required
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatMoney(p.min_amount)} – {formatMoney(p.max_amount)})
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    label="Requested amount (UGX)"
                    hint={
                      selectedProduct
                        ? `${formatMoney(selectedProduct.min_amount)} – ${formatMoney(selectedProduct.max_amount)}`
                        : undefined
                    }
                  >
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-10 rounded-xl border-slate-200"
                      required
                      min={1}
                    />
                  </Field>
                  <Field
                    label="Tenor (days)"
                    hint={
                      selectedProduct
                        ? `${selectedProduct.min_tenor_days} – ${selectedProduct.max_tenor_days} days`
                        : undefined
                    }
                  >
                    <Input
                      type="number"
                      value={tenorDays}
                      onChange={(e) => setTenorDays(e.target.value)}
                      className="h-10 rounded-xl border-slate-200"
                      required
                      min={1}
                    />
                  </Field>
                </div>
                <Field label="Purpose" hint="Optional">
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Working capital, school fees…"
                    className="h-10 rounded-xl border-slate-200"
                  />
                </Field>
              </section>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="submit"
                  disabled={createApp.isPending}
                  className="h-10 rounded-xl bg-main-600 px-5 text-white hover:bg-main-700"
                >
                  {createApp.isPending ? "Creating…" : "Create application"}
                </Button>
                <p className="text-xs text-slate-500">
                  Borrower must already be scored and eligible for the product.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Selected borrower</h3>
              {selectedBorrower ? (
                <dl className="space-y-2 text-sm">
                  <Row label="Name" value={selectedBorrower.full_name} />
                  <Row label="Phone" value={selectedBorrower.phone || "—"} />
                  <Row label="Email" value={selectedBorrower.email || "—"} />
                  <Row label="KYC" value={selectedBorrower.kyc_status || "—"} />
                  <Row
                    label="RukaPay user"
                    value={selectedBorrower.rukapay_user_id || "—"}
                    mono
                  />
                  <Row
                    label="Scoring wallet"
                    value={selectedBorrower.scoring_wallet_id || "—"}
                    mono
                  />
                </dl>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
                  Choose a borrower to preview their profile.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
            <CardContent className="space-y-2 p-5 text-sm text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">Before you submit</h3>
              <ul className="list-disc space-y-1 pl-4">
                <li>Borrower must exist in Ruka Sente (Manual borrower / enroll).</li>
                <li>Run score at least once so eligibility exists.</li>
                <li>Amount must pass product rules and score loan limits.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={cn(
          "text-right text-sm font-medium text-slate-900",
          mono && "break-all font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
