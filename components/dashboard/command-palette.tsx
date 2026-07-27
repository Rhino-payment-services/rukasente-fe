"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  LineChart,
  Plug,
  WalletCards,
  Link2,
  FileText,
  Search,
} from "lucide-react";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { useClientMounted } from "@/lib/use-client-mounted";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "Overview" },
  { href: "/loan-applications", label: "Loan applications", icon: WalletCards, group: "Operations" },
  { href: "/loan-applications/new", label: "New loan application", icon: FileText, group: "Operations" },
  { href: "/loan-products", label: "Loan products", icon: WalletCards, group: "Operations" },
  { href: "/borrowers", label: "Borrowers", icon: UserCircle, group: "Operations" },
  { href: "/manual-borrower", label: "Manual borrower", icon: Link2, group: "Operations" },
  { href: "/staff", label: "Staff", icon: Users, group: "Management" },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard, group: "Management" },
  { href: "/scoring", label: "Scoring", icon: LineChart, group: "Analytics" },
  { href: "/scoring/results", label: "Score results", icon: FileText, group: "Analytics" },
  { href: "/scoring/eligibility", label: "Eligibility", icon: FileText, group: "Analytics" },
  { href: "/partners", label: "Partners", icon: Link2, group: "Integrations" },
  { href: "/integrations", label: "API endpoints", icon: Plug, group: "Integrations" },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useSidebar();
  const mounted = useClientMounted();

  if (!mounted || !commandOpen) return null;

  return (
    <Command.Dialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      label="Command menu"
      className="fixed inset-0 z-[100]"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => setCommandOpen(false)}
      />
      <div className="absolute left-1/2 top-[18%] w-[min(560px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3">
          <Search className="size-4 text-slate-400" />
          <Command.Input
            placeholder="Search pages, borrowers, actions…"
            className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-slate-500">
            No results found.
          </Command.Empty>
          {["Overview", "Operations", "Management", "Analytics", "System"].map((group) => {
            const items = LINKS.filter((l) => l.group === group);
            if (!items.length) return null;
            return (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400"
              >
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.href}`}
                      onSelect={() => {
                        setCommandOpen(false);
                        router.push(item.href);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-slate-700",
                        "data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                      )}
                    >
                      <Icon className="size-4 text-slate-400" />
                      {item.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            );
          })}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
