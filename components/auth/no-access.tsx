"use client";

import { ShieldOff } from "lucide-react";

/** Blocks page content when the caller lacks a required view permission. */
export function NoAccess({
  title = "No access",
  description = "You do not have permission to view this page. Ask an admin to grant the required access.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <ShieldOff className="size-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
