"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletPickerCards } from "@/components/partners/wallet-picker-cards";
import { CompactLoading } from "@/components/ui/loading";
import { usePartner } from "@/hooks/use-partners";
import { usePermissions } from "@/hooks/use-permissions";
import { formatUgx } from "@/hooks/use-dashboard-stats";
import {
  useEscrowWalletOptions,
  usePartnerWalletSetup,
  useSavePartnerWallets,
  useVerifyPartnerWallets,
} from "@/hooks/use-partner-wallets";
import type {
  PartnerEscrowWalletOption,
  PartnerWalletSnapshot,
} from "@/types/partner";

function ReadinessBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ready
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-800"
      }`}
    >
      {ready ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <CircleAlert className="size-3.5" />
      )}
      {ready ? "Ready" : "Incomplete"}
    </span>
  );
}

function snapshotToWalletOption(
  snap: PartnerWalletSnapshot | undefined,
  label: string,
  currency = "UGX"
): PartnerEscrowWalletOption | null {
  if (!snap?.wallet_id || !snap.configured) return null;
  return {
    id: snap.wallet_id,
    description: label,
    currency: snap.currency || currency,
    balance: snap.balance ?? snap.available ?? 0,
    frozen: snap.frozen ?? 0,
    available_balance: snap.available ?? 0,
    is_default: label.toLowerCase().includes("disbursement"),
    is_active: true,
  };
}

function mergeWalletOptions(
  options: PartnerEscrowWalletOption[],
  extras: Array<PartnerEscrowWalletOption | null>
): PartnerEscrowWalletOption[] {
  const byId = new Map<string, PartnerEscrowWalletOption>();
  for (const wallet of options) byId.set(wallet.id, wallet);
  for (const extra of extras) {
    if (extra && !byId.has(extra.id)) byId.set(extra.id, extra);
  }
  return Array.from(byId.values());
}

export default function PartnerWalletsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isPlatform } = usePermissions();
  const partnerQ = usePartner(id);
  const setupQ = usePartnerWalletSetup(id);
  const optionsQ = useEscrowWalletOptions();
  const verify = useVerifyPartnerWallets(id);
  const saveWallets = useSavePartnerWallets(id);

  const [disbursementWalletId, setDisbursementWalletId] = useState("");
  const [collectionWalletId, setCollectionWalletId] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    disbursement?: { valid: boolean; available?: number; frozen?: number };
    collection?: { valid: boolean; available?: number; frozen?: number };
    wallets_separate: boolean;
  } | null>(null);

  const partner = partnerQ.data;
  const setup = setupQ.data;
  const options = optionsQ.data?.items ?? [];
  const currency = partner?.currency || "UGX";

  const legacyDisbursementOnly =
    !!setup?.disbursement.configured && !setup?.collection.configured;

  const disbursementOptions = useMemo(
    () =>
      mergeWalletOptions(options, [
        snapshotToWalletOption(
          setup?.disbursement,
          "Disbursement account (assigned)",
          currency
        ),
      ]),
    [options, setup?.disbursement, currency]
  );

  const collectionOptions = useMemo(
    () =>
      mergeWalletOptions(options, [
        snapshotToWalletOption(
          setup?.collection,
          "Collection account (assigned)",
          currency
        ),
      ]),
    [options, setup?.collection, currency]
  );

  useEffect(() => {
    if (!initialized && (partner || setup)) {
      const disbursementId =
        setup?.disbursement.wallet_id?.trim() ||
        partner?.rukapay_escrow_wallet_id?.trim() ||
        "";
      const collectionId =
        setup?.collection.wallet_id?.trim() ||
        partner?.rukapay_collection_wallet_id?.trim() ||
        "";

      setDisbursementWalletId(disbursementId);
      setCollectionWalletId(collectionId);
      setInitialized(true);
    }
  }, [partner, setup, initialized]);

  useEffect(() => {
    const configuredDisbursement = setup?.disbursement.wallet_id?.trim();
    if (configuredDisbursement && !disbursementWalletId) {
      setDisbursementWalletId(configuredDisbursement);
    }
  }, [setup?.disbursement.wallet_id, disbursementWalletId]);

  async function onVerify() {
    try {
      const result = await verify.mutateAsync({
        disbursement_wallet_id: disbursementWalletId.trim() || undefined,
        collection_wallet_id: collectionWalletId.trim() || undefined,
      });
      setVerifyResult(result);
      toast.success("Wallets verified");
    } catch (err) {
      toast.error((err as Error).message || "Verification failed");
    }
  }

  async function onSaveWallets(e: FormEvent) {
    e.preventDefault();
    if (
      disbursementWalletId.trim() &&
      collectionWalletId.trim() &&
      disbursementWalletId.trim() === collectionWalletId.trim()
    ) {
      toast.error("Disbursement and collection wallets must be different");
      return;
    }
    try {
      await saveWallets.mutateAsync({
        rukapay_escrow_wallet_id: disbursementWalletId.trim() || null,
        rukapay_collection_wallet_id: collectionWalletId.trim() || null,
      });
      toast.success("Wallet configuration saved");
      setupQ.refetch();
    } catch (err) {
      toast.error((err as Error).message || "Failed to save");
    }
  }

  if (!isPlatform) {
    return (
      <p className="text-sm text-slate-500">
        Wallet management is only available to platform administrators.
      </p>
    );
  }

  if (partnerQ.isLoading) {
    return <CompactLoading message="Loading wallet setup…" />;
  }
  if (!partner) {
    return <p className="text-sm text-destructive">Partner not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-[#08163d]" />
            <h1 className="text-2xl font-semibold text-slate-900">Wallet setup</h1>
            {setup ? <ReadinessBadge ready={setup.ready} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure disbursement and collection wallets for{" "}
            <span className="font-medium text-slate-800">{partner.name}</span>.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/partners/${id}`}>Back to partner</Link>
        </Button>
      </div>

      {setup && setup.blocking_issues.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 text-sm text-amber-900">
            <p className="font-medium">Blocking issues</p>
            <ul className="mt-2 list-disc pl-5">
              {setup.blocking_issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Wallet configuration</h2>
          <p className="text-xs text-slate-500">
            Both accounts are ESCROW wallets in RukaPay. Assign one role for loan
            disbursement and a separate account for repayment collection.
          </p>
          {legacyDisbursementOnly ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-900">
              This partner previously used a single wallet. That wallet is kept as the{" "}
              <span className="font-semibold">disbursement</span> wallet. Choose a separate{" "}
              <span className="font-semibold">collection</span> wallet below.
            </div>
          ) : null}
          <form className="grid gap-6" onSubmit={onSaveWallets}>
            <WalletPickerCards
              label="Disbursement account"
              accountRole="disbursement"
              hint="Debited when loans are disbursed to borrowers or merchants."
              wallets={disbursementOptions}
              selectedId={disbursementWalletId}
              onSelect={setDisbursementWalletId}
              disabledWalletIds={
                collectionWalletId ? [collectionWalletId] : []
              }
              loading={optionsQ.isLoading && !setup?.disbursement.configured}
              emptyMessage={
                setup?.disbursement.configured
                  ? "Configured disbursement wallet is shown above. Add RukaPay gateway admin env vars to list more wallets."
                  : undefined
              }
            />
            <WalletPickerCards
              label="Collection account"
              accountRole="collection"
              hint="Credited when loan repayments are collected. Must differ from disbursement."
              wallets={collectionOptions}
              selectedId={collectionWalletId}
              onSelect={setCollectionWalletId}
              disabledWalletIds={
                disbursementWalletId ? [disbursementWalletId] : []
              }
              loading={optionsQ.isLoading}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={verify.isPending}
                onClick={onVerify}
              >
                Verify with RukaPay
              </Button>
              <Button
                type="submit"
                disabled={saveWallets.isPending}
                className="bg-[#08163d] text-white hover:bg-[#06102a]"
              >
                Save wallets
              </Button>
            </div>
          </form>
          {verifyResult ? (
            <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
              {verifyResult.disbursement ? (
                <p>
                  Disbursement:{" "}
                  {verifyResult.disbursement.valid ? "valid" : "invalid"}
                  {verifyResult.disbursement.available != null
                    ? ` · available ${formatUgx(verifyResult.disbursement.available)}`
                    : ""}
                </p>
              ) : null}
              {verifyResult.collection ? (
                <p>
                  Collection:{" "}
                  {verifyResult.collection.valid ? "valid" : "invalid"}
                  {verifyResult.collection.available != null
                    ? ` · available ${formatUgx(verifyResult.collection.available)}`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Readiness checklist</h2>
          {setup ? (
            <ul className="space-y-1 text-sm text-slate-700">
              <li>
                {setup.disbursement.configured ? "✓" : "○"} Disbursement account
                configured
              </li>
              <li>
                {setup.collection.configured ? "✓" : "○"} Collection account
                configured
              </li>
              <li>{setup.wallets_separate ? "✓" : "○"} Accounts are separate</li>
              <li>
                {setup.disbursement.verified && setup.collection.verified
                  ? "✓"
                  : "○"}{" "}
                Both accounts verified with RukaPay
              </li>
            </ul>
          ) : (
            <CompactLoading message="Loading readiness…" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
