"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { usePermissions } from "@/hooks/use-permissions";
import { Perm } from "@/lib/permissions";

export type StaffPartnerSummary = {
  id: string;
  name: string;
  code: string;
  is_internal: boolean;
  logo_url?: string;
  primary_color?: string;
  currency?: string;
};

export type StaffListItem = {
  id: string;
  partner_id?: string | null;
  is_platform?: boolean;
  partner?: StaffPartnerSummary | null;
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
  partner_id?: string | null;
  is_platform?: boolean;
  partner?: StaffPartnerSummary | null;
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
  /** Platform-only: assign staff to a lending company. Omit/null = RukaSente platform. */
  partner_id?: string | null;
};

export type UpdateStaffProfilePayload = {
  full_name?: string;
  email?: string;
  phone?: string;
};

export function useStaffList(page = 1, pageSize = 20) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["staff", page, pageSize],
    enabled: can(Perm.StaffView),
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
      const body: Record<string, unknown> = {
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        status: payload.status,
      };
      if (payload.phone) body.phone = payload.phone;
      if (payload.partner_id) body.partner_id = payload.partner_id;
      const res = await apiClient.post("/admin/staff", body);
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

export type StaffPermissionBreakdown = {
  effective: string[];
  from_roles: string[];
  direct: string[];
};

export function useStaffPermissions(staffId?: string) {
  const { can } = usePermissions();
  return useQuery({
    queryKey: ["staff-permissions", staffId],
    enabled: !!staffId && can(Perm.PermissionView),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/staff/${staffId}/permissions`);
      return unwrapEnvelope<StaffPermissionBreakdown>(res);
    },
  });
}

export function useSetStaffDirectPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      permissionKeys,
    }: {
      staffId: string;
      permissionKeys: string[];
    }) => {
      const res = await apiClient.put(`/admin/staff/${staffId}/permissions`, {
        permission_keys: permissionKeys,
      });
      return unwrapEnvelope<StaffPermissionBreakdown>(res);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({
        queryKey: ["staff-detail", variables.staffId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["staff-permissions", variables.staffId],
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
