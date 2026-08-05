"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/dashboard/sidebar-context";
import { cn } from "@/lib/utils";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen w-full bg-[#f5f7fb]">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
          collapsed ? "md:ml-[80px]" : "md:ml-[272px]"
        )}
      >
        <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <div className="w-full px-4 md:px-6">
            <Topbar
              onMenuToggle={() => setMobileOpen(!mobileOpen)}
              isMenuOpen={mobileOpen}
            />
          </div>
        </div>
        <main className="flex-1 overflow-auto px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
    </AuthGuard>
  );
}
