import Image from "next/image";

import { cn } from "@/lib/utils";

/** Full RukaSente wordmark (includes name + tagline). */
export const RUKAPAY_LOGO_SRC = "/images/logo.png";

type RukaPayLogoMarkProps = {
  className?: string;
  /**
   * Display height in pixels. Width scales to the wordmark aspect ratio (~2:1).
   * Default 40.
   */
  height?: number;
  /** @deprecated Use `height` — logo is a wide wordmark, not a square. */
  size?: number;
  priority?: boolean;
};

/**
 * RukaSente logo wordmark — use alone (do not add a separate “Ruka Sente” label).
 */
export function RukaPayLogoMark({
  className,
  height,
  size,
  priority,
}: RukaPayLogoMarkProps) {
  const h = height ?? size ?? 40;
  const w = Math.round(h * (1774 / 887));

  return (
    <Image
      src={RUKAPAY_LOGO_SRC}
      alt="RukaSente"
      width={w}
      height={h}
      className={cn("object-contain shrink-0", className)}
      priority={priority}
    />
  );
}
