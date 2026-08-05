"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Info,
  Percent,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type SystemAlertsProps = {
  overdueLoans: number | null | undefined;
  pendingApps: number | null | undefined;
  repaymentRate: number | null | undefined;
  loading?: boolean;
};

type AlertItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  severity: "critical" | "warning" | "info";
  icon: LucideIcon;
};

function buildAlerts({
  overdueLoans,
  pendingApps,
  repaymentRate,
}: Omit<SystemAlertsProps, "loading">): AlertItem[] {
  const alerts: AlertItem[] = [];
  const overdue = overdueLoans ?? 0;
  const pending = pendingApps ?? 0;

  if (overdue > 0) {
    alerts.push({
      id: "overdue",
      title: `${overdue} overdue loan${overdue === 1 ? "" : "s"}`,
      detail: "Past due date — follow up on collections",
      href: "/loan-applications?status=overdue",
      severity: overdue >= 5 ? "critical" : "warning",
      icon: AlertTriangle,
    });
  }

  if (pending >= 5) {
    alerts.push({
      id: "pending",
      title: `${pending} applications awaiting review`,
      detail: "Pipeline backlog may delay decisions",
      href: "/loan-applications",
      severity: pending >= 15 ? "warning" : "info",
      icon: ClipboardList,
    });
  }

  if (repaymentRate != null && repaymentRate < 70) {
    alerts.push({
      id: "repayment",
      title: `Repayment rate at ${repaymentRate}%`,
      detail: "Below 70% threshold — review risk exposure",
      href: "/analytics/trends",
      severity: repaymentRate < 50 ? "critical" : "warning",
      icon: Percent,
    });
  }

  if (pending > 0 && pending < 5) {
    alerts.push({
      id: "pending-info",
      title: `${pending} pending application${pending === 1 ? "" : "s"}`,
      detail: "Applications waiting in the review queue",
      href: "/loan-applications",
      severity: "info",
      icon: Info,
    });
  }

  return alerts;
}

const severityStyles = {
  critical: "bg-rose-500 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-sky-500 text-white",
};

export function SystemAlerts({
  overdueLoans,
  pendingApps,
  repaymentRate,
  loading,
}: SystemAlertsProps) {
  const reduceMotion = useReducedMotion();
  const alerts = buildAlerts({ overdueLoans, pendingApps, repaymentRate });

  return (
    <motion.section
      className="flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.26, ease: "easeOut" }}
    >
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Shield className="size-3.5" aria-hidden />
          </span>
          <h3 className="text-[15px] font-semibold text-[#08163d]">
            System Alerts
          </h3>
        </div>
        <Link
          href="/loan-applications"
          className="text-xs font-medium text-violet-600 hover:text-violet-700"
        >
          View all
        </Link>
      </header>

      <div className="flex-1 px-2 pb-2">
        {loading ? (
          <div className="space-y-3 px-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Shield className="size-4" />
            </div>
            <p className="text-xs font-medium text-slate-700">All clear</p>
            <p className="mt-1 text-[11px] text-slate-400">
              No overdue spikes, backlog, or repayment alerts
            </p>
          </div>
        ) : (
          <ul>
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className="flex items-start gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-slate-50/80"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                        severityStyles[alert.severity]
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-semibold text-[#08163d]">
                          {alert.title}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug text-slate-400">
                        {alert.detail}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.section>
  );
}
