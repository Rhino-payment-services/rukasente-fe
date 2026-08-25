"use client";

export function LoanStatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();
  const cls =
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "fully_paid" ||
    normalized === "disbursed"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "partially_paid" || normalized === "disbursing"
      ? "bg-sky-100 text-sky-800"
      : normalized === "declined" ||
          normalized === "defaulted" ||
          normalized === "written_off" ||
          normalized === "customer_declined" ||
          normalized === "disbursement_failed"
        ? "bg-rose-100 text-rose-800"
        : normalized === "under_review" ||
            normalized === "overdue" ||
            normalized === "pending_customer_approval" ||
            normalized === "pending_retry"
          ? "bg-amber-100 text-amber-800"
          : normalized === "customer_approved" || normalized === "submitted"
            ? "bg-blue-100 text-blue-800"
            : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${cls}`}>
      {normalized.replace(/_/g, " ") || "unknown"}
    </span>
  );
}
