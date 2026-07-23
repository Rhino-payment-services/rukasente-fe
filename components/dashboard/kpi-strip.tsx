"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KPIItem = {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Optional trend chip; omit when no real comparison data. */
  delta?: string;
  up?: boolean;
  icon: LucideIcon;
  accent?: string;
};

export function KpiStrip({ items, loading }: { items: KPIItem[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.title}
            className="group gap-0 border-slate-200/80 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{item.title}</p>
                  {loading ? (
                    <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-slate-100" />
                  ) : (
                    <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                      {item.value}
                    </p>
                  )}
                  {item.subtitle ? (
                    <p className="mt-1 text-[11px] text-slate-400">{item.subtitle}</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(8,22,61,0.07)] text-[#08163d] ring-1 ring-[rgba(8,22,61,0.1)] transition-transform duration-200 group-hover:scale-105"
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
              </div>
              {item.delta ? (
                <p
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    item.up
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-600"
                  )}
                >
                  {item.delta}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
