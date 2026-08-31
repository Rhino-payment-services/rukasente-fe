"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { useMe } from "@/hooks/use-me";

export type EscrowBalance = {
  configured: boolean;
  available?: number;
  currency?: string;
  wallet_id?: string;
};

export type PartnerWalletBalances = {
  disbursement: EscrowBalance;
  collection: EscrowBalance;
};

function walletQueryKey(me: ReturnType<typeof useMe>["data"], suffix: string) {
  return [
    "wallet",
    suffix,
    me?.is_platform ? "platform" : (me?.partner_id ?? null),
  ] as const;
}

/** Fetches RukaPay disbursement wallet balance for tenant staff and platform. */
export function useEscrowBalance() {
  const { data: me } = useMe();
  const enabled = Boolean(me);

  return useQuery({
    queryKey: walletQueryKey(me, "escrow-balance"),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/wallet/escrow-balance`);
      return unwrapEnvelope<EscrowBalance>(res);
    },
  });
}

/** Fetches RukaPay collection wallet balance for tenant staff and platform. */
export function useCollectionBalance() {
  const { data: me } = useMe();
  const enabled = Boolean(me);

  return useQuery({
    queryKey: walletQueryKey(me, "collection-balance"),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/wallet/collection-balance`);
      return unwrapEnvelope<EscrowBalance>(res);
    },
  });
}

/** Fetches disbursement and collection wallet balances in one request. */
export function useWalletBalances() {
  const { data: me } = useMe();
  const enabled = Boolean(me);

  return useQuery({
    queryKey: walletQueryKey(me, "balances"),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/wallet/balances`);
      return unwrapEnvelope<PartnerWalletBalances>(res);
    },
  });
}
