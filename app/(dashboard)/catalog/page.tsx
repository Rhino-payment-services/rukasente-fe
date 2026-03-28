"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { usePermissionsCatalog, useRoles } from "@/hooks/use-catalog";

export default function CatalogPage() {
  const roles = useRoles();
  const perms = usePermissionsCatalog();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Roles & permissions</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.isLoading && <CompactLoading />}
            {roles.error && (
              <p className="text-destructive text-sm">
                {(roles.error as Error).message}
              </p>
            )}
            {roles.data && (
              <ul className="text-sm space-y-2 max-h-96 overflow-y-auto">
                {roles.data.map((r) => (
                  <li key={r.id} className="border-b border-border/40 pb-2">
                    <span className="font-medium">{r.name}</span>
                    {r.description && (
                      <p className="text-muted-foreground text-xs">{r.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {perms.isLoading && <CompactLoading />}
            {perms.error && (
              <p className="text-destructive text-sm">
                {(perms.error as Error).message}
              </p>
            )}
            {perms.data && (
              <ul className="text-sm space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
                {perms.data.map((p) => (
                  <li key={p.id} className="py-0.5 border-b border-border/30">
                    {p.key}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
