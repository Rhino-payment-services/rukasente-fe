"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DecisionBadge, formatDate } from "@/components/dashboard/scoring-shared";
import { ManualReviewCaseResponse, useManualReviewCases } from "@/hooks/use-scoring";

export default function ScoringManualReviewPage() {
  const manualQ = useManualReviewCases();

  const columns = useMemo<ColumnDef<ManualReviewCaseResponse>[]>(
    () => [
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <DecisionBadge status={row.original.status} />,
      },
      {
        accessorKey: "resolution",
        header: "Resolution",
        cell: ({ row }) => row.original.resolution || "—",
      },
      {
        accessorKey: "review_notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="block max-w-[280px] truncate" title={row.original.review_notes}>
            {row.original.review_notes || "—"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Opened on",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "resolved_at",
        header: "Resolved on",
        cell: ({ row }) => formatDate(row.original.resolved_at),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manual review cases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cases that require staff intervention before a final eligibility decision.
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={manualQ.data?.items ?? []}
            isLoading={manualQ.isLoading}
            error={manualQ.error ? (manualQ.error as Error).message : null}
            emptyMessage="No manual review cases."
          />
        </CardContent>
      </Card>
    </div>
  );
}
