"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type SubscriptionListResponse = {
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  page_size: number;
};

export function useSubscriptionsList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["subscriptions", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/subscriptions", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<SubscriptionListResponse>(res);
    },
  });
}
