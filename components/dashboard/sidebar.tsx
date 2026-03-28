"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  LineChart,
  Plug,
  BookOpen,
  Building2,
  X,
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
      { href: "/scoring", label: "Scoring", icon: LineChart, perm: Perm.ScoringView },
      {
        href: "/integrations",
        label: "Integrations",
        icon: Plug,
        perm: Perm.IntegrationView,
      },
      {
        href: "/catalog",
        label: "Roles & permissions",
        icon: BookOpen,
        anyOf: [Perm.RoleView, Perm.PermissionView],
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
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-white flex flex-col border-r border-gray-200 transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 pb-4 flex flex-col flex-1 min-h-0">
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
            className="mb-4 flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-600/30"
          >
            <RukaPayLogoMark size={48} className="shadow-sm rounded-lg" />
            <span className="text-2xl font-bold text-[#08163d] tracking-tight">
              Ruka Sente
            </span>
          </Link>

          <div className="mb-6 px-3 py-2.5 rounded-lg bg-main-50 border border-main-100">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-main-600 shrink-0" />
              <p className="text-xs font-medium text-main-600 uppercase tracking-wide">
                Console
              </p>
            </div>
            <p className="text-sm font-semibold text-[#08163d] truncate">
              Lending operations
            </p>
            <p className="text-xs text-main-600 mt-1">Staff admin</p>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
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
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-main-50 text-main-600 border border-main-200 shadow-sm"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 mr-3 shrink-0",
                              active ? "text-main-600" : "text-gray-500"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <span className="ml-auto w-2 h-2 bg-main-600 rounded-full shrink-0" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-main-600 flex items-center justify-center shrink-0 text-white text-sm font-semibold">
                {initialsFromSession(session?.user?.name, session?.user?.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name ?? "Staff"}
                </div>
                <div className="text-xs text-gray-500 truncate">
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
