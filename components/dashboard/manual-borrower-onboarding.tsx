"use client";

import { FormEvent, useState, type ReactNode } from "react";
import {
  ArrowRightCircle,
  CheckCircle2,
  Gauge,
  LineChart,
  Loader2,
  Shield,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ResultData = {
  latest_score?: {
    total_score?: number;
    risk_band?: string;
    recommended_limit?: number;
    max_tenor_days?: number;
    suggested_decision?: string;
  } | null;
  subscription?: { status?: string } | null;
};

const STEPS = [
  { id: "enroll", label: "Enroll", hint: "Create borrower profile" },
  { id: "consent", label: "Consent", hint: "Record required consents" },
  { id: "score", label: "Score", hint: "Run Ruka Score" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

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
      <span className="flex items-center gap-2 text-[13px] font-medium text-[#0f172a]">
        {label}
        {optional ? (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
            Optional
          </span>
        ) : (
          <span className="text-rose-500">*</span>
        )}
      </span>
      {children}
      {hint ? (
        <span className="block text-[11px] leading-snug text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

function formatMoney(n: number | undefined | null) {
  if (n == null) return "—";
  return `UGX ${n.toLocaleString()}`;
}

const inputClass =
  "h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none focus-visible:border-indigo-300 focus-visible:ring-indigo-500/15";

export function ManualBorrowerOnboarding() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setActiveStep("enroll");
    try {
      // Visual step progress while the single orchestrated API runs
      const stepTimers = [
        window.setTimeout(() => setActiveStep("consent"), 600),
        window.setTimeout(() => setActiveStep("score"), 1400),
      ];

      const payloadBody = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };
      const res = await fetch("/api/internal/manual-onboard-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });
      stepTimers.forEach((t) => window.clearTimeout(t));

      const payload = (await res.json()) as {
        success: boolean;
        data?: ResultData;
        error?: { message?: string };
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || "Manual onboarding failed");
      }
      setResult(payload.data ?? null);
      setActiveStep(null);
      toast.success("Borrower linked and scored successfully");
    } catch (err) {
      setActiveStep(null);
      toast.error((err as Error).message || "Failed to run manual flow");
    } finally {
      setSubmitting(false);
    }
  }

  const score = result?.latest_score;
  const done = Boolean(result) && !submitting;

  function stepState(id: StepId, index: number) {
    if (done) return "done" as const;
    if (!submitting && !activeStep) {
      return index === 0 ? ("current" as const) : ("todo" as const);
    }
    const order = STEPS.findIndex((s) => s.id === id);
    const activeIdx = STEPS.findIndex((s) => s.id === activeStep);
    if (order < activeIdx) return "done" as const;
    if (order === activeIdx) return "current" as const;
    return "todo" as const;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
      {/* Main form card */}
      <section className="rounded-[16px] border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-8">
        <header className="mb-6">
          <h1 className="text-[26px] font-semibold tracking-tight text-[#08163d] sm:text-[28px]">
            Link and score borrower
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter the customer&apos;s phone number — we look them up in RukaPay,
            then run enroll → consent → scoring.
          </p>
        </header>

        {/* Stepper */}
        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const state = stepState(step.id, index);
            return (
              <li
                key={step.id}
                className={cn(
                  "rounded-2xl border px-4 py-3.5 transition-colors",
                  state === "current" && "border-indigo-200 bg-indigo-50/70",
                  state === "done" && "border-emerald-200 bg-emerald-50/50",
                  state === "todo" && "border-slate-200 bg-slate-50/60"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      state === "current" && "bg-[#4f46e5] text-white",
                      state === "done" && "bg-emerald-500 text-white",
                      state === "todo" && "bg-slate-200 text-slate-500"
                    )}
                  >
                    {state === "done" ? (
                      <CheckCircle2 className="size-4" />
                    ) : state === "current" && submitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        state === "current" ? "text-[#4f46e5]" : "text-[#0f172a]"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{step.hint}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <form onSubmit={onSubmit} className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#08163d]">
              <UserRound className="size-3.5 text-indigo-500" />
              Borrower
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Phone"
                hint="Uganda MSISDN with country code — used to find the RukaPay account"
              >
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="256742600208"
                  className={inputClass}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Full name">
                <Input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  placeholder="Mwungeri Sevelin"
                  className={inputClass}
                  required
                />
              </Field>
              <div className="md:col-span-2">
                <Field
                  label="Email"
                  optional
                  hint="Leave blank if the customer has no email on file"
                >
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 gap-2 rounded-xl bg-[#4f46e5] px-5 text-sm font-semibold text-white hover:bg-[#4338ca]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Running workflow…
                </>
              ) : (
                <>
                  <ArrowRightCircle className="size-4" />
                  Link and score borrower
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400">
              Required: phone and full name. Wallet and RukaPay IDs are resolved
              automatically.
            </p>
          </div>
        </form>
      </section>

      {/* Right column */}
      <aside className="space-y-4">
        <section className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <ShieldCheck className="size-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-[#08163d]">What this does</h2>
          </div>
          <ul className="space-y-3">
            {[
              {
                icon: Wallet,
                tone: "bg-indigo-50 text-indigo-600",
                text: "Looks up the RukaPay subscriber and PERSONAL wallet by phone",
              },
              {
                icon: UserRound,
                tone: "bg-violet-50 text-violet-600",
                text: "Creates or updates the borrower profile in Ruka Sente",
              },
              {
                icon: Shield,
                tone: "bg-emerald-50 text-emerald-600",
                text: "Records lending consents for the selected wallet",
              },
              {
                icon: LineChart,
                tone: "bg-amber-50 text-amber-600",
                text: "Runs the credit score engine and returns the latest result",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      item.tone
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <p className="pt-1.5 text-[13px] leading-snug text-slate-600">
                    {item.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Gauge className="size-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-[#08163d]">Score result</h2>
          </div>

          {!result && !submitting ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center">
              <Gauge className="mb-3 size-10 text-slate-300" strokeWidth={1.25} />
              <p className="max-w-[220px] text-[13px] leading-relaxed text-slate-400">
                Submit the form to see subscription status and score summary here.
              </p>
            </div>
          ) : null}

          {submitting ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-6 text-sm text-indigo-800">
              <Loader2 className="size-4 animate-spin" />
              Running enroll, consent, and scoring…
            </div>
          ) : null}

          {result ? (
            <div className="grid gap-3">
              <ResultStat
                label="Subscription"
                value={result.subscription?.status ?? "—"}
              />
              <ResultStat
                label="Total score"
                value={String(score?.total_score ?? "—")}
                emphasize
              />
              <ResultStat label="Risk band" value={score?.risk_band ?? "—"} />
              <ResultStat
                label="Recommended limit"
                value={formatMoney(score?.recommended_limit)}
              />
              <ResultStat
                label="Max tenor"
                value={
                  score?.max_tenor_days != null
                    ? `${score.max_tenor_days} days`
                    : "—"
                }
              />
              {score?.suggested_decision ? (
                <ResultStat
                  label="Suggested decision"
                  value={score.suggested_decision}
                />
              ) : null}
            </div>
          ) : null}
        </section>
      </aside>
    </div>
  );
}

function ResultStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-semibold text-[#08163d]",
          emphasize ? "text-2xl tracking-tight" : "text-sm"
        )}
      >
        {value}
      </p>
    </div>
  );
}
