"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBorrowerLoans } from "@/hooks/use-borrowers";
import {
  useLoanMnoPrompt,
  useSendLoanMnoPromptForApplication,
} from "@/hooks/use-loan";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";
import { inferUgandaMobileNetwork } from "@/lib/uganda-phone";
import type { BorrowerLoan } from "@/types/loan";

const REPAYABLE = new Set([
  "disbursed",
  "repaying",
  "overdue",
  "active",
  "partially_paid",
]);

function formatMoney(amount: number, currency = "UGX") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

function apiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    const msg = data?.error?.message ?? data?.message;
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function repayableLoans(loans: BorrowerLoan[], loanApplicationId?: string) {
  return loans.filter((loan) => {
    if (loanApplicationId && loan.loan_application_id !== loanApplicationId) {
      return false;
    }
    return (
      Number(loan.outstanding_balance) > 0 &&
      REPAYABLE.has(String(loan.status || "").toLowerCase())
    );
  });
}

export function PromptRepaymentButton({
  profileId,
  phone,
  loanApplicationId,
  className,
}: {
  profileId: string;
  phone?: string;
  loanApplicationId?: string;
  className?: string;
}) {
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);
  if (!can(Perm.LoanRepayment) || !profileId) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        title="Send a mobile money prompt for repayment"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Smartphone className="size-3.5" />
        Prompt repayment
      </Button>
      <PromptRepaymentDialog
        open={open}
        onOpenChange={setOpen}
        profileId={profileId}
        phone={phone || ""}
        loanApplicationId={loanApplicationId}
      />
    </>
  );
}

function PromptRepaymentDialog({
  open,
  onOpenChange,
  profileId,
  phone,
  loanApplicationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  phone: string;
  loanApplicationId?: string;
}) {
  const loansQ = useBorrowerLoans(open ? profileId : "");
  const send = useSendLoanMnoPromptForApplication();
  const loans = useMemo(
    () => repayableLoans(loansQ.data?.items ?? [], loanApplicationId),
    [loansQ.data?.items, loanApplicationId],
  );
  const [selectedId, setSelectedId] = useState(loanApplicationId || "");
  const [amount, setAmount] = useState("");
  const [promptPhone, setPromptPhone] = useState(phone);
  const [error, setError] = useState("");

  const selected = loans.find((loan) => loan.loan_application_id === selectedId) ?? loans[0];
  const promptQ = useLoanMnoPrompt(open ? selected?.loan_application_id : undefined);
  const network = inferUgandaMobileNetwork(promptPhone);
  const outstanding = Number(selected?.outstanding_balance || 0);
  const currency = selected?.currency || "UGX";
  const waiting = promptQ.data?.status === "pending";

  useEffect(() => {
    if (!open) return;
    setPromptPhone(phone);
    setError("");
  }, [open, phone]);

  useEffect(() => {
    if (!open || loans.length === 0) return;
    const next =
      loans.find((loan) => loan.loan_application_id === (loanApplicationId || selectedId)) ??
      loans[0];
    setSelectedId(next.loan_application_id);
    setAmount(String(Number(next.outstanding_balance || 0)));
  }, [open, loans, loanApplicationId, selectedId]);

  async function submit() {
    if (!selected) {
      setError("This borrower has no outstanding loan to collect.");
      return;
    }
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid repayment amount.");
      return;
    }
    if (value > outstanding) {
      setError(`Amount cannot exceed the outstanding balance of ${formatMoney(outstanding, currency)}.`);
      return;
    }
    if (!network) {
      setError("Enter an MTN or Airtel number.");
      return;
    }
    setError("");
    try {
      await send.mutateAsync({
        applicationId: selected.loan_application_id,
        amount: value,
        phone: promptPhone.trim(),
        idempotency_key: `mno-repay-${selected.loan_application_id}-${crypto.randomUUID()}`,
      });
      toast.success("Prompt sent. Waiting for the customer to approve on their phone.");
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to send the mobile money prompt"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prompt repayment</DialogTitle>
          <DialogDescription>
            Sends an MTN or Airtel prompt. The loan is updated after the customer approves.
          </DialogDescription>
        </DialogHeader>
        {loansQ.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Loading loans…
          </p>
        ) : loans.length === 0 ? (
          <p className="text-sm text-slate-500">
            This borrower has no outstanding loan to collect.
          </p>
        ) : (
          <div className="space-y-3">
            {loans.length > 1 && !loanApplicationId ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Loan
                <select
                  value={selected?.loan_application_id || ""}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                  {loans.map((loan) => (
                    <option key={loan.loan_application_id} value={loan.loan_application_id}>
                      {loan.product_name || "Loan"} · {formatMoney(loan.outstanding_balance, loan.currency)} outstanding
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm text-slate-700">
                <span className="font-medium">{selected?.product_name || "Loan"}</span>
                <span className="text-slate-500">
                  {" "}
                  · {formatMoney(outstanding, currency)} outstanding
                </span>
              </p>
            )}
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Amount
              <input
                type="number"
                min={1}
                max={outstanding || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Phone {network ? `· ${network}` : ""}
              <input
                type="tel"
                value={promptPhone}
                onChange={(e) => setPromptPhone(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              />
            </label>
            {waiting ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Waiting for the customer to approve on their phone.
              </p>
            ) : null}
            {promptQ.data?.status === "failed" && promptQ.data.message ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {promptQ.data.message}
              </p>
            ) : null}
            {error ? <p className="text-xs text-rose-700">{error}</p> : null}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            className="bg-main-600 text-white hover:bg-main-700"
            disabled={send.isPending || loans.length === 0 || waiting}
            onClick={() => void submit()}
          >
            {send.isPending ? "Sending…" : "Send prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
