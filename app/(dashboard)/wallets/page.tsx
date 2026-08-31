"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { formatUgx } from "@/hooks/use-dashboard-stats";
import { usePermissions } from "@/hooks/use-permissions";
import { usePlatformPartnerWallets } from "@/hooks/use-partner-wallets";
import type { PartnerWalletSetupListItem } from "@/types/partner";

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

function PlatformPartnerRow({ item }: { item: PartnerWalletSetupListItem }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3 align-top">
        <p className="font-medium text-slate-900">{item.partner_name}</p>
        <p className="text-xs text-slate-500">{item.partner_code}</p>
        {item.is_internal ? (
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            Internal
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
        <p className="font-mono text-[11px] text-slate-600">
          {item.disbursement.wallet_id || "—"}
        </p>
        <p className="mt-1 text-xs text-slate-700">
          Available: {formatBalance(item.disbursement.available)}
        </p>
        <p className="text-[11px] text-slate-500">
          Frozen: {formatBalance(item.disbursement.frozen)}
        </p>
        <p className="text-[11px] text-slate-500">
          {item.disbursement.verified
            ? "Verified"
            : item.disbursement.configured
              ? "Unverified"
              : "Not set"}
        </p>
      </td>
      <td className="px-4 py-3 align-top">
        <p className="font-mono text-[11px] text-slate-600">
          {item.collection.wallet_id || "—"}
        </p>
        <p className="mt-1 text-xs text-slate-700">
          Available: {formatBalance(item.collection.available)}
        </p>
        <p className="text-[11px] text-slate-500">
          Frozen: {formatBalance(item.collection.frozen)}
        </p>
        <p className="text-[11px] text-slate-500">
          {item.collection.verified
            ? "Verified"
            : item.collection.configured
              ? "Unverified"
              : "Not set"}
        </p>
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

function PlatformWalletsView() {
  const walletsQ = usePlatformPartnerWallets();
  const [showInternal, setShowInternal] = useState(false);

  const items = useMemo(() => {
    const all = walletsQ.data ?? [];
    return showInternal ? all : all.filter((p) => !p.is_internal);
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
          Show internal partners
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

  if (!isPlatform) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        Wallet management is only available to platform administrators.
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
              Review and configure RukaPay ESCROW wallets for each lending company.
            </p>
          </div>
        </div>
      </div>

      <PlatformWalletsView />
    </div>
  );
}
