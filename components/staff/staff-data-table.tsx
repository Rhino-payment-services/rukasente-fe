"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  KeyRound,
  UserCog,
  Shield,
  UserX,
  Ban,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { RoleBadge, StatusBadge } from "@/components/staff/staff-badges";
import type { EnrichedStaff } from "@/lib/staff-enrichment";
import { cn } from "@/lib/utils";

type Props = {
  rows: EnrichedStaff[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
  currentUserEmail?: string;
  onViewProfile: (staff: EnrichedStaff) => void;
  onEdit: (staff: EnrichedStaff) => void;
  totalLabel?: string;
};

export function StaffDataTable({
  rows,
  loading,
  error,
  currentUserId,
  currentUserEmail,
  onViewProfile,
  onEdit,
  totalLabel,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card className="gap-0 overflow-hidden border-slate-200/80 bg-white py-0 shadow-sm">
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <CompactLoading message="Loading staff…" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-900">No staff found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/90">
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="sticky left-0 z-[1] min-w-[220px] bg-slate-50/95 px-3 py-2.5 font-medium backdrop-blur">
                    Staff
                  </th>
                  <th className="min-w-[130px] px-3 py-2.5 font-medium">Role</th>
                  <th className="hidden min-w-[140px] px-3 py-2.5 font-medium lg:table-cell">
                    Location
                  </th>
                  <th className="min-w-[90px] px-3 py-2.5 font-medium">Status</th>
                  <th className="min-w-[100px] px-3 py-2.5 font-medium">Last login</th>
                  <th className="hidden min-w-[100px] px-3 py-2.5 font-medium xl:table-cell">
                    Access
                  </th>
                  <th className="sticky right-0 z-[1] w-12 bg-slate-50/95 px-2 py-2.5 text-center font-medium backdrop-blur">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelf =
                    (!!currentUserId && currentUserId === row.id) ||
                    (!!currentUserEmail &&
                      !!row.email &&
                      currentUserEmail.toLowerCase() === row.email.toLowerCase());
                  const initials = row.full_name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={row.id}
                      className="group border-b border-slate-50 transition-colors hover:bg-slate-50/90"
                    >
                      <td className="sticky left-0 z-[1] bg-white px-3 py-2.5 group-hover:bg-slate-50/90">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#08163d] to-[#1a2d5c] text-[10px] font-semibold text-white">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[13px] font-semibold text-slate-900">
                                {row.full_name}
                              </p>
                              {isSelf ? (
                                <span className="shrink-0 rounded bg-slate-100 px-1 py-px text-[9px] font-medium text-slate-500">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-[11px] text-slate-500">{row.email}</p>
                            <p className="truncate text-[10px] tabular-nums text-slate-400">
                              {row.employeeId}
                              <span className="mx-1 text-slate-300">·</span>
                              <span className="whitespace-nowrap">{row.phone}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <RoleBadge role={row.role} />
                      </td>
                      <td className="hidden px-3 py-2.5 lg:table-cell">
                        <p className="truncate text-[12px] font-medium text-slate-700">
                          {row.branch}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {row.department}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="whitespace-nowrap text-[12px] text-slate-600">
                          {row.lastLogin}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 xl:table-cell">
                        <AccessCell permissions={row.permissions} />
                      </td>
                      <td className="sticky right-0 z-[1] bg-white px-2 py-2.5 text-center group-hover:bg-slate-50/90">
                        <ActionsMenu
                          open={openId === row.id}
                          onOpenChange={(o) => setOpenId(o ? row.id : null)}
                          disabled={isSelf}
                          onView={() => {
                            setOpenId(null);
                            onViewProfile(row);
                          }}
                          onEdit={() => {
                            setOpenId(null);
                            onEdit(row);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalLabel ? (
          <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            {totalLabel}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AccessCell({ permissions }: { permissions: string[] }) {
  if (!permissions.length) {
    return <span className="text-slate-400">—</span>;
  }
  const first = permissions[0];
  const rest = permissions.length - 1;
  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
        {first}
      </span>
      {rest > 0 ? (
        <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

function ActionsMenu({
  open,
  onOpenChange,
  disabled,
  onView,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onView: () => void;
  onEdit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  if (disabled) {
    return <span className="text-[10px] text-slate-400">—</span>;
  }

  const items = [
    { label: "View Profile", icon: Eye, onClick: onView },
    { label: "Edit Staff", icon: Pencil, onClick: onEdit },
    { label: "Reset Password", icon: KeyRound, onClick: () => onOpenChange(false) },
    { label: "Assign Role", icon: UserCog, onClick: onEdit },
    { label: "Change Permissions", icon: Shield, onClick: onEdit },
    { label: "Deactivate", icon: UserX, onClick: () => onOpenChange(false) },
    { label: "Suspend", icon: Ban, onClick: () => onOpenChange(false), danger: true },
    { label: "Delete", icon: Trash2, onClick: () => onOpenChange(false), danger: true },
  ];

  return (
    <div className="relative inline-flex" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-lg text-slate-400 hover:text-slate-900"
        onClick={() => onOpenChange(!open)}
        aria-label="Actions"
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50",
                  item.danger ? "text-rose-600" : "text-slate-700"
                )}
              >
                <Icon className="size-3.5 opacity-70" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
