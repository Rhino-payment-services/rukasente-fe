"use client";

import { useState } from "react";
import { Banknote, CircleDollarSign, Percent, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { useRepaymentsByProduct } from "@/hooks/use-loan";
import { Perm } from "@/lib/permissions";
import { defaultLoanExportDateRange } from "@/lib/loan-export";
import { cn } from "@/lib/utils";

function formatMoney(amount: number, currency = "UGX") {
  const code = currency || "UGX";
  return `${code} ${Number(amount || 0).toLocaleString()}`;
}

export default function RepaymentsPage() {
  const { can } = usePermissions();
  const initial = defaultLoanExportDateRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [applied, setApplied] = useState(initial);
  const summaryQ = useRepaymentsByProduct({
    from: applied.from || undefined,
    to: applied.to || undefined,
  });
  const data = summaryQ.data;
  const currency = data?.currency || "UGX";
  const items = data?.items ?? [];

  if (!can(Perm.LoanApplicationView)) {
    return (
      <NoAccess description="You need loan.application.view to open repayments." />
    );
  }

  function applyRange() {
    setApplied({ from, to });
  }

  function showAllTime() {
    setFrom("");
    setTo("");
    setApplied({ from: "", to: "" });
  }

  const periodLabel =
    data?.from && data?.to
      ? `${data.from} to ${data.to}`
      : "All posted repayments";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Repayments
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          How much has been collected, by loan product. Dates are inclusive East
          Africa Time days. Reversed repayments are left out.
        </p>
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Paid from
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Paid to
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)]"
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-10 rounded-lg bg-main-600 px-3 text-xs text-white hover:bg-main-700"
              onClick={applyRange}
            >
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 rounded-lg border-slate-200 px-3 text-xs"
              onClick={showAllTime}
            >
              All time
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TotalCard
          title="Collected"
          value={formatMoney(data?.amount ?? 0, currency)}
          hint={periodLabel}
          icon={CircleDollarSign}
          tone="navy"
          loading={summaryQ.isLoading}
        />
        <TotalCard
          title="Principal"
          value={formatMoney(data?.principal_paid ?? 0, currency)}
          hint={`${data?.repayment_count ?? 0} posted repayments`}
          icon={Banknote}
          tone="blue"
          loading={summaryQ.isLoading}
        />
        <TotalCard
          title="Interest"
          value={formatMoney(data?.interest_paid ?? 0, currency)}
          hint="Interest collected"
          icon={Percent}
          tone="green"
          loading={summaryQ.isLoading}
        />
        <TotalCard
          title="Fees"
          value={formatMoney(data?.fee_paid ?? 0, currency)}
          hint="Fees collected"
          icon={Receipt}
          tone="amber"
          loading={summaryQ.isLoading}
        />
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-0 py-0">
          {summaryQ.isLoading ? (
            <div className="px-4 py-8">
              <CompactLoading />
            </div>
          ) : summaryQ.isError ? (
            <p className="px-4 py-8 text-sm text-rose-700">
              Could not load repayment totals. Check the dates and try again.
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500">
              No posted repayments in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Loan product</th>
                    <th className="px-4 py-3 text-right">Repayments</th>
                    <th className="px-4 py-3 text-right">Collected</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Interest</th>
                    <th className="px-4 py-3 text-right">Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr
                      key={`${row.product_id}-${row.currency}`}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {row.product_name}
                        </p>
                        {row.product_code ? (
                          <p className="text-xs text-slate-500">{row.product_code}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {row.repayment_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                        {formatMoney(row.amount, row.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatMoney(row.principal_paid, row.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatMoney(row.interest_paid, row.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatMoney(row.fee_paid, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TotalCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "navy" | "blue" | "green" | "amber";
  loading?: boolean;
}) {
  const tones = {
    navy: "bg-[rgba(8,22,61,0.07)] text-[#08163d]",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
      <CardContent className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">{title}</p>
            {loading ? (
              <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900 tabular-nums">
                {value}
              </p>
            )}
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p>
          </div>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              tones[tone]
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
