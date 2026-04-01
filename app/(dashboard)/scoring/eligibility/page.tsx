"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DecisionBadge, formatDate } from "@/components/dashboard/scoring-shared";
import { EligibilityRow, useEligibilityDecisions } from "@/hooks/use-scoring";

export default function ScoringEligibilityPage() {
  const eligQ = useEligibilityDecisions();

  const columns = useMemo<ColumnDef<EligibilityRow>[]>(
    () => [
      {
        accessorKey: "status",
        header: "Decision",
        cell: ({ row }) => <DecisionBadge status={row.original.status} />,
      },
      {
        accessorKey: "reason_code",
        header: "Reason",
      },
      {
        accessorKey: "decision_source",
        header: "Source",
      },
      {
        accessorKey: "checked_at",
        header: "Checked on",
        cell: ({ row }) => formatDate(row.original.checked_at),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Eligibility decisions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Final qualification decisions made after scoring.
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={eligQ.data?.items ?? []}
            isLoading={eligQ.isLoading}
            error={eligQ.error ? (eligQ.error as Error).message : null}
            emptyMessage="No eligibility decisions yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
