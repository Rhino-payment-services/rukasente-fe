"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ResultData = {
  latest_score?: {
    total_score?: number;
    risk_band?: string;
    recommended_limit?: number;
    max_tenor_days?: number;
  } | null;
  subscription?: { status?: string } | null;
};

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
      const res = await fetch("/api/internal/manual-onboard-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <Card className="gap-0 border-slate-200 py-0 shadow-none">
      <CardHeader className="px-4 py-4">
        <CardTitle className="text-base text-slate-900">
          Manual borrower linking and scoring
        </CardTitle>
        <p className="text-xs text-slate-500">
          Paste RukaPay details and run enroll {"->"} consent {"->"} scoring in one action.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="RukaPay user ID"
            value={form.rukapay_user_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, rukapay_user_id: e.target.value }))
            }
            className="h-10 rounded-xl border-slate-200"
            required
          />
          <Input
            placeholder="Wallet ID"
            value={form.wallet_id}
            onChange={(e) => setForm((f) => ({ ...f, wallet_id: e.target.value }))}
            className="h-10 rounded-xl border-slate-200"
            required
          />
          <Input
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="h-10 rounded-xl border-slate-200"
            required
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="h-10 rounded-xl border-slate-200"
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="h-10 rounded-xl border-slate-200 md:col-span-2"
            required
          />
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-xl bg-main-600 text-white hover:bg-main-700"
            >
              {submitting ? "Running workflow..." : "Link and score borrower"}
            </Button>
          </div>
        </form>

        {result ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Latest score summary</p>
            <p className="mt-1">
              Subscription status:{" "}
              <span className="font-medium">{result.subscription?.status ?? "—"}</span>
            </p>
            <p>
              Total score:{" "}
              <span className="font-medium">{result.latest_score?.total_score ?? "—"}</span>
            </p>
            <p>
              Risk band:{" "}
              <span className="font-medium">{result.latest_score?.risk_band ?? "—"}</span>
            </p>
            <p>
              Recommended limit:{" "}
              <span className="font-medium">
                {result.latest_score?.recommended_limit ?? "—"}
              </span>
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

