"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Gauge,
  Layers,
  CircleDollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompactLoading } from "@/components/ui/loading";
import {
  ScoringPageShell,
  ScoringStatCard,
} from "@/components/dashboard/scoring-page-shell";
import {
  useCreateCreditScoreLoanLimit,
  useCreditScoreLoanLimits,
  useDeleteCreditScoreLoanLimit,
  useUpdateCreditScoreLoanLimit,
} from "@/hooks/use-loan";
import type { CreditScoreLoanLimit } from "@/types/loan";

type FormState = {
  min_score: string;
  max_score: string;
  maximum_loan_amount: string;
  is_active: boolean;
};

type StatusFilter = "all" | "active" | "inactive";

const emptyForm = (): FormState => ({
  min_score: "",
  max_score: "",
  maximum_loan_amount: "",
  is_active: true,
});

const SCORE_MAX = 1000;

function formatMoney(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "UGX 0";
  if (n >= 1_000_000_000) return `UGX ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  return `UGX ${Math.round(n).toLocaleString()}`;
}

function bandLabel(min: number, max: number) {
  const mid = (min + max) / 2;
  if (mid >= 900) return "Excellent";
  if (mid >= 750) return "Good";
  if (mid >= 600) return "Fair";
  if (mid >= 400) return "Risk";
  return "High risk";
}

function bandTone(min: number, max: number) {
  const mid = (min + max) / 2;
  if (mid >= 900) return "bg-emerald-500";
  if (mid >= 750) return "bg-sky-500";
  if (mid >= 600) return "bg-amber-500";
  if (mid >= 400) return "bg-orange-500";
  return "bg-rose-500";
}

export default function LoanScoreLimitsPage() {
  const limitsQ = useCreditScoreLoanLimits();
  const create = useCreateCreditScoreLoanLimit();
  const update = useUpdateCreditScoreLoanLimit();
  const remove = useDeleteCreditScoreLoanLimit();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditScoreLoanLimit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const items = useMemo(
    () =>
      [...(limitsQ.data ?? [])].sort(
        (a, b) => a.min_score - b.min_score || a.max_score - b.max_score
      ),
    [limitsQ.data]
  );

  const activeItems = items.filter((l) => l.is_active);
  const topCap = Math.max(0, ...items.map((l) => l.maximum_loan_amount), 0);
  const chartMax = Math.max(1, ...activeItems.map((l) => l.maximum_loan_amount), 1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "active" && !item.is_active) return false;
      if (statusFilter === "inactive" && item.is_active) return false;
      if (!q) return true;
      return (
        String(item.min_score).includes(q) ||
        String(item.max_score).includes(q) ||
        String(item.maximum_loan_amount).includes(q) ||
        formatMoney(item.maximum_loan_amount).toLowerCase().includes(q) ||
        bandLabel(item.min_score, item.max_score).toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row: CreditScoreLoanLimit) => {
    setEditing(row);
    setForm({
      min_score: String(row.min_score),
      max_score: String(row.max_score),
      maximum_loan_amount: String(row.maximum_loan_amount),
      is_active: row.is_active,
    });
    setFormError("");
    setModalOpen(true);
  };

  const onSave = async (e?: FormEvent) => {
    e?.preventDefault();
    setFormError("");
    const min = Number(form.min_score);
    const max = Number(form.max_score);
    const amount = Number(form.maximum_loan_amount);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
      setFormError("Score range must be valid non-negative numbers.");
      return;
    }
    if (min > max) {
      setFormError("Min score cannot exceed max score.");
      return;
    }
    if (max > SCORE_MAX) {
      setFormError(`Max score cannot exceed ${SCORE_MAX}.`);
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Maximum loan amount must be zero or positive.");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          payload: {
            min_score: min,
            max_score: max,
            maximum_loan_amount: amount,
            is_active: form.is_active,
          },
        });
        toast.success("Score limit updated");
      } else {
        await create.mutateAsync({
          min_score: min,
          max_score: max,
          maximum_loan_amount: amount,
          is_active: form.is_active,
        });
        toast.success("Score limit created");
      }
      setModalOpen(false);
    } catch (err) {
      setFormError((err as Error).message || "Failed to save score limit");
    }
  };

  const onDelete = async (row: CreditScoreLoanLimit) => {
    if (
      !window.confirm(
        `Delete score band ${row.min_score}–${row.max_score} (${formatMoney(row.maximum_loan_amount)})?`
      )
    ) {
      return;
    }
    setDeletingId(row.id);
    try {
      await remove.mutateAsync(row.id);
      toast.success("Score limit deleted");
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const previewMin = Number(form.min_score);
  const previewMax = Number(form.max_score);
  const previewAmount = Number(form.maximum_loan_amount);
  const showPreview =
    Number.isFinite(previewMin) &&
    Number.isFinite(previewMax) &&
    previewMin <= previewMax &&
    Number.isFinite(previewAmount) &&
    previewAmount >= 0;

  return (
    <ScoringPageShell
      activeStep="lend"
      title="Score loan limits"
      description="Map Ruka Score bands to the maximum loan amount a borrower can take. Eligibility still decides if they can apply — these bands decide how much."
      actions={
        <Button
          onClick={openCreate}
          className="bg-white text-[#08163d] hover:bg-white/90"
        >
          <Plus className="size-4" />
          Add limit
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoringStatCard
          label="Total bands"
          value={items.length}
          hint="Configured score ranges"
        />
        <ScoringStatCard
          label="Active bands"
          value={activeItems.length}
          hint="Used in eligibility checks"
          tone="success"
        />
        <ScoringStatCard
          label="Highest cap"
          value={formatMoney(topCap)}
          hint="Largest max loan across bands"
          tone="info"
        />
        <ScoringStatCard
          label="Score scale"
          value={`0–${SCORE_MAX}`}
          hint="Ruka Score range"
        />
      </div>

      <div className="space-y-4">
          {activeItems.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Active band ladder
                  </h2>
                  <p className="text-xs text-slate-500">
                    Higher scores should usually unlock higher caps
                  </p>
                </div>
                <Layers className="size-4 text-slate-400" />
              </div>
              <div className="space-y-3">
                {activeItems.map((band) => {
                  const widthPct = Math.max(
                    6,
                    (band.maximum_loan_amount / chartMax) * 100
                  );
                  const spanPct = Math.max(
                    2,
                    ((band.max_score - band.min_score + 1) / SCORE_MAX) * 100
                  );
                  const leftPct = (band.min_score / SCORE_MAX) * 100;
                  return (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => openEdit(band)}
                      className="group w-full rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left transition hover:border-[#08163d]/20 hover:bg-white"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2.5 rounded-full ${bandTone(band.min_score, band.max_score)}`}
                          />
                          <span className="text-sm font-semibold text-slate-900">
                            {band.min_score} – {band.max_score}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {bandLabel(band.min_score, band.max_score)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[#08163d]">
                          {formatMoney(band.maximum_loan_amount)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className="h-full rounded-full bg-[#08163d] transition group-hover:bg-[#122a66]"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="relative mt-2 h-1.5 rounded-full bg-slate-100">
                        <div
                          className={`absolute top-0 h-full rounded-full opacity-70 ${bandTone(band.min_score, band.max_score)}`}
                          style={{ left: `${leftPct}%`, width: `${spanPct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>0</span>
                        <span>{SCORE_MAX}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search score, amount, or band…"
                  className="h-9 pl-9"
                />
              </div>
              {(
                [
                  ["all", "All"],
                  ["active", "Active"],
                  ["inactive", "Inactive"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === value
                      ? "bg-[#08163d] text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {limitsQ.isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <CompactLoading message="Loading score limits…" />
              </div>
            ) : limitsQ.error ? (
              <p className="px-4 py-10 text-center text-sm text-rose-600">
                {(limitsQ.error as Error).message || "Failed to load limits"}
              </p>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <Gauge className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No score limits yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add bands like 600–749 → UGX 500,000 so eligibility can cap
                  loan size by score.
                </p>
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="size-4" />
                  Add first limit
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Score band</th>
                      <th className="px-4 py-3 font-medium">Max loan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-slate-100 hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`size-2.5 shrink-0 rounded-full ${bandTone(row.min_score, row.max_score)}`}
                            />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {row.min_score} – {row.max_score}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {bandLabel(row.min_score, row.max_score)} band
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {formatMoney(row.maximum_loan_amount)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Cap for this score range
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={row.is_active ? "success" : "default"}
                          >
                            {row.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => openEdit(row)}
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                              disabled={deletingId === row.id}
                              onClick={() => void onDelete(row)}
                            >
                              {deletingId === row.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit score limit" : "Add score limit"}
            </DialogTitle>
            <DialogDescription>
              Borrowers whose score falls in this range get this maximum loan
              amount (subject to product limits).
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3 px-5 py-4 md:grid-cols-2"
            onSubmit={(e) => void onSave(e)}
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Min score
              </label>
              <Input
                type="number"
                min={0}
                max={SCORE_MAX}
                value={form.min_score}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_score: e.target.value }))
                }
                placeholder="e.g. 600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Max score
              </label>
              <Input
                type="number"
                min={0}
                max={SCORE_MAX}
                value={form.max_score}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_score: e.target.value }))
                }
                placeholder="e.g. 749"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Maximum loan amount (UGX)
              </label>
              <div className="relative">
                <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  min={0}
                  className="pl-9"
                  value={form.maximum_loan_amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maximum_loan_amount: e.target.value,
                    }))
                  }
                  placeholder="e.g. 500000"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="limit-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                className="size-4 rounded border-slate-300"
              />
              <label htmlFor="limit-active" className="text-sm text-slate-700">
                Active — include this band in eligibility caps
              </label>
            </div>

            {showPreview ? (
              <div className="md:col-span-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                Preview: score{" "}
                <strong className="text-slate-900">
                  {previewMin}–{previewMax}
                </strong>{" "}
                ({bandLabel(previewMin, previewMax)}) → max{" "}
                <strong className="text-slate-900">
                  {formatMoney(previewAmount)}
                </strong>
                {!form.is_active ? " · inactive" : null}
              </div>
            ) : null}

            {formError ? (
              <p className="md:col-span-2 text-sm text-rose-600">{formError}</p>
            ) : null}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void onSave()}
              disabled={create.isPending || update.isPending}
            >
              {(create.isPending || update.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {editing ? "Save changes" : "Create band"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScoringPageShell>
  );
}
