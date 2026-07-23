"use client";

import { use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";
import { useBorrowerLoanApplication } from "@/hooks/use-loan";

export default function BorrowerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const appQ = useBorrowerLoanApplication(id);
  const app = appQ.data;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Application detail</h1>
      <Card>
        <CardContent className="space-y-2 pt-4">
          {!app ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <p><span className="font-medium">Application:</span> {app.application_number}</p>
              <p><span className="font-medium">Product:</span> {app.loan_product_id}</p>
              <p><span className="font-medium">Requested amount:</span> {app.requested_amount}</p>
              <p><span className="font-medium">Tenor:</span> {app.requested_tenor_days} days</p>
              <p><span className="font-medium">Purpose:</span> {app.purpose || "—"}</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <LoanStatusBadge status={app.status} />
              </div>
              <p><span className="font-medium">Submitted at:</span> {app.submitted_at}</p>
              <p><span className="font-medium">Decision reason:</span> {app.decision_reason || "—"}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
