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
    <div className="min-h-screen w-full bg-slate-50">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
          collapsed ? "md:ml-[72px]" : "md:ml-[240px]"
        )}
      >
        <div className="sticky top-0 z-30 border-b border-transparent bg-slate-50/80 backdrop-blur-md">
          <div className="w-full px-4 md:px-5">
            <Topbar
              onMenuToggle={() => setMobileOpen(!mobileOpen)}
              isMenuOpen={mobileOpen}
            />
          </div>
        </div>
        <main className="flex-1 overflow-auto px-4 py-4 md:px-5 md:py-5">
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
