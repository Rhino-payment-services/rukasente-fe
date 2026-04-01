"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";
import { useLoanApplication, useLoanApplicationReviews, useReviewLoanApplication } from "@/hooks/use-loan";

export default function LoanApplicationDetailPage({ params }: { params: { id: string } }) {
  const appQ = useLoanApplication(params.id);
  const reviewsQ = useLoanApplicationReviews(params.id);
  const review = useReviewLoanApplication(params.id);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("sent_to_review");
  const [notes, setNotes] = useState("");

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    await review.mutateAsync({ action, notes });
    setOpen(false);
    setNotes("");
  }

  const app = appQ.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Loan application detail</h1>
        <Button type="button" onClick={() => setOpen(true)} disabled={!app}>
          Review action
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-2 pt-4">
          {!app ? (
            <p className="text-sm text-muted-foreground">Loading application...</p>
          ) : (
            <>
              <p><span className="font-medium">Application:</span> {app.application_number}</p>
              <p><span className="font-medium">Borrower:</span> {app.borrower_profile_id}</p>
              <p><span className="font-medium">Product:</span> {app.loan_product_id}</p>
              <p><span className="font-medium">Requested amount:</span> {app.requested_amount}</p>
              <p><span className="font-medium">Tenor:</span> {app.requested_tenor_days} days</p>
              <p><span className="font-medium">Purpose:</span> {app.purpose || "—"}</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <LoanStatusBadge status={app.status} />
              </div>
              <p><span className="font-medium">Decision reason:</span> {app.decision_reason || "—"}</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="mb-2 text-sm font-medium">Review history</p>
          {reviewsQ.data?.length ? (
            <ul className="space-y-2 text-sm">
              {reviewsQ.data.map((r) => (
                <li key={r.id} className="rounded border border-border/60 p-2">
                  <span className="font-medium">{r.action}</span> - {r.notes || "No notes"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </CardContent>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-xl">
            <h2 className="text-lg font-semibold">Review action</h2>
            <form className="mt-3 space-y-3" onSubmit={submitReview}>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="sent_to_review">send to review</option>
                <option value="approved">approve</option>
                <option value="declined">decline</option>
                <option value="cancelled">cancel</option>
              </select>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={review.isPending}>
                  {review.isPending ? "Submitting..." : "Submit"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
