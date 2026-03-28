"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type StaffListResponse = {
  items: Array<{
    id: string;
    full_name: string;
    email: string;
    status: string;
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
};

export function useStaffList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["staff", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/staff", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<StaffListResponse>(res);
    },
  });
}
