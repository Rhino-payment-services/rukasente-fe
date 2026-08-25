"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  Cloud,
  CloudOff,
  Lock,
  Pencil,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  onCancel?: () => void;
  onSaveDraft?: (payload: LoanProductCreatePayload) => Promise<void>;
};

const STEPS = [
  { id: "basics", label: "Basics", hint: "Identity & currency" },
  { id: "limits", label: "Limits", hint: "Amount & tenor" },
  { id: "interest", label: "Interest", hint: "Pricing method" },
  { id: "fees", label: "Fees & Review", hint: "Fees & controls" },
] as const;

const CURRENCIES = [
  { code: "UGX", label: "Ugandan Shilling" },
  { code: "KES", label: "Kenyan Shilling" },
  { code: "TZS", label: "Tanzanian Shilling" },
  { code: "RWF", label: "Rwandan Franc" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
] as const;

const COMPOUNDING_OPTIONS: {
  value: CompoundingFrequency;
  label: string;
  hint: string;
}[] = [
  { value: "DAILY", label: "Daily", hint: "Compounds every day" },
  { value: "WEEKLY", label: "Weekly", hint: "Compounds every week" },
  { value: "MONTHLY", label: "Monthly", hint: "Most common for consumer loans" },
  { value: "QUARTERLY", label: "Quarterly", hint: "Every 3 months" },
  { value: "ANNUALLY", label: "Annually", hint: "Once per year" },
];

const DRAFT_KEY = "rukasente:loan-product-draft";

const selectClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08163d]/20 focus-visible:border-[#08163d]/40 disabled:cursor-not-allowed disabled:opacity-50";

const inputClass =
  "h-10 rounded-xl border-slate-200 shadow-sm focus-visible:ring-[#08163d]/20 focus-visible:border-[#08163d]/40";

type FormState = {
  code: string;
  name: string;
  description: string;
  currency: string;
  min_amount: string;
  max_amount: string;
  min_tenor_days: string;
  max_tenor_days: string;
  interest_type: "flat" | "percentage";
  interest_rate: string;
  interest_calculation_method: InterestCalculationMethod;
  compounding_frequency: CompoundingFrequency;
  processing_fee_type: "fixed" | "percentage";
  processing_fee_value: string;
  processing_fee_mode: "deduct_from_disbursement" | "add_to_repayable";
  late_fee_type: "fixed" | "percentage";
  late_fee_value: string;
  grace_period_days: string;
  pre_approval_enabled: boolean;
  pre_approval_min_amount: string;
  requires_manual_review: boolean;
  is_active: boolean;
};

type FieldErrors = Partial<Record<keyof FormState | "step", string>>;

function slugifyCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function formatMoney(n: number, currency = "UGX") {
  if (!Number.isFinite(n)) return "—";
  return `${currency} ${n.toLocaleString()}`;
}

function formatRelative(ts: number | null) {
  if (!ts) return "Not saved yet";
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 8) return "Saved just now";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `Saved ${mins}m ago`;
  return `Saved ${Math.floor(mins / 60)}h ago`;
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="group relative inline-flex">
      <CircleHelp className="size-3.5 text-slate-400 transition-colors group-hover:text-slate-600" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-2 text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  );
}

function Field({
  label,
  hint,
  optional,
  error,
  tooltip,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  tooltip?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
        {label}
        {tooltip ? <Tooltip label={tooltip} /> : null}
        {optional ? (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            Optional
          </span>
        ) : (
          <span className="text-rose-500">*</span>
        )}
      </span>
      {children}
      {error ? (
        <span className="block text-[12px] text-rose-600">{error}</span>
      ) : hint ? (
        <span className="block text-[12px] leading-relaxed text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

function CurrencySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (code: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = CURRENCIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q);
  });

  const selected = CURRENCIES.find((c) => c.code === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          selectClass,
          "justify-between text-left",
          error && "border-rose-300 focus-visible:ring-rose-200"
        )}
      >
        <span>
          {selected ? (
            <>
              <span className="font-medium">{selected.code}</span>
              <span className="ml-2 text-slate-400">{selected.label}</span>
            </>
          ) : (
            <span className="text-slate-400">Select currency</span>
          )}
        </span>
        <Search className="size-3.5 text-slate-400" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search currencies…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none focus:border-[#08163d]/30 focus:ring-2 focus:ring-[#08163d]/10"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50",
                      value === c.code && "bg-main-50 text-main-700"
                    )}
                  >
                    <span>
                      <span className="font-medium">{c.code}</span>
                      <span className="ml-2 text-slate-500">{c.label}</span>
                    </span>
                    {value === c.code ? <Check className="size-3.5" /> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
      {error ? <span className="mt-1.5 block text-[12px] text-rose-600">{error}</span> : null}
    </div>
  );
}

