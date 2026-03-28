"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type BorrowerListResponse = {
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  page_size: number;
};

export function useBorrowersList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["borrowers", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/borrowers", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<BorrowerListResponse>(res);
    },
  });
}
