"use client";

import type { ReactNode } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  filterLabel?: string | false;
  legend?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
};

function YearFilterChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
      <CalendarDays className="size-3.5 text-violet-500" aria-hidden />
      {label}
      <ChevronDown className="size-3 text-slate-400" aria-hidden />
    </span>
  );
}

export function ChartCard({
  title,
  description,
  filterLabel = "This Year",
  legend,
  action,
  children,
  className,
  delay = 0,
}: ChartCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: reduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[#08163d]">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          {filterLabel ? <YearFilterChip label={filterLabel} /> : null}
          {action}
          {legend}
        </div>
      </header>
      <div className="flex-1 px-5 pb-5 pt-2">{children}</div>
    </motion.section>
  );
}
