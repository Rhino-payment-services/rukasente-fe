"use client";

import { useQueries } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type { StaffListResponse } from "@/hooks/use-staff";
import type { BorrowerListResponse } from "@/hooks/use-borrowers";
import type { SubscriptionListResponse } from "@/hooks/use-subscriptions";
import type { IntegrationRow } from "@/hooks/use-integrations";

/**
 * Parallel lightweight list calls (page_size=1) to read pagination totals + integrations list length.
 */
export function useDashboardStats() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard-stats", "staff"],
        queryFn: async () => {
          const res = await apiClient.get("/admin/staff", {
            params: { page: 1, page_size: 1 },
          });
          return unwrapEnvelope<StaffListResponse>(res);
        },
        retry: 1,
      },
      {
        queryKey: ["dashboard-stats", "borrowers"],
        queryFn: async () => {
          const res = await apiClient.get("/admin/borrowers", {
            params: { page: 1, page_size: 1 },
          });
          return unwrapEnvelope<BorrowerListResponse>(res);
        },
        retry: 1,
      },
      {
        queryKey: ["dashboard-stats", "subscriptions"],
        queryFn: async () => {
          const res = await apiClient.get("/admin/subscriptions", {
            params: { page: 1, page_size: 1 },
          });
          return unwrapEnvelope<SubscriptionListResponse>(res);
        },
        retry: 1,
      },
      {
        queryKey: ["dashboard-stats", "integrations"],
        queryFn: async () => {
          const res = await apiClient.get("/admin/integrations");
          return unwrapEnvelope<IntegrationRow[]>(res);
        },
        retry: 1,
      },
    ],
  });

  const [staffQ, borrowersQ, subscriptionsQ, integrationsQ] = queries;

  const integrations = integrationsQ.data;
  const activeIntegrations =
    integrations?.filter((i) => i.is_active).length ?? null;

  return {
    staffTotal: staffQ.data?.total ?? null,
    borrowersTotal: borrowersQ.data?.total ?? null,
    subscriptionsTotal: subscriptionsQ.data?.total ?? null,
    integrationsTotal: integrations ? integrations.length : null,
    activeIntegrations,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    error: queries.find((q) => q.error)?.error,
    refetch: async () => {
      await Promise.all(queries.map((q) => q.refetch()));
    },
  };
}
