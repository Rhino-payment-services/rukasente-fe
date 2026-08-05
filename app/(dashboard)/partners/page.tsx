"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Handshake, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import { useDeletePartner, usePartners } from "@/hooks/use-partners";
import { hasPermission, Perm } from "@/lib/permissions";

export default function PartnersPage() {
  const { data: session } = useSession();
  const isPlatform = !!session?.user?.isPlatform;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const q = usePartners({
    page,
    page_size: 20,
    status: status === "all" ? undefined : status,
    search: search.trim() || undefined,
  });
  const del = useDeletePartner();

  const items = q.data?.items ?? [];
  const canDelete = hasPermission(
    session?.user?.permissions,
    Perm.PartnerUpdate
  );

  const rows = useMemo(() => items, [items]);

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete partner “${name}”? Linked borrowers keep their data.`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Partner deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Handshake className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {isPlatform ? "Lending companies" : "Partners"}
            </h1>
            <p className="text-xs text-slate-500">
              {isPlatform
                ? "Onboard and manage multi-tenant lending companies."
                : "Register RukaPay and other third-party integration partners."}
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 shrink-0 rounded-lg bg-[#08163d] px-3 text-xs text-white hover:bg-[#06102a]"
        >
          <Link href="/partners/new">
            <Plus className="size-3.5" />
            {isPlatform ? "Register company" : "New partner"}
          </Link>
        </Button>
      </div>

      <Card className="gap-0 border-slate-200 py-0 shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, code, email…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-main-200"
              />
            </div>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 rounded-lg border-slate-200 text-xs"
            >
              <Link href="/partners/new">
                <Plus className="size-3.5" />
                Add partner
              </Link>
            </Button>
          </div>

          {q.isLoading ? (
            <CompactLoading message="Loading partners…" />
          ) : q.error ? (
            <p className="text-sm text-destructive">{(q.error as Error).message}</p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-slate-500">No partners found yet.</p>
              <Button
                asChild
                size="sm"
                className="h-8 rounded-lg bg-[#08163d] text-white hover:bg-[#06102a]"
              >
                <Link href="/partners/new">
                  <Plus className="size-3.5" />
                  Create your first partner
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Partner</th>
                    <th className="px-3 py-2.5 font-medium">Code</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Borrowers</th>
                    <th className="px-3 py-2.5 font-medium">Credentials</th>
                    <th className="px-3 py-2.5 font-medium">Loans</th>
                    <th className="px-3 py-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.contact_email || "—"}</p>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{p.code}</td>
                      <td className="px-3 py-3">
                        <Badge variant={p.status === "active" ? "success" : "warning"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{p.borrower_count ?? 0}</td>
                      <td className="px-3 py-3 tabular-nums">{p.active_credentials ?? 0}</td>
                      <td className="px-3 py-3 tabular-nums">{p.loan_application_count ?? 0}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1.5">
                          <Button asChild size="sm" variant="outline" className="h-7 rounded-md text-xs">
                            <Link href={`/partners/${p.id}`}>Manage</Link>
                          </Button>
                          {canDelete && p.code !== "RUKAPAY" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-md border-rose-200 text-xs text-rose-700"
                              disabled={del.isPending}
                              onClick={() => void onDelete(p.id, p.name)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500">
            <span>Total: {q.data?.total ?? 0}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={!!q.data?.total_pages && page >= q.data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
