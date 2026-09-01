"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  WalletPickerCards,
  findWalletOption,
} from "@/components/partners/wallet-picker-cards";
import { CompactLoading } from "@/components/ui/loading";
import { useMe } from "@/hooks/use-me";
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

function VerifySummaryRow({
  role,
  wallet,
  valid,
  available,
}: {
  role: string;
  wallet?: PartnerEscrowWalletOption;
  valid: boolean;
  available?: number;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-xs ${
        valid
          ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
          : "border-rose-200 bg-rose-50/60 text-rose-900"
      }`}
    >
      <p className="font-semibold">{role}</p>
      {wallet ? (
        <p className="mt-0.5 text-slate-700">
          {wallet.description || "ESCROW account"}
          {wallet.wallet_number ? ` · Wallet #${wallet.wallet_number}` : ""}
          {wallet.public_wallet_id ? ` · RukaPay ${wallet.public_wallet_id}` : ""}
        </p>
      ) : null}
      <p className="mt-1">
        {valid ? "Verified" : "Not verified"}
        {available != null ? ` · Available ${formatUgx(available)}` : ""}
      </p>
    </div>
  );
}

function WalletSnapshotCard({
  title,
  hint,
  snap,
}: {
  title: string;
  hint: string;
  snap: PartnerWalletSnapshot | undefined;
}) {
  const configured = snap?.configured;
  const verified = snap?.verified;
  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
          {configured ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                verified
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {verified ? "Verified" : "Unverified"}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Not set
            </span>
          )}
        </div>
        {configured && snap?.wallet_id ? (
          <p className="font-mono text-xs text-slate-500">
            Account ···{snap.wallet_id.slice(-8)}
          </p>
        ) : null}
        <dl className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <dt className="text-slate-500">Available</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {snap?.available != null ? formatUgx(Number(snap.available)) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Frozen</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {snap?.frozen != null ? formatUgx(Number(snap.frozen)) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Balance</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {snap?.balance != null ? formatUgx(Number(snap.balance)) : "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export default function PartnerWalletsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: me } = useMe();
  const { isPlatform } = usePermissions();
  const canAccess = isPlatform || me?.partner_id === id;
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

  const allOptions = useMemo(
    () =>
      mergeWalletOptions(options, [
        snapshotToWalletOption(
          setup?.disbursement,
          "Disbursement account (assigned)",
          currency
        ),
        snapshotToWalletOption(
          setup?.collection,
          "Collection account (assigned)",
          currency
        ),
      ]),
    [options, setup?.disbursement, setup?.collection, currency]
  );

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

  const bothVerified =
    verifyResult?.disbursement?.valid === true &&
    verifyResult?.collection?.valid === true &&
    verifyResult.wallets_separate !== false;

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

  useEffect(() => {
    setVerifyResult(null);
  }, [disbursementWalletId, collectionWalletId]);

  async function onVerify() {
    if (!disbursementWalletId.trim() || !collectionWalletId.trim()) {
      toast.error("Select both disbursement and collection accounts first");
      return;
    }
    if (disbursementWalletId.trim() === collectionWalletId.trim()) {
      toast.error("Disbursement and collection accounts must be different");
      return;
    }
    try {
      const result = await verify.mutateAsync({
        disbursement_wallet_id: disbursementWalletId.trim(),
        collection_wallet_id: collectionWalletId.trim(),
      });
      setVerifyResult(result);
      if (
        result.disbursement?.valid &&
        result.collection?.valid &&
        result.wallets_separate !== false
      ) {
        toast.success("Both accounts verified with RukaPay");
      } else {
        toast.error("One or more accounts could not be verified");
      }
    } catch (err) {
      toast.error((err as Error).message || "Verification failed");
    }
  }

  async function onSaveWallets(e: FormEvent) {
    e.preventDefault();
    if (!disbursementWalletId.trim() || !collectionWalletId.trim()) {
      toast.error("Select both disbursement and collection accounts");
      return;
    }
    if (disbursementWalletId.trim() === collectionWalletId.trim()) {
      toast.error("Disbursement and collection wallets must be different");
      return;
    }
    if (!bothVerified) {
      toast.error("Verify both accounts with RukaPay before saving");
      return;
    }
    try {
      await saveWallets.mutateAsync({
        rukapay_escrow_wallet_id: disbursementWalletId.trim(),
        rukapay_collection_wallet_id: collectionWalletId.trim(),
      });
      toast.success("Wallet configuration saved");
      setupQ.refetch();
    } catch (err) {
      toast.error((err as Error).message || "Failed to save");
    }
  }

  if (!canAccess) {
    return (
      <p className="text-sm text-slate-500">
        You do not have access to view these wallet accounts.
      </p>
    );
  }

  if (!isPlatform) {
    if (partnerQ.isLoading || setupQ.isLoading) {
      return <CompactLoading message="Loading wallet accounts…" />;
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
              <h1 className="text-2xl font-semibold text-slate-900">
                Disbursement & collection wallets
              </h1>
              {setup ? <ReadinessBadge ready={setup.ready} /> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              RukaPay ESCROW accounts for{" "}
              <span className="font-medium text-slate-800">{partner.name}</span>.
              Contact RukaSente support to change wallet configuration.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/wallets">Back to wallets</Link>
          </Button>
        </div>

        {setup?.blocking_issues?.length ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 text-sm text-amber-900">
              <p className="font-medium">Setup notes</p>
              <ul className="mt-2 list-disc pl-5">
                {setup.blocking_issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <WalletSnapshotCard
            title="Disbursement account"
            hint="Debited when loans are paid out to borrowers."
            snap={setup?.disbursement}
          />
          <WalletSnapshotCard
            title="Collection account"
            hint="Credited when loan repayments are collected."
            snap={setup?.collection}
          />
        </div>
      </div>
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
            Search each account by name, Wallet #, or RukaPay No., set disbursement
            and collection, verify with RukaPay, then save.
          </p>
          {legacyDisbursementOnly ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-900">
              This partner previously used a single wallet. That wallet is kept as the{" "}
              <span className="font-semibold">disbursement</span> wallet. Choose a separate{" "}
              <span className="font-semibold">collection</span> wallet below.
            </div>
          ) : null}
          {optionsQ.isError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <p className="font-medium">Could not load ESCROW wallets from RukaPay</p>
              <p className="mt-1">
                Primary: <span className="font-mono">RUKA_RDBS_BASE_URL</span> +{" "}
                <span className="font-mono">RUKA_RDBS_API_KEY</span>. If your rdbs_core
                build lacks <span className="font-mono">GET /gateway/wallets</span>, also set{" "}
                <span className="font-mono">RUKA_RDBS_GATEWAY_ADMIN_TOKEN</span> and{" "}
                <span className="font-mono">RUKA_RDBS_GATEWAY_PARTNER_ID</span> (ApiPartner UUID
                from rdbs_core_fn). Restart rukasente-be after changing{" "}
                <span className="font-mono">.env</span>.
              </p>
              <p className="mt-1 font-mono text-[11px] text-amber-800">
                {(optionsQ.error as Error)?.message || "Request failed"}
              </p>
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
              optionsError={optionsQ.isError}
              emptyMessage={
                setup?.disbursement.configured
                  ? "Configured disbursement account is shown above. Set RUKA_RDBS_BASE_URL and RUKA_RDBS_API_KEY on rukasente-be to list more wallets."
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
              optionsError={optionsQ.isError}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                1 · Set accounts → 2 · Verify → 3 · Save
              </p>
              <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-2">
                <p>
                  <span className="font-medium">Disbursement:</span>{" "}
                  {disbursementWalletId
                    ? findWalletOption(allOptions, disbursementWalletId)?.description ||
                      `···${disbursementWalletId.slice(-4)}`
                    : "Not selected"}
                </p>
                <p>
                  <span className="font-medium">Collection:</span>{" "}
                  {collectionWalletId
                    ? findWalletOption(allOptions, collectionWalletId)?.description ||
                      `···${collectionWalletId.slice(-4)}`
                    : "Not selected"}
                </p>
              </div>
            </div>
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
                disabled={saveWallets.isPending || !bothVerified}
                className="bg-[#08163d] text-white hover:bg-[#06102a]"
              >
                Save wallets
              </Button>
            </div>
            {!bothVerified ? (
              <p className="text-[11px] text-slate-500">
                Verify both accounts with RukaPay to enable Save.
              </p>
            ) : null}
          </form>
          {verifyResult ? (
            <div className="grid gap-2 md:grid-cols-2">
              {verifyResult.disbursement ? (
                <VerifySummaryRow
                  role="Disbursement"
                  wallet={findWalletOption(allOptions, disbursementWalletId)}
                  valid={verifyResult.disbursement.valid}
                  available={verifyResult.disbursement.available}
                />
              ) : null}
              {verifyResult.collection ? (
                <VerifySummaryRow
                  role="Collection"
                  wallet={findWalletOption(allOptions, collectionWalletId)}
                  valid={verifyResult.collection.valid}
                  available={verifyResult.collection.available}
                />
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
