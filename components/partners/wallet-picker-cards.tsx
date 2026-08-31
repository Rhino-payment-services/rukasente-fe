"use client";

import { CheckCircle2, Wallet } from "lucide-react";
import { formatUgx } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";
import type { PartnerEscrowWalletOption } from "@/types/partner";
import { CompactLoading } from "@/components/ui/loading";

export type PartnerWalletAccountRole = "disbursement" | "collection";

const ROLE_META: Record<
  PartnerWalletAccountRole,
  { label: string; badgeClass: string; purpose: string }
> = {
  disbursement: {
    label: "Disbursement",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    purpose: "Loan payouts",
  },
  collection: {
    label: "Collection",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    purpose: "Repayments",
  },
};

function isGenericEscrowLabel(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized === "escrow" ||
    normalized.includes("escrow wallet") ||
    normalized === "default escrow wallet" ||
    /^[a-z]{3} escrow/.test(normalized)
  );
}

function accountSuffix(walletId: string): string {
  const trimmed = walletId.trim();
  if (trimmed.length < 4) return "";
  return ` ···${trimmed.slice(-4)}`;
}

function walletTitle(
  wallet: PartnerEscrowWalletOption,
  accountRole?: PartnerWalletAccountRole
) {
  const description = wallet.description?.trim();

  if (accountRole) {
    const roleLabel = ROLE_META[accountRole].label;
    if (description) {
      if (description.toLowerCase().includes(accountRole)) return description;
      if (!isGenericEscrowLabel(description)) {
        return `${roleLabel} · ${description}`;
      }
    }
    return `${roleLabel} account${accountSuffix(wallet.id)}`;
  }

  if (description && !isGenericEscrowLabel(description)) return description;
  if (wallet.is_default) return "Default ESCROW account";
  return `ESCROW account${accountSuffix(wallet.id)}`;
}

function walletSubtitle(
  wallet: PartnerEscrowWalletOption,
  accountRole?: PartnerWalletAccountRole
) {
  const parts = [
    "RukaPay ESCROW",
    wallet.currency || "UGX",
    wallet.is_active ? "Active" : "Inactive",
  ];
  if (accountRole) parts.push(ROLE_META[accountRole].purpose);
  if (wallet.is_default) parts.push("Default");
  return parts.join(" · ");
}

type WalletPickerCardsProps = {
  label: string;
  hint?: string;
  accountRole?: PartnerWalletAccountRole;
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
  accountRole,
  wallets,
  selectedId,
  onSelect,
  disabledWalletIds = [],
  loading,
  emptyMessage,
}: WalletPickerCardsProps) {
  const resolvedEmptyMessage =
    emptyMessage ??
    (accountRole === "disbursement"
      ? "No disbursement account options found. Check RukaPay gateway admin configuration."
      : accountRole === "collection"
        ? "No collection account options found. Check RukaPay gateway admin configuration."
        : "No ESCROW accounts found. Check RukaPay gateway admin configuration.");

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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-slate-700">{label}</p>
            {accountRole ? (
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  ROLE_META[accountRole].badgeClass
                )}
              >
                {ROLE_META[accountRole].label}
              </span>
            ) : null}
          </div>
          {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
        </div>
      ) : null}

      {!wallets.length ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
          {resolvedEmptyMessage}
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
                    ? accountRole === "collection"
                      ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600/20"
                      : "border-[#08163d] bg-[#08163d]/5 ring-1 ring-[#08163d]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                        selected
                          ? accountRole === "collection"
                            ? "bg-sky-700 text-white"
                            : "bg-[#08163d] text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Wallet className="size-4" />
                    </span>
                    <div className="min-w-0">
                      {accountRole ? (
                        <span
                          className={cn(
                            "mb-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            ROLE_META[accountRole].badgeClass
                          )}
                        >
                          {ROLE_META[accountRole].label}
                        </span>
                      ) : null}
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {walletTitle(wallet, accountRole)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {walletSubtitle(wallet, accountRole)}
                      </p>
                    </div>
                  </div>
                  {selected ? (
                    <CheckCircle2
                      className={cn(
                        "size-4 shrink-0",
                        accountRole === "collection"
                          ? "text-sky-700"
                          : "text-[#08163d]"
                      )}
                    />
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
