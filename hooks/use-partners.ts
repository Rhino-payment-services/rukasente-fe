"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  PaginatedPartners,
  Partner,
  PartnerAPILog,
  PartnerCreatePayload,
  PartnerCredential,
  PartnerCredentialCreated,
  PartnerStats,
  PartnerUpdatePayload,
} from "@/types/partner";
import type { BorrowerRow } from "@/hooks/use-borrowers";

export function usePartners(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["partners", params],
    queryFn: async () => {
      const res = await apiClient.get("/admin/partners", { params });
      return unwrapEnvelope<PaginatedPartners>(res);
    },
  });
}

export function usePartner(id?: string) {
  return useQuery({
    queryKey: ["partner", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${id}`);
      return unwrapEnvelope<Partner>(res);
    },
  });
}

export function usePartnerStats(id?: string) {
  return useQuery({
    queryKey: ["partner-stats", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${id}/stats`);
      return unwrapEnvelope<PartnerStats>(res);
    },
  });
}

export function usePartnerCredentials(id?: string) {
  return useQuery({
    queryKey: ["partner-credentials", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${id}/credentials`);
      return unwrapEnvelope<{ items: PartnerCredential[] }>(res);
    },
  });
}

export function usePartnerAPILogs(
  id?: string,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: ["partner-api-logs", id, page, pageSize],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${id}/api-logs`, {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<{
        items: PartnerAPILog[];
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
      }>(res);
    },
  });
}

export function usePartnerBorrowers(id?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["partner-borrowers", id, page, pageSize],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${id}/borrowers`, {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<{
        items: BorrowerRow[];
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
      }>(res);
    },
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PartnerCreatePayload) => {
      const res = await apiClient.post("/admin/partners", payload);
      return unwrapEnvelope<Partner>(res);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useUpdatePartner(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PartnerUpdatePayload) => {
      const res = await apiClient.patch(`/admin/partners/${id}`, payload);
      return unwrapEnvelope<Partner>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partners"] });
      void qc.invalidateQueries({ queryKey: ["partner", id] });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/partners/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useGeneratePartnerCredential(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: { name?: string; expires_at?: string }) => {
      const res = await apiClient.post(
        `/admin/partners/${partnerId}/credentials`,
        payload ?? {}
      );
      return unwrapEnvelope<PartnerCredentialCreated>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-credentials", partnerId] });
      void qc.invalidateQueries({ queryKey: ["partner-stats", partnerId] });
    },
  });
}

export function useRevokePartnerCredential(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credentialId: string) => {
      const res = await apiClient.post(
        `/admin/partners/${partnerId}/credentials/${credentialId}/revoke`
      );
      return unwrapEnvelope<PartnerCredential>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-credentials", partnerId] });
      void qc.invalidateQueries({ queryKey: ["partner-stats", partnerId] });
    },
  });
}

export function useRegeneratePartnerCredential(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credentialId: string) => {
      const res = await apiClient.post(
        `/admin/partners/${partnerId}/credentials/${credentialId}/regenerate`
      );
      return unwrapEnvelope<PartnerCredentialCreated>(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-credentials", partnerId] });
      void qc.invalidateQueries({ queryKey: ["partner-stats", partnerId] });
    },
  });
}
