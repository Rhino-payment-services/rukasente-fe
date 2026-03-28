"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useBorrowersList } from "@/hooks/use-borrowers";

export default function BorrowersPage() {
  const { data, isLoading, error } = useBorrowersList();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Borrowers</h1>
      <Card>
        <CardHeader>
          <CardTitle>Borrower profiles</CardTitle>
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
                    <th className="py-2 pr-4">RukaPay user</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2">KYC</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((row: Record<string, unknown>) => (
                    <tr
                      key={String(row.id ?? row.rukapay_user_id)}
                      className="border-b border-border/60"
                    >
                      <td className="py-2 pr-4 font-mono text-xs">
                        {String(row.rukapay_user_id ?? "")}
                      </td>
                      <td className="py-2 pr-4">{String(row.full_name ?? "")}</td>
                      <td className="py-2">{String(row.kyc_status ?? "")}</td>
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
