"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { RUKAPAY_LOGO_SRC } from "@/components/brand/rukapay-logo-mark";
import { cn } from "@/lib/utils";

/** Full-screen branded loader — used after login and while the session resolves. */
export function FullPageLoading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fb]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Soft ambient blobs */}
      <motion.div
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[rgba(8,22,61,0.06)] blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, 16, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full bg-[rgba(8,22,61,0.08)] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, -18, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center px-6"
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo + orbit rings */}
        <div className="relative mb-7 flex size-[7.5rem] items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full border border-[#08163d]/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#08163d] border-r-[#08163d]/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-5 rounded-full border border-dashed border-[#08163d]/25"
            animate={{ rotate: -360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-white shadow-[0_12px_40px_-12px_rgba(8,22,61,0.35)] ring-1 ring-[#08163d]/10"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={RUKAPAY_LOGO_SRC}
              alt="Ruka Sente"
              width={44}
              height={44}
              className="rounded-lg object-cover"
              priority
            />
          </motion.div>
        </div>

        <motion.p
          className="text-lg font-semibold tracking-tight text-[#08163d]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          Ruka Sente
        </motion.p>

        <motion.p
          className="mt-2 text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {message}
        </motion.p>

        {/* Animated dots */}
        <div className="mt-5 flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-[#08163d]"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </div>

        {/* Indeterminate progress bar */}
        <div className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-[#08163d]/10">
          <motion.div
            className="h-full w-1/2 rounded-full bg-[#08163d]"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </div>
      </motion.div>

      <span className="sr-only">{message}</span>
    </div>
  );
}

/** Centered card with Lucide spinner — matches merchant bulk-payment session / redirect states. */
export function CardLoading({
  message = "Loading...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[50vh] px-4",
        className
      )}
    >
      <Card className="max-w-md w-full border-gray-200/80 shadow-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/** In-card / section loading — Loader2 + label (merchant-style inline fetch). */
export function ContentLoading({
  message = "Loading...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin shrink-0" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/** Compact row spinner for tight spaces (e.g. table toolbar). */
export function InlineLoading({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-muted-foreground", className)}
      aria-hidden
    />
  );
}

/** One line — for card bodies / tables (merchant inline fetch pattern). */
export function CompactLoading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-1">
      <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
