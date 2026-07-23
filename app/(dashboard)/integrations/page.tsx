"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Handshake, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Integrations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Partners call into Ruka Sente with API keys. API endpoints configure
          outbound calls Ruka Sente makes to services like RukaPay/rdbs.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            className="h-8 rounded-lg bg-main-600 text-white hover:bg-main-700"
          >
            <Link href="/partners">
              <Handshake className="size-3.5" />
              Manage partners
            </Link>
          </Button>
        </div>
      </div>

      <Card className="gap-0 border-slate-200 py-0 shadow-sm">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Plug className="size-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">API endpoints</h2>
          </div>
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
