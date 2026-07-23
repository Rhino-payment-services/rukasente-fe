"use client";

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Percent,
  Settings2,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CompoundingFrequency,
  InterestCalculationMethod,
  LoanProduct,
  LoanProductCreatePayload,
} from "@/types/loan";

type Props = {
  initial?: Partial<LoanProduct>;
  isSaving?: boolean;
  onSubmit: (payload: LoanProductCreatePayload) => Promise<void>;
};

const STEPS = [
  {
    id: "basics",
    label: "Basics",
    hint: "Name and currency",
    icon: Tag,
  },
  {
    id: "limits",
    label: "Limits",
    hint: "Amount and tenor",
    icon: CircleDollarSign,
  },
  {
    id: "interest",
    label: "Interest",
    hint: "How interest is calculated",
    icon: Percent,
  },
  {
    id: "fees",
    label: "Fees & review",
    hint: "Fees and controls",
    icon: Settings2,
  },
] as const;

const COMPOUNDING_OPTIONS: { value: CompoundingFrequency; label: string; hint: string }[] = [
  { value: "DAILY", label: "Daily", hint: "Interest compounds every day" },
  { value: "WEEKLY", label: "Weekly", hint: "Interest compounds every week" },
  { value: "MONTHLY", label: "Monthly", hint: "Most common for consumer loans" },
  { value: "QUARTERLY", label: "Quarterly", hint: "Every 3 months" },
  { value: "ANNUALLY", label: "Annually", hint: "Once per year" },
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
        {label}
        {optional ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            Optional
          </span>
        ) : (
          <span className="text-rose-500">*</span>
        )}
      </span>
      {children}
      {hint ? <span className="block text-[11px] leading-relaxed text-slate-400">{hint}</span> : null}
    </label>
  );
}

function formatMoney(n: number, currency = "UGX") {
  if (!Number.isFinite(n)) return "—";
  return `${currency} ${n.toLocaleString()}`;
}

