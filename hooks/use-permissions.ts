"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useMe } from "@/hooks/use-me";
import { hasAll, hasAny, hasPermission } from "@/lib/permissions";

/**
 * Fresh effective permissions from `/admin/me`, falling back to the login session copy.
 * Does not call NextAuth `update()` — that caused CSRF/session spam and page flicker.
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const me = useMe({ enabled: status === "authenticated" });

  const permissions = useMemo(() => {
    if (me.data && Array.isArray(me.data.permissions)) {
      return me.data.permissions;
    }
    return session?.user?.permissions ?? [];
  }, [me.data, session?.user?.permissions]);

  const roles = me.data?.roles ?? session?.user?.roles ?? [];
  const isPlatform = me.data?.is_platform ?? !!session?.user?.isPlatform;

  // Only block UI on the initial auth/me bootstrap — never on session "loading"
  // after an update, which caused navigate flicker.
  const hasSessionPerms = (session?.user?.permissions?.length ?? 0) > 0;
  const isLoading =
    status === "loading" ||
    (status === "authenticated" && me.isLoading && !hasSessionPerms && !me.data);

  return {
    permissions,
    roles,
    isPlatform,
    isLoading,
    can: (key: string) => hasPermission(permissions, key),
    canAny: (keys: string[]) => hasAny(permissions, keys),
    canAll: (keys: string[]) => hasAll(permissions, keys),
    refetch: me.refetch,
  };
}
