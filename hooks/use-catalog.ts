"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type RoleRow = {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
};

export type PermissionRow = {
  id: string;
  key: string;
  description?: string;
};

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/roles");
      return unwrapEnvelope<RoleRow[]>(res);
    },
  });
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/permissions");
      return unwrapEnvelope<PermissionRow[]>(res);
    },
  });
}
