"use client";

import { CheckCircle2, Wallet } from "lucide-react";
import { formatUgx } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";
import type { PartnerEscrowWalletOption } from "@/types/partner";
import { CompactLoading } from "@/components/ui/loading";

function walletTitle(wallet: PartnerEscrowWalletOption) {
  if (wallet.description?.trim()) return wallet.description.trim();
  if (wallet.is_default) return "Default ESCROW wallet";
  return `${wallet.currency || "UGX"} ESCROW wallet`;
}

function walletSubtitle(wallet: PartnerEscrowWalletOption) {
  const parts = [
    wallet.currency || "UGX",
    wallet.is_active ? "Active" : "Inactive",
  ];
  if (wallet.is_default) parts.push("Default");
  return parts.join(" · ");
}

type WalletPickerCardsProps = {
  label: string;
  hint?: string;
  wallets: PartnerEscrowWalletOption[];
  selectedId: string;
  onSelect: (walletId: string) => void;
  disabledWalletIds?: string[];
  loading?: boolean;
  emptyMessage?: string;
};

export function WalletPickerCards({
  label,
  hint,
  wallets,
  selectedId,
  onSelect,
  disabledWalletIds = [],
  loading,
  emptyMessage = "No ESCROW wallets found. Check RukaPay gateway admin configuration.",
}: WalletPickerCardsProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <CompactLoading message="Loading wallets…" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label ? (
        <div>
          <p className="text-xs font-medium text-slate-700">{label}</p>
          {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
        </div>
      ) : null}

      {!wallets.length ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {wallets.map((wallet) => {
            const selected = selectedId === wallet.id;
            const disabled =
              !wallet.is_active || disabledWalletIds.includes(wallet.id);
            return (
              <button
                key={wallet.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(wallet.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-[#08163d] bg-[#08163d]/5 ring-1 ring-[#08163d]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                        selected ? "bg-[#08163d] text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Wallet className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {walletTitle(wallet)}
                      </p>
                      <p className="text-[11px] text-slate-500">{walletSubtitle(wallet)}</p>
                    </div>
                  </div>
                  {selected ? (
                    <CheckCircle2 className="size-4 shrink-0 text-[#08163d]" />
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-slate-500">Available</p>
                    <p className="font-semibold text-slate-900">
                      {formatUgx(wallet.available_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Frozen</p>
                    <p className="font-semibold text-slate-900">
                      {formatUgx(wallet.frozen)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
