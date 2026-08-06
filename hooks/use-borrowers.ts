"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type { BorrowerLoans, LoanReminderResult } from "@/types/loan";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

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
  partner_id?: string | null;
  rukapay_user_id?: string;
  full_name: string;
  phone: string;
  email?: string | null;
  national_id?: string | null;
  kyc_status: string;
  status: string;
  scoring_wallet_id?: string | null;
};

export type KycStatus = "pending" | "verified" | "rejected";

export type BorrowerDetail = {
  id: string;
  partner_id?: string | null;
  rukapay_user_id: string;
  full_name: string;
  phone: string;
  email: string;
  national_id?: string | null;
  kyc_status: string;
  status: string;
  wallet_ids?: string[];
  scoring_wallet_id?: string | null;
  created_at: string;
  updated_at: string;
};

export function useBorrower(id: string) {
  return useQuery({
    queryKey: ["borrower", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/borrowers/${id}`);
      return unwrapEnvelope<BorrowerDetail>(res);
    },
  });
}

export function useBorrowerLoans(profileId: string) {
  return useQuery({
    queryKey: ["borrower-loans", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/borrowers/${profileId}/loans`);
      return unwrapEnvelope<BorrowerLoans>(res);
    },
  });
}

export function useSendLoanReminder(profileId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await apiClient.post(
        `/admin/loan-applications/${applicationId}/remind`,
        {}
      );
      return unwrapEnvelope<LoanReminderResult>(res);
    },
    onSuccess: () => {
      if (profileId) {
        void qc.invalidateQueries({ queryKey: ["borrower-loans", profileId] });
      }
    },
  });
}

export function useBorrowersList(page = 1, pageSize = 20) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["borrowers", page, pageSize],
    enabled: can(Perm.BorrowerView),
    queryFn: async () => {
      const res = await apiClient.get("/admin/borrowers", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<BorrowerListResponse>(res);
    },
  });
}

/** Server-side ranked borrower search. Enabled only when q has 2+ characters. */
export function useBorrowerSearch(q: string, page = 1, pageSize = 10) {
  const { can } = usePermissions();
  const query = q.trim();
  return useQuery({
    queryKey: ["borrowers-search", query, page, pageSize],
    enabled: can(Perm.BorrowerView) && query.length >= 2,
    queryFn: async () => {
      const res = await apiClient.get("/admin/borrowers/search", {
        params: { q: query, page, page_size: pageSize },
      });
      return unwrapEnvelope<BorrowerListResponse>(res);
    },
    placeholderData: (prev) => prev,
  });
}

export function useUpdateBorrowerKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      kyc_status,
    }: {
      id: string;
      kyc_status: KycStatus;
    }) => {
      const res = await apiClient.patch(`/admin/borrowers/${id}/kyc`, {
        kyc_status,
      });
      return unwrapEnvelope<BorrowerRow>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["borrowers"] });
    },
  });
}
