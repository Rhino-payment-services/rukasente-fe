"use client";

import * as React from "react";
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

/**
 * Measures the host once, then renders the chart with explicit pixel width/height.
 * Avoids Recharts ResponsiveContainer, which can enter a width/height -1 resize
 * loop under Next.js 16 + React 19 and freeze the tab.
 */
export function ChartContainer({
  id,
  className,
  config,
  children,
  ...props
}: ChartContainerProps) {
  const chartId = React.useId().replace(/:/g, "");
  const resolvedId = `chart-${id ?? chartId}`;
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(
    null
  );

  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    let cancelled = false;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.floor(width);
      const h = Math.floor(height);
      if (w <= 0 || h <= 0) return;
      if (cancelled) return;
      setSize((prev) => {
        if (prev && prev.width === w && prev.height === h) return prev;
        return { width: w, height: h };
      });
    };

    measure();
    const ro = new ResizeObserver(() => {
      // Defer so we don't fight layout mid-frame.
      requestAnimationFrame(measure);
    });
    ro.observe(el);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  const child =
    size && React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement<{ width?: number; height?: number }>,
          { width: size.width, height: size.height }
        )
      : null;

  return (
    <div
      ref={hostRef}
      id={resolvedId}
      data-chart={resolvedId}
      className={cn(
        "h-[220px] w-full min-w-0 overflow-hidden text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-cartesian-grid_line]:stroke-slate-200 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-300",
        className
      )}
      {...props}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: Object.entries(config)
            .map(
              ([key, value]) =>
                `#${resolvedId}{--color-${key}:${value.color};}`
            )
            .join(""),
        }}
      />
      {child}
    </div>
  );
}
