"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Cable, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import {
  DetailGrid,
  DetailSection,
  formatDetailValue,
} from "@/components/dashboard/detail-fields";
import { TableViewButton } from "@/components/dashboard/table-view-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreatePaymentProvider,
  usePaymentProviders,
  useTestPaymentProvider,
} from "@/hooks/use-partners";
import { hasPermission, Perm } from "@/lib/permissions";
import type { PaymentProvider } from "@/types/partner";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentProvidersPage() {
  const { data: session } = useSession();
  const canCreate =
    !!session?.user?.isPlatform &&
    (hasPermission(session.user.permissions, Perm.PlatformPartnerCreate) ||
      hasPermission(session.user.permissions, Perm.PartnerCreate));

  const listQ = usePaymentProviders();
  const create = useCreatePaymentProvider();
  const test = useTestPaymentProvider();
  const [open, setOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [viewProvider, setViewProvider] = useState<PaymentProvider | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    adapter_key: "rukapay",
    base_url: "",
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    try {
      await create.mutateAsync({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        adapter_key: form.adapter_key.trim() || "rukapay",
        base_url: form.base_url.trim() || undefined,
      });
      toast.success("Payment provider created");
      setOpen(false);
      setForm({ code: "", name: "", adapter_key: "rukapay", base_url: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function onTest(id: string) {
    setTestingId(id);
    try {
      await test.mutateAsync(id);
      toast.success("Connection test succeeded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setTestingId(null);
    }
  }

  const items = listQ.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Cable className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Payment providers
            </h1>
            <p className="text-xs text-slate-500">
              Rails used by lending companies for disbursement.
            </p>
          </div>
        </div>
        {canCreate ? (
          <Button
            size="sm"
            className="h-8 shrink-0 rounded-lg bg-[#08163d] px-3 text-xs text-white hover:bg-[#06102a]"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-3.5" />
            New provider
          </Button>
        ) : null}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Providers</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {listQ.isLoading ? (
            <CompactLoading message="Loading providers…" />
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No payment providers yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Code
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Adapter
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Base URL
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((pp) => (
                    <tr
                      key={pp.id}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/90"
                    >
                      <td className="px-3 py-2 align-middle font-medium text-slate-900">
                        {pp.name}
                      </td>
                      <td className="px-3 py-2 align-middle font-mono text-[11px] text-slate-700">
                        {pp.code}
                      </td>
                      <td className="px-3 py-2 align-middle font-mono text-[11px] text-slate-700">
                        {pp.adapter_key}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 align-middle font-mono text-[11px] text-slate-700">
                        {pp.base_url || "—"}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Badge
                          variant={pp.status === "active" ? "success" : "warning"}
                        >
                          {pp.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TableViewButton onClick={() => setViewProvider(pp)} />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-[11px]"
                            disabled={testingId === pp.id || test.isPending}
                            onClick={() => void onTest(pp.id)}
                          >
                            <RefreshCw
                              className={`size-3 ${testingId === pp.id ? "animate-spin" : ""}`}
                            />
                            {testingId === pp.id ? "Testing…" : "Test"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New payment provider</DialogTitle>
            <DialogDescription>
              Minimal provider setup. Adapter defaults to rukapay.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-3 px-5 py-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">Code</span>
              <Input
                required
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                  }))
                }
                placeholder="RUKAPAY"
                className="font-mono"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">Name</span>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="RukaPay"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">
                Adapter key
              </span>
              <Input
                required
                value={form.adapter_key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adapter_key: e.target.value }))
                }
                placeholder="rukapay"
                className="font-mono"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700">Base URL</span>
              <Input
                value={form.base_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, base_url: e.target.value }))
                }
                placeholder="https://api.example.com"
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="bg-[#08163d] text-white hover:bg-[#06102a]"
              >
                {create.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DetailsDrawer
        open={!!viewProvider}
        onClose={() => setViewProvider(null)}
        title={viewProvider?.name ?? "Payment provider"}
        description={viewProvider?.code}
        footer={
          viewProvider ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-lg text-xs"
              disabled={testingId === viewProvider.id || test.isPending}
              onClick={() => void onTest(viewProvider.id)}
            >
              <RefreshCw
                className={`size-3 ${testingId === viewProvider.id ? "animate-spin" : ""}`}
              />
              {testingId === viewProvider.id ? "Testing…" : "Test connection"}
            </Button>
          ) : null
        }
      >
        {viewProvider ? (
          <>
            <DetailSection title="Provider">
              <DetailGrid
                fields={[
                  { label: "Name", value: viewProvider.name },
                  { label: "Code", value: viewProvider.code, mono: true },
                  { label: "Adapter key", value: viewProvider.adapter_key, mono: true },
                  { label: "Status", value: viewProvider.status },
                  {
                    label: "Has credentials",
                    value: formatDetailValue(viewProvider.has_credentials),
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Connection">
              <DetailGrid
                fields={[
                  {
                    label: "Base URL",
                    value: viewProvider.base_url,
                    mono: true,
                    fullWidth: true,
                  },
                  {
                    label: "Config JSON",
                    value: viewProvider.config_json ? "Configured" : "—",
                  },
                  {
                    label: "Capabilities",
                    value: viewProvider.capabilities_json ? "Configured" : "—",
                  },
                ]}
              />
            </DetailSection>
            <DetailSection title="Timestamps">
              <DetailGrid
                fields={[
                  { label: "Created", value: formatDate(viewProvider.created_at) },
                  { label: "Updated", value: formatDate(viewProvider.updated_at) },
                  { label: "ID", value: viewProvider.id, mono: true, fullWidth: true },
                ]}
              />
            </DetailSection>
          </>
        ) : null}
      </DetailsDrawer>
    </div>
  );
}
