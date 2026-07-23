"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Clock3,
  HandCoins,
  Mail,
  ShieldAlert,
  Timer,
  UserCheck,
  Users,
  UserCog,
  Wifi,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCard = {
  title: string;
  value: string | number;
  description: string;
  trend: string;
  up: boolean;
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
      trend: "+4.2%",
      up: true,
      icon: Users,
      iconBg: "bg-[rgba(8,22,61,0.08)]",
      iconColor: "text-[#08163d]",
    },
    {
      title: "Active Staff",
      value: active,
      description: "Currently enabled",
      trend: "+2.1%",
      up: true,
      icon: UserCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Loan Officers",
      value: loanOfficers,
      description: "Credit operations",
      trend: "+6.0%",
      up: true,
      icon: HandCoins,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
    },
    {
      title: "Supervisors",
      value: supervisors,
      description: "Team leads",
      trend: "+1.4%",
      up: true,
      icon: UserCog,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-700",
    },
    {
      title: "Collections Officers",
      value: collections,
      description: "Recovery team",
      trend: "-0.8%",
      up: false,
      icon: Building2,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      title: "Suspended Staff",
      value: suspended,
      description: "Access revoked",
      trend: "-12%",
      up: true,
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

export function StaffQuickStats() {
  const cards: StatCard[] = [
    {
      title: "New Staff This Month",
      value: 6,
      description: "Joined in Feb",
      trend: "+2",
      up: true,
      icon: Users,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
    },
    {
      title: "Average Daily Logins",
      value: 42,
      description: "Last 7 days",
      trend: "+8%",
      up: true,
      icon: Wifi,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    {
      title: "Branches Covered",
      value: 6,
      description: "Nationwide",
      trend: "Stable",
      up: true,
      icon: Building2,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-700",
    },
    {
      title: "Online Right Now",
      value: 11,
      description: "Active sessions",
      trend: "Live",
      up: true,
      icon: Wifi,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-700",
    },
    {
      title: "Pending Invitations",
      value: 3,
      description: "Awaiting accept",
      trend: "-1",
      up: true,
      icon: Mail,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      title: "Average Approval Time",
      value: "2.4h",
      description: "Loan decisions",
      trend: "-18%",
      up: true,
      icon: Timer,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <MetricCard key={card.title} card={card} compact />
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
        <p
          className={cn(
            "mt-2.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            card.up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
          )}
        >
          {card.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {card.trend}
        </p>
      </CardContent>
    </Card>
  );
}

export function StaffPerformanceCards() {
  const items = [
    { title: "Loans Processed", value: "1,248", icon: HandCoins },
    { title: "Loans Approved", value: "986", icon: UserCheck },
    { title: "Loans Rejected", value: "162", icon: ShieldAlert },
    { title: "Collections Completed", value: "418", icon: Building2 },
    { title: "Avg Processing Time", value: "2.4h", icon: Clock3 },
    { title: "Customer Satisfaction", value: "4.7/5", icon: Users },
    { title: "Approval Rate", value: "79%", icon: ArrowUpRight },
    { title: "Recovery Rate", value: "86%", icon: Timer },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.title}
            className="gap-0 border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="px-3 py-3.5">
              <Icon className="mb-2 size-4 text-[#08163d]/70" />
              <p className="text-[10px] font-medium text-slate-500">{item.title}</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">
                {item.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
