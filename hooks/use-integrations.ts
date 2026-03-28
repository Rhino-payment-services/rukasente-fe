"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

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
  return useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/integrations");
      return unwrapEnvelope<IntegrationRow[]>(res);
    },
  });
}
