"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GreetingSection({ fullName }: { fullName?: string | null }) {
  const firstName = fullName?.split(" ")[0] ?? "System";
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-[28px]">
          {hello}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Loan portfolio, credit risk, and RukaPay insights in one place.
        </p>
      </div>
      <Button
        size="sm"
        className="h-8 gap-2 rounded-xl bg-[#08163d] px-3 text-xs text-white hover:bg-[#06102a]"
      >
        <Share2 className="size-3.5" />
        Share
      </Button>
    </div>
  );
}
