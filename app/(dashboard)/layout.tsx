"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="w-full min-h-screen flex bg-gray-50">
        <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <Topbar
              onMenuToggle={() => setMobileOpen((o) => !o)}
              isMenuOpen={mobileOpen}
            />
          </div>
          <main className="flex-1 px-4 py-4 md:px-5 md:py-6 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
