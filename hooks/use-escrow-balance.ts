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

/** Fetches RukaPay ESCROW balance for tenant staff and platform (main RukaSente). */
export function useEscrowBalance() {
  const { data: me } = useMe();
  const enabled = Boolean(me);

  return useQuery({
    queryKey: [
      "wallet",
      "escrow-balance",
      me?.is_platform ? "platform" : (me?.partner_id ?? null),
    ],
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/wallet/escrow-balance`);
      return unwrapEnvelope<EscrowBalance>(res);
    },
  });
}
