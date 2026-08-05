"use client";

import { NoAccess } from "@/components/auth/no-access";
import { usePermissions } from "@/hooks/use-permissions";
import { CompactLoading } from "@/components/ui/loading";

/** Renders children only when the user has at least one of the required permissions. */
export function RequirePerm({
  anyOf,
  allOf,
  children,
  description,
}: {
  anyOf?: string[];
  allOf?: string[];
  children: React.ReactNode;
  description?: string;
}) {
  const { canAny, canAll, isLoading, permissions } = usePermissions();

  // Prefer session/me permissions immediately; only show spinner on cold start.
  if (isLoading && permissions.length === 0) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <CompactLoading />
      </div>
    );
  }

  const okAny = !anyOf?.length || canAny(anyOf);
  const okAll = !allOf?.length || canAll(allOf);
  if (!okAny || !okAll) {
    return <NoAccess description={description} />;
  }

  return <>{children}</>;
}
