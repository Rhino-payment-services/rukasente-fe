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
      className="group rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: reduceMotion ? 0 : 0.06 + index * 0.025,
        ease: "easeOut",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            styles.box,
            styles.icon
          )}
        >
          <Icon className="size-[15px]" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-slate-600">
          {title}
        </p>
        {delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 text-[10.5px] font-medium",
              up === true && "text-emerald-600",
              up === false && "text-rose-500",
              up == null && "text-slate-400"
            )}
          >
            {up === true ? (
              <ArrowUpRight className="size-3" aria-hidden />
            ) : up === false ? (
              <ArrowDownRight className="size-3" aria-hidden />
            ) : (
              <Minus className="size-3" aria-hidden />
            )}
            {delta}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-2 h-5 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-1.5 truncate text-[19px] font-semibold leading-tight tracking-tight text-[#08163d] tabular-nums">
          {value}
        </p>
      )}

      {subtitle ? (
        <p className="mt-0.5 truncate text-[10.5px] text-slate-400">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}
