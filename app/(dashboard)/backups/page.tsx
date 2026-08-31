"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Database, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import {
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  downloadBackupFile,
} from "@/hooks/use-backups";
import { hasPermission, Perm } from "@/lib/permissions";
import type { BackupMeta } from "@/types/backup";

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

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default function BackupsPage() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];
  const canView = hasPermission(permissions, Perm.BackupView);
  const canCreate = hasPermission(permissions, Perm.BackupCreate);
  const canDelete = hasPermission(permissions, Perm.BackupDelete);

  const listQ = useBackups();
  const create = useCreateBackup();
  const del = useDeleteBackup();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function onCreate() {
    if (!canCreate) {
      toast.error("You do not have permission to create backups.");
      return;
    }
    try {
      await create.mutateAsync(undefined);
      toast.success("Backup created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create backup");
    }
  }

  async function onDownload(item: BackupMeta) {
    if (!canView) return;
    setDownloadingId(item.id);
    try {
      await downloadBackupFile(item.id, item.filename);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download backup");
    } finally {
      setDownloadingId(null);
    }
  }

  async function onDelete(item: BackupMeta) {
    if (!canDelete) {
      toast.error("You do not have permission to delete backups.");
      return;
    }
    if (!confirm(`Delete backup from ${formatDate(item.created_at)}?`)) return;
    try {
      await del.mutateAsync(item.id);
      toast.success("Backup deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete backup");
    }
  }

  if (!canView) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        You do not have permission to view backups.
      </div>
    );
  }

  const items = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Database className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Database backups
            </h1>
            <p className="text-xs text-slate-500">
              Logical JSON.gz snapshots of Postgres tables stored on the server.
            </p>
          </div>
        </div>
        {canCreate ? (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
            onClick={() => void onCreate()}
            disabled={create.isPending}
          >
            <Plus className="size-3.5" />
            {create.isPending ? "Creating…" : "Create backup"}
          </Button>
        ) : null}
      </div>

      <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-sm">
        <CardContent className="px-0 py-0">
          {listQ.isLoading ? (
            <div className="px-4 py-8">
              <CompactLoading message="Loading backups…" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500">
              No backups yet. Create one to snapshot all database tables.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5">Database</th>
                    <th className="px-4 py-2.5">Tables</th>
                    <th className="px-4 py-2.5">Size</th>
                    <th className="px-4 py-2.5">By</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-800">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.database}
                        <span className="text-slate-400"> · {item.schema}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.tables?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatBytes(item.size_bytes)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.created_by || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => void onDownload(item)}
                            disabled={downloadingId === item.id}
                          >
                            <Download className="size-3.5" />
                            {downloadingId === item.id ? "…" : "Download"}
                          </Button>
                          {canDelete ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
                              onClick={() => void onDelete(item)}
                              disabled={del.isPending}
                            >
                              <Trash2 className="size-3.5" />
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
        </CardContent>
      </Card>
    </div>
  );
}
