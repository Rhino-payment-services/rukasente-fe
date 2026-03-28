"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type StaffSummary = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  permissions?: string[];
  roles?: Array<{
    id: string;
    name: string;
    description?: string;
    is_system: boolean;
  }>;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/me`);
      return unwrapEnvelope<StaffSummary>(res);
    },
  });
}
