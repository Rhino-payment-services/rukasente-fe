"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StaffRoleLabel, StaffStatusLabel } from "@/lib/staff-enrichment";

const ROLE_STYLES: Record<StaffRoleLabel, string> = {
  "System Administrator": "border-slate-800/10 bg-[#08163d] text-white",
  "Loan Officer": "border-blue-200 bg-blue-50 text-blue-700",
  "Collections Officer": "border-amber-200 bg-amber-50 text-amber-800",
  "Finance Officer": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Branch Manager": "border-violet-200 bg-violet-50 text-violet-700",
  "Credit Analyst": "border-cyan-200 bg-cyan-50 text-cyan-800",
  "Support Officer": "border-sky-200 bg-sky-50 text-sky-700",
  Supervisor: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Auditor: "border-rose-200 bg-rose-50 text-rose-700",
};

export function RoleBadge({ role }: { role: string }) {
  const style =
    ROLE_STYLES[role as StaffRoleLabel] ??
    "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
        style
      )}
    >
      {role}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase() as StaffStatusLabel;
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    pending: { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" },
    on_leave: { label: "On Leave", className: "border-orange-200 bg-orange-50 text-orange-700" },
    suspended: { label: "Suspended", className: "border-rose-200 bg-rose-50 text-rose-700" },
    inactive: { label: "Inactive", className: "border-slate-200 bg-slate-100 text-slate-600" },
  };
  const cfg = map[s] ?? map.inactive;
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

export function PermissionChips({ permissions }: { permissions: string[] }) {
  return (
    <div className="flex max-w-[180px] flex-wrap gap-1">
      {permissions.slice(0, 3).map((p) => (
        <Badge key={p} variant="default" className="rounded-md px-1.5 py-0 text-[10px]">
          {p}
        </Badge>
      ))}
      {permissions.length > 3 ? (
        <Badge variant="info" className="rounded-md px-1.5 py-0 text-[10px]">
          +{permissions.length - 3}
        </Badge>
      ) : null}
    </div>
  );
}
