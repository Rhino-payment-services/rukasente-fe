"use client";

import { ManualBorrowerOnboarding } from "@/components/dashboard/manual-borrower-onboarding";
import { Link2 } from "lucide-react";

export default function ManualBorrowerPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Link2 className="size-4" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Manual borrower
              </h1>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                Link a RukaPay user, record consents, and run scoring in one workflow.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ManualBorrowerOnboarding />
    </div>
  );
}
