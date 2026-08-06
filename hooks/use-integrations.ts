"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

export type IntegrationRow = {
  id: string;
  name: string;
  display_name: string;
  base_url: string;
  path_template: string;
  is_active: boolean;
  version: string;
};

export function useIntegrations() {
  const { canAny } = usePermissions();
  return useQuery({
    queryKey: ["integrations"],
    enabled: canAny([Perm.IntegrationView, Perm.PartnerView]),
    queryFn: async () => {
      const res = await apiClient.get("/admin/integrations");
      return unwrapEnvelope<IntegrationRow[]>(res);
    },
  });
}
