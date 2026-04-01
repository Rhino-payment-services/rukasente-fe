"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useBorrowersList } from "@/hooks/use-borrowers";

export default function BorrowersPage() {
  const { data, isLoading, error } = useBorrowersList();
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      {
        id: "rukapay_user_id",
        header: "RukaPay user",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {String(row.original.rukapay_user_id ?? "")}
          </span>
        ),
      },
      {
        id: "full_name",
        header: "Name",
        cell: ({ row }) => String(row.original.full_name ?? ""),
      },
      {
        id: "kyc_status",
        header: "KYC status",
        cell: ({ row }) => String(row.original.kyc_status ?? ""),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Borrowers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          RukaPay users enrolled in the Ruka Sente credit program. Each
          borrower profile stores KYC status and is the basis for credit
          scoring and eligibility decisions.
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            error={error ? (error as Error).message : null}
          />
          {data && (
            <p className="text-xs text-muted-foreground mt-2">
              Total: {data.total}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
