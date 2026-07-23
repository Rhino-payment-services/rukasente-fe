"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type StaffNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link_path: string;
  resource_type?: string;
  resource_id?: string | null;
  severity: "info" | "warning" | "critical" | string;
  is_read: boolean;
  created_at: string;
};

export type StaffNotificationList = {
  items: StaffNotification[];
  total: number;
  unread: number;
  page: number;
  page_size: number;
  total_pages: number;
};

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_KEY = ["notifications", "unread-count"] as const;

export function useNotifications(opts?: { pageSize?: number; enabled?: boolean }) {
  const pageSize = opts?.pageSize ?? 15;
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, { pageSize }],
    enabled: opts?.enabled ?? true,
    refetchInterval: 30_000,
    queryFn: async () => {
      const res = await apiClient.get("/admin/notifications", {
        params: { page: 1, page_size: pageSize },
      });
      return unwrapEnvelope<StaffNotificationList>(res);
    },
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: UNREAD_KEY,
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => {
      const res = await apiClient.get("/admin/notifications/unread-count");
      const data = unwrapEnvelope<{ unread: number }>(res);
      return data.unread ?? 0;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/admin/notifications/read-all");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}
