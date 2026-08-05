"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type StatTone =
  | "violet"
  | "blue"
  | "emerald"
  | "rose"
  | "amber"
  | "slate";

const toneStyles: Record<StatTone, { box: string; icon: string }> = {
  violet: {
    box: "bg-violet-50",
    icon: "text-violet-600",
  },
  blue: {
    box: "bg-sky-50",
    icon: "text-sky-600",
  },
  emerald: {
    box: "bg-emerald-50",
    icon: "text-emerald-600",
  },
  rose: {
    box: "bg-rose-50",
    icon: "text-rose-600",
  },
  amber: {
    box: "bg-amber-50",
    icon: "text-amber-600",
  },
  slate: {
    box: "bg-slate-100",
    icon: "text-slate-600",
  },
};

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Only pass when computed from real comparison data. */
  delta?: string;
  /** true = up (green), false = down (red), null/undefined + delta = neutral */
  up?: boolean | null;
  icon: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
  index?: number;
};

export function StatCard({
  title,
  value,
  subtitle,
  delta,
  up,
  icon: Icon,
  tone = "blue",
  loading,
  index = 0,
}: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const styles = toneStyles[tone];

  return (
    <motion.div
      className="group rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: reduceMotion ? 0 : 0.08 + index * 0.03,
        ease: "easeOut",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            styles.box,
            styles.icon
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[13px] font-medium text-slate-700">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <p className="mt-1 truncate text-[26px] font-semibold leading-none tracking-tight text-[#08163d] tabular-nums sm:text-[28px]">
              {value}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        {subtitle ? (
          <p className="min-w-0 truncate text-[11px] text-slate-400">{subtitle}</p>
        ) : (
          <span />
        )}
        {delta ? (
          <p
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium",
              up === true && "text-emerald-600",
              up === false && "text-rose-500",
              (up == null || up === undefined) && "text-slate-400"
            )}
          >
            {up === true ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : up === false ? (
              <ArrowDownRight className="size-3.5" aria-hidden />
            ) : (
              <Minus className="size-3.5" aria-hidden />
            )}
            {delta}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
