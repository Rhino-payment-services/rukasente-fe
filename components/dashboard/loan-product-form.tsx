"use client";

import { FormEvent, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoanProduct, LoanProductCreatePayload } from "@/types/loan";

type Props = {
  initial?: Partial<LoanProduct>;
  isSaving?: boolean;
  onSubmit: (payload: LoanProductCreatePayload) => Promise<void>;
};

export function LoanProductForm({ initial, isSaving, onSubmit }: Props) {
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
    processing_fee_type: (initial?.processing_fee_type ?? "percentage") as "fixed" | "percentage",
    processing_fee_value: String(initial?.processing_fee_value ?? 0),
    late_fee_type: (initial?.late_fee_type ?? "percentage") as "fixed" | "percentage",
    late_fee_value: String(initial?.late_fee_value ?? 0),
    grace_period_days: String(initial?.grace_period_days ?? 0),
    requires_manual_review: Boolean(initial?.requires_manual_review),
    is_active: initial?.is_active ?? true,
  });
  const [error, setError] = useState("");

  const parsed = useMemo<LoanProductCreatePayload | null>(() => {
    const minAmount = Number(form.min_amount);
    const maxAmount = Number(form.max_amount);
    const minTenor = Number(form.min_tenor_days);
    const maxTenor = Number(form.max_tenor_days);
    if (!form.code || !form.name || !form.currency) return null;
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
      interest_rate: Number(form.interest_rate),
      processing_fee_type: form.processing_fee_type,
      processing_fee_value: Number(form.processing_fee_value),
      late_fee_type: form.late_fee_type,
      late_fee_value: Number(form.late_fee_value),
      grace_period_days: Number(form.grace_period_days),
      requires_manual_review: form.requires_manual_review,
      is_active: form.is_active,
    };
  }, [form]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!parsed) {
      setError("Please fill all required fields with valid values.");
      return;
    }
    if (parsed.min_amount > parsed.max_amount || parsed.min_tenor_days > parsed.max_tenor_days) {
      setError("Minimum values cannot be greater than maximum values.");
      return;
    }
    await onSubmit(parsed);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <Input placeholder="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
      </div>
      <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <div className="grid gap-3 md:grid-cols-4">
        <Input type="number" placeholder="Min amount" value={form.min_amount} onChange={(e) => setForm((f) => ({ ...f, min_amount: e.target.value }))} />
        <Input type="number" placeholder="Max amount" value={form.max_amount} onChange={(e) => setForm((f) => ({ ...f, max_amount: e.target.value }))} />
        <Input type="number" placeholder="Min tenor days" value={form.min_tenor_days} onChange={(e) => setForm((f) => ({ ...f, min_tenor_days: e.target.value }))} />
        <Input type="number" placeholder="Max tenor days" value={form.max_tenor_days} onChange={(e) => setForm((f) => ({ ...f, max_tenor_days: e.target.value }))} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.interest_type} onChange={(e) => setForm((f) => ({ ...f, interest_type: e.target.value as "flat" | "percentage" }))}>
          <option value="flat">flat</option>
          <option value="percentage">percentage</option>
        </select>
        <Input type="number" step="0.01" placeholder="Interest rate" value={form.interest_rate} onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))} />
        <Input type="number" placeholder="Grace period days" value={form.grace_period_days} onChange={(e) => setForm((f) => ({ ...f, grace_period_days: e.target.value }))} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2 md:grid-cols-2">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.processing_fee_type} onChange={(e) => setForm((f) => ({ ...f, processing_fee_type: e.target.value as "fixed" | "percentage" }))}>
            <option value="fixed">processing fee fixed</option>
            <option value="percentage">processing fee percentage</option>
          </select>
          <Input type="number" step="0.01" placeholder="Processing fee value" value={form.processing_fee_value} onChange={(e) => setForm((f) => ({ ...f, processing_fee_value: e.target.value }))} />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.late_fee_type} onChange={(e) => setForm((f) => ({ ...f, late_fee_type: e.target.value as "fixed" | "percentage" }))}>
            <option value="fixed">late fee fixed</option>
            <option value="percentage">late fee percentage</option>
          </select>
          <Input type="number" step="0.01" placeholder="Late fee value" value={form.late_fee_value} onChange={(e) => setForm((f) => ({ ...f, late_fee_value: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.requires_manual_review} onChange={(e) => setForm((f) => ({ ...f, requires_manual_review: e.target.checked }))} />
          Requires manual review
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          Active
        </label>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save product"}</Button>
    </form>
  );
}
