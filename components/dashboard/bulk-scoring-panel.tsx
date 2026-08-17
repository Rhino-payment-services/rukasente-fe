"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BulkRunResponse,
  useActiveBulkScoringRun,
  useBulkScoringFailures,
  useRetryBulkScoringFailures,
  useRunAllScoring,
} from "@/hooks/use-scoring";
import { toast } from "sonner";

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "running":
    case "queued":
      return "info";
    default:
      return "default";
  }
}

function ProgressGrid({ run }: { run: BulkRunResponse }) {
  const pct = run.progress_percent.toFixed(1);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Total" value={run.total} />
      <Metric label="Pending" value={run.pending} />
      <Metric label="Processing" value={run.processing} />
      <Metric label="Completed" value={run.completed} />
      <Metric label="Failed" value={run.failed} />
      <Metric label="Progress" value={`${pct}%`} />
      <Metric
        label="Status"
        value={
          <Badge variant={statusVariant(run.status)} className="capitalize">
            {run.status.replace(/_/g, " ")}
          </Badge>
        }
      />
      <Metric
        label="Started"
        value={
          run.started_at ? new Date(run.started_at).toLocaleString() : "—"
        }
      />
      {run.finished_at ? (
        <Metric
          label="Finished"
          value={new Date(run.finished_at).toLocaleString()}
        />
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
        {value}
      </div>
    </div>
  );
}

export function BulkScoringPanel({ canRun }: { canRun: boolean }) {
  const queryClient = useQueryClient();
  const { data: activeRun, isLoading } = useActiveBulkScoringRun(canRun);
  const runAll = useRunAllScoring();
  const retry = useRetryBulkScoringFailures();
  const failures = useBulkScoringFailures(
    activeRun && activeRun.failed > 0 ? activeRun.id : null
  );
  const prevCompleted = useRef<number | null>(null);

  useEffect(() => {
    if (!activeRun) return;
    if (
      prevCompleted.current !== null &&
      prevCompleted.current !== activeRun.completed
    ) {
      void queryClient.invalidateQueries({ queryKey: ["scoring-results"] });
    }
    prevCompleted.current = activeRun.completed;
  }, [activeRun, queryClient]);

  const bulkBusy =
    activeRun?.status === "queued" || activeRun?.status === "running";
  const showPanel = bulkBusy || (activeRun && activeRun.total > 0);

  async function handleRunAll() {
    try {
      const res = await runAll.mutateAsync();
      toast.success(`Bulk scoring started for ${res.total_jobs.toLocaleString()} borrowers`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not start bulk scoring";
      toast.error(msg);
    }
  }

  async function handleRetry() {
    if (!activeRun?.id) return;
    try {
      const res = await retry.mutateAsync(activeRun.id);
      toast.success(`Requeued ${res.retried_count} failed jobs`);
    } catch {
      toast.error("Could not retry failed jobs");
    }
  }

  return (
    <Card className="gap-0 border-slate-200 py-0 shadow-none">
      <CardContent className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Bulk scoring</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Queue credit scores for all borrowers. Processing runs in the background.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={!canRun || bulkBusy || runAll.isPending}
            onClick={() => void handleRunAll()}
          >
            {runAll.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Users className="size-4" />
            )}
            Run score for all users
          </Button>
        </div>

        {bulkBusy ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            A bulk scoring run is in progress. You cannot start another until it finishes.
          </div>
        ) : null}

        {isLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
        ) : showPanel && activeRun ? (
          <>
            <ProgressGrid run={activeRun} />
            {activeRun.failed > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-600">
                    Failed borrowers ({activeRun.failed})
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    disabled={retry.isPending}
                    onClick={() => void handleRetry()}
                  >
                    {retry.isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <RotateCw className="size-3" />
                    )}
                    Retry failed
                  </Button>
                </div>
                {failures.data?.items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50/95">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Borrower</th>
                          <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failures.data.items.map((row) => (
                          <tr key={row.job_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/90">
                            <td className="px-3 py-2 align-top">
                              <div className="font-medium text-slate-800">
                                {row.full_name || row.rukapay_user_id}
                              </div>
                              <div className="text-slate-500">{row.rukapay_user_id}</div>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{row.last_error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-slate-500">
            No bulk scoring run is active. Start one to refresh scores for every enrolled borrower.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
