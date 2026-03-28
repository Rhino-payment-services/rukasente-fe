"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon: LucideIcon;
  loading?: boolean;
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1 min-h-[112px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <span className="rounded-lg bg-main-50 p-2 text-main-600 shrink-0">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-[#08163d] tabular-nums">
          {value === null || value === undefined ? "—" : value}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

export function StatCardsGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}
