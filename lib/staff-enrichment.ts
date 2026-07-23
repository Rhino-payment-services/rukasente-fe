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
  role: StaffRoleLabel;
  department: string;
  branch: string;
  lastLogin: string;
  permissions: string[];
  dateJoined: string;
};

const ROLE_CYCLE: StaffRoleLabel[] = [
  "System Administrator",
  "Loan Officer",
  "Collections Officer",
  "Finance Officer",
  "Supervisor",
  "Credit Analyst",
  "Branch Manager",
  "Support Officer",
  "Auditor",
];

const DEPARTMENTS = [
  "Credit Operations",
  "Collections",
  "Finance",
  "Risk & Compliance",
  "Customer Support",
  "Branch Operations",
];

const BRANCHES = [
  "Kampala HQ",
  "Entebbe",
  "Jinja",
  "Mbarara",
  "Gulu",
  "Mbale",
];

const PERM_SETS = [
  ["Loans", "Borrowers", "Approvals"],
  ["Collections", "Reports", "Borrowers"],
  ["Finance", "Reports", "Analytics"],
  ["Users", "Settings", "Approvals"],
  ["Loans", "Analytics", "Reports"],
  ["Borrowers", "Loans", "Collections"],
];

const LAST_LOGINS = [
  "Today 09:34 AM",
  "Today 08:12 AM",
  "Yesterday",
  "2 days ago",
  "3 days ago",
  "Never",
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function phoneFromHash(h: number) {
  const n = String(700000000 + (h % 99999999)).padStart(9, "0");
  return `+256 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

export function enrichStaff(item: StaffListItem, index: number): EnrichedStaff {
  const h = hash(item.id || item.email || String(index));
  const roleFromName = detectRoleFromName(item.full_name, item.email);
  const role = roleFromName ?? ROLE_CYCLE[h % ROLE_CYCLE.length];

  let status = String(item.status || "active").toLowerCase() as StaffStatusLabel;
  if (!["active", "inactive", "suspended", "pending", "on_leave"].includes(status)) {
    status = "active";
  }
  // Sprinkle a few richer statuses for demo polish when everyone is active
  if (status === "active" && h % 17 === 0) status = "on_leave";
  if (status === "active" && h % 23 === 0) status = "pending";

  return {
    ...item,
    status,
    employeeId: `RS-${String(1000 + (h % 9000))}`,
    phone: phoneFromHash(h),
    role,
    department: DEPARTMENTS[h % DEPARTMENTS.length],
    branch: BRANCHES[h % BRANCHES.length],
    lastLogin: LAST_LOGINS[h % LAST_LOGINS.length],
    permissions: PERM_SETS[h % PERM_SETS.length],
    dateJoined: `2025-${String((h % 12) + 1).padStart(2, "0")}-${String((h % 27) + 1).padStart(2, "0")}`,
  };
}

function detectRoleFromName(name: string, email: string): StaffRoleLabel | null {
  const s = `${name} ${email}`.toLowerCase();
  if (s.includes("admin") || s.includes("system")) return "System Administrator";
  if (s.includes("collection")) return "Collections Officer";
  if (s.includes("loan") || s.includes("officer")) return "Loan Officer";
  if (s.includes("finance")) return "Finance Officer";
  if (s.includes("supervisor")) return "Supervisor";
  if (s.includes("auditor")) return "Auditor";
  if (s.includes("credit")) return "Credit Analyst";
  return null;
}

export const STAFF_ACTIVITY = [
  { title: "Loan Approved", detail: "Brian Okello · UGX 1.2M", time: "12 min ago", tone: "success" as const },
  { title: "User Login", detail: "admin@rukapay.local", time: "28 min ago", tone: "info" as const },
  { title: "Borrower Assigned", detail: "Grace Atim → Loan Officer", time: "1 hr ago", tone: "info" as const },
  { title: "Role Updated", detail: "Ronald Collections → Collections Officer", time: "2 hr ago", tone: "warning" as const },
  { title: "Password Reset", detail: "finance@rukapay.local", time: "Yesterday", tone: "warning" as const },
  { title: "Permission Changed", detail: "Approvals enabled for Supervisor", time: "Yesterday", tone: "info" as const },
  { title: "Loan Rejected", detail: "High-risk application #LA-2041", time: "2 days ago", tone: "danger" as const },
  { title: "Collection Completed", detail: "UGX 450,000 recovered", time: "3 days ago", tone: "success" as const },
];

export const STAFF_NOTIFICATIONS = [
  { title: "New staff invited", detail: "Sarah Namutebi · Credit Analyst", time: "5 min ago" },
  { title: "Role changed", detail: "Supervisor assigned to Jinja branch", time: "40 min ago" },
  { title: "Permission updated", detail: "Reports access granted", time: "2 hr ago" },
  { title: "Account suspended", detail: "Inactive officer flagged", time: "Yesterday" },
  { title: "New login detected", detail: "Kampala HQ · Chrome", time: "Yesterday" },
  { title: "Password changed", detail: "System Administrator", time: "3 days ago" },
];

export const TOP_PERFORMERS = [
  {
    title: "Top Loan Officers",
    people: [
      { name: "Brian Loan Officer", dept: "Credit Operations", loans: 148, rate: "94%", collections: "—", score: 96 },
      { name: "Amina Nalwanga", dept: "Credit Operations", loans: 132, rate: "91%", collections: "—", score: 93 },
      { name: "Joseph Mugisha", dept: "Credit Operations", loans: 121, rate: "89%", collections: "—", score: 90 },
    ],
  },
  {
    title: "Top Collections Officers",
    people: [
      { name: "Ronald Collections", dept: "Collections", loans: 64, rate: "—", collections: "UGX 82M", score: 95 },
      { name: "Sarah Namutebi", dept: "Collections", loans: 51, rate: "—", collections: "UGX 71M", score: 91 },
      { name: "Daniel Kizito", dept: "Collections", loans: 47, rate: "—", collections: "UGX 63M", score: 88 },
    ],
  },
  {
    title: "Top Supervisors",
    people: [
      { name: "Grace Supervisor", dept: "Branch Operations", loans: 210, rate: "92%", collections: "UGX 40M", score: 97 },
      { name: "Peter Okello", dept: "Risk & Compliance", loans: 186, rate: "90%", collections: "UGX 28M", score: 94 },
      { name: "Linda Atim", dept: "Credit Operations", loans: 174, rate: "88%", collections: "UGX 22M", score: 91 },
    ],
  },
];

export const ROLE_DISTRIBUTION = [
  { name: "Loan Officer", value: 28, color: "#3b82f6" },
  { name: "Collections", value: 18, color: "#f59e0b" },
  { name: "Supervisor", value: 12, color: "#8b5cf6" },
  { name: "Finance", value: 10, color: "#10b981" },
  { name: "Admin", value: 8, color: "#08163d" },
  { name: "Other", value: 14, color: "#94a3b8" },
];

export const BRANCH_DISTRIBUTION = [
  { branch: "Kampala", count: 34 },
  { branch: "Entebbe", count: 18 },
  { branch: "Jinja", count: 15 },
  { branch: "Mbarara", count: 12 },
  { branch: "Gulu", count: 9 },
  { branch: "Mbale", count: 8 },
];

export const STAFF_GROWTH = [
  { month: "Aug", count: 42 },
  { month: "Sep", count: 48 },
  { month: "Oct", count: 55 },
  { month: "Nov", count: 61 },
  { month: "Dec", count: 70 },
  { month: "Jan", count: 78 },
  { month: "Feb", count: 86 },
];
