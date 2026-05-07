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
      <div className="w-full min-h-screen bg-gray-50">
        <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="ml-64 flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 bg-white">
            <div className="mx-auto w-[95%] max-w-[2200px]">
              <Topbar
                onMenuToggle={() => setMobileOpen((o) => !o)}
                isMenuOpen={mobileOpen}
              />
            </div>
          </div>
          <main className="flex-1 overflow-auto py-6 px-6 md:px-10">
            <div className="mx-auto w-[95%] max-w-[2200px]">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
