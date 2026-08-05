import type { StaffListItem } from "@/hooks/use-staff";

export type StaffRoleLabel =
  | "System Administrator"
  | "Loan Officer"
  | "Collections Officer"
  | "Finance Officer"
  | "Branch Manager"
  | "Credit Analyst"
  | "Support Officer"
  | "Supervisor"
  | "Auditor";

export type StaffStatusLabel =
  | "active"
  | "pending"
  | "on_leave"
  | "suspended"
  | "inactive";

export type EnrichedStaff = StaffListItem & {
  employeeId: string;
  phone: string;
  role: string;
  company: string;
  lastLogin: string;
  permissions: string[];
  dateJoined: string;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function staffCompanyLabel(item: {
  partner?: { name?: string } | null;
  is_platform?: boolean;
  partner_id?: string | null;
}): string {
  if (item.partner?.name) return item.partner.name;
  if (item.is_platform || !item.partner_id) return "RukaSente";
  return "—";
}

export function enrichStaff(item: StaffListItem): EnrichedStaff {
  let status = String(item.status || "active").toLowerCase() as StaffStatusLabel;
  if (!["active", "inactive", "suspended", "pending", "on_leave"].includes(status)) {
    status = "active";
  }

  return {
    ...item,
    status,
    employeeId: item.id,
    phone: item.phone?.trim() || "—",
    role: item.roles?.map((role) => role.name).join(", ") || "No role assigned",
    company: staffCompanyLabel(item),
    lastLogin: formatDateTime(item.last_login_at),
    permissions: item.permissions ?? [],
    dateJoined: formatDate(item.created_at),
  };
}
