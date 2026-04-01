"use client";

import { RefreshCw } from "lucide-react";
import { StatCard, StatCardsGrid } from "@/components/dashboard/stat-cards";
import { RecentBorrowersPanel } from "@/components/dashboard/recent-borrowers";
import { useSession } from "next-auth/react";
import { useMe } from "@/hooks/use-me";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Users, UserCircle, CreditCard, Plug } from "lucide-react";
import { Perm, hasPermission } from "@/lib/permissions";

export default function OverviewPage() {
  const { data: session } = useSession();
  const { data: me } = useMe();
  const {
    staffTotal,
    borrowersTotal,
    subscriptionsTotal,
    activeIntegrations,
    isLoading: statsLoading,
    isFetching: statsFetching,
  } = useDashboardStats();

  const canBorrowers = hasPermission(session?.user?.permissions, Perm.BorrowerView);

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#08163d] mb-1">Dashboard</h1>
          <p className="text-base text-gray-600">
            Managing{" "}
            <span className="font-semibold text-[#08163d]">
              Ruka Sente lending operations
            </span>
            {me?.full_name && (
              <span className="text-gray-500 font-normal">
                {" "}
                · {me.full_name}
              </span>
            )}
          </p>
        </div>
        {statsFetching && !statsLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
            Updating…
          </div>
        )}
      </div>

      <div className="relative">
        <StatCardsGrid>
          <StatCard
            title="Staff"
            value={staffTotal}
            subtitle="Team accounts"
            icon={Users}
            loading={statsLoading}
          />
          <StatCard
            title="Borrowers"
            value={borrowersTotal}
            subtitle="Borrower profiles"
            icon={UserCircle}
            loading={statsLoading}
          />
          <StatCard
            title="Subscriptions"
            value={subscriptionsTotal}
            subtitle="Ruka Sente subscriptions"
            icon={CreditCard}
            loading={statsLoading}
          />
          <StatCard
            title="Integrations"
            value={
              activeIntegrations === null
                ? null
                : `${activeIntegrations} active`
            }
            subtitle="API endpoints configured"
            icon={Plug}
            loading={statsLoading}
          />
        </StatCardsGrid>
      </div>

      {canBorrowers && (
        <div className="lg:col-span-2">
          <RecentBorrowersPanel />
        </div>
      )}
    </div>
  );
}
