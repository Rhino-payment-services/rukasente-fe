"use client";

import type { LucideIcon } from "lucide-react";
import { X, Mail, Phone, BadgeCheck, Building2, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PermissionChips,
  RoleBadge,
  StatusBadge,
} from "@/components/staff/staff-badges";
import type { EnrichedStaff } from "@/lib/staff-enrichment";
import { STAFF_ACTIVITY } from "@/lib/staff-enrichment";

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
  if (!open || !staff) return null;

  const initials = staff.full_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md animate-in slide-in-from-right flex-col border-l border-slate-200 bg-white shadow-2xl duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Staff Profile</p>
            <p className="text-xs text-slate-500">Operational identity & access</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#08163d] to-[#1a2d5c] text-2xl font-semibold text-white shadow-lg">
              {initials}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{staff.full_name}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{staff.role}</p>
            <div className="mt-2">
              <StatusBadge status={staff.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InfoTile icon={BadgeCheck} label="Employee ID" value={staff.employeeId} />
            <InfoTile icon={Building2} label="Department" value={staff.department} />
            <InfoTile icon={MapPin} label="Branch" value={staff.branch} />
            <InfoTile icon={Calendar} label="Date Joined" value={staff.dateJoined} />
          </div>

          <section className="space-y-2 rounded-xl bg-slate-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Contact
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Mail className="size-3.5 text-slate-400" />
              {staff.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Phone className="size-3.5 text-slate-400" />
              {staff.phone}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Role & Access
            </p>
            <RoleBadge role={staff.role} />
            <div className="pt-1">
              <PermissionChips permissions={staff.permissions} />
            </div>
            <p className="text-xs text-slate-500">Last login: {staff.lastLogin}</p>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Performance Summary
            </p>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Loans" value="48" />
              <MiniStat label="Approval" value="91%" />
              <MiniStat label="Score" value="94" />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assigned
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-slate-100 p-2.5">
                <p className="text-slate-400">Borrowers</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">36</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-2.5">
                <p className="text-slate-400">Active Loans</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">22</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent Activity
            </p>
            <ul className="space-y-2">
              {STAFF_ACTIVITY.slice(0, 4).map((a) => (
                <li
                  key={a.title + a.time}
                  className="rounded-lg border border-slate-100 px-3 py-2"
                >
                  <p className="text-xs font-medium text-slate-800">{a.title}</p>
                  <p className="text-[11px] text-slate-500">{a.detail}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{a.time}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl bg-[#08163d] text-white hover:bg-[#06102a]"
            onClick={onEdit}
          >
            Edit Staff
          </Button>
        </div>
      </aside>
    </div>
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
    <div className="rounded-xl border border-slate-100 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 truncate text-xs font-medium text-slate-800">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2 text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
