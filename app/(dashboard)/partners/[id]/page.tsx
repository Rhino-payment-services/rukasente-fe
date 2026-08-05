"use client";

import Link from "next/link";
import { FormEvent, use, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import {
  useGeneratePartnerCredential,
  usePartner,
  usePartnerAPILogs,
  usePartnerBorrowers,
  usePartnerCredentials,
  usePartnerStats,
  usePaymentProviders,
  useRegeneratePartnerCredential,
  useRevokePartnerCredential,
  useUpdatePartner,
} from "@/hooks/use-partners";
import { hasPermission, Perm } from "@/lib/permissions";
import type { PartnerCredentialCreated } from "@/types/partner";

function copy(text: string, label: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const canUpdate = hasPermission(session?.user?.permissions, Perm.PartnerUpdate);
  const canLogs = hasPermission(session?.user?.permissions, Perm.PartnerViewLogs);

  const partnerQ = usePartner(id);
  const statsQ = usePartnerStats(id);
  const credsQ = usePartnerCredentials(id);
  const borrowersQ = usePartnerBorrowers(id, 1, 20);
  const logsQ = usePartnerAPILogs(id, 1, 20);
  const providersQ = usePaymentProviders();
  const update = useUpdatePartner(id);
  const generate = useGeneratePartnerCredential(id);
  const revoke = useRevokePartnerCredential(id);
  const regenerate = useRegeneratePartnerCredential(id);

  const [secretReveal, setSecretReveal] = useState<PartnerCredentialCreated | null>(
    null
  );
  const [edit, setEdit] = useState(false);

  const p = partnerQ.data;

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!p) return;
    const fd = new FormData(e.currentTarget);
    const ipsRaw = String(fd.get("allowed_ips") || "");
    const allowed_ips = ipsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await update.mutateAsync({
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || ""),
        status: String(fd.get("status") || "active"),
        api_base_url: String(fd.get("api_base_url") || ""),
        contact_name: String(fd.get("contact_name") || ""),
        contact_email: String(fd.get("contact_email") || ""),
        contact_phone: String(fd.get("contact_phone") || ""),
        logo_url: String(fd.get("logo_url") || ""),
        country: String(fd.get("country") || ""),
        currency: String(fd.get("currency") || ""),
        primary_color: String(fd.get("primary_color") || ""),
        payment_provider_id: String(fd.get("payment_provider_id") || "") || null,
        allowed_ips,
        ip_whitelist_enabled: fd.get("ip_whitelist_enabled") === "on",
      });
      toast.success("Partner updated");
      setEdit(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onGenerate() {
    try {
      const created = await generate.mutateAsync({ name: "default" });
      setSecretReveal(created);
      toast.success("Credentials generated — copy the secret now");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    }
  }

  if (partnerQ.isLoading) return <CompactLoading message="Loading partner…" />;
  if (!p) {
    return <p className="text-sm text-destructive">Partner not found.</p>;
  }

  const stats = statsQ.data;
  const providers = providersQ.data?.items ?? [];
  const providerLabel =
    providers.find((pp) => pp.id === p.payment_provider_id)?.name ||
    p.payment_provider_id ||
    "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{p.name}</h1>
            <Badge variant={p.status === "active" ? "success" : "warning"}>
              {p.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Code <span className="font-mono">{p.code}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-lg bg-[#08163d] px-3 text-xs text-white hover:bg-[#06102a]"
            disabled={generate.isPending}
            onClick={() => void onGenerate()}
          >
            <KeyRound className="size-3.5" />
            {generate.isPending ? "Generating…" : "Generate API key"}
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
            <Link href="/partners">
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          ["Borrowers", stats?.borrower_count],
          ["Active keys", stats?.active_credentials],
          ["Applications", stats?.loan_application_count],
          ["Approved", stats?.approved_loans],
          ["Active loans", stats?.active_loans],
          ["API calls (7d)", stats?.api_calls_last_7_days],
        ].map(([label, value]) => (
          <Card key={String(label)} className="gap-0 border-slate-200 py-0 shadow-sm">
            <CardContent className="px-3 py-3">
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className="text-xl font-semibold tabular-nums text-slate-900">
                {value ?? "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-sm">Partner details</CardTitle>
          {canUpdate ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setEdit((v) => !v)}
            >
              {edit ? "Cancel" : "Edit"}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {edit ? (
            <form onSubmit={onSave} className="grid gap-2 sm:grid-cols-2">
              <Input name="name" defaultValue={p.name} placeholder="Name" />
              <select
                name="status"
                defaultValue={p.status}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Input
                name="description"
                defaultValue={p.description}
                placeholder="Description"
                className="sm:col-span-2"
              />
              <Input
                name="api_base_url"
                defaultValue={p.api_base_url}
                placeholder="API base URL"
                className="sm:col-span-2"
              />
              <Input name="contact_name" defaultValue={p.contact_name} placeholder="Contact name" />
              <Input
                name="contact_email"
                defaultValue={p.contact_email}
                placeholder="Contact email"
              />
              <Input
                name="contact_phone"
                defaultValue={p.contact_phone}
                placeholder="Contact phone"
              />
              <Input name="logo_url" defaultValue={p.logo_url} placeholder="Logo URL" />
              <Input
                name="country"
                defaultValue={p.country || ""}
                placeholder="Country (e.g. UG)"
              />
              <Input
                name="currency"
                defaultValue={p.currency || ""}
                placeholder="Currency (e.g. UGX)"
              />
              <Input
                name="primary_color"
                defaultValue={p.primary_color || ""}
                placeholder="Primary color (#4f46e5)"
              />
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Payment provider
                </span>
                <select
                  name="payment_provider_id"
                  defaultValue={p.payment_provider_id || ""}
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="">None / default</option>
                  {providers.map((pp) => (
                    <option key={pp.id} value={pp.id}>
                      {pp.name} ({pp.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  name="ip_whitelist_enabled"
                  defaultChecked={p.ip_whitelist_enabled}
                  className="rounded border-slate-300"
                />
                Require IP whitelist (reject calls from non-listed IPs)
              </label>
              <label className="sm:col-span-2 block space-y-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Allowed IPs / CIDRs
                </span>
                <textarea
                  name="allowed_ips"
                  defaultValue={(p.allowed_ips ?? []).join("\n")}
                  rows={4}
                  placeholder={"127.0.0.1\n10.0.0.0/8\n203.0.113.10"}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-[rgba(8,22,61,0.15)]"
                />
                <span className="block text-[11px] text-slate-400">
                  One IP or CIDR per line. Enforced only when “Require IP whitelist”
                  is checked. Use the public IP of the caller (or your reverse proxy)
                  as seen by the API — check partner API request logs if unsure.
                </span>
              </label>
              <Button
                type="submit"
                disabled={update.isPending}
                className="sm:col-span-2 bg-[#08163d] text-white hover:bg-[#06102a]"
              >
                Save changes
              </Button>
            </form>
          ) : (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Description</dt>
                <dd>{p.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">API base URL</dt>
                <dd className="truncate">{p.api_base_url || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Contact</dt>
                <dd>
                  {p.contact_name || "—"} · {p.contact_email || "—"} ·{" "}
                  {p.contact_phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Country / currency</dt>
                <dd>
                  {p.country || "—"} · {p.currency || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Payment provider</dt>
                <dd className="truncate">{providerLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">IP whitelist</dt>
                <dd>
                  {p.ip_whitelist_enabled ? "Required" : "Optional"} ·{" "}
                  {(p.allowed_ips ?? []).length
                    ? (p.allowed_ips ?? []).join(", ")
                    : "no IPs configured"}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
          <div>
            <CardTitle className="text-sm">API credentials</CardTitle>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Generate a key + secret for this partner. The secret is shown once.
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-lg bg-[#08163d] px-3 text-xs text-white hover:bg-[#06102a]"
            disabled={generate.isPending}
            onClick={() => void onGenerate()}
          >
            <KeyRound className="size-3.5" />
            {generate.isPending ? "Generating…" : "Generate API key"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          {secretReveal ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-900">{secretReveal.warning}</p>
              <div className="mt-3 space-y-2">
                <SecretRow
                  label="API Key"
                  value={secretReveal.api_key}
                  onCopy={() => copy(secretReveal.api_key, "API key")}
                />
                <SecretRow
                  label="API Secret"
                  value={secretReveal.api_secret}
                  onCopy={() => copy(secretReveal.api_secret, "API secret")}
                />
                {secretReveal.webhook_secret ? (
                  <SecretRow
                    label="Webhook Secret"
                    value={secretReveal.webhook_secret}
                    onCopy={() =>
                      copy(secretReveal.webhook_secret || "", "Webhook secret")
                    }
                  />
                ) : null}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 text-xs"
                onClick={() => setSecretReveal(null)}
              >
                I’ve saved these
              </Button>
            </div>
          ) : null}

          {credsQ.isLoading ? (
            <CompactLoading message="Loading credentials…" />
          ) : (credsQ.data?.items ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#08163d] shadow-sm ring-1 ring-slate-200">
                <KeyRound className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">No API keys yet</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Generate credentials so this partner can call Ruka Sente APIs.
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
                disabled={generate.isPending}
                onClick={() => void onGenerate()}
              >
                <KeyRound className="size-3.5" />
                Generate API key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">API Key</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Last used</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(credsQ.data?.items ?? []).map((c) => (
                    <tr key={c.id} className="border-t border-slate-50">
                      <td className="px-3 py-2">{c.name}</td>
                      <td className="px-3 py-2 font-mono">{c.api_key_hint || c.api_key}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={c.status === "active" ? "success" : "danger"}
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {c.last_used_at
                          ? new Date(c.last_used_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        {c.status === "active" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              disabled={regenerate.isPending}
                              onClick={async () => {
                                try {
                                  const created = await regenerate.mutateAsync(c.id);
                                  setSecretReveal(created);
                                  toast.success("Credential regenerated");
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Failed"
                                  );
                                }
                              }}
                            >
                              <RefreshCw className="size-3" />
                              Regen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 border-rose-200 text-xs text-rose-700"
                              disabled={revoke.isPending}
                              onClick={async () => {
                                try {
                                  await revoke.mutateAsync(c.id);
                                  toast.success("Credential revoked");
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Failed"
                                  );
                                }
                              }}
                            >
                              <ShieldOff className="size-3" />
                              Revoke
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Partner calls use headers{" "}
            <code className="rounded bg-slate-100 px-1">X-API-Key</code> and{" "}
            <code className="rounded bg-slate-100 px-1">X-API-Secret</code> on{" "}
            <code className="rounded bg-slate-100 px-1">/api/v1/partner/*</code>.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">Linked customers</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {(borrowersQ.data?.items ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No linked profiles yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {(borrowersQ.data?.items ?? []).map((b) => (
                  <li key={b.id} className="flex justify-between py-2">
                    <span className="font-medium">{b.full_name}</span>
                    <span className="text-xs text-slate-400">{b.phone}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {canLogs ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">API usage logs</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(logsQ.data?.items ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No API calls logged yet.</p>
              ) : (
                <div className="max-h-72 overflow-auto text-xs">
                  <table className="min-w-full text-left">
                    <thead className="sticky top-0 bg-white text-slate-500">
                      <tr>
                        <th className="px-2 py-1">When</th>
                        <th className="px-2 py-1">Method</th>
                        <th className="px-2 py-1">Path</th>
                        <th className="px-2 py-1">Status</th>
                        <th className="px-2 py-1">ms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(logsQ.data?.items ?? []).map((l) => (
                        <tr key={l.id} className="border-t border-slate-50">
                          <td className="px-2 py-1 whitespace-nowrap">
                            {new Date(l.created_at).toLocaleString()}
                          </td>
                          <td className="px-2 py-1">{l.method}</td>
                          <td className="px-2 py-1 font-mono">{l.path}</td>
                          <td className="px-2 py-1">{l.status_code}</td>
                          <td className="px-2 py-1">{l.duration_ms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function SecretRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-200/80 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-amber-800/80">{label}</span>
        <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={onCopy}>
          <Copy className="size-3" />
          Copy
        </Button>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-slate-900">{value}</p>
    </div>
  );
}
