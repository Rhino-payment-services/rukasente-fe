"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";
import { useLoanApplications } from "@/hooks/use-loan";
import { LoanApplication } from "@/types/loan";
import { Button } from "@/components/ui/button";

export default function LoanApplicationsPage() {
  const [status, setStatus] = useState("");
  const appsQ = useLoanApplications({ page: 1, page_size: 100, status: status || undefined });

  const columns = useMemo<ColumnDef<LoanApplication>[]>(
    () => [
      { accessorKey: "application_number", header: "Application #" },
      { accessorKey: "borrower_profile_id", header: "Borrower" },
      { accessorKey: "loan_product_id", header: "Product" },
      { accessorKey: "requested_amount", header: "Amount" },
      { accessorKey: "requested_tenor_days", header: "Tenor (days)" },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <LoanStatusBadge status={row.original.status} /> },
      { accessorKey: "submitted_at", header: "Submitted at" },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/loan-applications/${row.original.id}`}>View</Link>
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Loan applications</h1>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="submitted">submitted</option>
              <option value="under_review">under_review</option>
              <option value="approved">approved</option>
              <option value="declined">declined</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <DataTable
            columns={columns}
            data={appsQ.data?.items ?? []}
            isLoading={appsQ.isLoading}
            error={appsQ.error ? (appsQ.error as Error).message : null}
            emptyMessage="No applications found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
