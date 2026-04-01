"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DecisionBadge, formatCurrency, formatDate } from "@/components/dashboard/scoring-shared";
import { CreditScoreResultSummary, useScoringResults } from "@/hooks/use-scoring";

export default function ScoringResultsPage() {
  const resultsQ = useScoringResults();

  const columns = useMemo<ColumnDef<CreditScoreResultSummary>[]>(
    () => [
      {
        accessorKey: "total_score",
        header: "Score",
        cell: ({ row }) => <span className="font-semibold">{row.original.total_score}</span>,
      },
      {
        accessorKey: "risk_band",
        header: "Risk band",
        cell: ({ row }) => <DecisionBadge status={row.original.risk_band} />,
      },
      {
        accessorKey: "suggested_decision",
        header: "Decision",
        cell: ({ row }) => <DecisionBadge status={row.original.suggested_decision} />,
      },
      {
        accessorKey: "recommended_limit",
        header: "Recommended limit",
        cell: ({ row }) => formatCurrency(row.original.recommended_limit),
      },
      {
        accessorKey: "max_tenor_days",
        header: "Max tenor",
        cell: ({ row }) => `${row.original.max_tenor_days}d`,
      },
      {
        accessorKey: "reason_codes",
        header: "Reason codes",
        cell: ({ row }) => (row.original.reason_codes?.length ? row.original.reason_codes.join(", ") : "—"),
      },
      {
        accessorKey: "scored_at",
        header: "Scored on",
        cell: ({ row }) => formatDate(row.original.scored_at),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Score results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Credit score outcomes generated from the currently active scoring rules.
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={resultsQ.data?.items ?? []}
            isLoading={resultsQ.isLoading}
            error={resultsQ.error ? (resultsQ.error as Error).message : null}
            emptyMessage="No score results yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
