"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, CircleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { CompactLoading } from "@/components/ui/loading";
import { usePartner } from "@/hooks/use-partners";
import { formatUgx } from "@/hooks/use-dashboard-stats";
import {
  useCreatePartnerWalletRule,
  useDeletePartnerWalletRule,
  useEscrowWalletOptions,
  usePartnerWalletRules,
  usePartnerWalletSetup,
  useSavePartnerWallets,
  useSetPartnerWalletReserve,
  useVerifyPartnerWallets,
} from "@/hooks/use-partner-wallets";
import {
  PARTNER_WALLET_OPERATORS,
  PARTNER_WALLET_ROLES,
  PARTNER_WALLET_RULE_TYPES,
  type PartnerWalletRule,
} from "@/types/partner";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

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

export default function PartnerWalletsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const partnerQ = usePartner(id);
  const setupQ = usePartnerWalletSetup(id);
  const rulesQ = usePartnerWalletRules(id);
  const optionsQ = useEscrowWalletOptions();
  const verify = useVerifyPartnerWallets(id);
  const saveWallets = useSavePartnerWallets(id);
  const createRule = useCreatePartnerWalletRule(id);
  const deleteRule = useDeletePartnerWalletRule(id);
  const setReserve = useSetPartnerWalletReserve(id);

  const [disbursementWalletId, setDisbursementWalletId] = useState("");
  const [collectionWalletId, setCollectionWalletId] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    disbursement?: { valid: boolean; available?: number; frozen?: number };
    collection?: { valid: boolean; available?: number; frozen?: number };
    wallets_separate: boolean;
  } | null>(null);

  const [walletRole, setWalletRole] = useState("disbursement");
  const [ruleType, setRuleType] = useState("MIN_AVAILABLE_BALANCE");
  const [operator, setOperator] = useState("GREATER_THAN_OR_EQUAL");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");

  const [reserveRole, setReserveRole] = useState("disbursement");
  const [reserveAmount, setReserveAmount] = useState("");
  const [reserveReason, setReserveReason] = useState("");

  const partner = partnerQ.data;
  const setup = setupQ.data;
  const options = optionsQ.data?.items ?? [];

  useEffect(() => {
    if (partner && !initialized) {
      setDisbursementWalletId(partner.rukapay_escrow_wallet_id || "");
      setCollectionWalletId(partner.rukapay_collection_wallet_id || "");
      setInitialized(true);
    }
  }, [partner, initialized]);

  const ruleColumns = useMemo<ColumnDef<PartnerWalletRule>[]>(
    () => [
      { accessorKey: "wallet_role", header: "Wallet" },
      { accessorKey: "rule_type", header: "Rule" },
      { accessorKey: "operator", header: "Op" },
      { accessorKey: "value", header: "Value" },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={deleteRule.isPending}
            onClick={async () => {
              if (!window.confirm("Delete this rule?")) return;
              try {
                await deleteRule.mutateAsync(row.original.id);
                toast.success("Rule deleted");
              } catch (err) {
                toast.error((err as Error).message || "Failed to delete");
              }
            }}
          >
            Delete
          </Button>
        ),
      },
    ],
    [deleteRule]
  );

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

  async function onAddRule(e: FormEvent) {
    e.preventDefault();
    if (!ruleValue.trim()) {
      toast.error("Value is required");
      return;
    }
    try {
      await createRule.mutateAsync({
        wallet_role: walletRole,
        rule_type: ruleType,
        operator,
        value: ruleValue.trim(),
        description: ruleDescription.trim(),
        is_active: true,
      });
      setRuleValue("");
      setRuleDescription("");
      toast.success("Rule added");
    } catch (err) {
      toast.error((err as Error).message || "Failed to add rule");
    }
  }

  async function onSetReserve(e: FormEvent) {
    e.preventDefault();
    const amount = Number(reserveAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid reserve amount (minor units)");
      return;
    }
    if (!reserveReason.trim()) {
      toast.error("Reason is required");
      return;
    }
    try {
      await setReserve.mutateAsync({
        wallet_role: reserveRole,
        amount,
        reason: reserveReason.trim(),
      });
      toast.success("Reserve updated");
      setReserveAmount("");
      setupQ.refetch();
    } catch (err) {
      toast.error((err as Error).message || "Failed to set reserve");
    }
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
          <form className="grid gap-4" onSubmit={onSaveWallets}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Disbursement wallet
                </span>
                <select
                  className={selectClass}
                  value={disbursementWalletId}
                  onChange={(e) => setDisbursementWalletId(e.target.value)}
                >
                  <option value="">Select or enter below…</option>
                  {options.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.description || w.id.slice(0, 8)} —{" "}
                      {formatUgx(w.available_balance)}
                    </option>
                  ))}
                </select>
                <Input
                  value={disbursementWalletId}
                  onChange={(e) => setDisbursementWalletId(e.target.value)}
                  placeholder="Wallet UUID"
                  className="font-mono text-xs"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Collection wallet
                </span>
                <select
                  className={selectClass}
                  value={collectionWalletId}
                  onChange={(e) => setCollectionWalletId(e.target.value)}
                >
                  <option value="">Select or enter below…</option>
                  {options.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.description || w.id.slice(0, 8)} —{" "}
                      {formatUgx(w.available_balance)}
                    </option>
                  ))}
                </select>
                <Input
                  value={collectionWalletId}
                  onChange={(e) => setCollectionWalletId(e.target.value)}
                  placeholder="Wallet UUID"
                  className="font-mono text-xs"
                />
              </label>
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
                {setup.disbursement.configured ? "✓" : "○"} Disbursement wallet configured
              </li>
              <li>
                {setup.collection.configured ? "✓" : "○"} Collection wallet configured
              </li>
              <li>{setup.wallets_separate ? "✓" : "○"} Wallets are separate</li>
              <li>
                {setup.disbursement.verified && setup.collection.verified
                  ? "✓"
                  : "○"}{" "}
                Both wallets verified with RukaPay
              </li>
              <li>
                {setup.rule_results.every((r) => r.passed) ? "✓" : "○"} All active rules
                pass
              </li>
            </ul>
          ) : (
            <CompactLoading message="Loading readiness…" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Wallet rules</h2>
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={onAddRule}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Wallet role
              </label>
              <select
                className={selectClass}
                value={walletRole}
                onChange={(e) => setWalletRole(e.target.value)}
              >
                {PARTNER_WALLET_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Rule type
              </label>
              <select
                className={selectClass}
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
              >
                {PARTNER_WALLET_RULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Operator
              </label>
              <select
                className={selectClass}
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                {PARTNER_WALLET_OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} {o.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Value (minor units)
              </label>
              <Input value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Description
              </label>
              <Input
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createRule.isPending}>
                Add rule
              </Button>
            </div>
          </form>
          <DataTable
            columns={ruleColumns}
            data={rulesQ.data?.items ?? []}
            emptyMessage="No wallet rules yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Reserve management</h2>
          <p className="text-xs text-slate-500">
            Sets the RukaPay escrow reserve floor (frozen balance). Amount is in minor
            units. RESERVE_FLOOR rules also sync automatically when saved.
          </p>
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSetReserve}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Wallet role
              </label>
              <select
                className={selectClass}
                value={reserveRole}
                onChange={(e) => setReserveRole(e.target.value)}
              >
                {PARTNER_WALLET_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Reserve amount
              </label>
              <Input
                value={reserveAmount}
                onChange={(e) => setReserveAmount(e.target.value)}
                placeholder="0 to clear"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Reason
              </label>
              <Input
                value={reserveReason}
                onChange={(e) => setReserveReason(e.target.value)}
                placeholder="Audit reason"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={setReserve.isPending}>
                Apply reserve
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
