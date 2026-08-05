"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  HandCoins,
  ShieldAlert,
  UserCheck,
  Users,
  UserCog,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCard = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export function StaffSummaryCards({
  total,
  active,
  loanOfficers,
  supervisors,
  collections,
  suspended,
  loading,
}: {
  total: number;
  active: number;
  loanOfficers: number;
  supervisors: number;
  collections: number;
  suspended: number;
  loading?: boolean;
}) {
  const cards: StatCard[] = [
    {
      title: "Total Staff",
      value: total,
      description: "All platform users",
      icon: Users,
      iconBg: "bg-[rgba(8,22,61,0.08)]",
      iconColor: "text-[#08163d]",
    },
    {
      title: "Active Staff",
      value: active,
      description: "Currently enabled",
      icon: UserCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Loan Officers",
      value: loanOfficers,
      description: "Credit operations",
      icon: HandCoins,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
    },
    {
      title: "Supervisors",
      value: supervisors,
      description: "Team leads",
      icon: UserCog,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-700",
    },
    {
      title: "Collections Officers",
      value: collections,
      description: "Recovery team",
      icon: Building2,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      title: "Suspended Staff",
      value: suspended,
      description: "Access revoked",
      icon: ShieldAlert,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <MetricCard key={card.title} card={card} loading={loading} />
      ))}
    </div>
  );
}

function MetricCard({
  card,
  loading,
  compact,
}: {
  card: StatCard;
  loading?: boolean;
  compact?: boolean;
}) {
  const Icon = card.icon;
  return (
    <Card className="group gap-0 border-slate-200/80 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className={cn("px-4", compact ? "py-3.5" : "py-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">{card.title}</p>
            {loading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
            ) : (
              <p
                className={cn(
                  "mt-1 font-semibold tracking-tight text-slate-900 tabular-nums",
                  compact ? "text-xl" : "text-2xl"
                )}
              >
                {card.value}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-slate-400">{card.description}</p>
          </div>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              card.iconBg,
              card.iconColor
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

