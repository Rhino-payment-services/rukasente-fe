"use client";

import Link from "next/link";
import { FormEvent, use, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";
import {
  useInitiateLoanRepayment,
  useLoanAccount,
  useLoanApplication,
  useLoanApplicationReviews,
  useLoanLedger,
  useLoanRepayments,
  useReviewLoanApplication,
} from "@/hooks/use-loan";
import { hasPermission, Perm } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";

function formatMoney(amount: number, currency = "UGX") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

/** Pull the backend's real error message (envelope `error.message`) from an axios/unknown error. */
function apiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string; code?: string }; message?: string }
      | undefined;
    const msg = data?.error?.message ?? data?.message;
    if (msg) return msg;
    if (err.response?.status) {
      return `${fallback} (HTTP ${err.response.status})`;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LoanApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const { permissions: livePerms } = usePermissions();
  const { id } = use(params);
  const appQ = useLoanApplication(id);
  const reviewsQ = useLoanApplicationReviews(id);
  const accountQ = useLoanAccount(id);
  const repaymentsQ = useLoanRepayments(id);
  const ledgerQ = useLoanLedger(id);
  const review = useReviewLoanApplication(id);
  const repay = useInitiateLoanRepayment(id);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("sent_to_review");
  const [notes, setNotes] = useState("");
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState("");
  const [showLedger, setShowLedger] = useState(false);

  const permissions =
    livePerms.length > 0 ? livePerms : session?.user?.permissions ?? [];
  const canReview = hasPermission(permissions, Perm.LoanApplicationReview);
  const canApprove = hasPermission(permissions, Perm.LoanApplicationApprove);
  const canDecline = hasPermission(permissions, Perm.LoanApplicationDecline);
  const canRepay = hasPermission(permissions, Perm.LoanRepayment);

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!canReview) {
      toast.error("You do not have permission to review applications.");
      return;
    }
    if (action === "approved" && !canApprove) {
      toast.error("You do not have approve permission.");
      return;
    }
    if (action === "declined" && !canDecline) {
      toast.error("You do not have decline permission.");
      return;
    }
    try {
      await review.mutateAsync({ action, notes });
      toast.success("Review submitted");
      setOpen(false);
      setNotes("");
    } catch (err) {
      toast.error((err as Error).message || "Failed to submit review");
    }
  }

  async function submitRepayment(e: FormEvent) {
    e.preventDefault();
    setRepayError("");
    if (!canRepay) {
      setRepayError("You do not have permission to record repayments.");
      return;
    }
    const amount = Number(repayAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRepayError("Enter a valid repayment amount.");
      return;
    }
    const outstanding = accountQ.data?.outstanding_balance ?? 0;
    if (outstanding > 0 && amount > outstanding) {
      setRepayError(`Amount cannot exceed outstanding ${formatMoney(outstanding, currency)}`);
      return;
    }
    try {
      const idempotencyKey = `admin-repay-${id}-${crypto.randomUUID()}`;
      await repay.mutateAsync({
        amount,
        idempotency_key: idempotencyKey,
      });
      toast.success("Repayment recorded");
      setRepayOpen(false);
      setRepayAmount("");
      setRepayError("");
    } catch (err) {
      // Surface the backend's real message (e.g. insufficient wallet balance on
      // the RukaPay collection) inline on this modal instead of a generic failure.
      setRepayError(apiErrorMessage(err, "Failed to record repayment"));
    }
  }

  const app = appQ.data;
  const account = accountQ.data;
  const currency = account?.currency || app?.currency || "UGX";

  const paidPct = useMemo(() => {
    if (!account?.total_repayable) return 0;
    return Math.min(
      100,
      Math.round((Number(account.amount_repaid || 0) / Number(account.total_repayable)) * 100)
    );
  }, [account]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0">
          <Link
            href="/loan-applications"
            className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to applications
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {app?.application_number ?? "Loan application"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Review details, loan account balances, and repayment history
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {account && canRepay && Number(account.outstanding_balance) > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-xs"
              onClick={() => {
                setRepayAmount("");
                setRepayError("");
                setRepayOpen(true);
              }}
            >
              Record repayment
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
            onClick={() => setOpen(true)}
            disabled={!app || !canReview}
          >
            Review action
          </Button>
        </div>
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          {appQ.isLoading || !app ? (
            <CompactLoading message="Loading application…" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail
                label="Borrower"
                value={app.borrower_name || "Unknown borrower"}
                hint={app.borrower_phone || app.borrower_email || app.borrower_profile_id}
              />
              <Detail
                label="Product"
                value={app.product_name || "Unknown product"}
                hint={app.product_code || app.loan_product_id}
              />
              <Detail
                label="Requested amount"
                value={formatMoney(app.requested_amount, app.currency || "UGX")}
              />
              <Detail label="Tenor" value={`${app.requested_tenor_days} days`} />
              <Detail label="Purpose" value={app.purpose || "—"} />
              {app.loan_kind === "product" ? (
                <>
                  <Detail
                    label="Loan kind"
                    value="Product loan"
                    hint="Disbursed to the partner merchant after USSD approval"
                  />
                  <Detail
                    label="Partner product"
                    value={app.product_label || "—"}
                    hint={app.partner_product_ref || undefined}
                  />
                  <Detail
                    label="Merchant destination"
                    value={app.disbursement_merchant_code || app.disbursement_merchant_id || "—"}
                  />
                  <Detail
                    label="Down payment"
                    value={
                      app.down_payment_amount != null
                        ? formatMoney(app.down_payment_amount, app.currency || "UGX")
                        : "—"
                    }
                  />
                  <Detail
                    label="Customer approval"
                    value={
                      app.customer_approved_at
                        ? formatDate(app.customer_approved_at)
                        : app.customer_declined_at
                          ? `Declined ${formatDate(app.customer_declined_at)}`
                          : app.status === "pending_customer_approval"
                            ? "Waiting for USSD PIN"
                            : "—"
                    }
                    hint={app.customer_approval_channel || undefined}
                  />
                </>
              ) : null}
              <div>
                <p className="text-[11px] font-medium text-slate-500">Status</p>
                <div className="mt-1">
                  <LoanStatusBadge status={app.status} />
                </div>
              </div>
              <Detail label="Submitted" value={formatDate(app.submitted_at)} />
              <Detail label="Decision reason" value={app.decision_reason || "—"} />
              <Detail
                label="Channel"
                value={(app.submission_channel || "—").replace(/_/g, " ")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Loan account</p>
            {account ? <LoanStatusBadge status={account.status} /> : null}
          </div>

          {accountQ.isLoading ? (
            <CompactLoading message="Loading loan account…" />
          ) : !account ? (
            <p className="text-sm text-slate-500">
              No loan account yet. It appears after disbursement
              {app?.loan_kind === "product"
                ? " to the partner merchant."
                : " to the borrower's RukaPay wallet."}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Outstanding"
                  value={formatMoney(account.outstanding_balance, currency)}
                  emphasize
                />
                <Metric
                  label="Paid so far"
                  value={formatMoney(account.amount_repaid, currency)}
                  hint={`${paidPct}% of ${formatMoney(account.total_repayable, currency)}`}
                />
                <Metric
                  label="Total repayable"
                  value={formatMoney(account.total_repayable, currency)}
                  hint={[
                    `Principal ${formatMoney(account.principal_amount, currency)}`,
                    `Interest ${formatMoney(account.interest_amount, currency)}`,
                    account.processing_fee && account.processing_fee_mode === "add_to_repayable"
                      ? `Fee ${formatMoney(account.processing_fee, currency)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <Metric
                  label="Repayments"
                  value={String(account.repayment_count || 0)}
                  hint={account.account_number || account.loan_number}
                />
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Account number" value={account.account_number || "—"} />
                <Detail label="Loan number" value={account.loan_number || "—"} />
                <Detail
                  label="Display reference"
                  value={account.display_reference || "—"}
                />
                <Detail
                  label="Principal remaining"
                  value={formatMoney(account.principal_balance, currency)}
                  hint={`Paid ${formatMoney(account.principal_repaid, currency)}`}
                />
                <Detail
                  label="Interest remaining"
                  value={formatMoney(account.interest_balance, currency)}
                  hint={`Paid ${formatMoney(account.interest_repaid, currency)}`}
                />
                <Detail
                  label="Fee remaining"
                  value={formatMoney(account.fee_balance ?? 0, currency)}
                  hint={
                    account.processing_fee_mode === "deduct_from_disbursement"
                      ? `Deducted at disbursement (${formatMoney(account.processing_fee ?? 0, currency)})`
                      : account.processing_fee
                        ? `Processing fee ${formatMoney(account.processing_fee, currency)}`
                        : undefined
                  }
                />
                <Detail
                  label="Cash disbursed"
                  value={formatMoney(account.disbursed_amount, currency)}
                  hint={
                    account.processing_fee_mode === "deduct_from_disbursement" &&
                    (account.processing_fee ?? 0) > 0
                      ? `Principal ${formatMoney(account.principal_amount, currency)} minus fee`
                      : undefined
                  }
                />
                <Detail label="Disbursed" value={formatDate(account.disbursed_at)} />
                <Detail label="Due date" value={formatDate(account.due_date)} />
                <Detail label="Fully repaid" value={formatDate(account.repaid_at)} />
                <Detail
                  label="Interest method"
                  value={
                    account.interest_calculation_method === "COMPOUND"
                      ? `Compound${
                          account.compounding_frequency
                            ? ` · ${account.compounding_frequency}`
                            : ""
                        }`
                      : "Simple"
                  }
                  hint={`${account.interest_rate}%${
                    account.interest_type ? ` · ${account.interest_type}` : ""
                  }`}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Repayment history</p>
          {repaymentsQ.isLoading ? (
            <CompactLoading message="Loading repayments…" />
          ) : repaymentsQ.data?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/95">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">#</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Amount</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Principal</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Interest</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Outstanding after</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Posted</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {repaymentsQ.data.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/90">
                      <td className="px-3 py-2">{row.repayment_number}</td>
                      <td className="px-3 py-2 font-medium">
                        {formatMoney(row.amount, currency)}
                      </td>
                      <td className="px-3 py-2">
                        {formatMoney(row.principal_paid, currency)}
                      </td>
                      <td className="px-3 py-2">
                        {formatMoney(row.interest_paid, currency)}
                      </td>
                      <td className="px-3 py-2">
                        {formatMoney(row.outstanding_after, currency)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {formatDate(row.posted_at)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {row.partner_ref || row.partner_txn_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {account
                ? "No repayments recorded yet."
                : "Repayment history will appear after disbursement."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Account ledger</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-slate-600"
              onClick={() => setShowLedger((v) => !v)}
              disabled={!account}
            >
              {showLedger ? "Hide" : "Show"}
            </Button>
          </div>
          {!showLedger ? (
            <p className="text-sm text-slate-500">
              Disbursement and repayment events for this loan account.
            </p>
          ) : ledgerQ.isLoading ? (
            <CompactLoading message="Loading ledger…" />
          ) : ledgerQ.data?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/95">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">#</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Type</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Description</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Amount</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Outstanding after</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerQ.data.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/90">
                      <td className="px-3 py-2">{row.entry_number}</td>
                      <td className="px-3 py-2 capitalize">
                        {String(row.entry_type || "").replace(/_/g, " ")}
                      </td>
                      <td className="max-w-[240px] truncate px-3 py-2 text-slate-600">
                        {row.description || "—"}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {formatMoney(row.amount, currency)}
                      </td>
                      <td className="px-3 py-2">
                        {formatMoney(row.outstanding_balance_after, currency)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {formatDate(row.posted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No ledger entries yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Review history</p>
          {reviewsQ.isLoading ? (
            <CompactLoading message="Loading reviews…" />
          ) : reviewsQ.data?.length ? (
            <ul className="space-y-2">
              {reviewsQ.data.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm"
                >
                  <p className="font-medium capitalize text-slate-900">
                    {String(r.action || "").replace(/_/g, " ")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.notes || "No notes"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          )}
        </CardContent>
      </Card>

      {!canReview ? (
        <p className="text-xs text-slate-500">
          You do not have permission to review loan applications.
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Review action</h2>
            <form className="mt-3 space-y-3" onSubmit={submitReview}>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[rgba(8,22,61,0.25)]"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="sent_to_review">Send to review</option>
                {canApprove ? <option value="approved">Approve</option> : null}
                {canDecline ? <option value="declined">Decline</option> : null}
                <option value="cancelled">Cancel</option>
              </select>
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[rgba(8,22,61,0.25)]"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={review.isPending}
                  className="h-9 rounded-xl bg-[#08163d] text-white hover:bg-[#06102a]"
                >
                  {review.isPending ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {repayOpen && account ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Record repayment</h2>
            <p className="mt-1 text-xs text-slate-500">
              Debits the borrower&apos;s RukaPay wallet into RukaSente escrow. Outstanding:{" "}
              <span className="font-medium text-slate-800">
                {formatMoney(account.outstanding_balance, currency)}
              </span>
            </p>
            <form className="mt-3 space-y-3" onSubmit={submitRepayment}>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  min={1}
                  max={account.outstanding_balance}
                  step={1}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[rgba(8,22,61,0.25)]"
                  value={repayAmount}
                  onChange={(e) => {
                    setRepayAmount(e.target.value);
                    if (repayError) setRepayError("");
                  }}
                  placeholder="e.g. 10000"
                  required
                />
              </div>
              {repayError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                >
                  {repayError}
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={repay.isPending}
                  className="h-9 rounded-xl bg-[#08163d] text-white hover:bg-[#06102a]"
                >
                  {repay.isPending ? "Posting..." : "Post repayment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl"
                  onClick={() => {
                    setRepayOpen(false);
                    setRepayError("");
                  }}
                >
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

function Detail({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold tracking-tight ${
          emphasize ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}
