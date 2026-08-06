"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoles } from "@/hooks/use-catalog";
import {
  useAssignStaffRoles,
  useCreateStaff,
  useStaffDetail,
} from "@/hooks/use-staff";
import { RequirePerm } from "@/components/auth/require-perm";
import { Perm } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { usePartners } from "@/hooks/use-partners";

const PLATFORM_COMPANY = "__platform__";

export default function AddStaffPage() {
  return (
    <RequirePerm
      anyOf={[Perm.StaffCreate]}
      description="You need staff.create to add staff accounts."
    >
      <AddStaffForm />
    </RequirePerm>
  );
}

function AddStaffForm() {
  const { isPlatform } = usePermissions();
  const roles = useRoles();
  const partners = usePartners({ page: 1, page_size: 100, enabled: isPlatform });
  const createStaff = useCreateStaff();
  const assignRoles = useAssignStaffRoles();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">(
    "active"
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [companyId, setCompanyId] = useState(PLATFORM_COMPANY);
  const [createdStaffId, setCreatedStaffId] = useState<string>("");
  const [formError, setFormError] = useState("");

  const createdDetail = useStaffDetail(createdStaffId || undefined);

  const assignableRoles = useMemo(() => {
    const rows = roles.data ?? [];
    if (isPlatform) return rows;
    return rows.filter((role) => role.name !== "platform_owner");
  }, [roles.data, isPlatform]);

  const selectedRoles = useMemo(() => {
    return assignableRoles.filter((role) => role.id === selectedRoleId);
  }, [assignableRoles, selectedRoleId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError("Full name, email and password are required.");
      return;
    }

    try {
      const created = await createStaff.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        status,
        partner_id:
          isPlatform && companyId !== PLATFORM_COMPANY ? companyId : null,
      });

      let targetId = created.id;
      if (selectedRoleId) {
        const assigned = await assignRoles.mutateAsync({
          staffId: created.id,
          roleIds: [selectedRoleId],
        });
        targetId = assigned.id;
      }

      setCreatedStaffId(targetId);
      setFullName("");
      setEmail("");
      setPassword("");
      setStatus("active");
      setSelectedRoleId("");
      setCompanyId(PLATFORM_COMPANY);
    } catch (err) {
      setFormError((err as Error).message || "Failed to create user.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Add user</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create a staff account and assign one role.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-lg">
            <Link href="/staff">Back to staff</Link>
          </Button>
        </div>
      </div>

      <Card className="gap-0 border-slate-200 py-0 shadow-none">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-lg text-slate-900">Staff details</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
              />
            </div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
              />
            </div>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "inactive" | "suspended")
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            {isPlatform ? (
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value={PLATFORM_COMPANY}>RukaSente (platform)</option>
                {(partners.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.code ? ` (${p.code})` : ""}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Role
              </p>
              <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                {assignableRoles.map((role) => (
                  <label
                    key={role.id}
                    className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${
                      selectedRoleId === role.id
                        ? "border-main-300 bg-main-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="add-staff-role"
                      checked={selectedRoleId === role.id}
                      onChange={() => setSelectedRoleId(role.id)}
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
              {selectedRoles[0] ? (
                <p className="text-xs text-slate-500">
                  Selected: {selectedRoles[0].name}
                </p>
              ) : null}
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <Button
              type="submit"
              className="bg-main-600 text-white hover:bg-main-700"
              disabled={createStaff.isPending || assignRoles.isPending}
            >
              {createStaff.isPending || assignRoles.isPending
                ? "Creating..."
                : "Create user"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {createdStaffId ? (
        <Card className="gap-0 border-slate-200 py-0 shadow-none">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-lg text-slate-900">Effective permissions</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {createdDetail.data?.partner?.name || createdDetail.data?.is_platform ? (
              <p className="mb-2 text-xs text-slate-500">
                Company: {createdDetail.data.partner?.name || "RukaSente"}
              </p>
            ) : null}
            {createdDetail.data?.permissions?.length ? (
              <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-xs font-mono text-slate-700">
                {createdDetail.data.permissions.map((perm) => (
                  <li key={perm}>{perm}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No effective permissions found for this user yet.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
