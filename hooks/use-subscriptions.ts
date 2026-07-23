"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type SubscriptionRow = {
  id: string;
  borrower_profile_id: string;
  rukapay_user_id: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at?: string | null;
  last_eligibility_check_at?: string | null;
  next_eligibility_check_at?: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
  phone?: string;
  email?: string;
  kyc_status?: string;
};

export type SubscriptionListResponse = {
  items: SubscriptionRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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
