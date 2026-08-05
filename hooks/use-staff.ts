"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";

export type StaffListItem = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  roles?: RoleRef[];
  permissions?: string[];
};

export type StaffListResponse = {
  items: StaffListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
};

export type RoleRef = {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
};

export type StaffSummary = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  roles?: RoleRef[];
  permissions?: string[];
};

export type CreateStaffPayload = {
  full_name: string;
  email: string;
  password: string;
  status: "active" | "inactive" | "suspended";
  phone?: string;
};

export type UpdateStaffProfilePayload = {
  full_name?: string;
  email?: string;
  phone?: string;
};

export function useStaffList(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["staff", page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get("/admin/staff", {
        params: { page, page_size: pageSize },
      });
      return unwrapEnvelope<StaffListResponse>(res);
    },
  });
}

export function useStaffDetail(staffId?: string) {
  return useQuery({
    queryKey: ["staff-detail", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const res = await apiClient.get(`/admin/staff/${staffId}`);
      return unwrapEnvelope<StaffSummary>(res);
    },
  });
}

export async function fetchStaffDetailById(staffId: string) {
  const res = await apiClient.get(`/admin/staff/${staffId}`);
  return unwrapEnvelope<StaffSummary>(res);
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStaffPayload) => {
      const res = await apiClient.post("/admin/staff", payload);
      return unwrapEnvelope<StaffSummary>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useAssignStaffRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      roleIds,
    }: {
      staffId: string;
      roleIds: string[];
    }) => {
      const res = await apiClient.post(`/admin/staff/${staffId}/roles`, {
        role_ids: roleIds,
      });
      return unwrapEnvelope<StaffSummary>(res);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({
        queryKey: ["staff-detail", variables.staffId],
      });
    },
  });
}

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      status,
    }: {
      staffId: string;
      status: "active" | "inactive" | "suspended";
    }) => {
      const res = await apiClient.patch(`/admin/staff/${staffId}/status`, { status });
      return unwrapEnvelope<StaffSummary>(res);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({
        queryKey: ["staff-detail", variables.staffId],
      });
    },
  });
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      payload,
    }: {
      staffId: string;
      payload: UpdateStaffProfilePayload;
    }) => {
      const res = await apiClient.patch(`/admin/staff/${staffId}`, payload);
      return unwrapEnvelope<StaffSummary>(res);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({
        queryKey: ["staff-detail", variables.staffId],
      });
    },
  });
}
