"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Perm, hasPermission } from "@/lib/permissions";
import { RukaPayLogoMark } from "@/components/brand/rukapay-logo-mark";
import { useSidebar } from "@/components/dashboard/sidebar-context";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  perm?: string;
  anyOf?: string[];
  badge?: string;
  children?: Array<{ href: string; label: string }>;
};

type NavSection = { title: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/loan-applications",
        label: "Loan applications",
        icon: WalletCards,
        anyOf: [Perm.LoanApplicationView, Perm.StaffView],
      },
      {
        href: "/loan-products",
        label: "Loan products",
        icon: WalletCards,
        anyOf: [Perm.LoanProductView, Perm.StaffView],
      },
      { href: "/borrowers", label: "Borrowers", icon: UserCircle, perm: Perm.BorrowerView },
      {
        href: "/manual-borrower",
        label: "Manual borrower",
        icon: Link2,
        anyOf: [Perm.BorrowerView, Perm.StaffView],
      },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/staff", label: "Staff", icon: Users, perm: Perm.StaffView },
      {
        href: "/subscriptions",
        label: "Subscriptions",
        icon: CreditCard,
        perm: Perm.SubscriptionView,
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        href: "/scoring",
        label: "Scoring",
        icon: LineChart,
        perm: Perm.ScoringView,
        children: [
          { href: "/credit-score/rules", label: "Credit score rules" },
          { href: "/scoring/results", label: "Score results" },
          { href: "/loan-score-limits", label: "Score loan limits" },
          { href: "/scoring/eligibility", label: "Eligibility" },
          { href: "/scoring/manual-review", label: "Manual review" },
        ],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/integrations",
        label: "Integrations",
        icon: Plug,
        anyOf: [Perm.PartnerView, Perm.IntegrationView],
        children: [
          { href: "/partners", label: "Partners" },
          { href: "/integrations", label: "API endpoints" },
        ],
      },
    ],
  },
];

function isNavVisible(perms: string[], item: NavItem): boolean {
  if (item.anyOf?.length) return item.anyOf.some((k) => hasPermission(perms, k));
  if (item.perm) return hasPermission(perms, item.perm);
  return true;
}

