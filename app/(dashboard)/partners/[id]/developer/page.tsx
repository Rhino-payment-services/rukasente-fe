"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, BookOpen, Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import {
  useGeneratePartnerCredential,
  useIssuePartnerAccessToken,
  usePartner,
  usePartnerAPIGrants,
  usePartnerAPIPermissionCatalog,
  usePartnerCredentials,
  useRegeneratePartnerCredential,
  useRevokePartnerCredential,
} from "@/hooks/use-partners";
import { getApiDocsUrl } from "@/lib/config";
import { hasPermission, Perm } from "@/lib/permissions";
import type {
  PartnerAccessTokenCreated,
  PartnerCredentialCreated,
} from "@/types/partner";

function copy(text: string, label: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function maskKey(value: string) {
  if (!value || value.length < 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

export default function PartnerDeveloperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const canManage = hasPermission(
    session?.user?.permissions,
    Perm.PartnerManageCredentials
  );

  const partnerQ = usePartner(id);
  const credsQ = usePartnerCredentials(id);
  const grantsQ = usePartnerAPIGrants(id);
  const catalogQ = usePartnerAPIPermissionCatalog();
  const generate = useGeneratePartnerCredential(id);
  const revoke = useRevokePartnerCredential(id);
  const regenerate = useRegeneratePartnerCredential(id);
  const issueToken = useIssuePartnerAccessToken(id);

  const [secretReveal, setSecretReveal] = useState<PartnerCredentialCreated | null>(
    null
  );
  const [tokenReveal, setTokenReveal] = useState<PartnerAccessTokenCreated | null>(
    null
  );

  const p = partnerQ.data;
  const activeCreds = (credsQ.data?.items ?? []).filter((c) => c.status === "active");
  const granted = new Set(grantsQ.data?.keys ?? []);
  const catalog = catalogQ.data?.items ?? [];
  const grouped = useMemo(() => {
    const map = new Map<string, typeof catalog>();
    for (const item of catalog) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [catalog]);

  if (partnerQ.isLoading) {
    return <CompactLoading message="Loading developer settings…" />;
  }
  if (!p) {
    return <p className="text-sm text-slate-500">Partner not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            API Integration
          </h1>
          <p className="text-xs text-slate-500">
            {p.name} · <span className="font-mono">{p.code}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="h-8 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]">
            <a href={getApiDocsUrl()} target="_blank" rel="noreferrer">
              <BookOpen className="size-3.5" />
              View Redoc documentation
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
            <Link href={`/partners/${id}`}>
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {secretReveal ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-medium text-amber-900">{secretReveal.warning}</p>
            <SecretRow label="API Key" value={secretReveal.api_key} />
            <SecretRow label="API Secret" value={secretReveal.api_secret} />
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => setSecretReveal(null)}>
              I’ve saved these
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tokenReveal ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-medium text-amber-900">{tokenReveal.warning}</p>
            <SecretRow label="Access Token" value={tokenReveal.access_token} />
            <p className="text-xs text-slate-600">
              Expires {new Date(tokenReveal.expires_at).toLocaleString()} · send as
              {" "}<span className="font-mono">Authorization: Bearer …</span> with{" "}
              <span className="font-mono">X-API-Key</span>
            </p>
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => setTokenReveal(null)}>
              I’ve saved this
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
          <div>
            <CardTitle className="text-sm">Partner API credentials</CardTitle>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Keys are masked after generation. Use X-API-Key plus a Bearer token (or X-API-Secret).
            </p>
          </div>
          {canManage ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-[#08163d] px-3 text-xs text-white hover:bg-[#06102a]"
              disabled={generate.isPending}
              onClick={async () => {
                try {
                  setSecretReveal(await generate.mutateAsync({}));
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
                }
              }}
            >
              <KeyRound className="size-3.5" />
              Generate API key
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {credsQ.isLoading ? (
            <CompactLoading message="Loading credentials…" />
          ) : (credsQ.data?.items ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No API keys yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/95">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Name</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">API Key</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Status</th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(credsQ.data?.items ?? []).map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2">{c.name}</td>
                      <td className="px-3 py-2 font-mono">{maskKey(c.api_key_hint || c.api_key)}</td>
                      <td className="px-3 py-2">
                        <Badge variant={c.status === "active" ? "success" : "danger"}>{c.status}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {canManage && c.status === "active" ? (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={issueToken.isPending}
                              onClick={async () => {
                                try {
                                  setTokenReveal(await issueToken.mutateAsync(c.id));
                                  toast.success("Access token generated");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Failed");
                                }
                              }}
                            >
                              Generate token
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={regenerate.isPending}
                              onClick={async () => {
                                try {
                                  setSecretReveal(await regenerate.mutateAsync(c.id));
                                  toast.success("API key regenerated");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Failed");
                                }
                              }}
                            >
                              <RefreshCw className="size-3" />
                              Regen key
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-rose-200 text-xs text-rose-700"
                              disabled={revoke.isPending}
                              onClick={async () => {
                                try {
                                  await revoke.mutateAsync(c.id);
                                  toast.success("API key revoked");
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Failed");
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
          {activeCreds.length > 0 ? (
            <p className="mt-3 text-[11px] text-slate-500">
              {activeCreds.length} active key{activeCreds.length === 1 ? "" : "s"}. Tokens expire after one hour unless configured otherwise.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Assigned API permissions</CardTitle>
          <p className="mt-0.5 text-[11px] text-slate-500">
            This partner can only call the operations listed here.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          {grouped.length === 0 ? (
            <p className="text-sm text-slate-500">No catalog loaded.</p>
          ) : (
            grouped.map(([category, items]) => (
              <div key={category}>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <Badge
                      key={item.key}
                      variant={granted.has(item.key) ? "success" : "default"}
                    >
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate font-mono text-xs">{value}</p>
      </div>
      <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => copy(value, label)}>
        <Copy className="size-3" />
        Copy
      </Button>
    </div>
  );
}
