"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getAxiosApiErrorMessage, unwrapEnvelope } from "@/lib/api-envelope";
import { useMe } from "@/hooks/use-me";
import type {
  PartnerEscrowWalletOption,
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
      try {
        const res = await apiClient.get("/admin/wallet/escrow-options");
        return unwrapEnvelope<{ items: PartnerEscrowWalletOption[] }>(res);
      } catch (error) {
        throw new Error(getAxiosApiErrorMessage(error));
      }
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
