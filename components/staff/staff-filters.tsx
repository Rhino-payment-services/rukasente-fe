"use client";

import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type StaffFilterState = {
  search: string;
  role: string;
  department: string;
  branch: string;
  status: string;
  dateJoined: string;
};

export const EMPTY_FILTERS: StaffFilterState = {
  search: "",
  role: "all",
  department: "all",
  branch: "all",
  status: "all",
  dateJoined: "all",
};

export function StaffFilters({
  value,
  onChange,
  onReset,
}: {
  value: StaffFilterState;
  onChange: (next: StaffFilterState) => void;
  onReset: () => void;
}) {
  return (
    <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
      <CardContent className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Search & Filters</p>
            <p className="text-xs text-slate-500">
              Search by name, email, phone, or staff ID
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200"
            onClick={onReset}
          >
            <RotateCcw className="size-3.5" />
            Reset Filters
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Name, email, phone, or staff ID…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[rgba(8,22,61,0.25)] focus:bg-white focus:ring-4 focus:ring-[rgba(8,22,61,0.05)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          <FilterSelect
            label="Role"
            value={value.role}
            onChange={(role) => onChange({ ...value, role })}
            options={[
              "all",
              "System Administrator",
              "Loan Officer",
              "Collections Officer",
              "Finance Officer",
              "Supervisor",
              "Credit Analyst",
              "Branch Manager",
              "Support Officer",
              "Auditor",
            ]}
          />
          <FilterSelect
            label="Department"
            value={value.department}
            onChange={(department) => onChange({ ...value, department })}
            options={[
              "all",
              "Credit Operations",
              "Collections",
              "Finance",
              "Risk & Compliance",
              "Customer Support",
              "Branch Operations",
            ]}
          />
          <FilterSelect
            label="Branch"
            value={value.branch}
            onChange={(branch) => onChange({ ...value, branch })}
            options={["all", "Kampala HQ", "Entebbe", "Jinja", "Mbarara", "Gulu", "Mbale"]}
          />
          <FilterSelect
            label="Status"
            value={value.status}
            onChange={(status) => onChange({ ...value, status })}
            options={["all", "active", "pending", "on_leave", "suspended", "inactive"]}
          />
          <FilterSelect
            label="Date Joined"
            value={value.dateJoined}
            onChange={(dateJoined) => onChange({ ...value, dateJoined })}
            options={["all", "2025", "2024", "2023"]}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[rgba(8,22,61,0.25)]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === "all" ? `All ${label.toLowerCase()}` : formatOpt(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatOpt(opt: string) {
  if (opt === "on_leave") return "On Leave";
  if (opt === "active") return "Active";
  if (opt === "pending") return "Pending";
  if (opt === "suspended") return "Suspended";
  if (opt === "inactive") return "Inactive";
  return opt;
}