function defaultForm(initial?: Partial<LoanProduct>): FormState {
  return {
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
    processing_fee_type: (initial?.processing_fee_type ?? "percentage") as
      | "fixed"
      | "percentage",
    processing_fee_value: String(initial?.processing_fee_value ?? 0),
    processing_fee_mode: (initial?.processing_fee_mode ??
      "deduct_from_disbursement") as
      | "deduct_from_disbursement"
      | "add_to_repayable",
    late_fee_type: (initial?.late_fee_type ?? "percentage") as "fixed" | "percentage",
    late_fee_value: String(initial?.late_fee_value ?? 0),
    grace_period_days: String(initial?.grace_period_days ?? 0),
    pre_approval_enabled: Boolean(initial?.pre_approval_enabled),
    pre_approval_min_amount: String(initial?.pre_approval_min_amount ?? 0),
    requires_manual_review: Boolean(initial?.requires_manual_review),
    is_active: initial?.is_active ?? true,
  };
}

export function LoanProductForm({
  initial,
  isSaving,
  onSubmit,
  onCancel,
  onSaveDraft,
}: Props) {
  const isEdit = Boolean(initial?.id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => defaultForm(initial));
  const [codeLocked, setCodeLocked] = useState(!isEdit);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savePulse, setSavePulse] = useState(0);
  const [draftSaving, setDraftSaving] = useState(false);

  const isCompound = form.interest_calculation_method === "COMPOUND";

  useEffect(() => {
    if (isEdit || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { form?: FormState; step?: number; savedAt?: number };
      if (parsed.form) {
        setForm(parsed.form);
        setCodeLocked(false);
      }
      if (typeof parsed.step === "number") setStep(Math.min(Math.max(parsed.step, 0), 3));
      if (parsed.savedAt) setLastSavedAt(parsed.savedAt);
    } catch {
      /* ignore corrupt draft */
    }
  }, [isEdit]);

  useEffect(() => {
    if (isEdit || typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      const savedAt = Date.now();
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt }));
      setLastSavedAt(savedAt);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [form, step, isEdit]);

  useEffect(() => {
    const id = window.setInterval(() => setSavePulse((n) => n + 1), 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const next = validateFieldsForStep(step);
    setErrors((prev) => {
      const merged: FieldErrors = {};
      (Object.keys(touched) as (keyof FormState)[]).forEach((key) => {
        if (touched[key] && next[key]) merged[key] = next[key];
      });
      // Keep only current-step relevant errors for touched fields
      return merged;
    });
    // validateFieldsForStep closes over form/step; intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step, touched, isCompound]);

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
      pre_approval_enabled: form.pre_approval_enabled,
      pre_approval_min_amount: Number(form.pre_approval_min_amount) || 0,
      requires_manual_review: form.requires_manual_review,
      is_active: form.is_active,
    };
  }, [form, isCompound]);

  function fieldError(key: keyof FormState): string | undefined {
    if (!touched[key] && !errors[key]) return undefined;
    return errors[key];
  }

  function validateFieldsForStep(index: number): FieldErrors {
    const next: FieldErrors = {};
    if (index === 0) {
      if (!form.name.trim()) next.name = "Display name is required.";
      if (!form.code.trim()) next.code = "Product code is required.";
      if (!form.currency.trim()) next.currency = "Select a currency.";
    }
    if (index === 1) {
      const minAmount = Number(form.min_amount);
      const maxAmount = Number(form.max_amount);
      const minTenor = Number(form.min_tenor_days);
      const maxTenor = Number(form.max_tenor_days);
      if (!Number.isFinite(minAmount) || minAmount <= 0) {
        next.min_amount = "Enter a valid minimum amount greater than zero.";
      }
      if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
        next.max_amount = "Enter a valid maximum amount greater than zero.";
      }
      if (
        Number.isFinite(minAmount) &&
        Number.isFinite(maxAmount) &&
        minAmount > maxAmount
      ) {
        next.min_amount = "Minimum cannot exceed maximum.";
        next.max_amount = "Maximum must be at least the minimum.";
      }
      if (!Number.isFinite(minTenor) || minTenor < 1) {
        next.min_tenor_days = "Enter a valid minimum tenor.";
      }
      if (!Number.isFinite(maxTenor) || maxTenor < 1) {
        next.max_tenor_days = "Enter a valid maximum tenor.";
      }
      if (
        Number.isFinite(minTenor) &&
        Number.isFinite(maxTenor) &&
        minTenor > maxTenor
      ) {
        next.min_tenor_days = "Minimum tenor cannot exceed maximum.";
        next.max_tenor_days = "Maximum tenor must be at least the minimum.";
      }
    }
    if (index === 2) {
      const rate = Number(form.interest_rate);
      if (!Number.isFinite(rate) || rate < 0) {
        next.interest_rate = "Enter a valid interest rate (0 or higher).";
      }
      if (isCompound && !form.compounding_frequency) {
        next.compounding_frequency = "Choose how often interest compounds.";
      }
    }
    if (index === 3) {
      const pf = Number(form.processing_fee_value);
      const lf = Number(form.late_fee_value);
      const pa = Number(form.pre_approval_min_amount);
      if (!Number.isFinite(pf) || pf < 0) {
        next.processing_fee_value = "Enter a valid processing fee.";
      }
      if (!Number.isFinite(lf) || lf < 0) {
        next.late_fee_value = "Enter a valid late fee.";
      }
      if (form.pre_approval_enabled && (!Number.isFinite(pa) || pa < 0)) {
        next.pre_approval_min_amount = "Enter a valid pre-approval amount.";
      }
    }
    return next;
  }

  function markStepTouched(index: number) {
    const keys: (keyof FormState)[] =
      index === 0
        ? ["name", "code", "currency"]
        : index === 1
          ? ["min_amount", "max_amount", "min_tenor_days", "max_tenor_days"]
          : index === 2
            ? ["interest_rate", "compounding_frequency"]
            : ["processing_fee_value", "late_fee_value", "pre_approval_min_amount"];
    setTouched((t) => {
      const next = { ...t };
      keys.forEach((k) => {
        next[k] = true;
      });
      return next;
    });
  }

  function goNext() {
    const nextErrors = validateFieldsForStep(step);
    markStepTouched(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goToStep(index: number) {
    if (index === step) return;
    if (index < step) {
      setStep(index);
      return;
    }
    for (let i = step; i < index; i++) {
      const nextErrors = validateFieldsForStep(i);
      if (Object.keys(nextErrors).length > 0) {
        markStepTouched(i);
        setErrors(nextErrors);
        setStep(i);
        return;
      }
    }
    setErrors({});
    setStep(index);
  }

  async function handleSaveDraft() {
    const basics = validateFieldsForStep(0);
    markStepTouched(0);
    if (Object.keys(basics).length > 0) {
      setErrors(basics);
      setStep(0);
      return;
    }
    // Draft = local progress only. Never create the product until the final step.
    setDraftSaving(true);
    try {
      if (!isEdit && typeof window !== "undefined") {
        const savedAt = Date.now();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt }));
        setLastSavedAt(savedAt);
      }
      if (onSaveDraft && parsed && isEdit) {
        // Edit mode may persist an inactive draft to the server.
        await onSaveDraft({ ...parsed, is_active: false });
      }
    } finally {
      setDraftSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Enter key / implicit submit must never create the product before the last step.
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    for (let i = 0; i < STEPS.length; i++) {
      const nextErrors = validateFieldsForStep(i);
      if (Object.keys(nextErrors).length > 0) {
        markStepTouched(i);
        setErrors(nextErrors);
        setStep(i);
        return;
      }
    }
    if (!parsed) return;
    await onSubmit(parsed);
    if (!isEdit && typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  function onFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    // Block Enter from submitting the form on steps 1–3; advance instead.
    if (step < STEPS.length - 1) {
      e.preventDefault();
      goNext();
    }
  }

  function updateName(name: string) {
    setForm((f) => ({
      ...f,
      name,
      code: codeLocked && !isEdit ? slugifyCode(name) : f.code,
    }));
    setTouched((t) => ({ ...t, name: true }));
    setErrors((err) => ({ ...err, name: undefined }));
  }

  const feePreview =
    parsed && parsed.processing_fee_type === "percentage"
      ? `${parsed.processing_fee_value}% of principal`
      : parsed
        ? formatMoney(parsed.processing_fee_value, parsed.currency)
        : "—";

  void savePulse;

  return (
    <form className="space-y-6" onSubmit={handleSubmit} onKeyDown={onFormKeyDown}>
      {/* Horizontal stepper */}
      <nav aria-label="Product setup progress" className="rounded-2xl border border-slate-200/80 bg-white px-4 py-5 shadow-sm sm:px-6">
        <ol className="flex items-center">
          {STEPS.map((item, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={item.id} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  className="group flex min-w-0 flex-col items-center gap-2 text-center"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      active &&
                        "bg-[#08163d] text-white shadow-md shadow-[#08163d]/25 ring-4 ring-[#08163d]/10",
                      done && !active && "bg-emerald-500 text-white",
                      !active &&
                        !done &&
                        "bg-white text-slate-400 ring-1 ring-slate-200 group-hover:ring-slate-300"
                    )}
                  >
                    {done && !active ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
                  </span>
                  <span className="hidden sm:block">
                    <span
                      className={cn(
                        "block text-[13px] font-semibold",
                        active ? "text-[#08163d]" : done ? "text-emerald-700" : "text-slate-500"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-slate-400">{item.hint}</span>
                  </span>
                </button>
                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-3",
                      index < step ? "bg-emerald-400" : "bg-slate-200"
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-center text-[12px] text-slate-400 sm:hidden">
          Step {step + 1} of {STEPS.length}: {STEPS[step].label}
        </p>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main form card */}
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8">
            {step === 0 ? (
              <div className="space-y-6">
                <header className="space-y-1 border-b border-slate-100 pb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Product basics
                  </h2>
                  <p className="text-sm text-slate-500">
                    Define how this product appears to staff and borrowers.
                  </p>
                </header>

                <Field
                  label="Display name"
                  hint="Shown on applications, catalogs, and borrower screens"
                  error={fieldError("name")}
                >
                  <Input
                    className={cn(inputClass, fieldError("name") && "border-rose-300")}
                    value={form.name}
                    onChange={(e) => updateName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="e.g. Micro loan 30 days"
                  />
                </Field>

                <Field
                  label="Product code"
                  hint={
                    isEdit
                      ? "Code cannot be changed after creation"
                      : codeLocked
                        ? "Auto-generated from the display name"
                        : "Editing manually — unlock to auto-generate again"
                  }
                  tooltip="Unique internal identifier used in APIs and reporting."
                  error={fieldError("code")}
                >
                  <div className="flex gap-2">
                    <Input
                      className={cn(
                        inputClass,
                        "font-mono text-[13px]",
                        fieldError("code") && "border-rose-300"
                      )}
                      value={form.code}
                      disabled={isEdit || codeLocked}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }));
                        setTouched((t) => ({ ...t, code: true }));
                      }}
                      placeholder="MICRO-LOAN-30-DAYS"
                    />
                    {!isEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0 rounded-xl border-slate-200 px-3"
                        onClick={() => {
                          if (codeLocked) {
                            setCodeLocked(false);
                          } else {
                            setCodeLocked(true);
                            setForm((f) => ({ ...f, code: slugifyCode(f.name) }));
                          }
                        }}
                        title={codeLocked ? "Edit code manually" : "Lock & auto-generate"}
                      >
                        {codeLocked ? (
                          <Pencil className="size-3.5" />
                        ) : (
                          <Lock className="size-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </Field>

                <Field
                  label="Currency"
                  tooltip="All loan amounts and fees for this product use this currency."
                >
                  <CurrencySelect
                    value={form.currency}
                    error={fieldError("currency")}
                    onChange={(code) => {
                      setForm((f) => ({ ...f, currency: code }));
                      setTouched((t) => ({ ...t, currency: true }));
                      setErrors((err) => ({ ...err, currency: undefined }));
                    }}
                  />
                </Field>

                <Field
                  label="Description"
                  optional
                  hint="Internal or borrower-facing context for who this product serves"
                >
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe eligibility, use cases, and any special terms…"
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#08163d]/40 focus:ring-2 focus:ring-[#08163d]/20"
                  />
                </Field>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-6">
                <header className="space-y-1 border-b border-slate-100 pb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Loan limits
                  </h2>
                  <p className="text-sm text-slate-500">
                    Borrowers can only request amounts and tenors inside these bounds.
                  </p>
                </header>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Minimum amount"
                    hint="Smallest principal allowed"
                    error={fieldError("min_amount")}
                  >
                    <Input
                      type="number"
                      min={0}
                      className={cn(inputClass, fieldError("min_amount") && "border-rose-300")}
                      value={form.min_amount}
                      onChange={(e) => setForm((f) => ({ ...f, min_amount: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, min_amount: true }))}
                    />
                  </Field>
                  <Field
                    label="Maximum amount"
                    hint="Largest principal allowed"
                    error={fieldError("max_amount")}
                  >
                    <Input
                      type="number"
                      min={0}
                      className={cn(inputClass, fieldError("max_amount") && "border-rose-300")}
                      value={form.max_amount}
                      onChange={(e) => setForm((f) => ({ ...f, max_amount: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, max_amount: true }))}
                    />
                  </Field>
                  <Field
                    label="Minimum tenor (days)"
                    hint="Shortest repayment period"
                    error={fieldError("min_tenor_days")}
                  >
                    <Input
                      type="number"
                      min={1}
                      className={cn(inputClass, fieldError("min_tenor_days") && "border-rose-300")}
                      value={form.min_tenor_days}
                      onChange={(e) => setForm((f) => ({ ...f, min_tenor_days: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, min_tenor_days: true }))}
                    />
                  </Field>
                  <Field
                    label="Maximum tenor (days)"
                    hint="Longest repayment period"
                    error={fieldError("max_tenor_days")}
                  >
                    <Input
                      type="number"
                      min={1}
                      className={cn(inputClass, fieldError("max_tenor_days") && "border-rose-300")}
                      value={form.max_tenor_days}
                      onChange={(e) => setForm((f) => ({ ...f, max_tenor_days: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, max_tenor_days: true }))}
                    />
                  </Field>
                </div>

                {parsed ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Allowed range:{" "}
                    <span className="font-medium text-slate-900">
                      {formatMoney(parsed.min_amount, parsed.currency)} –{" "}
                      {formatMoney(parsed.max_amount, parsed.currency)}
                    </span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="font-medium text-slate-900">
                      {parsed.min_tenor_days}–{parsed.max_tenor_days} days
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <header className="space-y-1 border-b border-slate-100 pb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">Interest</h2>
                  <p className="text-sm text-slate-500">
                    Choose how interest is calculated for every loan under this product. Once a loan
                    is created, its method stays fixed.
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
                          "rounded-2xl border px-4 py-4 text-left transition-all",
                          selected
                            ? "border-[#08163d] bg-main-50 shadow-sm ring-1 ring-[#08163d]/15"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">{opt.title}</span>
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full border",
                              selected
                                ? "border-[#08163d] bg-[#08163d] text-white"
                                : "border-slate-300 bg-white"
                            )}
                          >
                            {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
                          </span>
                        </span>
                        <span className="mt-1.5 block text-[12px] leading-relaxed text-slate-500">
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
                    tooltip="Higher frequency increases effective cost for the same annual rate."
                    error={fieldError("compounding_frequency")}
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
                          {opt.label} — {opt.hint}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}

                <div className="grid gap-5 md:grid-cols-3">
                  {!isCompound ? (
                    <Field
                      label="Interest type"
                      hint="Flat = rate% of principal for the loan. Percentage = annualized (× tenor days ÷ 365) — short tenors may round near zero."
                      tooltip="Flat charges rate% of principal once for the tenor. Percentage uses P × rate/100 × days/365. For short loans like 7 days at 0.5%, use flat if you want 0.5% of principal."
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
                    <Field
                      label="Interest type"
                      optional
                      hint="Kept for product records; compound uses the annual rate."
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
                        <option value="percentage">Percentage</option>
                        <option value="flat">Flat</option>
                      </select>
                    </Field>
                  )}
                  <Field
                    label="Interest rate (%)"
                    hint="Annual rate used in the calculation"
                    error={fieldError("interest_rate")}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      className={cn(inputClass, fieldError("interest_rate") && "border-rose-300")}
                      value={form.interest_rate}
                      onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, interest_rate: true }))}
                      placeholder="e.g. 12"
                    />
                  </Field>
                  <Field
                    label="Grace period (days)"
                    optional
                    hint="Days after due date before late fees apply"
                    tooltip="Late fees are calculated after this grace window ends."
                  >
                    <Input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={form.grace_period_days}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, grace_period_days: e.target.value }))
                      }
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <header className="space-y-1 border-b border-slate-100 pb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Fees & controls
                  </h2>
                  <p className="text-sm text-slate-500">
                    Configure processing and late fees, then review activation settings.
                  </p>
                </header>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Processing fee
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                        error={fieldError("processing_fee_value")}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className={cn(
                            inputClass,
                            fieldError("processing_fee_value") && "border-rose-300"
                          )}
                          value={form.processing_fee_value}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, processing_fee_value: e.target.value }))
                          }
                          onBlur={() =>
                            setTouched((t) => ({ ...t, processing_fee_value: true }))
                          }
                        />
                      </Field>
                    </div>
                    <Field
                      label="How is this fee applied?"
                      tooltip="Deduct reduces cash received at disbursement and settles the fee to RukaPay. Add to repayable keeps full disbursement and increases debt."
                      hint={
                        form.processing_fee_mode === "deduct_from_disbursement"
                          ? "Borrower receives principal minus fee. Fee is taken at disbursement (not added to repayable); interest is collected later on repayment."
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
                        <option value="add_to_repayable">Add to amount to repay</option>
                      </select>
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Late fee
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                        error={fieldError("late_fee_value")}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className={cn(
                            inputClass,
                            fieldError("late_fee_value") && "border-rose-300"
                          )}
                          value={form.late_fee_value}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, late_fee_value: e.target.value }))
                          }
                          onBlur={() => setTouched((t) => ({ ...t, late_fee_value: true }))}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
                      form.pre_approval_enabled
                        ? "border-indigo-200 bg-indigo-50/70"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4 rounded border-slate-300"
                      checked={form.pre_approval_enabled}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pre_approval_enabled: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">
                        Enable pre-approval floor
                      </span>
                      <span className="mt-0.5 block text-[12px] text-slate-500">
                        Gives qualified customers a minimum pre-approved amount before normal limits grow.
                      </span>
                    </span>
                  </label>
                  <Field
                    label="Pre-approved minimum amount"
                    optional={!form.pre_approval_enabled}
                    hint={`Amount in ${form.currency || "UGX"}`}
                    error={fieldError("pre_approval_min_amount")}
                  >
                    <Input
                      type="number"
                      min={0}
                      className={cn(inputClass, fieldError("pre_approval_min_amount") && "border-rose-300")}
                      value={form.pre_approval_min_amount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pre_approval_min_amount: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((t) => ({ ...t, pre_approval_min_amount: true }))
                      }
                      disabled={!form.pre_approval_enabled}
                    />
                  </Field>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
                      form.requires_manual_review
                        ? "border-amber-200 bg-amber-50/70"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4 rounded border-slate-300"
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
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
                      form.is_active
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4 rounded border-slate-300"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">
                        Active product
                      </span>
                      <span className="mt-0.5 block text-[12px] text-slate-500">
                        Available for new applications when checked.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            ) : null}
          </section>

          {/* Footer actions */}
          <div className="sticky bottom-0 z-10 -mx-1 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl text-slate-600"
                onClick={onCancel}
                disabled={isSaving || draftSaving}
              >
                Cancel
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  id="loan-product-save-draft"
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-slate-200"
                  onClick={async () => {
                    await handleSaveDraft();
                    if (!isEdit) {
                      toast.success("Draft saved on this device");
                    }
                  }}
                  disabled={isSaving || draftSaving}
                >
                  {draftSaving ? "Saving…" : "Save Draft"}
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="h-10 rounded-xl bg-[#08163d] px-5 text-white hover:bg-[#06102a]"
                  >
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSaving || draftSaving}
                    className="h-10 rounded-xl bg-[#08163d] px-5 text-white hover:bg-[#06102a]"
                  >
                    {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live summary panel */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Live summary
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  {form.name.trim() || "Untitled product"}
                </h3>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  form.is_active
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                )}
              >
                {form.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Code</dt>
                <dd className="truncate font-mono text-[12px] font-medium text-slate-800">
                  {form.code.trim() || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Currency</dt>
                <dd className="font-medium text-slate-800">{form.currency || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Loan type</dt>
                <dd className="text-right font-medium text-slate-800">
                  {isCompound ? "Compound" : "Simple"}
                  {!isCompound ? ` · ${form.interest_type}` : null}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Interest</dt>
                <dd className="font-medium text-slate-800">{form.interest_rate || "0"}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Amount range</dt>
                <dd className="text-right text-[12px] font-medium text-slate-800">
                  {parsed
                    ? `${formatMoney(parsed.min_amount, parsed.currency)} – ${formatMoney(parsed.max_amount, parsed.currency)}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Tenor</dt>
                <dd className="font-medium text-slate-800">
                  {parsed ? `${parsed.min_tenor_days}–${parsed.max_tenor_days}d` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Processing fee</dt>
                <dd className="text-right text-[12px] font-medium text-slate-800">{feePreview}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Fee mode</dt>
                <dd className="text-right text-[12px] font-medium text-slate-800">
                  {form.processing_fee_mode === "deduct_from_disbursement"
                    ? "Deduct from disbursement"
                    : "Add to repayable"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Review</dt>
                <dd className="font-medium text-slate-800">
                  {form.requires_manual_review ? "Manual" : "Auto-eligible"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Pre-approval</dt>
                <dd className="text-right font-medium text-slate-800">
                  {form.pre_approval_enabled
                    ? `${formatMoney(Number(form.pre_approval_min_amount) || 0, form.currency)} min`
                    : "Disabled"}
                </dd>
              </div>
            </dl>

            {!isEdit ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-500">
                {lastSavedAt ? (
                  <Cloud className="size-3.5 text-emerald-600" />
                ) : (
                  <CloudOff className="size-3.5 text-slate-400" />
                )}
                <span>
                  Draft · <span className="text-slate-700">{formatRelative(lastSavedAt)}</span>
                </span>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-500">
                Editing existing product · code is locked
              </div>
            )}

            {form.description.trim() ? (
              <p className="mt-4 line-clamp-4 border-t border-slate-100 pt-4 text-[12px] leading-relaxed text-slate-500">
                {form.description}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </form>
  );
}
