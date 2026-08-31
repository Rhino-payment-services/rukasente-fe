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
  return `···${trimmed.slice(-4)}`;
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
    return `${roleLabel} account${accountSuffix(wallet.id) ? ` ${accountSuffix(wallet.id)}` : ""}`;
  }

  if (description && !isGenericEscrowLabel(description)) return description;
  if (wallet.is_default) return "Default ESCROW account";
  return `ESCROW account${accountSuffix(wallet.id) ? ` ${accountSuffix(wallet.id)}` : ""}`;
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
  optionsError?: boolean;
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
  optionsError,
}: WalletPickerCardsProps) {
  const resolvedEmptyMessage =
    emptyMessage ??
    (optionsError
      ? "Could not load wallet options from RukaPay. Check RUKA_RDBS_BASE_URL and RUKA_RDBS_API_KEY on rukasente-be, then restart the backend."
      : accountRole === "disbursement"
        ? "No disbursement account options found. Set RUKA_RDBS_BASE_URL and RUKA_RDBS_API_KEY on rukasente-be."
        : accountRole === "collection"
          ? "No collection account options found. Set RUKA_RDBS_BASE_URL and RUKA_RDBS_API_KEY on rukasente-be."
          : "No ESCROW accounts found. Set RUKA_RDBS_BASE_URL and RUKA_RDBS_API_KEY on rukasente-be.");

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
        <p
          className={cn(
            "rounded-xl border border-dashed px-3 py-4 text-xs",
            optionsError
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-slate-50 text-slate-500"
          )}
        >
          {resolvedEmptyMessage}
        </p>
      ) : (
        <div className="grid gap-2">
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
                  "flex w-full items-stretch justify-between gap-4 rounded-xl border p-3 text-left transition",
                  selected
                    ? accountRole === "collection"
                      ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600/20"
                      : "border-[#08163d] bg-[#08163d]/5 ring-1 ring-[#08163d]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
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
                  <div className="min-w-0 flex-1">
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
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                      {wallet.wallet_number ? (
                        <span>
                          Wallet <span className="font-semibold">#{wallet.wallet_number}</span>
                        </span>
                      ) : null}
                      {wallet.public_wallet_id ? (
                        <span>
                          RukaPay No.{" "}
                          <span className="font-semibold">{wallet.public_wallet_id}</span>
                        </span>
                      ) : null}
                      {accountSuffix(wallet.id) ? (
                        <span className="font-mono text-slate-400">
                          ID {accountSuffix(wallet.id)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {selected ? (
                    <CheckCircle2
                      className={cn(
                        "size-4 shrink-0 self-start",
                        accountRole === "collection"
                          ? "text-sky-700"
                          : "text-[#08163d]"
                      )}
                    />
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {formatUgx(wallet.available_balance)}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Available
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Frozen {formatUgx(wallet.frozen)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Lookup wallet metadata from options list for verify summary. */
export function findWalletOption(
  wallets: PartnerEscrowWalletOption[],
  walletId: string
): PartnerEscrowWalletOption | undefined {
  const id = walletId.trim();
  if (!id) return undefined;
  return wallets.find((w) => w.id === id);
}
