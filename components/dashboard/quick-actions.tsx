"use client";

import Link from "next/link";
import {
  CheckCircle2,
  FilePlus2,
  Download,
  RefreshCw,
  ScanSearch,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
};

const actions: QuickAction[] = [
  { label: "Approve Loan", href: "/loan-applications", icon: CheckCircle2, primary: true },
  { label: "Create Loan", href: "/loan-applications/new", icon: FilePlus2 },
  { label: "Run Credit Check", href: "/scoring/results", icon: ScanSearch },
  { label: "Register Borrower", href: "/manual-borrower", icon: UserPlus },
  { label: "Sync from RukaPay", href: "/integrations", icon: RefreshCw },
  { label: "Export Report", href: "/loan-applications", icon: Download },
];

export function QuickActions() {
  return (
    <section className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="mr-1 shrink-0">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          Quick Actions
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08163d]/25",
                action.primary
                  ? "bg-[#08163d] text-white hover:bg-[#06102a]"
                  : "bg-slate-100/80 text-slate-700 hover:bg-[rgba(8,22,61,0.08)] hover:text-[#08163d]"
              )}
            >
              <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
