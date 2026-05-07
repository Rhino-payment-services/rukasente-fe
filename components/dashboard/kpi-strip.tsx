"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type KPIItem = {
  title: string;
  value: string | number;
  delta: string;
  up: boolean;
};

export function KpiStrip({ items, loading }: { items: KPIItem[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title} className="gap-0 border-slate-200 bg-white py-0 shadow-none">
          <CardContent className="px-4 py-3.5">
            <p className="text-xs text-slate-500">{item.title}</p>
            {loading ? (
              <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="mt-1 text-4xl font-semibold leading-none text-slate-900">
                {item.value}
              </p>
            )}
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs ${
                item.up ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {item.up ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {item.delta}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

