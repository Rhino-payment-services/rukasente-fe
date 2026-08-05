"use client";

import type { LucideIcon } from "lucide-react";
import { StatCard, type StatTone } from "@/components/dashboard/stat-card";

export type KPIItem = {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Optional trend chip; omit when no real comparison data. */
  delta?: string;
  up?: boolean | null;
  icon: LucideIcon;
  tone?: StatTone;
};

export function KpiStrip({ items, loading }: { items: KPIItem[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          delta={item.delta}
          up={item.up}
          icon={item.icon}
          tone={item.tone}
          loading={loading}
          index={index}
        />
      ))}
    </div>
  );
}
