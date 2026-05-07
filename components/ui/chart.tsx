"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
};

export function ChartContainer({
  id,
  className,
  config,
  children,
  ...props
}: ChartContainerProps) {
  const chartId = React.useId().replace(/:/g, "");
  const resolvedId = `chart-${id ?? chartId}`;

  return (
    <div
      id={resolvedId}
      data-chart={resolvedId}
      className={cn(
        // `min-w-0` lets the container shrink inside flex/grid parents instead of
        // bottoming out at width 0 and triggering recharts' "width(-1) height(-1)"
        // warning on first paint, which was pinning dev mode CPU.
        "h-[220px] w-full min-w-0 text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-cartesian-grid_line]:stroke-slate-200 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-300",
        className
      )}
      {...props}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: Object.entries(config)
            .map(([key, value]) => `#${resolvedId}{--color-${key}:${value.color};}`)
            .join(""),
        }}
      />
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

