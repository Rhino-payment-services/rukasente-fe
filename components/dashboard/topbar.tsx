"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, LogOut, RefreshCw, ShieldCheck, Activity, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, clearCachedAccessToken } from "@/lib/api-client";
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
      await apiClient.post("/admin/auth/logout", {
        refresh_token: session?.refreshToken,
      });
    } catch {
      /* still sign out locally */
    }
    clearCachedAccessToken();
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
    <header className="bg-white px-4 py-3 md:px-5">
      <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
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
          <div className="hidden items-center gap-2 text-xs lg:flex">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
              <Coins className="size-3.5 text-amber-500" />
              <span>In-game economy</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
              <Activity className="size-3.5 text-indigo-500" />
              <span>Data analytics</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Security</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden max-w-[200px] truncate text-xs text-gray-600 sm:inline">
            {session?.user?.email ?? session?.user?.name ?? "—"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-gray-200 px-3 text-xs"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-8 gap-1.5 rounded-full border-gray-200 px-3 text-xs"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-main-100 text-xs font-semibold text-main-700">
            {(session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "U").toUpperCase()}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-0.5 text-xs lg:hidden">
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
          <Coins className="size-3.5 text-amber-500" />
          <span>In-game economy</span>
        </div>
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
          <Activity className="size-3.5 text-indigo-500" />
          <span>Data analytics</span>
        </div>
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>Security</span>
        </div>
      </div>
    </header>
  );
}
