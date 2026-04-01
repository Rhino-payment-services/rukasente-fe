"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Topbar({
  onMenuToggle,
  isMenuOpen,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function handleLogout() {
    try {
      await apiClient.post("/admin/auth/logout");
    } catch {
      /* still sign out locally */
    }
    await signOut({ redirect: false });
    window.location.assign("/auth/login");
    toast.success("Signed out");
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["borrowers"] }),
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      ]);
      toast.success("Dashboard data refreshed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <header className="min-h-[56px] border-b border-gray-200 bg-white flex items-center justify-between gap-3 py-2.5 px-4 md:px-5 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={onMenuToggle}
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 justify-end flex-wrap shrink-0">
        <span className="text-sm text-gray-600 hidden sm:inline max-w-[min(100%,220px)] truncate">
          <span className="text-gray-500">Signed in as</span>{" "}
          <span className="font-medium text-gray-900">
            {session?.user?.email ?? session?.user?.name ?? "—"}
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </header>
  );
}
