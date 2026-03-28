import Image from "next/image";

import { cn } from "@/lib/utils";

/** Same asset as merchant_dashboard `public/images/logo.jpg`. */
export const RUKAPAY_LOGO_SRC = "/images/logo.jpg";

type RukaPayLogoMarkProps = {
  className?: string;
  /** Square logo size in pixels (default 48). */
  size?: number;
  priority?: boolean;
};

/**
 * RukaPay square logo mark — copied from merchant dashboard; use beside “Ruka Sente” titles.
 */
export function RukaPayLogoMark({
  className,
  size = 48,
  priority,
}: RukaPayLogoMarkProps) {
  return (
    <Image
      src={RUKAPAY_LOGO_SRC}
      alt="RukaPay"
      width={size}
      height={size}
      className={cn("rounded-lg object-cover shadow-sm shrink-0", className)}
      priority={priority}
    />
  );
}
