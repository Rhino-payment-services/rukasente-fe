"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export function useScoringResults(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["scoring-results", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/scoring/results", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<unknown>(res);
    },
  });
}

export function useScoringRules() {
  return useQuery({
    queryKey: ["scoring-rules"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/scoring/rules");
      return unwrapEnvelope<unknown>(res);
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
      return unwrapEnvelope<unknown>(res);
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
      return unwrapEnvelope<unknown>(res);
    },
  });
}
