"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import {
  LoanApplication,
  LoanApplicationReview,
  LoanProduct,
  LoanProductCreatePayload,
  LoanProductEligibilityRule,
  LoanProductUpdatePayload,
  Paginated,
} from "@/types/loan";

export function useLoanProducts(params?: {
  page?: number;
  page_size?: number;
  active?: string;
  currency?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["loan-products", params],
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
      rule_key: string;
      operator: string;
      rule_value: string;
      is_active: boolean;
    }) => {
      const res = await apiClient.post(`/admin/loan-products/${productId}/rules`, payload);
      return unwrapEnvelope<LoanProductEligibilityRule>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["loan-product-rules", productId] }),
  });
}

export function useLoanApplications(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  product_id?: string;
  borrower_id?: string;
}) {
  return useQuery({
    queryKey: ["loan-applications", params],
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

// Borrower/internal endpoints
export function useBorrowerLoanProducts(rukapayUserId: string) {
  return useQuery({
    queryKey: ["borrower-loan-products", rukapayUserId],
    enabled: !!rukapayUserId,
    queryFn: async () => {
      const res = await apiClient.get(`/internal/borrowers/${rukapayUserId}/loan-products`);
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
      const res = await apiClient.post("/internal/loan-applications", payload);
      return unwrapEnvelope<LoanApplication>(res);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["borrower-loan-applications", vars.rukapay_user_id] });
    },
  });
}

export function useBorrowerLoanApplications(rukapayUserId: string) {
  return useQuery({
    queryKey: ["borrower-loan-applications", rukapayUserId],
    enabled: !!rukapayUserId,
    queryFn: async () => {
      const res = await apiClient.get(`/internal/borrowers/${rukapayUserId}/loan-applications`);
      return unwrapEnvelope<Paginated<LoanApplication>>(res);
    },
  });
}

export function useBorrowerLoanApplication(id?: string) {
  return useQuery({
    queryKey: ["borrower-loan-application", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/internal/loan-applications/${id}`);
      return unwrapEnvelope<LoanApplication>(res);
    },
  });
}
