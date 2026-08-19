"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import {
  LoanAccount,
  LoanApplication,
  LoanApplicationReview,
  LoanLedgerEntry,
  LoanProduct,
  LoanProductCreatePayload,
  LoanProductEligibilityRule,
  LoanProductPreApprovalRule,
  LoanProductUpdatePayload,
  LoanRepayment,
  CreditScoreLoanLimit,
  ProductStats,
  Paginated,
} from "@/types/loan";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

export function useLoanProducts(params?: {
  page?: number;
  page_size?: number;
  active?: string;
  currency?: string;
  search?: string;
}) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["loan-products", params],
    enabled: can(Perm.LoanProductView),
    queryFn: async () => {
      const res = await apiClient.get("/admin/loan-products", { params });
      return unwrapEnvelope<Paginated<LoanProduct>>(res);
    },
  });
}

export function useLoanProduct(id?: string) {
  return useQuery({
    queryKey: ["loan-product", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/loan-products/${id}`);
      return unwrapEnvelope<LoanProduct>(res);
    },
  });
}

export function useCreateLoanProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoanProductCreatePayload) => {
      const res = await apiClient.post("/admin/loan-products", payload);
      return unwrapEnvelope<LoanProduct>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-products"] }),
  });
}

export function useUpdateLoanProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoanProductUpdatePayload) => {
      const res = await apiClient.patch(`/admin/loan-products/${id}`, payload);
      return unwrapEnvelope<LoanProduct>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["loan-products"] });
      void qc.invalidateQueries({ queryKey: ["loan-product", id] });
    },
  });
}

export function useSetLoanProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/admin/loan-products/${id}/status`, {
        is_active: isActive,
      });
      return unwrapEnvelope<LoanProduct>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-products"] }),
  });
}

export function useLoanProductRules(productId?: string) {
  return useQuery({
    queryKey: ["loan-product-rules", productId],
    enabled: !!productId,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/loan-products/${productId}/rules`);
      return unwrapEnvelope<LoanProductEligibilityRule[]>(res);
    },
  });
}

export function useCreateLoanRule(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      rule_type: string;
      operator: string;
      value: string;
      description?: string;
      is_active: boolean;
    }) => {
      const res = await apiClient.post(`/admin/loan-products/${productId}/rules`, payload);
      return unwrapEnvelope<LoanProductEligibilityRule>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-product-rules", productId] }),
  });
}

export function useDeleteLoanRule(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await apiClient.delete(`/admin/loan-product-rules/${ruleId}`);
      return unwrapEnvelope<{ deleted: boolean }>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-product-rules", productId] }),
  });
}

export function useLoanProductPreApprovalRules(productId?: string) {
  return useQuery({
    queryKey: ["loan-product-preapproval-rules", productId],
    enabled: !!productId,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/loan-products/${productId}/preapproval-rules`);
      return unwrapEnvelope<LoanProductPreApprovalRule[]>(res);
    },
  });
}

export function useCreateLoanPreApprovalRule(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      rule_type: string;
      operator: string;
      value: string;
      description?: string;
      is_active: boolean;
    }) => {
      const res = await apiClient.post(`/admin/loan-products/${productId}/preapproval-rules`, payload);
      return unwrapEnvelope<LoanProductPreApprovalRule>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-product-preapproval-rules", productId] }),
  });
}

export function useDeleteLoanPreApprovalRule(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await apiClient.delete(`/admin/loan-product-preapproval-rules/${ruleId}`);
      return unwrapEnvelope<{ deleted: boolean }>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-product-preapproval-rules", productId] }),
  });
}

export function useDeleteLoanProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/admin/loan-products/${id}`);
      return unwrapEnvelope<{ deleted: boolean }>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-products"] }),
  });
}

export function useLoanProductStats() {
  return useQuery({
    queryKey: ["loan-product-stats"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/loan-products/stats");
      return unwrapEnvelope<ProductStats>(res);
    },
  });
}

export function useCreditScoreLoanLimits() {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["loan-score-limits"],
    enabled: can(Perm.LoanScoreLimitView),
    queryFn: async () => {
      const res = await apiClient.get("/admin/loan-score-limits");
      return unwrapEnvelope<CreditScoreLoanLimit[]>(res);
    },
  });
}

export function useCreateCreditScoreLoanLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      min_score: number;
      max_score: number;
      maximum_loan_amount: number;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post("/admin/loan-score-limits", payload);
      return unwrapEnvelope<CreditScoreLoanLimit>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-score-limits"] }),
  });
}

export function useUpdateCreditScoreLoanLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        min_score?: number;
        max_score?: number;
        maximum_loan_amount?: number;
        is_active?: boolean;
      };
    }) => {
      const res = await apiClient.put(`/admin/loan-score-limits/${id}`, payload);
      return unwrapEnvelope<CreditScoreLoanLimit>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-score-limits"] }),
  });
}

export function useDeleteCreditScoreLoanLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/admin/loan-score-limits/${id}`);
      return unwrapEnvelope<{ deleted: boolean }>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-score-limits"] }),
  });
}