export function LoanProductForm({ initial, isSaving, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    currency: initial?.currency ?? "UGX",
    min_amount: String(initial?.min_amount ?? 50000),
    max_amount: String(initial?.max_amount ?? 5000000),
    min_tenor_days: String(initial?.min_tenor_days ?? 7),
    max_tenor_days: String(initial?.max_tenor_days ?? 90),
    interest_type: (initial?.interest_type ?? "percentage") as "flat" | "percentage",
    interest_rate: String(initial?.interest_rate ?? 0),
    interest_calculation_method: (initial?.interest_calculation_method ??
      "SIMPLE") as InterestCalculationMethod,
    compounding_frequency: (initial?.compounding_frequency ??
      "MONTHLY") as CompoundingFrequency,
    processing_fee_type: (initial?.processing_fee_type ?? "percentage") as "fixed" | "percentage",
    processing_fee_value: String(initial?.processing_fee_value ?? 0),
    processing_fee_mode: (initial?.processing_fee_mode ??
      "deduct_from_disbursement") as
      | "deduct_from_disbursement"
      | "add_to_repayable",
    late_fee_type: (initial?.late_fee_type ?? "percentage") as "fixed" | "percentage",
    late_fee_value: String(initial?.late_fee_value ?? 0),
    grace_period_days: String(initial?.grace_period_days ?? 0),
    requires_manual_review: Boolean(initial?.requires_manual_review),
    is_active: initial?.is_active ?? true,
  });
  const [error, setError] = useState("");

  const isCompound = form.interest_calculation_method === "COMPOUND";
  const isEdit = Boolean(initial?.id);

  const parsed = useMemo<LoanProductCreatePayload | null>(() => {
    const minAmount = Number(form.min_amount);
    const maxAmount = Number(form.max_amount);
    const minTenor = Number(form.min_tenor_days);
    const maxTenor = Number(form.max_tenor_days);
    if (!form.code.trim() || !form.name.trim() || !form.currency.trim()) return null;
    if (!Number.isFinite(minAmount) || !Number.isFinite(maxAmount)) return null;
    if (!Number.isFinite(minTenor) || !Number.isFinite(maxTenor)) return null;
    return {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      currency: form.currency.trim().toUpperCase(),
      min_amount: minAmount,
      max_amount: maxAmount,
      min_tenor_days: minTenor,
      max_tenor_days: maxTenor,
      interest_type: form.interest_type,
      interest_rate: Number(form.interest_rate) || 0,
      interest_calculation_method: form.interest_calculation_method,
      compounding_frequency: isCompound ? form.compounding_frequency : undefined,
      processing_fee_type: form.processing_fee_type,
      processing_fee_value: Number(form.processing_fee_value) || 0,
      processing_fee_mode: form.processing_fee_mode,
      late_fee_type: form.late_fee_type,
      late_fee_value: Number(form.late_fee_value) || 0,
      grace_period_days: Number(form.grace_period_days) || 0,
      requires_manual_review: form.requires_manual_review,
      is_active: form.is_active,
    };
  }, [form, isCompound]);

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!form.code.trim() || !form.name.trim() || !form.currency.trim()) {
        return "Enter a product code, name, and currency to continue.";
      }
    }
    if (index === 1) {
      const minAmount = Number(form.min_amount);
      const maxAmount = Number(form.max_amount);
      const minTenor = Number(form.min_tenor_days);
      const maxTenor = Number(form.max_tenor_days);
      if (![minAmount, maxAmount, minTenor, maxTenor].every(Number.isFinite)) {
        return "Enter valid amount and tenor limits.";
      }
      if (minAmount <= 0 || maxAmount <= 0) {
        return "Amounts must be greater than zero.";
      }
      if (minAmount > maxAmount) {
        return "Minimum amount cannot be greater than maximum amount.";
      }
      if (minTenor > maxTenor) {
        return "Minimum tenor cannot be greater than maximum tenor.";
      }
    }
    if (index === 2) {
      const rate = Number(form.interest_rate);
      if (!Number.isFinite(rate) || rate < 0) {
        return "Enter a valid interest rate (0 or higher).";
      }
      if (isCompound && !form.compounding_frequency) {
        return "Choose how often interest compounds.";
      }
    }
    return null;
  }

  function goNext() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Guard against premature submission (e.g. pressing Enter in an input on an
    // earlier step). Only the final "Fees & review" step may submit; otherwise
    // treat the action as "continue" so we never create the product early.
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    setError("");
    for (let i = 0; i < STEPS.length; i++) {
      const msg = validateStep(i);
      if (msg) {
        setStep(i);
        setError(msg);
        return;
      }
    }
    if (!parsed) {
      setError("Please fill all required fields with valid values.");
      return;
    }
    await onSubmit(parsed);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const done = index < step;
          const active = index === step;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (index < step) {
                    setError("");
                    setStep(index);
                    return;
                  }
                  for (let i = step; i < index; i++) {
                    const msg = validateStep(i);
                    if (msg) {
                      setStep(i);
                      setError(msg);
                      return;
                    }
                  }
                  setError("");
                  setStep(index);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active && "border-main-200 bg-main-50",
                  done && !active && "border-emerald-200 bg-emerald-50/50",
                  !active && !done && "border-slate-200 bg-slate-50/80 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    active && "bg-main-600 text-white",
                    done && !active && "bg-emerald-600 text-white",
                    !active && !done && "bg-white text-slate-400 ring-1 ring-slate-200"
                  )}
                >
                  {done && !active ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900">
                    {index + 1}. {item.label}
                  </span>
                  <span className="block text-[11px] text-slate-500">{item.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-slate-200/80 bg-white">
        {step === 0 ? (
          <section className="space-y-4 p-5">
            <header>
              <h2 className="text-sm font-semibold text-slate-900">Product basics</h2>
              <p className="mt-1 text-sm text-slate-500">
                How this product appears to staff and borrowers.
              </p>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Product code" hint="Short unique code, e.g. MICRO-30">
                <Input
                  value={form.code}
                  disabled={isEdit}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. MICRO-30"
                />
              </Field>
              <Field label="Display name" hint="Shown on applications and catalogs">
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Micro loan 30 days"
                />
              </Field>
              <Field label="Currency" hint="Usually UGX">
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  placeholder="UGX"
                />
              </Field>
            </div>
            <Field label="Description" optional hint="Optional note for internal or borrower context">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Who this product is for"
              />
            </Field>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-4 p-5">
            <header>
              <h2 className="text-sm font-semibold text-slate-900">Loan limits</h2>
              <p className="mt-1 text-sm text-slate-500">
                Borrowers can only request amounts and tenors inside these bounds.
              </p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Minimum amount" hint="Smallest principal allowed">
                <Input
                  type="number"
                  min={0}
                  value={form.min_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_amount: e.target.value }))}
                />
              </Field>
              <Field label="Maximum amount" hint="Largest principal allowed">
                <Input
                  type="number"
                  min={0}
                  value={form.max_amount}
                  onChange={(e) => setForm((f) => ({ ...f, max_amount: e.target.value }))}
                />
              </Field>
              <Field label="Minimum tenor (days)" hint="Shortest repayment period">
                <Input
                  type="number"
                  min={1}
                  value={form.min_tenor_days}
                  onChange={(e) => setForm((f) => ({ ...f, min_tenor_days: e.target.value }))}
                />
              </Field>
              <Field label="Maximum tenor (days)" hint="Longest repayment period">
                <Input
                  type="number"
                  min={1}
                  value={form.max_tenor_days}
                  onChange={(e) => setForm((f) => ({ ...f, max_tenor_days: e.target.value }))}
                />
              </Field>
            </div>
            {parsed ? (
              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                Range: {formatMoney(parsed.min_amount, parsed.currency)} –{" "}
                {formatMoney(parsed.max_amount, parsed.currency)} · {parsed.min_tenor_days}–
                {parsed.max_tenor_days} days
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-4 p-5">
            <header>
              <h2 className="text-sm font-semibold text-slate-900">Interest</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how interest is calculated for every loan under this product. Once a loan is
                created, its method stays fixed.
              </p>
            </header>

            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "SIMPLE" as const,
                    title: "Simple interest",
                    body: "Interest on principal only. Matches existing products.",
                  },
                  {
                    value: "COMPOUND" as const,
                    title: "Compound interest",
                    body: "Interest builds on outstanding balance at the chosen frequency.",
                  },
                ] as const
              ).map((opt) => {
                const selected = form.interest_calculation_method === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        interest_calculation_method: opt.value,
                      }))
                    }
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-main-600 bg-main-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{opt.title}</span>
                      <span
                        className={cn(
                          "size-4 rounded-full border",
                          selected ? "border-main-600 bg-main-600" : "border-slate-300 bg-white"
                        )}
                      />
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-slate-500">
                      {opt.body}
                    </span>
                  </button>
                );
              })}
            </div>

            {isCompound ? (
              <Field
                label="Compounding frequency"
                hint="How often interest is added to the balance during the loan tenor"
              >
                <select
                  className={selectClass}
                  value={form.compounding_frequency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      compounding_frequency: e.target.value as CompoundingFrequency,
                    }))
                  }
                >
                  {COMPOUNDING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              {!isCompound ? (
                <Field
                  label="Interest type"
                  hint="Flat = one-time on principal. Percentage = pro-rata over tenor days."
                >
                  <select
                    className={selectClass}
                    value={form.interest_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        interest_type: e.target.value as "flat" | "percentage",
                      }))
                    }
                  >
                    <option value="flat">Flat</option>
                    <option value="percentage">Percentage (pro-rata)</option>
                  </select>
                </Field>
              ) : (
                <Field label="Interest type" optional hint="Kept for product records; compound uses the annual rate below.">
                  <select
                    className={selectClass}
                    value={form.interest_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        interest_type: e.target.value as "flat" | "percentage",
                      }))
                    }
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                  </select>
                </Field>
              )}
              <Field label="Interest rate (%)" hint="Annual rate used in the calculation">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.interest_rate}
                  onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))}
                  placeholder="e.g. 12"
                />
              </Field>
              <Field
                label="Grace period (days)"
                optional
                hint="Days after due date before late fees apply"
              >
                <Input
                  type="number"
                  min={0}
                  value={form.grace_period_days}
                  onChange={(e) => setForm((f) => ({ ...f, grace_period_days: e.target.value }))}
                />
              </Field>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-5 p-5">
            <header>
              <h2 className="text-sm font-semibold text-slate-900">Fees & controls</h2>
              <p className="mt-1 text-sm text-slate-500">
                Processing and late fees, plus whether applications need manual review.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Processing fee
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Type">
                    <select
                      className={selectClass}
                      value={form.processing_fee_type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          processing_fee_type: e.target.value as "fixed" | "percentage",
                        }))
                      }
                    >
                      <option value="fixed">Fixed amount</option>
                      <option value="percentage">Percentage of principal</option>
                    </select>
                  </Field>
                  <Field
                    label="Value"
                    hint={
                      form.processing_fee_type === "percentage"
                        ? "Percent of principal"
                        : `Amount in ${form.currency || "UGX"}`
                    }
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.processing_fee_value}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, processing_fee_value: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Field
                  label="How is this fee applied?"
                  hint={
                    form.processing_fee_mode === "deduct_from_disbursement"
                      ? "Borrower receives principal minus fee. Fee is not added to repayable."
                      : "Borrower receives full principal. Fee is added to what they repay."
                  }
                >
                  <select
                    className={selectClass}
                    value={form.processing_fee_mode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        processing_fee_mode: e.target.value as
                          | "deduct_from_disbursement"
                          | "add_to_repayable",
                      }))
                    }
                  >
                    <option value="deduct_from_disbursement">
                      Deduct from amount received
                    </option>
                    <option value="add_to_repayable">
                      Add to amount to repay
                    </option>
                  </select>
                </Field>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Late fee
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Type">
                    <select
                      className={selectClass}
                      value={form.late_fee_type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          late_fee_type: e.target.value as "fixed" | "percentage",
                        }))
                      }
                    >
                      <option value="fixed">Fixed amount</option>
                      <option value="percentage">Percentage of principal</option>
                    </select>
                  </Field>
                  <Field
                    label="Value"
                    hint={
                      form.late_fee_type === "percentage"
                        ? "Percent of principal"
                        : `Amount in ${form.currency || "UGX"}`
                    }
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.late_fee_value}
                      onChange={(e) => setForm((f) => ({ ...f, late_fee_value: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3",
                  form.requires_manual_review
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-slate-200 bg-white"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.requires_manual_review}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requires_manual_review: e.target.checked }))
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Requires manual review
                  </span>
                  <span className="mt-0.5 block text-[12px] text-slate-500">
                    Staff must approve applications before disbursement.
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3",
                  form.is_active
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-white"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">Active product</span>
                  <span className="mt-0.5 block text-[12px] text-slate-500">
                    Available for new applications when checked.
                  </span>
                </span>
              </label>
            </div>

            {parsed ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Summary
                </p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] text-slate-400">Product</dt>
                    <dd className="font-medium text-slate-900">
                      {parsed.name}{" "}
                      <span className="font-normal text-slate-500">({parsed.code})</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Limits</dt>
                    <dd className="text-slate-800">
                      {formatMoney(parsed.min_amount, parsed.currency)} –{" "}
                      {formatMoney(parsed.max_amount, parsed.currency)} · {parsed.min_tenor_days}–
                      {parsed.max_tenor_days}d
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Interest</dt>
                    <dd className="text-slate-800">
                      {parsed.interest_calculation_method === "COMPOUND"
                        ? `Compound · ${parsed.compounding_frequency?.toLowerCase()}`
                        : `Simple · ${parsed.interest_type}`}{" "}
                      @ {parsed.interest_rate}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Controls</dt>
                    <dd className="text-slate-800">
                      {parsed.is_active ? "Active" : "Inactive"}
                      {parsed.requires_manual_review ? " · Manual review" : " · Auto-eligible"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 0 || isSaving}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] text-slate-400 sm:inline">
            Step {step + 1} of {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
