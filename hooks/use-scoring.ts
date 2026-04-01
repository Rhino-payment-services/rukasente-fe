"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

// ── Scoring Rules ─────────────────────────────────────────────────────────────

export type ScoreRuleResponse = {
  id: string;
  key: string;
  description: string;
  rule_type: string;
  weight: number;
  config_json?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScoreRuleCreatePayload = {
  key: string;
  description: string;
  rule_type: string;
  weight: number;
  config_json?: Record<string, unknown>;
  is_active?: boolean;
};

// ── Credit Score Results ───────────────────────────────────────────────────────

export type CreditScoreResultSummary = {
  id: string;
  total_score: number;
  risk_band: string;
  recommended_limit: number;
  max_tenor_days: number;
  suggested_decision: string;
  reason_codes: string[];
  scoring_input_snapshot_id: string;
  scored_at: string;
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

export function useScoringRules() {
  return useQuery({
    queryKey: ["scoring-rules"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/scoring/rules");
      return unwrapEnvelope<ScoreRuleResponse[]>(res);
    },
  });
}

export function useCreateScoringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ScoreRuleCreatePayload) => {
      const res = await apiClient.post("/admin/scoring/rules", payload);
      return unwrapEnvelope<ScoreRuleResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
    },
  });
}

export function useManualReviewCases(page = 1, pageSize = 20) {
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

export function useEligibilityDecisions(page = 1, pageSize = 20) {
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
