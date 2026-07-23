"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

// ── Credit Score Rules Engine ─────────────────────────────────────────────────

export type CreditScoreRuleResponse = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  condition: string;
  operator: string;
  threshold?: number | null;
  score_value: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

export type CreditScoreRuleStats = {
  total: number;
  active: number;
  positive: number;
  negative: number;
};

export type CreditScoreRuleCreatePayload = {
  name: string;
  description?: string;
  category: string;
  type: string;
  condition: string;
  operator?: string;
  threshold?: number | null;
  score_value: number;
  is_active?: boolean;
  priority?: number;
};

export type CreditScoreRuleUpdatePayload = Partial<CreditScoreRuleCreatePayload>;

/** @deprecated Use CreditScoreRuleResponse */
export type ScoreRuleResponse = CreditScoreRuleResponse;
/** @deprecated Use CreditScoreRuleCreatePayload */
export type ScoreRuleCreatePayload = CreditScoreRuleCreatePayload;

// ── Credit Score Results ───────────────────────────────────────────────────────

export type CreditScoreResultSummary = {
  id: string;
  borrower_profile_id: string;
  total_score: number;
  risk_band: string;
  recommended_limit: number;
  max_tenor_days: number;
  suggested_decision: string;
  reason_codes: string[];
  scoring_input_snapshot_id: string;
  scored_at: string;
  rukapay_user_id?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  kyc_status?: string;
};

export type CreditScoreListResponse = {
  items: CreditScoreResultSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// ── Manual Review ──────────────────────────────────────────────────────────────

export type ManualReviewCaseResponse = {
  id: string;
  borrower_profile_id: string;
  subscription_id: string;
  credit_score_result_id: string;
  status: string;
  assigned_to_staff_user_id?: string;
  review_notes: string;
  resolution: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
};

export type ManualReviewListResponse = {
  items: ManualReviewCaseResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// ── Eligibility Decisions ─────────────────────────────────────────────────────

export type EligibilityRow = {
  id: string;
  borrower_profile_id: string;
  subscription_id: string;
  wallet_id: string;
  status: string;
  reason_code: string;
  decision_source: string;
  checked_at: string;
  credit_score_result_id?: string;
};

export type EligibilityListResponse = {
  items: EligibilityRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useScoringResults(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["scoring-results", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/scoring/results", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<CreditScoreListResponse>(res);
    },
  });
}

const CREDIT_RULES_KEY = ["credit-score-rules"] as const;

export function useScoringRules() {
  return useQuery({
    queryKey: CREDIT_RULES_KEY,
    queryFn: async () => {
      const res = await apiClient.get("/admin/credit-score/rules");
      return unwrapEnvelope<CreditScoreRuleResponse[]>(res);
    },
  });
}

export function useCreditScoreRuleStats() {
  return useQuery({
    queryKey: [...CREDIT_RULES_KEY, "stats"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/credit-score/rules/stats");
      return unwrapEnvelope<CreditScoreRuleStats>(res);
    },
  });
}

export function useCreateScoringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreditScoreRuleCreatePayload) => {
      const res = await apiClient.post("/admin/credit-score/rules", payload);
      return unwrapEnvelope<CreditScoreRuleResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREDIT_RULES_KEY });
    },
  });
}

export function useUpdateCreditScoreRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: CreditScoreRuleUpdatePayload;
    }) => {
      const res = await apiClient.put(`/admin/credit-score/rules/${id}`, payload);
      return unwrapEnvelope<CreditScoreRuleResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREDIT_RULES_KEY });
    },
  });
}

export function useDeleteCreditScoreRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/admin/credit-score/rules/${id}`);
      return unwrapEnvelope<{ deleted: boolean }>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREDIT_RULES_KEY });
    },
  });
}

export function useSetCreditScoreRuleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await apiClient.patch(`/admin/credit-score/rules/${id}/status`, {
        is_active,
      });
      return unwrapEnvelope<CreditScoreRuleResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREDIT_RULES_KEY });
    },
  });
}

export function useResetCreditScoreRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/admin/credit-score/rules/reset");
      return unwrapEnvelope<CreditScoreRuleResponse[]>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREDIT_RULES_KEY });
    },
  });
}

export function useManualReviewCases(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["manual-review", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/manual-review-cases", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<ManualReviewListResponse>(res);
    },
  });
}

export type ManualReviewUpdatePayload = {
  status?: string;
  resolution?: string;
  review_notes?: string;
  assigned_to_staff_user_id?: string;
};

export function useUpdateManualReviewCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: ManualReviewUpdatePayload & { id: string }) => {
      const res = await apiClient.patch(`/admin/manual-review-cases/${id}`, body);
      return unwrapEnvelope<ManualReviewCaseResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manual-review"] });
      void queryClient.invalidateQueries({ queryKey: ["eligibility-decisions"] });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

// Trigger a fresh scoring run for one borrower via the server-side proxy
// (which holds the X-Internal-API-Key). Invalidates the score-results list on success.
export type RunScoringPayload = {
  rukapay_user_id: string;
  wallet_id?: string;
  signal?: AbortSignal;
};

export type RunScoringResponse = {
  credit_score_result: CreditScoreResultSummary;
  eligibility_decision: {
    id: string;
    wallet_id: string;
    status: string;
    reason_code: string;
    decision_source: string;
    approved_limit?: number;
    approved_max_tenor_days?: number;
    credit_score_result_id?: string;
  };
  manual_review_case_id?: string;
};

/** Scoring can call RukaPay + the Python scorer; bound wait so the UI never hangs forever. */
const SCORING_TIMEOUT_MS = 45_000;

export function useRunScoring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RunScoringPayload) => {
      const id = encodeURIComponent(payload.rukapay_user_id);
      const qs = payload.wallet_id
        ? `?wallet_id=${encodeURIComponent(payload.wallet_id)}`
        : "";
      const res = await axios.post(`/api/internal/scoring/${id}/run${qs}`, null, {
        timeout: SCORING_TIMEOUT_MS,
        signal: payload.signal,
      });
      return unwrapEnvelope<RunScoringResponse>(res);
    },
    onSuccess: () => {
      // Defer invalidation so the borrowers UI can settle first. Sync
      // invalidation + refetch storms were contributing to tab freezes.
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["scoring-results"] });
        void queryClient.invalidateQueries({
          queryKey: ["eligibility-decisions"],
        });
        void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      }, 0);
    },
  });
}

export function useEligibilityDecisions(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["eligibility-decisions", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/eligibility-decisions", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<EligibilityListResponse>(res);
    },
  });
}
