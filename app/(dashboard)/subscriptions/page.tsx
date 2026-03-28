"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useSubscriptionsList } from "@/hooks/use-subscriptions";

export default function SubscriptionsPage() {
  const { data, isLoading, error } = useSubscriptionsList();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ruka Sente subscriptions</CardTitle>
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
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((row: Record<string, unknown>) => (
                    <tr
                      key={String(row.id)}
                      className="border-b border-border/60"
                    >
                      <td className="py-2 pr-4 font-mono text-xs">
                        {String(row.rukapay_user_id ?? "")}
                      </td>
                      <td className="py-2 pr-4">{String(row.status ?? "")}</td>
                      <td className="py-2 text-xs">
                        {row.subscribed_at
                          ? String(row.subscribed_at)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">Total: {data.total}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