export function useLoanApplications(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  product_id?: string;
  borrower_id?: string;
}) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["loan-applications", params],
    enabled: can(Perm.LoanApplicationView),
    queryFn: async () => {
      const res = await apiClient.get("/admin/loan-applications", { params });
      return unwrapEnvelope<Paginated<LoanApplication>>(res);
    },
  });
}

export function useLoanApplication(id?: string) {
  return useQuery({
    queryKey: ["loan-application", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/loan-applications/${id}`);
      return unwrapEnvelope<LoanApplication>(res);
    },
  });
}

export function useLoanApplicationReviews(id?: string) {
  return useQuery({
    queryKey: ["loan-application-reviews", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/loan-applications/${id}/reviews`);
      return unwrapEnvelope<LoanApplicationReview[]>(res);
    },
  });
}

export function useReviewLoanApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { action: string; notes: string }) => {
      const res = await apiClient.patch(`/admin/loan-applications/${id}/review`, payload);
      return unwrapEnvelope<LoanApplication>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["loan-application", id] });
      void qc.invalidateQueries({ queryKey: ["loan-applications"] });
      void qc.invalidateQueries({ queryKey: ["loan-application-reviews", id] });
    },
  });
}

function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export function useLoanAccount(applicationId?: string) {
  return useQuery({
    queryKey: ["loan-account", applicationId],
    enabled: !!applicationId,
    retry: false,
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/loan-applications/${applicationId}/account`);
        return unwrapEnvelope<LoanAccount>(res);
      } catch (err) {
        if (isNotFoundError(err)) return null;
        throw err;
      }
    },
  });
}

export function useLoanRepayments(applicationId?: string) {
  return useQuery({
    queryKey: ["loan-repayments", applicationId],
    enabled: !!applicationId,
    retry: false,
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/loan-applications/${applicationId}/repayments`);
        return unwrapEnvelope<LoanRepayment[]>(res);
      } catch (err) {
        if (isNotFoundError(err)) return [];
        throw err;
      }
    },
  });
}

export function useLoanLedger(applicationId?: string) {
  return useQuery({
    queryKey: ["loan-ledger", applicationId],
    enabled: !!applicationId,
    retry: false,
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/admin/loan-applications/${applicationId}/ledger`);
        return unwrapEnvelope<LoanLedgerEntry[]>(res);
      } catch (err) {
        if (isNotFoundError(err)) return [];
        throw err;
      }
    },
  });
}

export function useInitiateLoanRepayment(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      amount: number;
      wallet_id?: string;
      idempotency_key?: string;
    }) => {
      const res = await apiClient.post(`/admin/loan-applications/${applicationId}/repay`, payload);
      return unwrapEnvelope(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["loan-account", applicationId] });
      void qc.invalidateQueries({ queryKey: ["loan-repayments", applicationId] });
      void qc.invalidateQueries({ queryKey: ["loan-ledger", applicationId] });
      void qc.invalidateQueries({ queryKey: ["loan-application", applicationId] });
      void qc.invalidateQueries({ queryKey: ["loan-applications"] });
    },
  });
}

// Borrower/internal endpoints
export function useBorrowerLoanProducts(rukapayUserId: string) {
  return useQuery({
    queryKey: ["borrower-loan-products", rukapayUserId],
    enabled: !!rukapayUserId,
    queryFn: async () => {
      const res = await apiClient.get(`/api/internal/borrowers/${rukapayUserId}/loan-products`);
      return unwrapEnvelope<LoanProduct[]>(res);
    },
  });
}

export function useCreateBorrowerLoanApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      rukapay_user_id: string;
      loan_product_id: string;
      requested_amount: number;
      requested_tenor_days: number;
      purpose: string;
      submission_channel: "web" | "internal_admin" | "api";
    }) => {
      // Go through the Next.js internal proxy (holds X-Internal-API-Key).
      const res = await axios.post("/api/internal/loan-applications", payload);
      return unwrapEnvelope<LoanApplication>(res);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["borrower-loan-applications", vars.rukapay_user_id] });
      void qc.invalidateQueries({ queryKey: ["loan-applications"] });
    },
  });
}

export function useBorrowerLoanApplications(rukapayUserId: string) {
  return useQuery({
    queryKey: ["borrower-loan-applications", rukapayUserId],
    enabled: !!rukapayUserId,
    queryFn: async () => {
      const res = await apiClient.get(
        `/api/internal/borrowers/${rukapayUserId}/loan-applications`
      );
      return unwrapEnvelope<Paginated<LoanApplication>>(res);
    },
  });
}

export function useBorrowerLoanApplication(id?: string) {
  return useQuery({
    queryKey: ["borrower-loan-application", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/api/internal/loan-applications/${id}`);
      return unwrapEnvelope<LoanApplication>(res);
    },
  });
}
