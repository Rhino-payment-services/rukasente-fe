"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useSubscriptionsList } from "@/hooks/use-subscriptions";

export default function SubscriptionsPage() {
  const { data, isLoading, error } = useSubscriptionsList();
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      {
        id: "rukapay_user_id",
        header: "User",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {String(row.original.rukapay_user_id ?? "")}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => String(row.original.status ?? ""),
      },
      {
        id: "subscribed_at",
        header: "Subscribed on",
        cell: ({ row }) =>
          row.original.subscribed_at ? String(row.original.subscribed_at) : "—",
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tracks whether an enrolled borrower has an active Ruka Sente credit
          subscription. A borrower can exist without a subscription — a
          subscription confirms they have opted in to credit access.
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
