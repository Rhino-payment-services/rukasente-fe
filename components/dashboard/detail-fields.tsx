"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DetailFieldItem = {
  label: string;
  value: ReactNode;
  mono?: boolean;
  fullWidth?: boolean;
};

export function DetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      {children}
    </section>
  );
}

export function DetailGrid({ fields }: { fields: DetailFieldItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((f) => (
        <DetailField key={f.label} {...f} />
      ))}
    </div>
  );
}

export function DetailField({
  label,
  value,
  mono,
  fullWidth,
}: DetailFieldItem) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2",
        fullWidth && "col-span-2"
      )}
    >
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <div
        className={cn(
          "mt-0.5 break-words text-xs text-slate-800",
          mono && "font-mono text-[11px] text-slate-600"
        )}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

export function formatDetailValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}
