"use client";

import Link from "next/link";
import { Smile } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { LoanApplication } from "@/types/loan";

type ActivityFeedProps = {
  apps: LoanApplication[];
  loading?: boolean;
};

function activityMeta(status: string): {
  label: string;
  className: string;
  detailVerb: string;
} {
  const s = status.toLowerCase();
  if (["approved", "disbursed", "disbursing", "repaying", "repaid"].includes(s)) {
    return {
      label: "LOAN APPROVED",
      className: "bg-emerald-50 text-emerald-700",
      detailVerb: "approved",
    };
  }
  if (["declined", "cancelled", "rejected"].includes(s)) {
    return {
      label: "LOAN DECLINED",
      className: "bg-rose-50 text-rose-700",
      detailVerb: "declined",
    };
  }
  if (s === "overdue") {
    return {
      label: "OVERDUE",
      className: "bg-amber-50 text-amber-800",
      detailVerb: "marked overdue",
    };
  }
  if (["under_review", "submitted"].includes(s)) {
    return {
      label: "UNDER REVIEW",
      className: "bg-sky-50 text-sky-700",
      detailVerb: "submitted for review",
    };
  }
  return {
    label: "APPLICATION",
    className: "bg-violet-50 text-violet-700",
    detailVerb: s.replaceAll("_", " ") || "updated",
  };
}

function actorLabel(app: LoanApplication): string {
  if (app.submission_channel === "internal_admin") return "System Administrator";
  if (app.submission_channel === "api") return "API Partner";
  if (app.decisioned_by_staff_user_id) return "System Administrator";
  return "System Administrator";
}

function relativeTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ActivityFeed({ apps, loading }: ActivityFeedProps) {
  const reduceMotion = useReducedMotion();
  const items = apps.slice(0, 6);

  return (
    <motion.section
      className="flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
    >
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Smile className="size-3.5" aria-hidden />
          </span>
          <h3 className="text-[15px] font-semibold text-[#08163d]">
            Recent Activities
          </h3>
        </div>
        <Link
          href="/loan-applications"
          className="text-xs font-medium text-violet-600 hover:text-violet-700"
        >
          View all
        </Link>
      </header>

      <div className="flex-1 overflow-x-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-3 px-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-10 text-center text-xs text-slate-400">
            No recent activity yet
          </p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[11px] font-medium text-slate-400">
                <th className="px-3 py-2 font-medium">Activity</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Details</th>
                <th className="px-3 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((app) => {
                const meta = activityMeta(app.status);
                const when = app.decisioned_at || app.submitted_at || app.updated_at || app.created_at;
                return (
                  <tr
                    key={app.id}
                    className="border-t border-slate-50 text-xs transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-3 py-3">
                      <Link href={`/loan-applications/${app.id}`}>
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide",
                            meta.className
                          )}
                        >
                          {meta.label}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                      {actorLabel(app)}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-500">
                      <Link
                        href={`/loan-applications/${app.id}`}
                        className="hover:text-slate-800"
                      >
                        {app.borrower_name
                          ? `${app.borrower_name} — ${app.application_number} ${meta.detailVerb}`
                          : `Loan application #${app.application_number} ${meta.detailVerb}`}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-slate-400">
                      {relativeTime(when)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.section>
  );
}
