"use client";

export function LoanStatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();
  const cls =
    normalized === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "declined"
      ? "bg-rose-100 text-rose-800"
      : normalized === "under_review"
      ? "bg-amber-100 text-amber-800"
      : normalized === "submitted"
      ? "bg-blue-100 text-blue-800"
      : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${cls}`}>
      {normalized || "unknown"}
    </span>
  );
}
