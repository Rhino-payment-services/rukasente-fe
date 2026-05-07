"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type BorrowerListResponse = {
  items: BorrowerRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type BorrowerRow = {
  // Internal identifier — kept off the UI but needed for per-borrower actions
  // (e.g. running a credit score via /internal/scoring/borrowers/{id}/run).
  id?: string;
  rukapay_user_id?: string;
  full_name: string;
  phone: string;
  email?: string | null;
  kyc_status: string;
  status: string;
  scoring_wallet_id?: string | null;
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
