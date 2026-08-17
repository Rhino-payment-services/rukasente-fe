"use client";

import type { LucideIcon } from "lucide-react";
import { Mail, Phone, BadgeCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import {
  PermissionChips,
  RoleBadge,
  StatusBadge,
} from "@/components/staff/staff-badges";
import type { EnrichedStaff } from "@/lib/staff-enrichment";

export function StaffProfileDrawer({
  staff,
  open,
  onClose,
  onEdit,
}: {
  staff: EnrichedStaff | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!staff) return null;

  const initials = staff.full_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DetailsDrawer
      open={open}
      onClose={onClose}
      title="Staff Profile"
      description="Operational identity & access"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-lg text-xs"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
            onClick={onEdit}
          >
            Edit Staff
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#08163d] to-[#1a2d5c] text-xl font-semibold text-white shadow-lg">
          {initials}
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-900">
          {staff.full_name}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">{staff.role}</p>
        <div className="mt-2">
          <StatusBadge status={staff.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoTile
          icon={BadgeCheck}
          label="Staff ID"
          value={staff.employeeId.slice(0, 8)}
        />
        <InfoTile icon={Calendar} label="Date Joined" value={staff.dateJoined} />
      </div>

      <section className="space-y-2 rounded-lg bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Contact
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Mail className="size-3.5 text-slate-400" />
          {staff.email}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Phone className="size-3.5 text-slate-400" />
          {staff.phone}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Role & Access
        </p>
        <RoleBadge role={staff.role} />
        <p className="text-xs text-slate-600">
          Company:{" "}
          <span className="font-medium text-slate-800">{staff.company}</span>
        </p>
        <div className="pt-1">
          <PermissionChips permissions={staff.permissions} />
        </div>
        <p className="text-xs text-slate-500">Last login: {staff.lastLogin}</p>
      </section>
    </DetailsDrawer>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 truncate text-xs font-medium text-slate-800">{value}</p>
    </div>
  );
}
