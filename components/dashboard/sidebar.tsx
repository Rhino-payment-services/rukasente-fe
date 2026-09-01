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
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  X,
  Database,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Perm, hasPermission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useMe } from "@/hooks/use-me";
import { RukaPayLogoMark } from "@/components/brand/rukapay-logo-mark";
import { useSidebar } from "@/components/dashboard/sidebar-context";

type NavChild = {
  href: string;
  label: string;
  /** Prefer platform; allow partner.view for tenants. */
  platformOnly?: boolean;
  /** Strict: only when session.user.isPlatform. */
  requirePlatform?: boolean;
  /** Show when the staff user is linked to a tenant partner. */
  showWhenPartnerLinked?: boolean;
  perm?: string;
  anyOf?: string[];
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  perm?: string;
  anyOf?: string[];
  /** When true, require session.user.isPlatform (or listed perms). */
  platformOnly?: boolean;
  showWhenPartnerLinked?: boolean;
  badge?: string;
  children?: NavChild[];
};

type NavSection = { title: string; items: NavItem[] };

function buildSections(isPlatform: boolean): NavSection[] {
  const partnersLabel = isPlatform ? "Lending companies" : "Partners";
  return [
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
          perm: Perm.LoanApplicationView,
        },
        {
          href: "/loan-products",
          label: "Loan products",
          icon: WalletCards,
          perm: Perm.LoanProductView,
        },
        {
          href: "/borrowers",
          label: "Borrowers",
          icon: UserCircle,
          perm: Perm.BorrowerView,
        },
        {
          href: "/manual-borrower",
          label: "Manual borrower",
          icon: Link2,
          perm: Perm.BorrowerView,
        },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/staff", label: "Staff", icon: Users, perm: Perm.StaffView },
        {
          href: "/staff/add",
          label: "Add staff",
          icon: UserPlus,
          perm: Perm.StaffCreate,
        },
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
          anyOf: [
            Perm.ScoringView,
            Perm.ScoringRuleView,
            Perm.ManualReviewView,
            Perm.LoanScoreLimitView,
            Perm.EligibilityDecisionView,
          ],
          children: [
            {
              href: "/credit-score/rules",
              label: "Credit score rules",
              perm: Perm.ScoringRuleView,
            },
            {
              href: "/scoring/results",
              label: "Score results",
              perm: Perm.ScoringView,
            },
            {
              href: "/loan-score-limits",
              label: "Score loan limits",
              perm: Perm.LoanScoreLimitView,
            },
            {
              href: "/scoring/eligibility",
              label: "Eligibility",
              anyOf: [Perm.EligibilityDecisionView, Perm.EligibilityView],
            },
            {
              href: "/scoring/manual-review",
              label: "Manual review",
              perm: Perm.ManualReviewView,
            },
          ],
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          href: "/wallets",
          label: "Wallets",
          icon: WalletCards,
          perm: Perm.PartnerView,
        },
        {
          href: "/backups",
          label: "Backups",
          icon: Database,
          perm: Perm.BackupView,
          platformOnly: true,
        },
        {
          href: "/integrations",
          label: "Integrations",
          icon: Plug,
          anyOf: [
            Perm.PartnerView,
            Perm.IntegrationView,
            Perm.PlatformPartnerCreate,
          ],
          children: [
            {
              href: "/partners",
              label: partnersLabel,
              platformOnly: true,
            },
            {
              href: "/payment-providers",
              label: "Payment providers",
              requirePlatform: true,
            },
            {
              href: "/integrations",
              label: "API endpoints",
              anyOf: [Perm.IntegrationView, Perm.PartnerView],
            },
          ],
        },
      ],
    },
  ];
}

function isNavVisible(
  perms: string[],
  item: NavItem,
  isPlatform: boolean,
  partnerLinked: boolean
): boolean {
  if (item.platformOnly && !isPlatform) {
    return false;
  }
  if (item.showWhenPartnerLinked && partnerLinked) {
    return true;
  }
  if (item.anyOf?.length) return item.anyOf.some((k) => hasPermission(perms, k));
  if (item.perm) return hasPermission(perms, item.perm);
  return true;
}

