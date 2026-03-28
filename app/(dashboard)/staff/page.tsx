"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useStaffList } from "@/hooks/use-staff";

export default function StaffPage() {
  const { data, isLoading, error } = useStaffList();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
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
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-4">{row.full_name}</td>
                      <td className="py-2 pr-4">{row.email}</td>
                      <td className="py-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {data.total} · Page {data.page} / {data.total_pages ?? "—"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
