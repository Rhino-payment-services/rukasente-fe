"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const ACTION_SLOT = {
  icon: "28px",
  sm: "62px",
  md: "72px",
  lg: "90px",
} as const;

export function RowActions({
  slots,
  children,
  className,
}: {
  slots: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("grid items-center justify-end gap-1", className)}
      style={{ gridTemplateColumns: slots.join(" ") }}
    >
      {children}
    </div>
  );
}

export function ActionSlot({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 [&>*]:w-full [&>*]:justify-center [&>*]:whitespace-nowrap",
        className
      )}
    >
      {children}
    </div>
  );
}