function isChildVisible(
  child: NavChild,
  perms: string[],
  isPlatform: boolean
): boolean {
  if (child.requirePlatform) {
    if (!isPlatform) return false;
    return (
      hasPermission(perms, Perm.PlatformPartnerCreate) ||
      hasPermission(perms, Perm.PartnerCreate) ||
      hasPermission(perms, Perm.PartnerView) ||
      hasPermission(perms, Perm.IntegrationView)
    );
  }
  if (child.platformOnly) {
    return isPlatform;
  }
  if (child.anyOf?.length) {
    return child.anyOf.some((k) => hasPermission(perms, k));
  }
  if (child.perm) return hasPermission(perms, child.perm);
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
  const { permissions: perms, isPlatform, roles } = usePermissions();
  const { data: me } = useMe();
  const partnerLinked = Boolean(me?.partner_id);
  const sections = useMemo(() => buildSections(isPlatform), [isPlatform]);
  const { collapsed, toggleCollapsed, setCommandOpen } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const roleLabel = useMemo(() => {
    const name = roles[0]?.name;
    if (!name) return "Administrator";
    return String(name)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [roles]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-[#08163d] text-slate-200 transition-[width,transform] duration-300 ease-out",
          collapsed ? "md:w-[80px]" : "md:w-[272px]",
          "w-[272px]",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 border-b border-slate-200/80 bg-slate-100 px-4 py-3.5",
            collapsed && "md:justify-center md:px-2"
          )}
        >
          <Link
            href="/"
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          >
            <RukaPayLogoMark height={collapsed ? 26 : 36} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3.5 py-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={cn(
              "mb-5 flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 text-left text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200",
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
                "rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500",
                collapsed && "md:hidden"
              )}
            >
              ⌘K
            </kbd>
          </button>

          <nav className="flex-1 space-y-5 overflow-y-auto pb-3 scrollbar-thin">
            {sections.map((section) => {
              const visible = section.items
                .filter((i) => isNavVisible(perms, i, isPlatform, partnerLinked))
                .map((item) => ({
                  ...item,
                  children: item.children?.filter((c) =>
                    isChildVisible(c, perms, isPlatform)
                  ),
                }));
              if (!visible.length) return null;
              return (
                <div key={section.title}>
                  <div
                    className={cn(
                      "mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500",
                      collapsed && "md:hidden"
                    )}
                  >
                    {section.title}
                  </div>
                  <ul className="space-y-1">
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
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                                active
                                  ? "nav-active-pill"
                                  : "text-slate-300 hover:bg-white/8 hover:text-white",
                                collapsed && "md:justify-center md:px-0"
                              )}
                            >
                              <Icon className="size-4 shrink-0 opacity-90" />
                              <span className={cn("truncate", collapsed && "md:hidden")}>
                                {item.label}
                              </span>
                              <span className={cn("ml-auto", collapsed && "md:hidden")}>
                                {groupOpen ? (
                                  <ChevronDown className="size-3.5 opacity-70" />
                                ) : (
                                  <ChevronRight className="size-3.5 opacity-70" />
                                )}
                              </span>
                            </button>
                            {groupOpen && !collapsed ? (
                              <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
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
                                          "block rounded-lg px-2.5 py-1.5 text-[12px] transition-colors",
                                          isChildActive
                                            ? "bg-white/10 font-medium text-white"
                                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                              active
                                ? "nav-active-pill"
                                : "text-slate-300 hover:bg-white/8 hover:text-white",
                              collapsed && "md:justify-center md:px-0"
                            )}
                          >
                            <Icon className="size-4 shrink-0 opacity-90" />
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

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div
              className={cn(
                "rounded-2xl border border-white/10 bg-white/5 p-3",
                collapsed && "md:px-2 md:py-2.5"
              )}
              title={`${session?.user?.name ?? "Staff"} · ${roleLabel}`}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  collapsed && "md:justify-center"
                )}
              >
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-[11px] font-semibold text-white shadow-md">
                  {initialsFromSession(session?.user?.name, session?.user?.email)}
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#08163d] bg-emerald-400" />
                </div>
                <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
                  <p className="truncate text-xs font-semibold text-white">
                    {session?.user?.name ?? "Staff"}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {session?.user?.email ?? roleLabel}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Active
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "hidden h-9 w-full items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-400 transition hover:bg-white/8 hover:text-white md:flex",
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
          </div>
        </div>
      </aside>
    </>
  );
}
