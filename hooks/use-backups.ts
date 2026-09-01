"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { useMe } from "@/hooks/use-me";
import type { BackupListResponse, BackupMeta, BackupTablesResponse } from "@/types/backup";

export function useBackups() {
  const { data: me } = useMe();
  return useQuery({
    queryKey: ["backups"],
    enabled: Boolean(me?.is_platform),
    queryFn: async () => {
      const res = await apiClient.get("/admin/backups");
      const data = unwrapEnvelope<BackupListResponse>(res);
      return data.items ?? [];
    },
  });
}

export function useBackupTables() {
  const { data: me } = useMe();
  return useQuery({
    queryKey: ["backup-tables"],
    enabled: Boolean(me?.is_platform),
    queryFn: async () => {
      const res = await apiClient.get("/admin/backups/tables");
      const data = unwrapEnvelope<BackupTablesResponse>(res);
      return data.tables ?? [];
    },
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tables?: string[]) => {
      const res = await apiClient.post("/admin/backups", tables?.length ? { tables } : {});
      return unwrapEnvelope<BackupMeta>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"] });
    },
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/backups/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"] });
    },
  });
}

export async function downloadBackupFile(id: string, filename: string) {
  const res = await apiClient.get(`/admin/backups/${id}/download`, {
    responseType: "blob",
  });
  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || `backup-${id}.json.gz`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
