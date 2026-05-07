"use client";

import { useEffect, useMemo, useState } from "react";

type Point = { time: string; value: number };

function createSeedData() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const ts = new Date(now.getTime() - (11 - i) * 10_000);
    return {
      time: ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: 180 + Math.round(Math.random() * 70),
    };
  });
}

export function useRealtimeTraffic() {
  const [points, setPoints] = useState<Point[]>(() => createSeedData());

  useEffect(() => {
    const timer = setInterval(() => {
      setPoints((prev) => {
        const next = [
          ...prev.slice(1),
          {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            value: 180 + Math.round(Math.random() * 70),
          },
        ];
        return next;
      });
    }, 8000);

    // Pause the simulated stream while the tab is hidden so we don't keep
    // re-rendering 4 recharts containers in the background.
    function onVisibility() {
      if (document.hidden) clearInterval(timer);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const latestValue = useMemo(() => points[points.length - 1]?.value ?? 0, [points]);

  return { points, latestValue };
}

