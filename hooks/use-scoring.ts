"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

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

export async function getLatestScoringResultForUser(
  rukapayUserID: string
): Promise<CreditScoreResultSummary | null> {
  const pageSize = 100;
  const maxPages = 30;
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await apiClient.get("/admin/scoring/results", {
      params: { page, page_size: pageSize },
    });
    const data = unwrapEnvelope<CreditScoreListResponse>(res);
    const hit =
      data.items.find((item) => item.rukapay_user_id === rukapayUserID) ?? null;
    if (hit) return hit;
    if (!data.items.length || page >= data.total_pages) break;
  }
  return null;
}

export function useLatestScoringResultForUser(
  rukapayUserID: string | null,
  baselineResultId: string | null,
  queuedAtMs: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["scoring-latest-user", rukapayUserID, baselineResultId, queuedAtMs],
    enabled: enabled && !!rukapayUserID,
    queryFn: async () => {
      if (!rukapayUserID) return null;
      const latest = await getLatestScoringResultForUser(rukapayUserID);
      if (!latest) return null;
      if (queuedAtMs) {
        const scoredAtMs = Date.parse(latest.scored_at);
        if (Number.isFinite(scoredAtMs) && scoredAtMs + 5_000 < queuedAtMs) {
          return null;
        }
      }
      if (!baselineResultId) return latest;
      return latest.id !== baselineResultId ? latest : null;
    },
    refetchInterval: (query) => (query.state.data ? false : 2500),
    staleTime: 0,
  });
}

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
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["scoring-results", page, pageSize],
    enabled: can(Perm.ScoringView),
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
  const { can } = usePermissions();
  return useQuery({
    queryKey: CREDIT_RULES_KEY,
    enabled: can(Perm.ScoringRuleView),
    queryFn: async () => {
      const res = await apiClient.get("/admin/credit-score/rules");
      return unwrapEnvelope<CreditScoreRuleResponse[]>(res);
    },
  });
}

export function useCreditScoreRuleStats() {
  const { can } = usePermissions();
  return useQuery({
    queryKey: [...CREDIT_RULES_KEY, "stats"],
    enabled: can(Perm.ScoringRuleView),
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
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["manual-review", page, pageSize],
    enabled: can(Perm.ManualReviewView),
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

export type EnqueueScoringResponse = {
  message: string;
  job_id: string;
  status: string;
};

export type BulkRunResponse = {
  id: string;
  status: string;
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  progress_percent: number;
  started_at?: string | null;
  finished_at?: string | null;
  error_summary?: string;
  requested_by: string;
};

export type RunAllScoringResponse = {
  message: string;
  bulk_run_id: string;
  total_jobs: number;
};

export type BulkRunFailureItem = {
  job_id: string;
  borrower_profile_id: string;
  rukapay_user_id: string;
  full_name?: string;
  attempts: number;
  last_error: string;
  finished_at?: string | null;
};

export type BulkRunFailuresResponse = {
  items: BulkRunFailureItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** Async admin scoring — job is processed in the background worker pool. */
const SCORING_TIMEOUT_MS = 15_000;

export function useRunScoring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RunScoringPayload) => {
      const id = encodeURIComponent(payload.rukapay_user_id);
      const qs = payload.wallet_id
        ? `?wallet_id=${encodeURIComponent(payload.wallet_id)}`
        : "";
      const res = await apiClient.post(
        `/admin/scoring/borrowers/${id}/run${qs}`,
        null,
        {
          timeout: SCORING_TIMEOUT_MS,
          signal: payload.signal,
        }
      );
      return unwrapEnvelope<EnqueueScoringResponse>(res);
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

export function useActiveBulkScoringRun(enabled = true) {
  return useQuery({
    queryKey: ["scoring-bulk-run-active"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/scoring/bulk-runs/active");
      const body = res.data as {
        success?: boolean;
        data?: BulkRunResponse | null;
        error?: { code?: string; message?: string };
      };
      if (!body?.success) {
        throw new Error(body?.error?.message ?? "Request failed");
      }
      // Backend omits `data` when no run is active (`omitempty` + nil).
      return body.data ?? null;
    },
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run) return false;
      if (
        run.status === "completed" ||
        run.status === "failed" ||
        run.status === "cancelled"
      ) {
        return false;
      }
      return 2500;
    },
  });
}

export function useBulkScoringFailures(bulkRunId: string | null, page = 1) {
  return useQuery({
    queryKey: ["scoring-bulk-failures", bulkRunId, page],
    queryFn: async () => {
      const res = await apiClient.get(
        `/admin/scoring/bulk-runs/${bulkRunId}/failures`,
        { params: { page, page_size: 10 } }
      );
      return unwrapEnvelope<BulkRunFailuresResponse>(res);
    },
    enabled: !!bulkRunId,
  });
}

export function useRunAllScoring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/admin/scoring/run-all");
      return unwrapEnvelope<RunAllScoringResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scoring-bulk-run-active"] });
    },
  });
}

export function useRunQueuedScoring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Uses the current backend bulk run endpoint, surfaced on borrowers page
      // for queue management without leaving the page.
      const res = await apiClient.post("/admin/scoring/run-all");
      return unwrapEnvelope<RunAllScoringResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scoring-bulk-run-active"] });
      void queryClient.invalidateQueries({ queryKey: ["scoring-results"] });
      void queryClient.invalidateQueries({ queryKey: ["eligibility-decisions"] });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useRetryBulkScoringFailures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bulkRunId: string) => {
      const res = await apiClient.post(
        `/admin/scoring/bulk-runs/${bulkRunId}/retry-failed`
      );
      return unwrapEnvelope<{ message: string; retried_count: number }>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scoring-bulk-run-active"] });
      void queryClient.invalidateQueries({ queryKey: ["scoring-bulk-failures"] });
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
