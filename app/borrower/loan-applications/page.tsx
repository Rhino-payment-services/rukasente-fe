"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";
import { useBorrowerContext } from "@/components/providers/borrower-provider";
import { useBorrowerLoanApplications } from "@/hooks/use-loan";

export default function BorrowerApplicationsPage() {
  const { rukapayUserId } = useBorrowerContext();
  const appsQ = useBorrowerLoanApplications(rukapayUserId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My loan applications</h1>
      <Card>
        <CardContent className="pt-4">
          {appsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : appsQ.data?.items?.length ? (
            <ul className="space-y-2">
              {appsQ.data.items.map((app) => (
                <li key={app.id} className="rounded border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{app.application_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Amount {app.requested_amount} · Tenor {app.requested_tenor_days} days
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <LoanStatusBadge status={app.status} />
                      <Link className="text-xs underline" href={`/borrower/loan-applications/${app.id}`}>
                        View
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No applications found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
