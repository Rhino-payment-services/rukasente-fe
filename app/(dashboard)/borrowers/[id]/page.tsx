"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, BellRing, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { LoanStatusBadge } from "@/components/dashboard/loan-status-badge";
import {
  useBorrower,
  useBorrowerLoans,
  useSendLoanReminder,
  useSyncBorrowerFromRukaPay,
  borrowerSourceLabel,
} from "@/hooks/use-borrowers";
import { hasPermission, Perm } from "@/lib/permissions";
import type { BorrowerLoan } from "@/types/loan";

function formatMoney(amount: number, currency = "UGX") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
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

function formatDateOnly(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isOverdue(loan: BorrowerLoan) {
  if (Number(loan.outstanding_balance) <= 0) return false;
  if (!loan.due_date) return false;
  const due = new Date(loan.due_date);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

export default function BorrowerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const borrowerQ = useBorrower(id);
  const loansQ = useBorrowerLoans(id);
  const canRemind = hasPermission(session?.user?.permissions, Perm.LoanRepayment);
  const canSyncBorrower = hasPermission(
    session?.user?.permissions,
    Perm.BorrowerUpdate
  );
  const syncBorrower = useSyncBorrowerFromRukaPay();

  const borrower = borrowerQ.data;
  const loans = loansQ.data?.items ?? [];
  const name = borrower?.full_name || loansQ.data?.borrower_name || "Borrower";
  const phone = borrower?.phone || loansQ.data?.borrower_phone || "";

  const activeLoans = loans.filter((l) => Number(l.outstanding_balance) > 0);

  async function syncFromRukaPay() {
    const profileId = borrower?.id?.trim();
    if (!profileId) {
      toast.error("Missing borrower profile id");
      return;
    }
    try {
      await syncBorrower.mutateAsync({ id: profileId });
      toast.success("Borrower profile synced from RukaPay");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sync borrower from RukaPay"
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <div className="min-w-0">
          <Link
            href="/borrowers"
            className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to borrowers
          </Link>
          <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
            {name}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {phone || "—"}
            {borrower?.email ? ` · ${borrower.email}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {borrower ? (
            <>
              {canSyncBorrower ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 rounded-lg text-xs"
                  disabled={syncBorrower.isPending}
                  onClick={() => void syncFromRukaPay()}
                >
                  {syncBorrower.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Sync KYC
                </Button>
              ) : null}
              <span
                className="inline-flex rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700"
                title={
                  borrower.partner?.code
                    ? `${borrowerSourceLabel(borrower)} (${borrower.partner.code})`
                    : borrowerSourceLabel(borrower)
                }
              >
                {borrowerSourceLabel(borrower)}
              </span>
              <span className="inline-flex rounded px-2 py-1 text-xs font-medium capitalize bg-slate-100 text-slate-700">
                KYC: {borrower.kyc_status || "—"}
              </span>
              <LoanStatusBadge status={borrower.status} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Loans" value={String(loans.length)} />
        <SummaryTile label="With balance" value={String(activeLoans.length)} />
        <SummaryTile
          label="Total outstanding"
          value={formatMoney(
            activeLoans.reduce((s, l) => s + Number(l.outstanding_balance || 0), 0),
            loans[0]?.currency || "UGX"
          )}
          emphasize
        />
      </div>

      <Card className="gap-0 border-slate-200 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">
            Borrower profile
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Full name" value={borrower?.full_name || "—"} />
            <Metric label="Phone number" value={borrower?.phone || "—"} />
            <Metric label="Email" value={borrower?.email || "—"} />
            <Metric label="NIN / National ID" value={borrower?.national_id || "—"} />
            <Metric
              label="Date of birth"
              value={formatDateOnly(borrower?.date_of_birth)}
            />
            <Metric
              label="Gender"
              value={
                borrower?.gender
                  ? String(borrower.gender).replace(/_/g, " ")
                  : "—"
              }
            />
            <Metric
              label="Source platform"
              value={borrower ? borrowerSourceLabel(borrower) : "—"}
            />
            <Metric
              label="KYC status"
              value={borrower?.kyc_status ? borrower.kyc_status : "—"}
            />
            <Metric
              label="Account status"
              value={borrower?.status ? borrower.status : "—"}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 border-slate-200 bg-white py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Loans</p>
          {loansQ.isLoading ? (
            <CompactLoading message="Loading loans…" />
          ) : loansQ.error ? (
            <p className="text-sm text-destructive">
              {(loansQ.error as Error).message}
            </p>
          ) : loans.length === 0 ? (
            <p className="text-sm text-slate-500">
              This borrower has no loans yet. Loans appear after an application is
              disbursed to their RukaPay wallet.
            </p>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  profileId={id}
                  canRemind={canRemind}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoanCard({
  loan,
  profileId,
  canRemind,
}: {
  loan: BorrowerLoan;
  profileId: string;
  canRemind: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reminder = useSendLoanReminder(profileId);
  const currency = loan.currency || "UGX";
  const outstanding = Number(loan.outstanding_balance || 0);
  const pending = outstanding > 0;
  const overdue = isOverdue(loan);

  async function sendReminder() {
    try {
      const res = await reminder.mutateAsync(loan.loan_application_id);
      if (res.sent) {
        toast.success(`Reminder sent to ${res.to}`);
      } else {
        toast.error(res.error || "Reminder could not be delivered");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminder");
    }
  }

  return (
    <div
      className={`rounded-xl border ${
        overdue ? "border-amber-300 bg-amber-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">
              {loan.product_name || "Loan"}
            </p>
            <LoanStatusBadge status={loan.status} />
            {overdue ? (
              <span className="inline-flex rounded px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-100">
                Overdue
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {loan.loan_number || loan.account_number}
            {loan.application_number ? ` · ${loan.application_number}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canRemind && pending ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-lg text-xs"
              disabled={reminder.isPending}
              onClick={() => void sendReminder()}
            >
              {reminder.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <BellRing className="size-3.5" />
              )}
              Send reminder
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 rounded-lg text-xs text-slate-600"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "Details"}
            <ChevronDown
              className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 px-3.5 py-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Outstanding"
          value={formatMoney(outstanding, currency)}
          emphasize={pending}
        />
        <Metric label="Paid" value={formatMoney(loan.amount_repaid, currency)} />
        <Metric
          label="Total repayable"
          value={formatMoney(loan.total_repayable, currency)}
        />
        <Metric label="Due date" value={formatDate(loan.due_date)} />
      </div>

      {open ? (
        <div className="space-y-4 border-t border-slate-100 px-3.5 py-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Repayment schedule
            </p>
            {loan.schedule && loan.schedule.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/95">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">#</th>
                      <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Due</th>
                      <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Amount due</th>
                      <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Paid</th>
                      <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loan.schedule.map((s) => (
                      <tr
                        key={s.installment}
                        className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/90"
                      >
                        <td className="px-3 py-2">{s.installment}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {formatDate(s.due_date)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(s.amount_due ?? 0, currency)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(s.amount_paid ?? 0, currency)}
                        </td>
                        <td className="px-3 py-2 capitalize">
                          {(s.status || "—").replace(/_/g, " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No schedule available.</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment history
            </p>
            {loan.repayments && loan.repayments.length > 0 ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {loan.repayments.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-50 text-slate-700 last:border-0 hover:bg-slate-50/90"
                      >
                        <td className="px-3 py-2">{r.repayment_number}</td>
                        <td className="px-3 py-2 font-medium">
                          {formatMoney(r.amount, currency)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(r.principal_paid, currency)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(r.interest_paid, currency)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(r.outstanding_after, currency)}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {formatDate(r.posted_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No repayments recorded yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-lg font-semibold tracking-tight ${
          emphasize ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold tracking-tight ${
          emphasize ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
