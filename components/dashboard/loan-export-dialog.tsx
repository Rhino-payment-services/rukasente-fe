"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { usePartners } from "@/hooks/use-partners";
import { usePermissions } from "@/hooks/use-permissions";
import {
  defaultLoanExportDateRange,
  downloadLoanExport,
  type LoanExportFilters,
} from "@/lib/loan-export";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "disbursed", label: "Disbursed" },
  { value: "overdue", label: "Overdue" },
  { value: "repaid", label: "Repaid" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

type LoanExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: string;
};

export function LoanExportDialog({
  open,
  onOpenChange,
  initialStatus = "",
}: LoanExportDialogProps) {
  const { isPlatform } = usePermissions();
  const defaults = defaultLoanExportDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [status, setStatus] = useState(initialStatus);
  const [partnerId, setPartnerId] = useState("");
  const [exporting, setExporting] = useState<"book" | "repayments" | null>(null);

  const partnersQ = usePartners({
    page: 1,
    page_size: 100,
    enabled: isPlatform && open,
  });
  const partners = partnersQ.data?.items ?? [];

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      const range = defaultLoanExportDateRange();
      setFrom(range.from);
      setTo(range.to);
    }
  }, [open, initialStatus]);

  function buildFilters(): LoanExportFilters {
    return {
      from: from.trim() || undefined,
      to: to.trim() || undefined,
      status: status.trim() || undefined,
      partner_id: isPlatform && partnerId.trim() ? partnerId.trim() : undefined,
    };
  }

  async function runExport(kind: "book" | "repayments") {
    setExporting(kind);
    try {
      await downloadLoanExport(kind, buildFilters());
      toast.success(
        kind === "book"
          ? "Loan book exported"
          : "Repayments exported"
      );
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export for reconciliation</DialogTitle>
          <DialogDescription>
            Download CSV files to reconcile loans and repayments with RukaPay.
            Exports are capped at 10,000 rows — narrow the date range if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-5 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">From</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">To</label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Status (loan book only)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {isPlatform ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Partner (optional)
              </label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)]"
              >
                <option value="">All partners</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!exporting}
            onClick={() => void runExport("book")}
          >
            <Download className="size-3.5" />
            {exporting === "book" ? "Exporting…" : "Loan book (CSV)"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#08163d] text-white hover:bg-[#06102a]"
            disabled={!!exporting}
            onClick={() => void runExport("repayments")}
          >
            <Download className="size-3.5" />
            {exporting === "repayments" ? "Exporting…" : "Repayments (CSV)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
