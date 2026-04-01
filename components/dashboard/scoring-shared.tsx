"use client";

export function formatCurrency(value: number | undefined | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RuleTypeBadge({ type }: { type: string }) {
  const label = type.replaceAll("_", " ");
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize">
      {label}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-gray-100 text-gray-500 border border-gray-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function DecisionBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    manual_review: "bg-orange-50 text-orange-700 border-orange-200",
  };
  const colors =
    colorMap[status.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${colors}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
