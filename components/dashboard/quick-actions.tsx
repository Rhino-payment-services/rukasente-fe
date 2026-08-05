"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Download,
  FilePlus2,
  RefreshCw,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  anyOf: string[];
};

const actions: QuickAction[] = [
  {
    label: "Approve Loan",
    href: "/loan-applications",
    icon: CheckCircle2,
    primary: true,
    anyOf: [Perm.LoanApplicationView, Perm.LoanApplicationApprove],
  },
  {
    label: "Create Loan",
    href: "/loan-applications/new",
    icon: FilePlus2,
    anyOf: [Perm.LoanApplicationCreate, Perm.LoanApplicationView],
  },
  {
    label: "Run Credit Check",
    href: "/scoring/results",
    icon: Activity,
    anyOf: [Perm.ScoringView, Perm.ScoringRun],
  },
  {
    label: "Register Borrower",
    href: "/manual-borrower",
    icon: UserPlus,
    anyOf: [Perm.BorrowerView, Perm.BorrowerCreate],
  },
  {
    label: "Sync from RukaPay",
    href: "/integrations",
    icon: RefreshCw,
    anyOf: [Perm.IntegrationView, Perm.PartnerView],
  },
  {
    label: "Export Report",
    href: "/loan-applications",
    icon: Download,
    anyOf: [Perm.LoanApplicationView],
  },
];

export function QuickActions() {
  const reduceMotion = useReducedMotion();
  const { canAny } = usePermissions();
  const visible = actions.filter((a) => canAny(a.anyOf));

  if (!visible.length) return null;

  return (
    <motion.section
      className="flex flex-wrap items-center gap-x-3 gap-y-2.5"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
    >
      <h2 className="mr-1 shrink-0 text-sm font-semibold text-[#0f172a]">
        Quick Actions
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <Link
                href={action.href}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
                  action.primary
                    ? "bg-[#4f46e5] text-white hover:bg-[#4338ca]"
                    : "border border-slate-200 bg-white text-[#312e81] hover:border-indigo-200 hover:bg-indigo-50/40"
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {action.label}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
