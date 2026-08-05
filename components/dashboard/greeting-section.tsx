"use client";

import { Share2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

export function GreetingSection({ fullName }: { fullName?: string | null }) {
  const firstName = fullName?.split(" ")[0] ?? "System";
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-wrap items-start justify-between gap-4"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#0f172a] md:text-[32px]">
          {hello}, {firstName}{" "}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your loan portfolio today.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50 hover:text-[#08163d]"
      >
        <Share2 className="size-3.5" />
        Share dashboard
      </Button>
    </motion.div>
  );
}
