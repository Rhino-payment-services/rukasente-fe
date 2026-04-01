"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useLoanProducts, useSetLoanProductStatus } from "@/hooks/use-loan";
import { LoanProduct } from "@/types/loan";

export default function LoanProductsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const productsQ = useLoanProducts({
    page: 1,
    page_size: 100,
    search: search || undefined,
    active: activeFilter || undefined,
  });
  const setStatus = useSetLoanProductStatus();

  const columns = useMemo<ColumnDef<LoanProduct>[]>(
    () => [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "currency", header: "Currency" },
      {
        id: "amount_range",
        header: "Amount range",
        cell: ({ row }) => `${row.original.min_amount} - ${row.original.max_amount}`,
      },
      {
        id: "tenor_range",
        header: "Tenor range",
        cell: ({ row }) =>
          `${row.original.min_tenor_days}d - ${row.original.max_tenor_days}d`,
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
      },
      {
        accessorKey: "requires_manual_review",
        header: "Manual review",
        cell: ({ row }) => (row.original.requires_manual_review ? "Yes" : "No"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/loan-products/${row.original.id}/edit`}>Edit</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/loan-products/${row.original.id}/rules`}>Rules</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await setStatus.mutateAsync({
                  id: row.original.id,
                  isActive: !row.original.is_active,
                });
              }}
            >
              {row.original.is_active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ),
      },
    ],
    [setStatus]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Loan products</h1>
          <p className="text-sm text-muted-foreground">
            Configure products and eligibility rules.
          </p>
        </div>
        <Button asChild>
          <Link href="/loan-products/new">Create product</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex gap-2">
            <input
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Search by name/code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <DataTable
            columns={columns}
            data={productsQ.data?.items ?? []}
            isLoading={productsQ.isLoading}
            error={productsQ.error ? (productsQ.error as Error).message : null}
            emptyMessage="No loan products found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
