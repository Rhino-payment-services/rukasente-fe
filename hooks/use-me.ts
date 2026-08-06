"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type PartnerSummary = {
  id: string;
  name: string;
  code: string;
  is_internal: boolean;
  logo_url?: string;
  primary_color?: string;
  currency?: string;
};

export type StaffSummary = {
  id: string;
  partner_id?: string | null;
  is_platform: boolean;
  partner?: PartnerSummary | null;
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

export function useMe(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["me"],
    enabled: opts?.enabled ?? true,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/me`);
      return unwrapEnvelope<StaffSummary>(res);
    },
  });
}
