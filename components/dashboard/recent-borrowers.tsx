"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactLoading } from "@/components/ui/loading";
import { useBorrowersList } from "@/hooks/use-borrowers";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  const s = status?.toUpperCase() ?? "";
  const ok = s === "ACTIVE" || s === "VERIFIED";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ok
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
          : "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/10"
      )}
    >
      {status || "—"}
    </span>
  );
}

export function RecentBorrowersPanel() {
  const { data, isLoading, isFetching, error, refetch } = useBorrowersList(1, 6);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-[#08163d]">Recent borrowers</h2>
          <p className="text-sm text-gray-500">Latest profiles from the API</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("size-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/borrowers">View all</Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8">
          <CompactLoading message="Loading borrowers..." />
        </div>
      )}

      {error && (
        <p className="p-6 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      {!isLoading && !error && data && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/95">
              <tr>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Name</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Phone</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">KYC</th>
                <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="hidden px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400 lg:table-cell">RukaPay user</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-10 text-center text-xs text-slate-500"
                  >
                    No borrowers yet.
                  </td>
                </tr>
              )}
              {data.items?.map((row) => (
                <tr
                  key={String(row.id)}
                  className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/90"
                >
                  <td className="px-3 py-2 text-[13px] font-semibold text-slate-900">
                    {String(row.full_name ?? "—")}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-600">
                    {String(row.phone ?? "—")}
                  </td>
                  <td className="px-3 py-2">
                    {statusBadge(String(row.kyc_status ?? ""))}
                  </td>
                  <td className="px-3 py-2">
                    {statusBadge(String(row.status ?? ""))}
                  </td>
                  <td className="hidden px-3 py-2 font-mono text-[11px] text-slate-500 lg:table-cell">
                    {String(row.rukapay_user_id ?? "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
