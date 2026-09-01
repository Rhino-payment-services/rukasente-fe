"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { formatUgx } from "@/hooks/use-dashboard-stats";
import { useMe } from "@/hooks/use-me";
import { usePermissions } from "@/hooks/use-permissions";
import { usePartner } from "@/hooks/use-partners";
import {
  usePartnerWalletSetup,
  usePlatformPartnerWallets,
} from "@/hooks/use-partner-wallets";
import type { PartnerWalletSetupListItem, PartnerWalletSnapshot } from "@/types/partner";

function ReadinessBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
      }`}
    >
      {ready ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
      {ready ? "Ready" : "Needs setup"}
    </span>
  );
}

function formatBalance(amount?: number | null) {
  if (amount == null) return "—";
  return formatUgx(Number(amount));
}

function WalletAccountCell({
  snap,
  roleLabel,
}: {
  snap: PartnerWalletSnapshot;
  roleLabel: string;
}) {
  const configured = snap.configured;
  const verified = snap.verified;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-700">{roleLabel}</p>
        <p className="text-[11px] text-slate-500">
          {configured
            ? verified
              ? "Verified"
              : "Unverified"
            : "Not set"}
        </p>
        {configured && snap.wallet_id ? (
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
            ···{snap.wallet_id.slice(-4)}
          </p>
        ) : null}
        <p className="mt-1 text-[11px] text-slate-500">
          Frozen: {formatBalance(snap.frozen)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-bold tabular-nums text-slate-900">
          {formatBalance(snap.available)}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Available
        </p>
      </div>
    </div>
  );
}

function PlatformPartnerRow({ item }: { item: PartnerWalletSetupListItem }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3 align-top">
        <p className="font-medium text-slate-900">{item.partner_name}</p>
        <p className="text-xs text-slate-500">{item.partner_code}</p>
        {item.is_internal ? (
          <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
            Platform (RukaSente)
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top">
        <ReadinessBadge ready={item.ready} />
        {item.blocking_issues?.length ? (
          <p className="mt-1 text-[11px] text-amber-700">
            {item.blocking_issues[0]}
            {item.blocking_issues.length > 1
              ? ` (+${item.blocking_issues.length - 1} more)`
              : ""}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top">
        <WalletAccountCell snap={item.disbursement} roleLabel="Disbursement" />
      </td>
      <td className="px-4 py-3 align-top">
        <WalletAccountCell snap={item.collection} roleLabel="Collection" />
      </td>
      <td className="px-4 py-3 text-right align-top">
        <Button
          asChild
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg text-xs"
        >
          <Link href={`/partners/${item.partner_id}/wallets`}>
            Manage
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

function PartnerOwnWalletsView({ partnerId }: { partnerId: string }) {
  const partnerQ = usePartner(partnerId);
  const setupQ = usePartnerWalletSetup(partnerId);
  const setup = setupQ.data;

  if (partnerQ.isLoading || setupQ.isLoading) {
    return <CompactLoading message="Loading wallet accounts…" />;
  }

  if (setupQ.isError) {
    return (
      <p className="text-sm text-rose-600">
        Failed to load wallet accounts. Contact your administrator if this persists.
      </p>
    );
  }

  if (!setup) {
    return <p className="text-sm text-slate-500">Wallet setup not available.</p>;
  }

  const partnerName = partnerQ.data?.name ?? "Your company";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <div>
          <p className="font-medium text-slate-900">{partnerName}</p>
          <p className="text-xs text-slate-500">
            RukaPay ESCROW accounts used for loan disbursements and repayments.
          </p>
        </div>
        <ReadinessBadge ready={setup.ready} />
      </div>

      {setup.blocking_issues?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Setup notes</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {setup.blocking_issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <WalletAccountCell snap={setup.disbursement} roleLabel="Disbursement account" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <WalletAccountCell snap={setup.collection} roleLabel="Collection account" />
        </div>
      </div>
    </div>
  );
}

function PlatformWalletsView() {
  const walletsQ = usePlatformPartnerWallets();
  const [showInternal, setShowInternal] = useState(true);

  const items = useMemo(() => {
    const all = walletsQ.data ?? [];
    const filtered = showInternal ? all : all.filter((p) => !p.is_internal);
    return [...filtered].sort((a, b) => {
      if (a.is_internal && !b.is_internal) return -1;
      if (!a.is_internal && b.is_internal) return 1;
      return a.partner_name.localeCompare(b.partner_name);
    });
  }, [walletsQ.data, showInternal]);

  const readyCount = items.filter((p) => p.ready).length;

  if (walletsQ.isLoading) {
    return <CompactLoading message="Loading partner wallet accounts…" />;
  }

  if (walletsQ.isError) {
    return (
      <p className="text-sm text-rose-600">
        Failed to load partner wallets. Ensure you are signed in as a platform admin.
      </p>
    );
  }

  if (!items.length) {
    return (
      <p className="text-sm text-slate-500">
        No lending companies found. Create one under Integrations → Lending companies.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-700">
          <span className="font-semibold text-slate-900">{items.length}</span> companies ·{" "}
          <span className="font-semibold text-emerald-700">{readyCount}</span> wallet-ready
        </p>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={showInternal}
            onChange={(e) => setShowInternal(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show platform (RukaSente)
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Disbursement account</th>
              <th className="px-4 py-2.5">Collection account</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <PlatformPartnerRow key={item.partner_id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const { isPlatform } = usePermissions();
  const { data: me } = useMe();
  const partnerId = me?.partner_id ?? null;

  if (!isPlatform && !partnerId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        Wallet accounts are not available for your account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Wallet className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Disbursement & collection wallets
            </h1>
            <p className="text-xs text-slate-500">
              {isPlatform
                ? "Review disbursement and collection accounts (RukaPay ESCROW) for each lending company."
                : "Your company’s disbursement and collection accounts on RukaPay."}
            </p>
          </div>
        </div>
      </div>

      {isPlatform ? (
        <PlatformWalletsView />
      ) : (
        <PartnerOwnWalletsView partnerId={partnerId!} />
      )}
    </div>
  );
}
