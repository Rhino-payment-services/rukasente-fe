"use client";

import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CompactLoading } from "@/components/ui/loading";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import {
  DetailGrid,
  DetailSection,
  formatDetailValue,
} from "@/components/dashboard/detail-fields";
import { TableViewButton } from "@/components/dashboard/table-view-button";
import {
  ACTION_SLOT,
  ActionSlot,
  RowActions,
} from "@/components/dashboard/row-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditScoreRuleCreatePayload,
  CreditScoreRuleResponse,
  useCreateScoringRule,
  useCreditScoreRuleStats,
  useDeleteCreditScoreRule,
  useResetCreditScoreRules,
  useSetCreditScoreRuleStatus,
  useScoringRules,
  useUpdateCreditScoreRule,
} from "@/hooks/use-scoring";
import {
  ScoringPageShell,
  ScoringStatCard,
} from "@/components/dashboard/scoring-page-shell";

const CATEGORIES = [
  "TRANSACTION",
  "LOAN",
  "INCOME",
  "WALLET",
  "KYC",
  "ACCOUNT",
  "PAYMENT",
  "RISK",
] as const;

const OPERATORS = [">=", "<=", ">", "<", "==", ""] as const;

type FormState = {
  name: string;
  description: string;
  category: string;
  type: string;
  condition: string;
  operator: string;
  threshold: string;
  score_value: string;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  category: "TRANSACTION",
  type: "POSITIVE",
  condition: "",
  operator: ">=",
  threshold: "",
  score_value: "",
  is_active: true,
});

function formFromRule(rule: CreditScoreRuleResponse): FormState {
  return {
    name: rule.name,
    description: rule.description || "",
    category: rule.category,
    type: rule.type,
    condition: rule.condition,
    operator: rule.operator || "",
    threshold: rule.threshold != null ? String(rule.threshold) : "",
    score_value: String(rule.score_value),
    is_active: rule.is_active,
  };
}

function selectClassName(fullWidth = true) {
  return `h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#08163d]/30 ${
    fullWidth ? "w-full" : "w-auto shrink-0"
  }`;
}