function initialsFromSession(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`.toUpperCase() || "U";
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const { collapsed, toggleCollapsed, setCommandOpen } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const roleLabel = useMemo(() => {
    const roles = session?.user?.roles ?? [];
    const name = roles[0]?.name;
    if (!name) return "Administrator";
    return String(name)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [session?.user?.roles]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/70 bg-white transition-[width,transform] duration-300 ease-out",
          collapsed ? "md:w-[72px]" : "md:w-[240px]",
          "w-[240px]",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full min-h-0 flex-col px-3 py-3">
          {/* Brand */}
          <div
            className={cn(
              "mb-3 flex items-center gap-2.5 px-1",
              collapsed && "md:justify-center"
            )}
          >
            <Link
              href="/"
              onClick={onClose}
              className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08163d]/20"
            >
              <RukaPayLogoMark size={collapsed ? 30 : 32} className="rounded-lg shrink-0" />
              <span
                className={cn(
                  "truncate text-[15px] font-semibold tracking-tight text-[#08163d] transition-opacity",
                  collapsed && "md:hidden"
                )}
              >
                Ruka Sente
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto size-8 text-slate-500 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Command / search */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={cn(
              "mb-3 flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-left text-xs text-slate-500 transition hover:bg-slate-100",
              collapsed && "md:justify-center md:px-0"
            )}
            title="Search (⌘K)"
          >
            <Search className="size-3.5 shrink-0" />
            <span className={cn("flex-1 truncate", collapsed && "md:hidden")}>
              Search…
            </span>
            <kbd
              className={cn(
                "rounded border border-slate-200 bg-white px-1 py-px text-[10px] text-slate-400",
                collapsed && "md:hidden"
              )}
            >
              ⌘K
            </kbd>
          </button>

          {/* Nav */}
          <nav className="flex-1 space-y-4 overflow-y-auto pb-3">
            {sections.map((section) => {
              const visible = section.items.filter((i) => isNavVisible(perms, i));
              if (!visible.length) return null;
              return (
                <div key={section.title}>
                  <div
                    className={cn(
                      "mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400",
                      collapsed && "md:hidden"
                    )}
                  >
                    {section.title}
                  </div>
                  <ul className="space-y-0.5">
                    {visible.map((item) => {
                      const Icon = item.icon;
                      const childActive =
                        item.children?.some(
                          (child) =>
                            pathname === child.href ||
                            pathname.startsWith(child.href + "/")
                        ) ?? false;
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname === item.href ||
                            pathname.startsWith(item.href + "/") ||
                            childActive;
                      const defaultOpen = active;
                      const groupOpen =
                        item.children?.length &&
                        (openGroups[item.href] ?? defaultOpen);

                      if (item.children?.length) {
                        return (
                          <li key={item.href}>
                            <button
                              type="button"
                              title={item.label}
                              onClick={() => {
                                if (collapsed) {
                                  toggleCollapsed();
                                  setOpenGroups((p) => ({ ...p, [item.href]: true }));
                                  return;
                                }
                                setOpenGroups((p) => ({
                                  ...p,
                                  [item.href]: !groupOpen,
                                }));
                              }}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all",
                                active
                                  ? "bg-[rgba(8,22,61,0.06)] text-[#08163d]"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                collapsed && "md:justify-center md:px-0"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "size-4 shrink-0",
                                  active ? "text-[#08163d]" : "text-slate-400"
                                )}
                              />
                              <span className={cn("truncate", collapsed && "md:hidden")}>
                                {item.label}
                              </span>
                              <span className={cn("ml-auto", collapsed && "md:hidden")}>
                                {groupOpen ? (
                                  <ChevronDown className="size-3.5 opacity-50" />
                                ) : (
                                  <ChevronRight className="size-3.5 opacity-50" />
                                )}
                              </span>
                            </button>
                            {groupOpen && !collapsed ? (
                              <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2.5">
                                {item.children.map((child) => {
                                  const isChildActive =
                                    pathname === child.href ||
                                    pathname.startsWith(child.href + "/");
                                  return (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        onClick={onClose}
                                        className={cn(
                                          "block rounded-lg px-2 py-1.5 text-[12px] transition-colors",
                                          isChildActive
                                            ? "bg-[rgba(8,22,61,0.06)] font-medium text-[#08163d]"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                        )}
                                      >
                                        {child.label}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </li>
                        );
                      }

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            title={item.label}
                            className={cn(
                              "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all",
                              active
                                ? "bg-[rgba(8,22,61,0.06)] text-[#08163d]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                              collapsed && "md:justify-center md:px-0"
                            )}
                          >
                            {active ? (
                              <span className="absolute left-0 top-1/2 hidden h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#08163d] md:block" />
                            ) : null}
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                active ? "text-[#08163d]" : "text-slate-400"
                              )}
                            />
                            <span className={cn("truncate", collapsed && "md:hidden")}>
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* Collapse + profile */}
          <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "hidden h-8 w-full items-center gap-2 rounded-xl px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 md:flex",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <>
                  <PanelLeftClose className="size-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>

            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl bg-slate-50/90 p-2",
                collapsed && "md:justify-center md:px-1"
              )}
              title={`${session?.user?.name ?? "Staff"} · ${roleLabel}`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#08163d] text-[11px] font-semibold text-white">
                {initialsFromSession(session?.user?.name, session?.user?.email)}
              </div>
              <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
                <p className="truncate text-xs font-semibold text-slate-900">
                  {session?.user?.name ?? "Staff"}
                </p>
                <p className="truncate text-[10px] text-slate-500">{roleLabel}</p>
                <p className="truncate text-[10px] text-slate-400">Kampala HQ · Active</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
