"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoles } from "@/hooks/use-catalog";
import {
  useAssignStaffRoles,
  useCreateStaff,
  useStaffDetail,
} from "@/hooks/use-staff";

export default function AddStaffPage() {
  const roles = useRoles();
  const createStaff = useCreateStaff();
  const assignRoles = useAssignStaffRoles();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">(
    "active"
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [createdStaffId, setCreatedStaffId] = useState<string>("");
  const [formError, setFormError] = useState("");

  const createdDetail = useStaffDetail(createdStaffId || undefined);

  const selectedRoles = useMemo(() => {
    if (!roles.data) return [];
    return roles.data.filter((role) => role.id === selectedRoleId);
  }, [roles.data, selectedRoleId]);

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
    } catch (err) {
      setFormError((err as Error).message || "Failed to create user.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Add user</h1>
        <Button asChild variant="outline">
          <Link href="/staff">Back to staff</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create staff user</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "active" | "inactive" | "suspended")
                }
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Assign roles</p>
              <p className="text-xs text-muted-foreground">
                Pick one role for this user.
              </p>
              {roles.data && (
                <div className="grid gap-2 md:grid-cols-2">
                  {roles.data.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-2 rounded border border-border/60 p-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="new-staff-role"
                        checked={selectedRoleId === role.id}
                        onChange={() => setSelectedRoleId(role.id)}
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
              )}
            </div>

            {selectedRoles.length > 0 && (
              <div className="rounded border border-border/60 p-3">
                <p className="mb-2 text-sm font-medium">Selected role</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {selectedRoles.map((role) => (
                    <li key={role.id}>
                      <span className="font-medium">{role.name}</span>
                      {role.description ? ` - ${role.description}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" disabled={createStaff.isPending || assignRoles.isPending}>
              {createStaff.isPending ? "Creating..." : "Create user"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {createdStaffId && (
        <Card>
          <CardHeader>
            <CardTitle>Effective permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {createdDetail.data?.permissions?.length ? (
              <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-xs font-mono">
                {createdDetail.data.permissions.map((perm) => (
                  <li key={perm}>{perm}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No effective permissions found for this user yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
