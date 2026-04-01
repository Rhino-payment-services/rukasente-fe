"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { IntegrationRow, useIntegrations } from "@/hooks/use-integrations";

export default function IntegrationsPage() {
  const { data, isLoading, error } = useIntegrations();
  const columns = useMemo<ColumnDef<IntegrationRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => row.original.display_name || row.original.name,
      },
      {
        accessorKey: "base_url",
        header: "Base URL",
        cell: ({ row }) => (
          <span className="max-w-[260px] truncate font-mono text-xs">
            {row.original.base_url}
          </span>
        ),
      },
      {
        accessorKey: "path_template",
        header: "Path",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.path_template}</span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Integrations</h1>
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={data ?? []}
            isLoading={isLoading}
            error={error ? (error as Error).message : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
