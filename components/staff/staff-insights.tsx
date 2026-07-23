"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BRANCH_DISTRIBUTION,
  ROLE_DISTRIBUTION,
  STAFF_ACTIVITY,
  STAFF_GROWTH,
  STAFF_NOTIFICATIONS,
  TOP_PERFORMERS,
} from "@/lib/staff-enrichment";
import { cn } from "@/lib/utils";

export function StaffInsightsPanel() {
  const branchMax = Math.max(...BRANCH_DISTRIBUTION.map((b) => b.count), 1);
  const growthMax = Math.max(...STAFF_GROWTH.map((g) => g.count), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm xl:col-span-4">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold">Staff by Role</CardTitle>
            <p className="text-xs text-slate-500">Distribution across functions</p>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {ROLE_DISTRIBUTION.map((r) => (
              <div key={r.name} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: r.color }}
                />
                <span className="flex-1 text-slate-600">{r.name}</span>
                <span className="font-medium text-slate-900">{r.value}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm xl:col-span-4">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold">Staff by Branch</CardTitle>
            <p className="text-xs text-slate-500">Headcount coverage</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex h-[220px] items-end gap-2">
              {BRANCH_DISTRIBUTION.map((b) => (
                <div
                  key={b.branch}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-md bg-[#08163d]"
                    style={{
                      height: `${Math.max(8, (b.count / branchMax) * 180)}px`,
                    }}
                    title={`${b.branch}: ${b.count}`}
                  />
                  <span className="truncate text-[10px] text-slate-500">
                    {b.branch}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm xl:col-span-4">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold">
              Monthly Staff Growth
            </CardTitle>
            <p className="text-xs text-slate-500">Headcount trend</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex h-[220px] items-end gap-2">
              {STAFF_GROWTH.map((g) => (
                <div
                  key={g.month}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-md bg-blue-500"
                    style={{
                      height: `${Math.max(8, (g.count / growthMax) * 180)}px`,
                    }}
                    title={`${g.month}: ${g.count}`}
                  />
                  <span className="text-[10px] text-slate-500">{g.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {TOP_PERFORMERS.map((group) => (
          <Card
            key={group.title}
            className="gap-0 border-slate-200/80 py-0 shadow-sm"
          >
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-sm font-semibold">
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 px-4 pb-4">
              {group.people.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#08163d] text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {p.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      {p.dept}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Loans {p.loans} · Rate {p.rate} · {p.collections}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {p.score}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
            <p className="text-xs text-slate-500">Operational timeline</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ol className="relative space-y-0 border-l border-slate-200 pl-4">
              {STAFF_ACTIVITY.map((a) => (
                <li key={a.title + a.time} className="relative pb-4 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-white",
                      a.tone === "success" && "bg-emerald-500",
                      a.tone === "danger" && "bg-rose-500",
                      a.tone === "warning" && "bg-amber-500",
                      a.tone === "info" && "bg-blue-500"
                    )}
                  />
                  <p className="text-xs font-medium text-slate-900">{a.title}</p>
                  <p className="text-[11px] text-slate-500">{a.detail}</p>
                  <p className="text-[10px] text-slate-400">{a.time}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200/80 py-0 shadow-sm">
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-sm font-semibold">
              Notifications
            </CardTitle>
            <p className="text-xs text-slate-500">
              Staff access & security events
            </p>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {STAFF_NOTIFICATIONS.map((n) => (
              <div
                key={n.title + n.time}
                className="rounded-xl border border-slate-100 px-3 py-2.5 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-900">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {n.time}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{n.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
