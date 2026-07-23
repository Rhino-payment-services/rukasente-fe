"use client";

import { FormEvent, use, useMemo, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  useCreateLoanRule,
  useDeleteLoanRule,
  useLoanProduct,
  useLoanProductRules,
} from "@/hooks/use-loan";
import {
  LOAN_RULE_OPERATORS,
  LOAN_RULE_TYPES,
  LoanProductEligibilityRule,
} from "@/types/loan";
import { toast } from "sonner";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function LoanProductRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const productQ = useLoanProduct(id);
  const rulesQ = useLoanProductRules(id);
  const create = useCreateLoanRule(id);
  const remove = useDeleteLoanRule(id);

  const [ruleType, setRuleType] = useState("CREDIT_SCORE");
  const [operator, setOperator] = useState("GREATER_THAN_OR_EQUAL");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const columns = useMemo<ColumnDef<LoanProductEligibilityRule>[]>(
    () => [
      {
        accessorKey: "rule_type",
        header: "Rule Type",
        cell: ({ row }) => (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium">
            {row.original.rule_type}
          </span>
        ),
      },
      {
        accessorKey: "operator",
        header: "Operator",
        cell: ({ row }) => {
          const op = LOAN_RULE_OPERATORS.find((o) => o.value === row.original.operator);
          return op?.label ?? row.original.operator;
        },
      },
      { accessorKey: "value", header: "Value" },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description || "—",
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={remove.isPending}
            onClick={async () => {
              if (!window.confirm("Delete this rule?")) return;
              try {
                await remove.mutateAsync(row.original.id);
                toast.success("Rule deleted");
              } catch (err) {
                toast.error((err as Error).message || "Failed to delete rule");
              }
            }}
          >
            Delete
          </Button>
        ),
      },
    ],
    [remove]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      toast.error("Value is required");
      return;
    }
    try {
      await create.mutateAsync({
        rule_type: ruleType,
        operator,
        value: value.trim(),
        description: description.trim(),
        is_active: isActive,
      });
      setValue("");
      setDescription("");
      toast.success("Rule added");
    } catch (err) {
      toast.error((err as Error).message || "Failed to add rule");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Product Rules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eligibility requirements for{" "}
            <span className="font-medium text-slate-800">
              {productQ.data?.name ?? "this product"}
            </span>
            {productQ.data?.code ? ` (${productQ.data.code})` : ""}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/loan-products">Back to products</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Rule Type</label>
              <select
                className={selectClass}
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
              >
                {LOAN_RULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Operator</label>
              <select
                className={selectClass}
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                {LOAN_RULE_OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.value})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Value</label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={ruleType === "KYC_LEVEL" ? "FULL" : "850"}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional explanation shown in eligibility reasons"
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded border-slate-300"
                />
                Active
              </label>
              <Button type="submit" disabled={create.isPending || !value.trim()}>
                {create.isPending ? "Saving..." : "Add rule"}
              </Button>
            </div>
          </form>

          <DataTable
            columns={columns}
            data={rulesQ.data ?? []}
            isLoading={rulesQ.isLoading}
            error={rulesQ.error ? (rulesQ.error as Error).message : null}
            emptyMessage="No eligibility rules configured for this product."
          />
        </CardContent>
      </Card>
    </div>
  );
}
