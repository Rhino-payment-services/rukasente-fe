 "use client";

import Link from "next/link";
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { RuleTypeBadge, StatusBadge } from "@/components/dashboard/scoring-shared";
import {
  ScoreRuleResponse,
  useScoringRules,
} from "@/hooks/use-scoring";

export default function ScoringRulesPage() {
  const rulesQ = useScoringRules();

  const columns = useMemo<ColumnDef<ScoreRuleResponse>[]>(
    () => [
      {
        accessorKey: "key",
        header: "Rule key",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.key}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description || "—",
      },
      {
        accessorKey: "rule_type",
        header: "Type",
        cell: ({ row }) => <RuleTypeBadge type={row.original.rule_type} />,
      },
      {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => `${(row.original.weight * 100).toFixed(0)}%`,
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => <StatusBadge active={row.original.is_active} />,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
        <h1 className="text-2xl font-semibold">Scoring rules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define how each scoring factor affects borrower credit score outcomes.
        </p>
        </div>
        <Button asChild>
          <Link href="/scoring/rules/create">Create rule</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={rulesQ.data ?? []}
            isLoading={rulesQ.isLoading}
            error={rulesQ.error ? (rulesQ.error as Error).message : null}
            emptyMessage="No scoring rules configured yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
