"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { useMe } from "@/hooks/use-me";
import type {
  PartnerEscrowWalletOption,
  PartnerWalletRule,
  PartnerWalletRuleCreatePayload,
  PartnerWalletSetup,
  PartnerWalletSetupListItem,
  PartnerWalletVerifyResult,
  PartnerUpdatePayload,
} from "@/types/partner";

export function useEscrowWalletOptions() {
  const { data: me } = useMe();
  return useQuery({
    queryKey: ["wallet", "escrow-options"],
    enabled: !!me?.is_platform,
    queryFn: async () => {
      const res = await apiClient.get("/admin/wallet/escrow-options");
      return unwrapEnvelope<{ items: PartnerEscrowWalletOption[] }>(res);
    },
  });
}

export function usePartnerWalletSetup(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-wallet-setup", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${partnerId}/wallet-setup`);
      return unwrapEnvelope<PartnerWalletSetup>(res);
    },
  });
}

/** Platform admin: all partners' disbursement/collection wallet accounts with balances. */
export function usePlatformPartnerWallets(enabled = true) {
  return useQuery({
    queryKey: ["platform-partner-wallets"],
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await apiClient.get("/admin/wallets/partners");
      const data = unwrapEnvelope<{ items: PartnerWalletSetupListItem[] }>(res);
      return data.items ?? [];
    },
  });
}

export function usePartnerWalletRules(partnerId?: string) {
  return useQuery({
    queryKey: ["partner-wallet-rules", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/partners/${partnerId}/wallet-rules`);
      return unwrapEnvelope<{ items: PartnerWalletRule[] }>(res);
    },
  });
}

export function useVerifyPartnerWallets(partnerId: string) {
  return useMutation({
    mutationFn: async (payload: {
      disbursement_wallet_id?: string;
      collection_wallet_id?: string;
    }) => {
      const res = await apiClient.post(
        `/admin/partners/${partnerId}/wallets/verify`,
        payload
      );
      return unwrapEnvelope<PartnerWalletVerifyResult>(res);
    },
  });
}

export function useSavePartnerWallets(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Pick<
      PartnerUpdatePayload,
      "rukapay_escrow_wallet_id" | "rukapay_collection_wallet_id"
    >) => {
      const res = await apiClient.patch(`/admin/partners/${partnerId}`, payload);
      return unwrapEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner", partnerId] });
      qc.invalidateQueries({ queryKey: ["partner-wallet-setup", partnerId] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useCreatePartnerWalletRule(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PartnerWalletRuleCreatePayload) => {
      const res = await apiClient.post(
        `/admin/partners/${partnerId}/wallet-rules`,
        payload
      );
      return unwrapEnvelope<PartnerWalletRule>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-wallet-rules", partnerId] });
      qc.invalidateQueries({ queryKey: ["partner-wallet-setup", partnerId] });
    },
  });
}

export function useDeletePartnerWalletRule(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.delete(`/admin/partners/${partnerId}/wallet-rules/${ruleId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-wallet-rules", partnerId] });
      qc.invalidateQueries({ queryKey: ["partner-wallet-setup", partnerId] });
    },
  });
}

export function useSetPartnerWalletReserve(partnerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      wallet_role: string;
      amount: number;
      reason: string;
    }) => {
      const res = await apiClient.post(
        `/admin/partners/${partnerId}/wallets/reserve`,
        payload
      );
      return unwrapEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-wallet-setup", partnerId] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
