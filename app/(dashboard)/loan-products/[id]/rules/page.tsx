"use client";

import { FormEvent, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useCreateLoanRule, useLoanProductRules } from "@/hooks/use-loan";
import { LoanProductEligibilityRule } from "@/types/loan";

export default function LoanProductRulesPage({ params }: { params: { id: string } }) {
  const rulesQ = useLoanProductRules(params.id);
  const create = useCreateLoanRule(params.id);
  const [ruleKey, setRuleKey] = useState("min_score");
  const [operator, setOperator] = useState("gte");
  const [ruleValue, setRuleValue] = useState("");

  const columns = useMemo<ColumnDef<LoanProductEligibilityRule>[]>(
    () => [
      { accessorKey: "rule_key", header: "Rule key" },
      { accessorKey: "operator", header: "Operator" },
      { accessorKey: "rule_value", header: "Rule value" },
      { accessorKey: "is_active", header: "Active", cell: ({ row }) => (row.original.is_active ? "Yes" : "No") },
    ],
    []
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ rule_key: ruleKey, operator, rule_value: ruleValue, is_active: true });
    setRuleValue("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Product rules</h1>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <form className="grid gap-2 md:grid-cols-4" onSubmit={onSubmit}>
            <Input value={ruleKey} onChange={(e) => setRuleKey(e.target.value)} placeholder="rule_key" />
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={operator} onChange={(e) => setOperator(e.target.value)}>
              <option value="eq">eq</option>
              <option value="gte">gte</option>
              <option value="lte">lte</option>
              <option value="in">in</option>
              <option value="bool">bool</option>
            </select>
            <Input value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder="rule_value" />
            <Button type="submit" disabled={create.isPending || !ruleValue}>
              {create.isPending ? "Saving..." : "Add rule"}
            </Button>
          </form>
          <DataTable
            columns={columns}
            data={rulesQ.data ?? []}
            isLoading={rulesQ.isLoading}
            error={rulesQ.error ? (rulesQ.error as Error).message : null}
            emptyMessage="No rules configured."
          />
        </CardContent>
      </Card>
    </div>
  );
}
