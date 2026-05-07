"use client";

import { ManualBorrowerOnboarding } from "@/components/dashboard/manual-borrower-onboarding";

export default function ManualBorrowerPage() {
  return (
    <div className="flex w-full max-w-[1600px] flex-1 flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Manual borrower onboarding
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manually link RukaPay users and run scoring workflow.
        </p>
      </div>
      <ManualBorrowerOnboarding />
    </div>
  );
}

