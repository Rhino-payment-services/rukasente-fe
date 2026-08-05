"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  LogOut,
  RefreshCw,
  Search,
  Bell,
  Plus,
  ChevronDown,
  User,
  CheckCheck,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, clearCachedAccessToken } from "@/lib/api-client";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") {
    return <XCircle className="size-3.5 shrink-0 text-rose-500" />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />;
  }
  return <Info className="size-3.5 shrink-0 text-sky-500" />;
}

export function Topbar({
  onMenuToggle,
  isMenuOpen,
}: {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setCommandOpen } = useSidebar();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useUnreadNotificationCount(!!session?.accessToken);
  const { data: inbox, isLoading: inboxLoading } = useNotifications({
    pageSize: 12,
    enabled: bellOpen && !!session?.accessToken,
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const initial = (
    session?.user?.name?.[0] ??
    session?.user?.email?.[0] ??
    "U"
  ).toUpperCase();

  useEffect(() => {
    if (!userOpen && !bellOpen) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (userOpen && userRef.current && !userRef.current.contains(target)) {
        setUserOpen(false);
      }
      if (bellOpen && bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userOpen, bellOpen]);

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
        queryClient.invalidateQueries({ queryKey: ["loan-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
      toast.success("Dashboard data refreshed");
    } finally {
      setRefreshing(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setCommandOpen(true);
      return;
    }
    window.location.assign(`/borrowers?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="flex min-h-[64px] w-full items-center gap-3 sm:gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
        onClick={onMenuToggle}
        aria-expanded={isMenuOpen}
        aria-label="Toggle menu"
      >
        <Menu className="size-5" />
      </Button>

      <form onSubmit={handleSearch} className="min-w-0 flex-1">
        <label className="relative block w-full max-w-xl">
          <span className="sr-only">Search</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search borrowers, loans, scores…"
            className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-16 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
          />
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600 sm:inline-flex"
          >
            ⌘K
          </button>
        </label>
      </form>

      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <span
          className="hidden max-w-[180px] truncate rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 sm:inline-block"
          title={
            session?.user?.isPlatform
              ? "RukaSente Platform"
              : session?.user?.partner?.name || "Tenant"
          }
        >
          {session?.user?.isPlatform
            ? "RukaSente Platform"
            : session?.user?.partner?.name || "—"}
        </span>

        <Button
          asChild
          size="sm"
          className="hidden h-10 rounded-xl bg-[#4f46e5] px-4 text-xs font-semibold text-white hover:bg-[#4338ca] xl:inline-flex"
        >
          <Link href="/loan-applications/new">
            <Plus className="size-3.5" />
            New application
          </Link>
        </Button>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh data"
          className="inline-flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </button>

        <div className="relative" ref={bellRef}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={bellOpen}
            onClick={() => {
              setBellOpen((v) => !v);
              setUserOpen(false);
            }}
            className="relative inline-flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4f46e5] px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>

          {bellOpen ? (
            <div className="absolute right-0 z-40 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Notifications
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {unread > 0 ? `${unread} unread` : "You're all caught up"}
                  </p>
                </div>
                {unread > 0 ? (
                  <button
                    type="button"
                    disabled={markAll.isPending}
                    onClick={() => markAll.mutate()}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </button>
                ) : null}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {inboxLoading ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">
                    Loading…
                  </p>
                ) : !inbox?.items?.length ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">
                    No notifications yet
                  </p>
                ) : (
                  inbox.items.map((n) => {
                    const href = n.link_path || "#";
                    return (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => {
                          if (!n.is_read) markRead.mutate(n.id);
                          setBellOpen(false);
                        }}
                        className={cn(
                          "flex gap-2.5 border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50",
                          !n.is_read && "bg-indigo-50/40"
                        )}
                      >
                        <SeverityIcon severity={n.severity} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "truncate text-xs text-slate-900",
                                !n.is_read ? "font-semibold" : "font-medium"
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {relativeTime(n.created_at)}
                            </span>
                          </div>
                          {n.body ? (
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
                              {n.body}
                            </p>
                          ) : null}
                        </div>
                        {!n.is_read ? (
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#4f46e5]" />
                        ) : null}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative ml-0.5" ref={userRef}>
          <button
            type="button"
            onClick={() => {
              setUserOpen((v) => !v);
              setBellOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:bg-slate-50"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-[#08163d] text-xs font-semibold text-white">
              {initial}
            </div>
            <div className="hidden min-w-0 flex-col items-start leading-tight md:flex">
              <span className="max-w-[160px] truncate text-xs font-semibold text-[#0f172a]">
                {session?.user?.name ?? "Admin"}
              </span>
              <span className="max-w-[160px] truncate text-[10px] text-slate-400">
                {session?.user?.email ?? "—"}
              </span>
            </div>
            <ChevronDown className="hidden size-3.5 text-slate-400 md:block" />
          </button>

          {userOpen ? (
            <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {session?.user?.name ?? "Admin"}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {session?.user?.email}
                </p>
              </div>
              <Link
                href="/staff"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <User className="size-3.5 opacity-70" />
                Staff management
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="size-3.5 opacity-70" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
