"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  FilePlus2,
  Loader2,
  Search,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useBorrowerSearch,
  type BorrowerRow,
} from "@/hooks/use-borrowers";
import {
  useCreateBorrowerLoanApplication,
  useLoanProducts,
} from "@/hooks/use-loan";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-main-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

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

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function NewLoanApplicationPage() {
  const router = useRouter();
  const productsQ = useLoanProducts({ page: 1, page_size: 100, active: "true" });
  const createApp = useCreateBorrowerLoanApplication();

  const [borrowerQuery, setBorrowerQuery] = useState("");
  const debouncedQuery = useDebouncedValue(borrowerQuery.trim(), 350);
  const searchQ = useBorrowerSearch(debouncedQuery, 1, 12);

  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerRow | null>(null);
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [tenorDays, setTenorDays] = useState("");
  const [purpose, setPurpose] = useState("");

  const products = useMemo(
    () => (productsQ.data?.items ?? []).filter((p) => p.is_active),
    [productsQ.data?.items]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const results = searchQ.data?.items ?? [];
  const showResults =
    !selectedBorrower && debouncedQuery.length >= 2 && borrowerQuery.trim().length >= 2;
  const loanSectionEnabled = Boolean(selectedBorrower?.rukapay_user_id);

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p && !tenorDays) {
      setTenorDays(String(p.max_tenor_days || p.min_tenor_days || 30));
    }
  }

  function clearBorrower() {
    setSelectedBorrower(null);
    setBorrowerQuery("");
    setProductId("");
    setAmount("");
    setTenorDays("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const rukapayUserId = selectedBorrower?.rukapay_user_id?.trim() ?? "";
    if (!rukapayUserId) {
      toast.error("Search and select a Ruka Sente borrower first");
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
              Search an existing borrower, then complete the loan details.
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

                {selectedBorrower ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="size-4" strokeWidth={2.5} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Borrower selected
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Loan product section is unlocked.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs text-slate-600"
                        onClick={clearBorrower}
                      >
                        <X className="size-3.5" />
                        Change
                      </Button>
                    </div>
                    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                      <MiniRow label="Name" value={selectedBorrower.full_name} />
                      <MiniRow label="Phone" value={selectedBorrower.phone || "—"} />
                      <MiniRow
                        label="RukaPay ID"
                        value={selectedBorrower.rukapay_user_id || "—"}
                        mono
                      />
                      <MiniRow
                        label="Email"
                        value={selectedBorrower.email || "—"}
                      />
                      <MiniRow
                        label="National ID"
                        value={selectedBorrower.national_id || "—"}
                      />
                      <MiniRow
                        label="KYC"
                        value={selectedBorrower.kyc_status || "—"}
                      />
                    </dl>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Field
                      label="Search borrower"
                      hint="Search by name, phone, email, national ID, or RukaPay user ID"
                    >
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={borrowerQuery}
                          onChange={(e) => setBorrowerQuery(e.target.value)}
                          placeholder="Name, phone, email, national ID, or user ID…"
                          className="h-11 rounded-xl border-slate-200 pl-10 pr-10"
                          autoComplete="off"
                        />
                        {searchQ.isFetching ? (
                          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
                        ) : null}
                      </div>
                    </Field>

                    {borrowerQuery.trim().length > 0 && borrowerQuery.trim().length < 2 ? (
                      <p className="text-xs text-slate-400">
                        Type at least 2 characters to search.
                      </p>
                    ) : null}

                    {showResults ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {searchQ.isLoading ? (
                          <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
                            <Loader2 className="size-4 animate-spin" />
                            Searching borrowers…
                          </div>
                        ) : results.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-slate-500">
                            No borrowers match “{debouncedQuery}”. Enroll them first via Manual
                            borrower.
                          </div>
                        ) : (
                          <ul className="max-h-80 divide-y divide-slate-100 overflow-auto">
                            {results.map((b) => (
                              <li key={b.id || b.rukapay_user_id}>
                                <button
                                  type="button"
                                  disabled={!b.rukapay_user_id}
                                  onClick={() => {
                                    setSelectedBorrower(b);
                                    setBorrowerQuery(b.full_name || "");
                                  }}
                                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                    <UserRound className="size-4" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-slate-900">
                                      {b.full_name}
                                    </span>
                                    <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
                                      {b.phone ? <span>{b.phone}</span> : null}
                                      {b.rukapay_user_id ? (
                                        <span className="font-mono text-[11px]">
                                          {b.rukapay_user_id}
                                        </span>
                                      ) : null}
                                      {b.email ? <span className="truncate">{b.email}</span> : null}
                                    </span>
                                    <span className="mt-1 flex flex-wrap gap-2 text-[11px]">
                                      {b.kyc_status ? (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                          KYC {b.kyc_status}
                                        </span>
                                      ) : null}
                                      {b.status ? (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                          {b.status}
                                        </span>
                                      ) : null}
                                      {b.national_id ? (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
                                          NID {b.national_id}
                                        </span>
                                      ) : null}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {searchQ.data && searchQ.data.total > results.length ? (
                          <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
                            Showing {results.length} of {searchQ.data.total} matches. Refine your
                            search for better results.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>

              <section
                className={cn(
                  "space-y-3 rounded-2xl border p-4 transition-opacity",
                  loanSectionEnabled
                    ? "border-slate-200 bg-white"
                    : "border-dashed border-slate-200 bg-slate-50/70 opacity-70"
                )}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <WalletCards className="size-3.5" />
                  Application details
                </div>
                {!loanSectionEnabled ? (
                  <p className="text-xs text-slate-500">
                    Select a borrower above to enable loan product, amount, and tenor.
                  </p>
                ) : null}
                <fieldset disabled={!loanSectionEnabled} className="space-y-3">
                  <Field label="Loan product">
                    <select
                      className={selectClass}
                      value={productId}
                      onChange={(e) => onSelectProduct(e.target.value)}
                      required={loanSectionEnabled}
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
                        required={loanSectionEnabled}
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
                        required={loanSectionEnabled}
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
                </fieldset>
              </section>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="submit"
                  disabled={createApp.isPending || !loanSectionEnabled}
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
                  <Row label="National ID" value={selectedBorrower.national_id || "—"} />
                  <Row label="KYC" value={selectedBorrower.kyc_status || "—"} />
                  <Row label="Status" value={selectedBorrower.status || "—"} />
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
                  Search and select a borrower to preview their profile.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
            <CardContent className="space-y-2 p-5 text-sm text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">Before you submit</h3>
              <ul className="list-disc space-y-1 pl-4">
                <li>Search scales to large borrower databases — results are ranked server-side.</li>
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

function MiniRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-emerald-100/80 bg-white/70 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-medium text-slate-900",
          mono && "break-all font-mono text-xs"
        )}
      >
        {value}
      </dd>
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
