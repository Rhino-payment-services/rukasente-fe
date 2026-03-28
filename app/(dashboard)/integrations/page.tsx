"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useIntegrations } from "@/hooks/use-integrations";

export default function IntegrationsPage() {
  const { data, isLoading, error } = useIntegrations();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Integrations</h1>
      <Card>
        <CardHeader>
          <CardTitle>External API endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <CompactLoading />}
          {error && (
            <p className="text-destructive text-sm">{(error as Error).message}</p>
          )}
          {data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Base URL</th>
                    <th className="py-2 pr-4">Path</th>
                    <th className="py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-4">{row.display_name || row.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs max-w-[200px] truncate">
                        {row.base_url}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">{row.path_template}</td>
                      <td className="py-2">{row.is_active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