function conditionLabel(rule: CreditScoreRuleResponse) {
  const op = rule.operator?.trim();
  const thr = rule.threshold;
  if (op && thr != null) return `${rule.condition} ${op} ${thr}`;
  if (op) return `${rule.condition} ${op}`;
  return rule.condition;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreditScoreRulesPage() {
  const { can } = usePermissions();

  const rulesQ = useScoringRules();
  const statsQ = useCreditScoreRuleStats();
  const createRule = useCreateScoringRule();
  const updateRule = useUpdateCreditScoreRule();
  const deleteRule = useDeleteCreditScoreRule();
  const setStatus = useSetCreditScoreRuleStatus();
  const resetRules = useResetCreditScoreRules();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<"name" | "category" | "score_value" | "priority">(
    "priority"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreditScoreRuleResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [viewRule, setViewRule] = useState<CreditScoreRuleResponse | null>(null);

  const stats = statsQ.data ?? {
    total: 0,
    active: 0,
    positive: 0,
    negative: 0,
  };

  const filtered = useMemo(() => {
    const rows = rulesQ.data ?? [];
    const q = search.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;
      if (statusFilter === "ACTIVE" && !r.is_active) return false;
      if (statusFilter === "INACTIVE" && r.is_active) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    });
    out = [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rulesQ.data, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (rule: CreditScoreRuleResponse) => {
    setEditing(rule);
    setForm(formFromRule(rule));
    setFormError("");
    setModalOpen(true);
  };

  const validateForm = (): CreditScoreRuleCreatePayload | null => {
    const name = form.name.trim();
    const condition = form.condition.trim();
    const score = Number(form.score_value);
    if (!name) {
      setFormError("Name is required.");
      return null;
    }
    if (!form.category) {
      setFormError("Category is required.");
      return null;
    }
    if (!form.type) {
      setFormError("Type is required.");
      return null;
    }
    if (!condition) {
      setFormError("Condition is required.");
      return null;
    }
    if (!Number.isFinite(score) || score === 0) {
      setFormError("Score value is required and cannot be zero.");
      return null;
    }
    const operator = form.operator.trim();
    let threshold: number | null | undefined = undefined;
    if (operator) {
      if (form.threshold.trim() === "") {
        setFormError("Threshold is required for comparison rules.");
        return null;
      }
      threshold = Number(form.threshold);
      if (!Number.isFinite(threshold)) {
        setFormError("Threshold must be a valid number.");
        return null;
      }
    } else if (form.threshold.trim() !== "") {
      threshold = Number(form.threshold);
    }
    return {
      name,
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      condition,
      operator,
      threshold: threshold ?? null,
      score_value: score,
      is_active: form.is_active,
    };
  };

  const onSave = async () => {
    setFormError("");
    const payload = validateForm();
    if (!payload) return;
    try {
      if (editing) {
        await updateRule.mutateAsync({ id: editing.id, payload });
      } else {
        await createRule.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError((err as Error).message || "Failed to save rule.");
    }
  };

  const onDelete = async (rule: CreditScoreRuleResponse) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    setActionError("");
    try {
      await deleteRule.mutateAsync(rule.id);
    } catch (err) {
      setActionError((err as Error).message || "Failed to delete rule.");
    }
  };

  const onToggle = async (rule: CreditScoreRuleResponse) => {
    setActionError("");
    try {
      await setStatus.mutateAsync({ id: rule.id, is_active: !rule.is_active });
    } catch (err) {
      setActionError((err as Error).message || "Failed to update status.");
    }
  };

  const onReset = async () => {
    if (
      !window.confirm(
        "Reset all rules to product defaults? This deletes every current rule."
      )
    ) {
      return;
    }
    setActionError("");
    try {
      await resetRules.mutateAsync();
      setPage(1);
    } catch (err) {
      setActionError((err as Error).message || "Failed to reset rules.");
    }
  };

  if (!can(Perm.ScoringRuleView)) {
    return <NoAccess description="You need scoring.rule.view to open credit score rules." />;
  }

  return (
    <ScoringPageShell
      activeStep="score"
      title="Credit score rules"
      description="Manage rules used to calculate the customer Ruka Score. Active rules add or subtract points from the base score when a borrower is scored."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={() => void onReset()}
            disabled={resetRules.isPending}
          >
            Reset default rules
          </Button>
          <Button
            className="bg-white text-[#08163d] hover:bg-white/90"
            onClick={openCreate}
          >
            + Add rule
          </Button>
        </div>
      }
    >
      {actionError ? (
        <p className="text-sm text-rose-600">{actionError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoringStatCard label="Total rules" value={stats.total} />
        <ScoringStatCard
          label="Active"
          value={stats.active}
          hint="Applied when scoring"
          tone="success"
        />
        <ScoringStatCard
          label="Positive"
          value={stats.positive}
          hint="Add points"
          tone="info"
        />
        <ScoringStatCard
          label="Negative"
          value={stats.negative}
          hint="Subtract points"
          tone="danger"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search rules…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9"
            />
          </div>
          <select
            className={`${selectClassName(false)} min-w-[140px]`}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={`${selectClassName(false)} min-w-[120px]`}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className={`${selectClassName(false)} min-w-[150px]`}
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":") as [
                typeof sortKey,
                typeof sortDir,
              ];
              setSortKey(k);
              setSortDir(d);
            }}
          >
            <option value="priority:asc">Priority ↑</option>
            <option value="priority:desc">Priority ↓</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="category:asc">Category</option>
            <option value="score_value:desc">Score high</option>
            <option value="score_value:asc">Score low</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {rulesQ.isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <CompactLoading message="Loading rules…" />
          </div>
        ) : rulesQ.error ? (
          <p className="px-4 py-10 text-center text-sm text-rose-600">
            {(rulesQ.error as Error).message || "Failed to load rules"}
          </p>
        ) : pageRows.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-slate-500">
            No credit score rules found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                <tr>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Rule
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Category
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Condition
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Score
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((rule) => {
                  const positive = rule.type === "POSITIVE" || rule.score_value > 0;
                  return (
                    <tr
                      key={rule.id}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/90"
                    >
                      <td className="px-3 py-2 align-middle text-slate-700">
                        <p className="font-medium text-slate-900">{rule.name}</p>
                        {rule.description ? (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                            {rule.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Badge variant="default">{rule.category}</Badge>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                          {conditionLabel(rule)}
                        </code>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            positive ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {rule.score_value > 0
                            ? `+${rule.score_value}`
                            : rule.score_value}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {rule.type === "POSITIVE" ? "Adds" : "Subtracts"}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Badge variant={rule.is_active ? "success" : "default"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <RowActions
                          slots={[
                            ACTION_SLOT.sm,
                            ACTION_SLOT.md,
                            "48px",
                            ACTION_SLOT.md,
                          ]}
                        >
                          <ActionSlot>
                            <TableViewButton onClick={() => setViewRule(rule)} />
                          </ActionSlot>
                          <ActionSlot>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => openEdit(rule)}
                            >
                              Edit
                            </Button>
                          </ActionSlot>
                          <ActionSlot>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => void onToggle(rule)}
                            >
                              {rule.is_active ? "Off" : "On"}
                            </Button>
                          </ActionSlot>
                          <ActionSlot>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-rose-200 text-[11px] text-rose-700 hover:bg-rose-50"
                              onClick={() => void onDelete(rule)}
                            >
                              Delete
                            </Button>
                          </ActionSlot>
                        </RowActions>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing {pageRows.length} of {filtered.length} rules
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {pageSafe} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Rule" : "Add Rule"}</DialogTitle>
            <DialogDescription>
              Configure how this rule contributes to the Ruka Score.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[65vh] gap-3 overflow-y-auto px-5 py-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Completed Loan Repayment"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Description
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
              <select
                className={selectClassName()}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
              <select
                className={selectClassName()}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="POSITIVE">POSITIVE</option>
                <option value="NEGATIVE">NEGATIVE</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Condition</label>
              <Input
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                placeholder="completed_loans"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Operator</label>
              <select
                className={selectClassName()}
                value={form.operator}
                onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}
              >
                {OPERATORS.map((op) => (
                  <option key={op || "none"} value={op}>
                    {op || "(none — boolean)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Threshold</label>
              <Input
                type="number"
                value={form.threshold}
                onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
                placeholder="Required when operator is set"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Score Value</label>
              <Input
                type="number"
                value={form.score_value}
                onChange={(e) => setForm((f) => ({ ...f, score_value: e.target.value }))}
                placeholder="e.g. 100 or -50"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="rule-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="size-4 rounded border-slate-300"
              />
              <label htmlFor="rule-active" className="text-sm text-slate-700">
                Active
              </label>
            </div>
            {formError ? (
              <p className="md:col-span-2 text-sm text-rose-600">{formError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void onSave()}
              disabled={createRule.isPending || updateRule.isPending}
            >
              {editing ? "Save changes" : "Create rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailsDrawer
        open={!!viewRule}
        onClose={() => setViewRule(null)}
        title={viewRule?.name ?? "Credit score rule"}
        description={viewRule?.category}
        footer={
          viewRule ? (
            <Button
              type="button"
              className="flex-1 rounded-lg text-xs"
              onClick={() => {
                setViewRule(null);
                openEdit(viewRule);
              }}
            >
              Edit rule
            </Button>
          ) : null
        }
      >
        {viewRule ? (
          <>
            <DetailSection title="Rule">
              <DetailGrid
                fields={[
                  { label: "Name", value: viewRule.name },
                  { label: "Category", value: viewRule.category },
                  { label: "Type", value: viewRule.type },
                  { label: "Priority", value: viewRule.priority },
                  {
                    label: "Active",
                    value: formatDetailValue(viewRule.is_active),
                  },
                  {
                    label: "Description",
                    value: viewRule.description || "—",
                    fullWidth: true,
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Condition">
              <DetailGrid
                fields={[
                  { label: "Condition", value: viewRule.condition, mono: true },
                  { label: "Operator", value: viewRule.operator || "—", mono: true },
                  {
                    label: "Threshold",
                    value:
                      viewRule.threshold != null ? viewRule.threshold : "—",
                  },
                  {
                    label: "Full expression",
                    value: conditionLabel(viewRule),
                    mono: true,
                    fullWidth: true,
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Scoring impact">
              <DetailGrid
                fields={[
                  {
                    label: "Score value",
                    value:
                      viewRule.score_value > 0
                        ? `+${viewRule.score_value}`
                        : viewRule.score_value,
                  },
                  {
                    label: "Effect",
                    value: viewRule.type === "POSITIVE" ? "Adds points" : "Subtracts points",
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Timestamps">
              <DetailGrid
                fields={[
                  { label: "Created", value: formatDate(viewRule.created_at) },
                  { label: "Updated", value: formatDate(viewRule.updated_at) },
                  { label: "ID", value: viewRule.id, mono: true, fullWidth: true },
                ]}
              />
            </DetailSection>
          </>
        ) : null}
      </DetailsDrawer>
    </ScoringPageShell>
  );
}
