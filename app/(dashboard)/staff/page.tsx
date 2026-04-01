"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { DataTable } from "@/components/ui/data-table";
import { usePermissionsCatalog, useRoles } from "@/hooks/use-catalog";
import {
  fetchStaffDetailById,
  StaffListItem,
  useAssignStaffRoles,
  useStaffDetail,
  useStaffList,
  useUpdateStaffStatus,
} from "@/hooks/use-staff";

export default function StaffPage() {
  const { data: session } = useSession();
  const roles = useRoles();
  const permissionsCatalog = usePermissionsCatalog();
  const { data, isLoading, error } = useStaffList();
  const assignRoles = useAssignStaffRoles();
  const updateStatus = useUpdateStaffStatus();

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const detail = useStaffDetail(selectedStaffId || undefined);
  const [assignRoleId, setAssignRoleId] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [statusValue, setStatusValue] = useState<
    "active" | "inactive" | "suspended"
  >("active");
  const [statusDraft, setStatusDraft] = useState<"active" | "inactive">("active");

  const selectedStaffLabel = useMemo(() => {
    const row = data?.items?.find((item) => item.id === selectedStaffId);
    if (!row) return "";
    return `${row.full_name} (${row.email})`;
  }, [data?.items, selectedStaffId]);

  const isManagingSelf = (() => {
    if (!selectedStaffId) return false;
    const byId = session?.user?.id && session.user.id === selectedStaffId;
    if (byId) return true;
    const selected = data?.items?.find((item) => item.id === selectedStaffId);
    const byEmail =
      !!session?.user?.email &&
      !!selected?.email &&
      session.user.email.toLowerCase() === selected.email.toLowerCase();
    return byEmail;
  })();

  const isSuperAdmin = useMemo(() => {
    const names = (session?.user?.roles ?? []).map((role) =>
      String(role.name || "").toLowerCase()
    );
    return names.some((name) =>
      ["super_admin", "superadmin", "system_admin"].includes(name)
    );
  }, [session?.user?.roles]);

  const handleLoadForAssign = async (staffId: string, currentStatus: string) => {
    setSelectedStaffId(staffId);
    setIsManageOpen(true);
    if (
      currentStatus === "active" ||
      currentStatus === "inactive" ||
      currentStatus === "suspended"
    ) {
      setStatusValue(currentStatus);
      setStatusDraft(currentStatus === "active" ? "active" : "inactive");
    }
    setFormError("");
    try {
      const summary = await fetchStaffDetailById(staffId);
      setAssignRoleId(summary.roles?.[0]?.id ?? "");
    } catch {
      setAssignRoleId("");
    }
  };

  const handleAssignRoles = async () => {
    setFormError("");
    if (isManagingSelf) {
      setFormError("You cannot change your own role.");
      return;
    }
    if (!selectedStaffId) {
      setFormError("Select a staff member first.");
      return;
    }
    if (!assignRoleId) {
      setFormError("Choose one role.");
      return;
    }
    try {
      await assignRoles.mutateAsync({
        staffId: selectedStaffId,
        roleIds: [assignRoleId],
      });
      await detail.refetch();
    } catch (err) {
      setFormError((err as Error).message || "Failed to assign roles.");
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedStaffId) return;
    setFormError("");
    try {
      await updateStatus.mutateAsync({ staffId: selectedStaffId, status: statusDraft });
      setStatusValue(statusDraft);
      await detail.refetch();
    } catch (err) {
      setFormError((err as Error).message || "Failed to update status.");
    }
  };

  const teamColumns: ColumnDef<StaffListItem>[] = [
      {
        accessorKey: "full_name",
        header: "Name",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="capitalize">{String(row.original.status || "")}</span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const selfById = !!session?.user?.id && session.user.id === row.original.id;
          const selfByEmail =
            !!session?.user?.email &&
            !!row.original.email &&
            session.user.email.toLowerCase() === row.original.email.toLowerCase();
          const isSelfRow = selfById || selfByEmail;

          if (isSelfRow) {
            return <span className="text-xs text-muted-foreground">Current user</span>;
          }

          return (
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleLoadForAssign(row.original.id, row.original.status)}
              >
                Manage
              </Button>
            </div>
          );
        },
      },
    ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Staff</h1>
        <Button asChild>
          <Link href="/staff/add">Add user</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={teamColumns}
            data={data?.items ?? []}
            isLoading={isLoading}
            error={error ? (error as Error).message : null}
          />
          {data && (
            <p className="text-xs text-muted-foreground mt-2">
              Total: {data.total} · Page {data.page} / {data.total_pages ?? "—"}
            </p>
          )}
        </CardContent>
      </Card>
      {isManageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Manage user</h2>
                <p className="text-sm text-muted-foreground">{selectedStaffLabel}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setIsManageOpen(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-4 p-4">
              {roles.isLoading || detail.isLoading ? <CompactLoading /> : null}
              {roles.data && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Assign one role</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {roles.data.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-start gap-2 rounded border border-border/60 p-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="staff-role"
                          checked={assignRoleId === role.id}
                          onChange={() => setAssignRoleId(role.id)}
                          disabled={isManagingSelf}
                        />
                        <span>
                          <span className="font-medium">{role.name}</span>
                          {role.description && (
                            <span className="block text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAssignRoles}
                    disabled={!selectedStaffId || assignRoles.isPending || isManagingSelf}
                  >
                    {assignRoles.isPending ? "Saving..." : "Save role"}
                  </Button>
                  {isManagingSelf ? (
                    <p className="text-xs text-muted-foreground">
                      You cannot change your own role. Manage another user instead.
                    </p>
                  ) : null}
                </div>
              )}

              {isSuperAdmin ? (
                <div className="rounded border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-xs text-muted-foreground">
                        Only super admin can activate/deactivate users.
                      </p>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label="Staff status"
                      className="inline-flex items-center rounded-lg border border-border bg-muted/20 p-1"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={statusDraft === "inactive"}
                        onClick={() => setStatusDraft("inactive")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          statusDraft === "inactive"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Inactive
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={statusDraft === "active"}
                        onClick={() => setStatusDraft("active")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          statusDraft === "active"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Active
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveStatus}
                      disabled={updateStatus.isPending || statusDraft === (statusValue === "active" ? "active" : "inactive")}
                    >
                      {updateStatus.isPending ? "Saving..." : "Save status"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="rounded border border-border/60 p-3">
                <p className="mb-2 text-sm font-medium">What this user can do</p>
                {detail.data?.permissions?.length ? (
                  <ul className="max-h-56 list-disc space-y-1 overflow-y-auto pl-5 text-xs font-mono">
                    {detail.data.permissions.map((perm) => (
                      <li key={perm}>{perm}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No effective permissions yet. Assign role to populate this list.
                  </p>
                )}
              </div>
              <div className="rounded border border-border/60 p-3">
                <p className="mb-2 text-sm font-medium">Permissions catalog</p>
                {permissionsCatalog.isLoading ? (
                  <CompactLoading />
                ) : permissionsCatalog.data?.length ? (
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid gap-2 md:grid-cols-2">
                    {permissionsCatalog.data.map((perm) => {
                      const enabled = !!detail.data?.permissions?.includes(perm.key);
                      return (
                        <div
                          key={perm.id}
                          className={`rounded border px-2 py-1 text-xs ${
                            enabled
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-border/60 bg-background text-muted-foreground"
                          }`}
                        >
                          <p className="font-mono">{perm.key}</p>
                          {perm.description ? <p>{perm.description}</p> : null}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No permissions found.</p>
                )}
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
