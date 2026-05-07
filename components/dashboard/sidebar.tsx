"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  LineChart,
  Plug,
  WalletCards,
  Link2,
  ChevronDown,
  ChevronRight,
  Building2,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Perm, hasPermission } from "@/lib/permissions";
import { RukaPayLogoMark } from "@/components/brand/rukapay-logo-mark";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  perm?: string;
  anyOf?: string[];
  children?: Array<{
    href: string;
    label: string;
  }>;
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Operations",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/staff", label: "Staff", icon: Users, perm: Perm.StaffView },
      { href: "/borrowers", label: "Borrowers", icon: UserCircle, perm: Perm.BorrowerView },
      {
        href: "/subscriptions",
        label: "Subscriptions",
        icon: CreditCard,
        perm: Perm.SubscriptionView,
      },
      {
        href: "/scoring",
        label: "Scoring",
        icon: LineChart,
        perm: Perm.ScoringView,
        children: [
          { href: "/scoring/rules", label: "Scoring rules" },
          { href: "/scoring/results", label: "Score results" },
          { href: "/scoring/eligibility", label: "Eligibility decisions" },
          { href: "/scoring/manual-review", label: "Manual review cases" },
        ],
      },
      {
        href: "/integrations",
        label: "Integrations",
        icon: Plug,
        perm: Perm.IntegrationView,
      },
      {
        href: "/loan-products",
        label: "Loan products",
        icon: WalletCards,
        anyOf: [Perm.LoanProductView, Perm.StaffView],
      },
      {
        href: "/loan-applications",
        label: "Loan applications",
        icon: WalletCards,
        anyOf: [Perm.LoanApplicationView, Perm.StaffView],
      },
      {
        href: "/manual-borrower",
        label: "Manual borrower",
        icon: Link2,
        anyOf: [Perm.BorrowerView, Perm.StaffView],
      },
    ],
  },
];

function isNavVisible(perms: string[], item: NavItem): boolean {
  if (item.anyOf?.length) {
    return item.anyOf.some((k) => hasPermission(perms, k));
  }
  if (item.perm) {
    return hasPermission(perms, item.perm);
  }
  return true;
}

function initialsFromSession(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return `${a}${b}`.toUpperCase() || "U";
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function Sidebar({
  isOpen: _isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-gray-100 bg-white flex flex-col"
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="md:hidden flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-600"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <Link
            href="/"
            onClick={onClose}
            className="mb-3 flex items-center gap-2.5 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-600/30"
          >
            <RukaPayLogoMark size={34} className="rounded-lg" />
            <span className="text-base font-semibold text-[#08163d] tracking-tight">
              Ruka Sente
            </span>
          </Link>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-main-200 focus:bg-white"
            />
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {section.title}
                </div>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    if (!isNavVisible(perms, item)) return null;
                    const Icon = item.icon;
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href ||
                          pathname.startsWith(item.href + "/");
                    const defaultOpen =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    const groupOpen =
                      item.children?.length &&
                      (openGroups[item.href] ?? defaultOpen);
                    return (
                      <li key={item.href}>
                        {item.children?.length ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenGroups((prev) => ({
                                  ...prev,
                                  [item.href]: !groupOpen,
                                }))
                              }
                              className={cn(
                                "w-full flex items-center px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                                active
                                  ? "bg-main-50 text-main-700"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "mr-2.5 h-4 w-4 shrink-0",
                                  active ? "text-main-600" : "text-gray-400"
                                )}
                              />
                              <span className="truncate">{item.label}</span>
                              {groupOpen ? (
                                <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                              )}
                            </button>
                            {groupOpen && (
                              <ul className="ml-7 mt-1 space-y-1">
                                {item.children.map((child) => {
                                  const childActive =
                                    pathname === child.href ||
                                    pathname.startsWith(child.href + "/");
                                  return (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        onClick={onClose}
                                        className={cn(
                                          "block rounded-md px-2.5 py-1.5 text-[11px]",
                                          childActive
                                            ? "bg-main-50 text-main-700"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                      >
                                        {child.label}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "w-full flex items-center px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                              active
                                ? "bg-main-50 text-main-700"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <Icon
                              className={cn(
                                "mr-2.5 h-4 w-4 shrink-0",
                                active ? "text-main-600" : "text-gray-400"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                            {active && (
                              <span className="ml-auto w-2 h-2 bg-main-600 rounded-full shrink-0" />
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-main-600 text-xs font-semibold text-white">
                {initialsFromSession(session?.user?.name, session?.user?.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-semibold text-gray-900">
                  {session?.user?.name ?? "Staff"}
                </div>
                <div className="truncate text-[11px] text-gray-500">
                  {session?.user?.email ?? "Signed in"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
