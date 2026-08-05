"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMe } from "@/hooks/use-me";
import { hasAll, hasAny, hasPermission } from "@/lib/permissions";

/**
 * Fresh effective permissions from `/admin/me`, falling back to the login session copy.
 * Also syncs NextAuth JWT permissions when `/me` returns newer keys.
 */
export function usePermissions() {
  const { data: session, status, update } = useSession();
  const me = useMe();
  const lastSynced = useRef<string>("");

  const permissions = useMemo(() => {
    if (me.data?.permissions?.length) return me.data.permissions;
    if (me.data && Array.isArray(me.data.permissions)) return me.data.permissions;
    return session?.user?.permissions ?? [];
  }, [me.data, session?.user?.permissions]);

  const roles = me.data?.roles ?? session?.user?.roles ?? [];
  const isPlatform = me.data?.is_platform ?? !!session?.user?.isPlatform;

  useEffect(() => {
    if (!me.data || status !== "authenticated") return;
    const stamp = JSON.stringify({
      p: me.data.permissions ?? [],
      r: (me.data.roles ?? []).map((x) => x.id),
      ip: me.data.is_platform,
    });
    if (stamp === lastSynced.current) return;
    lastSynced.current = stamp;
    void update({
      permissions: me.data.permissions ?? [],
      roles: me.data.roles ?? [],
      isPlatform: me.data.is_platform,
      partnerId: me.data.partner_id ?? null,
      partner: me.data.partner ?? null,
    });
  }, [me.data, status, update]);

  return {
    permissions,
    roles,
    isPlatform,
    isLoading: status === "loading" || me.isLoading,
    can: (key: string) => hasPermission(permissions, key),
    canAny: (keys: string[]) => hasAny(permissions, keys),
    canAll: (keys: string[]) => hasAll(permissions, keys),
    refetch: me.refetch,
  };
}
