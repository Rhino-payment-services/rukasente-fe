"use client";

import { FormEvent, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ShieldCheck,
  UserRound,
  Wallet,
  Gauge,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

function formatMoney(n: number | undefined | null) {
  if (n == null) return "—";
  return `UGX ${n.toLocaleString()}`;
}

export function ManualBorrowerOnboarding() {
  const [form, setForm] = useState({
    rukapay_user_id: "",
    full_name: "",
    phone: "",
    email: "",
    wallet_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payloadBody = {
        rukapay_user_id: form.rukapay_user_id.trim(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        wallet_id: form.wallet_id.trim(),
      };
      const res = await fetch("/api/internal/manual-onboard-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });
      const payload = (await res.json()) as {
        success: boolean;
        data?: ResultData;
        error?: { message?: string };
      };
      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || "Manual onboarding failed");
      }
      setResult(payload.data ?? null);
      toast.success("Borrower linked and scored successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to run manual flow");
    } finally {
      setSubmitting(false);
    }
  }

  const score = result?.latest_score;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
      <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Link and score borrower
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Paste RukaPay identity details, then run enroll → consent → scoring.
              </p>
            </div>
          </div>

          <ol className="grid gap-2 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  submitting
                    ? "border-main-200 bg-main-50/60"
                    : "border-slate-200 bg-slate-50/80"
                )}
              >
                <div className="flex items-center gap-2">
                  {submitting ? (
                    <Loader2 className="size-3.5 animate-spin text-main-700" />
                  ) : result ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : (
                    <Circle className="size-3.5 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">
                    {index + 1}. {step.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{step.hint}</p>
              </li>
            ))}
          </ol>

          <form onSubmit={onSubmit} className="space-y-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Wallet className="size-3.5" />
                RukaPay identity
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="RukaPay user ID"
                  hint="UUID from RukaPay / rdbs_core"
                >
                  <Input
                    value={form.rukapay_user_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rukapay_user_id: e.target.value }))
                    }
                    placeholder="e.g. bd0922a5-dc43-4c3c-9d8d-…"
                    className="h-10 rounded-xl border-slate-200 font-mono text-xs"
                    required
                    autoComplete="off"
                  />
                </Field>
                <Field label="Wallet ID" hint="Wallet used for scoring">
                  <Input
                    value={form.wallet_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wallet_id: e.target.value }))
                    }
                    placeholder="e.g. 80196611-e436-480b-…"
                    className="h-10 rounded-xl border-slate-200 font-mono text-xs"
                    required
                    autoComplete="off"
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <UserRound className="size-3.5" />
                Borrower profile
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Full name">
                  <Input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    placeholder="Mwungeri Sevelin"
                    className="h-10 rounded-xl border-slate-200"
                    required
                  />
                </Field>
                <Field label="Phone" hint="Include country code, e.g. 256…">
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="256742600208"
                    className="h-10 rounded-xl border-slate-200"
                    required
                    inputMode="tel"
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
                      className="h-10 rounded-xl border-slate-200"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 rounded-xl bg-main-600 px-5 text-white hover:bg-main-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Running workflow…
                  </>
                ) : (
                  "Link and score borrower"
                )}
              </Button>
              <p className="text-xs text-slate-500">
                Required fields are marked with *. Email is optional.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">What this does</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                Creates or updates the borrower profile in Ruka Sente
              </li>
              <li className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                Records lending consents for the selected wallet
              </li>
              <li className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                Runs the credit score engine and returns the latest result
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Score result</h3>
            </div>

            {!result && !submitting ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
                Submit the form to see subscription status and score summary here.
              </p>
            ) : null}

            {submitting ? (
              <div className="flex items-center gap-2 rounded-xl border border-main-100 bg-main-50/50 px-4 py-6 text-sm text-main-800">
                <Loader2 className="size-4 animate-spin" />
                Running enroll, consent, and scoring…
              </div>
            ) : null}

            {result ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
          </CardContent>
        </Card>
      </div>
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
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-semibold text-slate-900",
          emphasize ? "text-2xl tracking-tight" : "text-sm"
        )}
      >
        {value}
      </p>
    </div>
  );
}
