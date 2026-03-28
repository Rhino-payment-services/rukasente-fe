import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Full-screen loader — matches merchant `MerchantAuthGuard` (gradient + ring spinner). */
export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-main-50 via-white to-main-50">
      <div className="text-center">
        <div
          className="w-12 h-12 border-4 border-main-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          aria-hidden
        />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
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
