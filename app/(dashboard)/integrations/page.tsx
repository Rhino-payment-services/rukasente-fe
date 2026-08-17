"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Handshake, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import {
  DetailGrid,
  DetailSection,
} from "@/components/dashboard/detail-fields";
import { TableViewButton } from "@/components/dashboard/table-view-button";
import { IntegrationRow, useIntegrations } from "@/hooks/use-integrations";
import { getApiDocsUrl } from "@/lib/config";

export default function IntegrationsPage() {
  const { data, isLoading, error } = useIntegrations();
  const [viewIntegration, setViewIntegration] = useState<IntegrationRow | null>(
    null
  );

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
          <span className="max-w-[260px] truncate font-mono text-[11px]">
            {row.original.base_url}
          </span>
        ),
      },
      {
        accessorKey: "path_template",
        header: "Path",
        cell: ({ row }) => (
          <span className="font-mono text-[11px]">{row.original.path_template}</span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "success" : "default"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <TableViewButton
            onClick={() => setViewIntegration(row.original)}
            label={`View ${row.original.display_name || row.original.name}`}
          />
        ),
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
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
            <a href={getApiDocsUrl()} target="_blank" rel="noreferrer">
              Partner API docs
            </a>
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

      <DetailsDrawer
        open={!!viewIntegration}
        onClose={() => setViewIntegration(null)}
        title={viewIntegration?.display_name || viewIntegration?.name || "Integration"}
        description="Outbound API endpoint configuration"
      >
        {viewIntegration ? (
          <>
            <DetailSection title="Identity">
              <DetailGrid
                fields={[
                  { label: "Display name", value: viewIntegration.display_name },
                  { label: "Internal name", value: viewIntegration.name, mono: true },
                  { label: "Version", value: viewIntegration.version },
                  {
                    label: "Status",
                    value: viewIntegration.is_active ? "Active" : "Inactive",
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Endpoint">
              <DetailGrid
                fields={[
                  {
                    label: "Base URL",
                    value: viewIntegration.base_url,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "Path template",
                    value: viewIntegration.path_template,
                    mono: true,
                    fullWidth: true,
                  },
                  { label: "ID", value: viewIntegration.id, mono: true, fullWidth: true },
                ]}
              />
            </DetailSection>
          </>
        ) : null}
      </DetailsDrawer>
    </div>
  );
}
