"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Mail,
  Lock,
  User,
  CheckCircle2,
  Plus,
  Download,
  Upload,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePermissionsCatalog, useRoles } from "@/hooks/use-catalog";
import {
  CreateStaffPayload,
  fetchStaffDetailById,
  useAssignStaffRoles,
  useCreateStaff,
  useStaffDetail,
  useStaffList,
  useUpdateStaffProfile,
  useUpdateStaffStatus,
} from "@/hooks/use-staff";
import { enrichStaff, type EnrichedStaff } from "@/lib/staff-enrichment";
import {
  StaffPerformanceCards,
  StaffQuickStats,
  StaffSummaryCards,
} from "@/components/staff/staff-kpi-cards";
import {
  EMPTY_FILTERS,
  StaffFilters,
  type StaffFilterState,
} from "@/components/staff/staff-filters";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffProfileDrawer } from "@/components/staff/staff-profile-drawer";
import { StaffInsightsPanel } from "@/components/staff/staff-insights";

export default function StaffPage() {
  const { data: session } = useSession();
  const roles = useRoles();
  const permissionsCatalog = usePermissionsCatalog();
  const { data, isLoading, error } = useStaffList(1, 100);
  const createStaff = useCreateStaff();
  const assignRoles = useAssignStaffRoles();
  const updateStatus = useUpdateStaffStatus();
  const updateProfile = useUpdateStaffProfile();

  const [filters, setFilters] = useState<StaffFilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [profileStaff, setProfileStaff] = useState<EnrichedStaff | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const detail = useStaffDetail(selectedStaffId || undefined);
  const [assignRoleId, setAssignRoleId] = useState("");
  const [formError, setFormError] = useState("");
  const [statusValue, setStatusValue] = useState<"active" | "inactive" | "suspended">("active");
  const [statusDraft, setStatusDraft] = useState<"active" | "inactive">("active");
  const [profileDraft, setProfileDraft] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [addError, setAddError] = useState("");
  const [addPayload, setAddPayload] = useState<CreateStaffPayload>({
    full_name: "",
    email: "",
    password: "",
    status: "active",
    phone: "",
  });
  const [addRoleId, setAddRoleId] = useState("");

  const enriched = useMemo(
    () => (data?.items ?? []).map((item, i) => enrichStaff(item, i)),
    [data?.items]
  );

  const filteredStaff = useMemo(() => {
    return enriched.filter((item) => {
      const q = filters.search.trim().toLowerCase();
      const bySearch =
        !q ||
        item.full_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q);
      const byRole = filters.role === "all" || item.role === filters.role;
      const byDept = filters.department === "all" || item.department === filters.department;
      const byBranch = filters.branch === "all" || item.branch === filters.branch;
      const byStatus = filters.status === "all" || item.status === filters.status;
      const byJoined =
        filters.dateJoined === "all" || item.dateJoined.startsWith(filters.dateJoined);
      return bySearch && byRole && byDept && byBranch && byStatus && byJoined;
    });
  }, [enriched, filters]);

  const stats = useMemo(() => {
    return {
      total: enriched.length,
      active: enriched.filter((i) => i.status === "active").length,
      loanOfficers: enriched.filter((i) => i.role === "Loan Officer").length,
      supervisors: enriched.filter((i) => i.role === "Supervisor").length,
      collections: enriched.filter((i) => i.role === "Collections Officer").length,
      suspended: enriched.filter((i) => i.status === "suspended").length,
    };
  }, [enriched]);

  const selectedStaffLabel = useMemo(() => {
    const row = enriched.find((item) => item.id === selectedStaffId);
    if (!row) return "";
    return `${row.full_name} (${row.email})`;
  }, [enriched, selectedStaffId]);

  const isManagingSelf = (() => {
    if (!selectedStaffId) return false;
    const byId = session?.user?.id && session.user.id === selectedStaffId;
    if (byId) return true;
    const selected = enriched.find((item) => item.id === selectedStaffId);
    return (
      !!session?.user?.email &&
      !!selected?.email &&
      session.user.email.toLowerCase() === selected.email.toLowerCase()
    );
  })();

  const isSuperAdmin = useMemo(() => {
    const names = (session?.user?.roles ?? []).map((role) =>
      String(role.name || "").toLowerCase()
    );
    return names.some((name) =>
      ["super_admin", "superadmin", "system_admin"].includes(name)
    );
  }, [session?.user?.roles]);

  const handleLoadForManage = async (staffId: string, currentStatus: string) => {
    setSelectedStaffId(staffId);
    setIsManageOpen(true);
    setDrawerOpen(false);
    if (currentStatus === "active" || currentStatus === "inactive" || currentStatus === "suspended") {
      setStatusValue(currentStatus);
      setStatusDraft(currentStatus === "active" ? "active" : "inactive");
    }
    setFormError("");
    try {
      const summary = await fetchStaffDetailById(staffId);
      setAssignRoleId(summary.roles?.[0]?.id ?? "");
      setProfileDraft({
        full_name: summary.full_name ?? "",
        email: summary.email ?? "",
        phone: summary.phone ?? "",
      });
    } catch {
      setAssignRoleId("");
      setProfileDraft({ full_name: "", email: "", phone: "" });
    }
  };

  const handleAssignRoles = async () => {
    setFormError("");
    if (isManagingSelf) {
      setFormError("You cannot change your own role.");
      return;
    }
    if (!selectedStaffId) return;
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

  const handleSaveProfile = async () => {
    if (!selectedStaffId) return;
    setFormError("");
    try {
      await updateProfile.mutateAsync({
        staffId: selectedStaffId,
        payload: {
          full_name: profileDraft.full_name.trim() || undefined,
          email: profileDraft.email.trim() || undefined,
          phone: profileDraft.phone.trim() || undefined,
        },
      });
      await detail.refetch();
    } catch (err) {
      setFormError((err as Error).message || "Failed to update profile.");
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

  async function handleCreateStaff() {
    setAddError("");
    if (!addPayload.full_name.trim() || !addPayload.email.trim() || !addPayload.password.trim()) {
      setAddError("Full name, email and password are required.");
      return;
    }
    if (!addRoleId) {
      setAddError("Select one role before creating the user.");
      return;
    }

    try {
      const created = await createStaff.mutateAsync({
        ...addPayload,
        full_name: addPayload.full_name.trim(),
        email: addPayload.email.trim(),
      });
      await assignRoles.mutateAsync({ staffId: created.id, roleIds: [addRoleId] });
      setIsAddOpen(false);
      setAddStep(1);
      setAddPayload({
        full_name: "",
        email: "",
        password: "",
        status: "active",
        phone: "",
      });
      setAddRoleId("");
      setAddError("");
    } catch (err) {
      setAddError((err as Error).message || "Failed to create user.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Staff Management
          </h1>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            Manage employees, roles, permissions, branches, and operational access across
            the RukaSente platform.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
          >
            <Upload className="size-3.5" />
            <span className="hidden md:inline">Import</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-2.5 text-xs"
          >
            <Download className="size-3.5" />
            <span className="hidden md:inline">Export</span>
          </Button>

          <Dialog
            open={isAddOpen}
            onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setAddStep(1);
                setAddError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 rounded-lg bg-[#08163d] px-2.5 text-xs text-white hover:bg-[#06102a]"
              >
                <Plus className="size-3.5" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl min-h-[560px]">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  {addStep === 1
                    ? "Step 1 of 2 - Enter basic profile details."
                    : "Step 2 of 2 - Assign one role and confirm creation."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 min-w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      addStep >= 1 ? "bg-main-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    1
                  </div>
                  <div className={`h-px w-10 ${addStep === 2 ? "bg-main-600" : "bg-slate-200"}`} />
                  <div
                    className={`flex h-7 min-w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      addStep === 2 ? "bg-main-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    2
                  </div>
                </div>

                {addStep === 1 ? (
                  <div className="grid gap-3">
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        autoFocus
                        value={addPayload.full_name}
                        onChange={(e) =>
                          setAddPayload((p) => ({ ...p, full_name: e.target.value }))
                        }
                        placeholder="Full name"
                        className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        value={addPayload.email}
                        onChange={(e) =>
                          setAddPayload((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="Email"
                        className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="password"
                        value={addPayload.password}
                        onChange={(e) =>
                          setAddPayload((p) => ({ ...p, password: e.target.value }))
                        }
                        placeholder="Password"
                        className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
                      />
                    </div>
                    <Input
                      value={addPayload.phone}
                      onChange={(e) => setAddPayload((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone (optional)"
                      className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none"
                    />
                    <select
                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                      value={addPayload.status}
                      onChange={(e) =>
                        setAddPayload((p) => ({
                          ...p,
                          status: e.target.value as "active" | "inactive" | "suspended",
                        }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">New user summary</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {addPayload.full_name || "—"} · {addPayload.email || "—"}
                      </p>
                    </div>
                    <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                      {roles.data?.map((role) => (
                        <label
                          key={role.id}
                          className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${
                            addRoleId === role.id
                              ? "border-main-300 bg-main-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="create-staff-role"
                            checked={addRoleId === role.id}
                            onChange={() => setAddRoleId(role.id)}
                          />
                          <span>
                            <span className="font-medium text-slate-900">{role.name}</span>
                            {role.description ? (
                              <span className="block text-xs text-slate-500">
                                {role.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                    {addRoleId ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="size-3.5" />
                        Role selected
                      </div>
                    ) : null}
                  </div>
                )}

                {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
              </div>

              <DialogFooter>
                {addStep === 1 ? (
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setAddStep(1)}>
                    Back
                  </Button>
                )}
                {addStep === 1 ? (
                  <Button
                    className="bg-main-600 text-white hover:bg-main-700"
                    onClick={() => {
                      if (
                        addPayload.full_name.trim() &&
                        addPayload.email.trim() &&
                        addPayload.password.trim()
                      ) {
                        setAddError("");
                        setAddStep(2);
                        return;
                      }
                      setAddError("Full name, email and password are required.");
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    className="bg-main-600 text-white hover:bg-main-700"
                    onClick={handleCreateStaff}
                    disabled={createStaff.isPending || assignRoles.isPending}
                  >
                    {createStaff.isPending || assignRoles.isPending
                      ? "Creating..."
                      : "Create user"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <StaffSummaryCards
        total={stats.total}
        active={stats.active}
        loanOfficers={stats.loanOfficers || Math.max(1, Math.round(stats.total * 0.35))}
        supervisors={stats.supervisors || Math.max(1, Math.round(stats.total * 0.15))}
        collections={stats.collections || Math.max(1, Math.round(stats.total * 0.2))}
        suspended={stats.suspended}
        loading={isLoading}
      />

      <StaffQuickStats />

      {showFilters ? (
        <StaffFilters
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />
      ) : null}

      <StaffDataTable
        rows={filteredStaff}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        currentUserId={session?.user?.id}
        currentUserEmail={session?.user?.email ?? undefined}
        onViewProfile={(staff) => {
          setProfileStaff(staff);
          setDrawerOpen(true);
        }}
        onEdit={(staff) => handleLoadForManage(staff.id, staff.status)}
        totalLabel={
          data
            ? `Showing ${filteredStaff.length} of ${data.total} staff members`
            : undefined
        }
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Performance Overview</h2>
        <StaffPerformanceCards />
      </div>

      <StaffInsightsPanel />

      <StaffProfileDrawer
        staff={profileStaff}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => {
          if (profileStaff) handleLoadForManage(profileStaff.id, profileStaff.status);
        }}
      />

      {/* Existing manage modal — preserved */}
      {isManageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Manage staff</h2>
                <p className="text-sm text-slate-500">{selectedStaffLabel}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setIsManageOpen(false)}>
                Close
              </Button>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              {roles.isLoading || detail.isLoading ? <CompactLoading /> : null}

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-3 text-sm font-semibold text-slate-900">Profile</p>
                  <div className="grid gap-2">
                    <input
                      value={profileDraft.full_name}
                      onChange={(e) =>
                        setProfileDraft((p) => ({ ...p, full_name: e.target.value }))
                      }
                      placeholder="Full name"
                      className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-main-200"
                    />
                    <input
                      value={profileDraft.email}
                      onChange={(e) =>
                        setProfileDraft((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="Email"
                      className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-main-200"
                    />
                    <input
                      value={profileDraft.phone}
                      onChange={(e) =>
                        setProfileDraft((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="Phone (optional)"
                      className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-main-200"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? "Saving..." : "Save profile"}
                  </Button>
                </div>

                {isSuperAdmin ? (
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Status</p>
                        <p className="text-xs text-slate-500">
                          Only super admin can activate/deactivate users.
                        </p>
                      </div>
                      <div
                        role="radiogroup"
                        aria-label="Staff status"
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={statusDraft === "inactive"}
                          onClick={() => setStatusDraft("inactive")}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            statusDraft === "inactive"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
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
                              ? "bg-main-600 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
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
                        disabled={
                          updateStatus.isPending ||
                          statusDraft === (statusValue === "active" ? "active" : "inactive")
                        }
                      >
                        {updateStatus.isPending ? "Saving..." : "Save status"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                {roles.data && (
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-900">Role assignment</p>
                    <p className="mb-2 text-xs text-slate-500">
                      Assign one role. Effective permissions update immediately.
                    </p>
                    <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                      {roles.data.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-start gap-2 rounded border border-slate-200 p-2 text-sm"
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
                            {role.description ? (
                              <span className="block text-xs text-slate-500">
                                {role.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                    <Button
                      type="button"
                      className="mt-3"
                      onClick={handleAssignRoles}
                      disabled={!selectedStaffId || assignRoles.isPending || isManagingSelf}
                    >
                      {assignRoles.isPending ? "Saving..." : "Save role"}
                    </Button>
                    {isManagingSelf ? (
                      <p className="mt-2 text-xs text-slate-500">
                        You cannot change your own role. Manage another user instead.
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-900">
                    Effective permissions
                  </p>
                  {detail.data?.permissions?.length ? (
                    <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-xs font-mono text-slate-700">
                      {detail.data.permissions.map((perm) => (
                        <li key={perm}>{perm}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No effective permissions yet. Assign role to populate this list.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-900">
                    Permissions catalog
                  </p>
                  {permissionsCatalog.isLoading ? (
                    <CompactLoading />
                  ) : permissionsCatalog.data?.length ? (
                    <div className="max-h-56 overflow-y-auto pr-1">
                      <div className="grid gap-2">
                        {permissionsCatalog.data.map((perm) => {
                          const enabled = !!detail.data?.permissions?.includes(perm.key);
                          return (
                            <div
                              key={perm.id}
                              className={`rounded border px-2 py-1 text-xs ${
                                enabled
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                  : "border-slate-200 bg-white text-slate-500"
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
                    <p className="text-xs text-slate-500">No permissions found.</p>
                  )}
                </div>
              </div>
              {formError ? (
                <div className="lg:col-span-2">
                  <p className="text-sm text-destructive">{formError}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
