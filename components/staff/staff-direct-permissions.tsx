"use client";

import { useMemo } from "react";
import {
  PERMISSION_GROUPS,
  isPlatformOnlyPermission,
} from "@/lib/permissions";
import type { PermissionRow } from "@/hooks/use-catalog";

export function StaffDirectPermissionChecklist({
  catalog,
  fromRoles,
  directSelected,
  onChange,
  disabled,
  hidePlatformKeys,
}: {
  catalog: PermissionRow[];
  fromRoles: string[];
  directSelected: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  hidePlatformKeys?: boolean;
}) {
  const fromRoleSet = useMemo(() => new Set(fromRoles), [fromRoles]);
  const directSet = useMemo(() => new Set(directSelected), [directSelected]);
  const byKey = useMemo(() => {
    const m = new Map<string, PermissionRow>();
    for (const p of catalog) m.set(p.key, p);
    return m;
  }, [catalog]);

  const groups = useMemo(() => {
    return PERMISSION_GROUPS.map((g) => ({
      ...g,
      keys: g.keys.filter((k) => {
        if (!byKey.has(k)) return false;
        if (hidePlatformKeys && isPlatformOnlyPermission(k)) return false;
        return true;
      }),
    })).filter((g) => g.keys.length > 0);
  }, [byKey, hidePlatformKeys]);

  function toggle(key: string) {
    if (disabled) return;
    const next = new Set(directSelected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next).sort());
  }

  const effectivePreview = useMemo(() => {
    const set = new Set([...fromRoles, ...directSelected]);
    return Array.from(set).sort();
  }, [fromRoles, directSelected]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Effective preview (role ∪ direct)
        </p>
        {effectivePreview.length ? (
          <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
            {effectivePreview.map((k) => (
              <span
                key={k}
                className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 ring-1 ring-slate-200"
              >
                {k}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No permissions yet.</p>
        )}
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.title}
            </p>
            <div className="grid gap-1.5">
              {group.keys.map((key) => {
                const row = byKey.get(key);
                const fromRole = fromRoleSet.has(key);
                const checked = directSet.has(key);
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                      checked
                        ? "border-main-200 bg-main-50"
                        : fromRole
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-slate-200 bg-white"
                    } ${disabled ? "opacity-60" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(key)}
                    />
                    <span className="min-w-0">
                      <span className="font-mono text-slate-800">{key}</span>
                      {fromRole ? (
                        <span className="ml-1.5 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-medium text-emerald-700">
                          via role
                        </span>
                      ) : null}
                      {row?.description ? (
                        <span className="mt-0.5 block text-slate-500">
                          {row.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
