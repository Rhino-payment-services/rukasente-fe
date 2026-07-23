"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Loader2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RunScoringResponse,
  useRunScoring,
} from "@/hooks/use-scoring";
import { scoringErrorMessage } from "@/lib/scoring-errors";

export { scoringErrorMessage } from "@/lib/scoring-errors";

type RunScoreDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initialRukapayUserId?: string;
  initialWalletId?: string;
  lockRukapayUserId?: boolean;
  borrowerLabel?: string | null;
};

export function RunScoreDialog({
  open,
  onOpenChange,
  initialRukapayUserId = "",
  initialWalletId = "",
  lockRukapayUserId = false,
  borrowerLabel,
}: RunScoreDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [rukapayUserId, setRukapayUserId] = useState(initialRukapayUserId);
  const [walletId, setWalletId] = useState(initialWalletId);
  const [result, setResult] = useState<RunScoringResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // Local pending flag — always cleared in finally so the button never sticks.
  const [isRunning, setIsRunning] = useState(false);
  const mutation = useRunScoring();
  const abortRef = useRef<AbortController | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setRukapayUserId(initialRukapayUserId);
    setWalletId(initialWalletId);
    setResult(null);
    setErrorMsg("");
    setIsRunning(false);
  }, [open, initialRukapayUserId, initialWalletId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsRunning(false);
        onOpenChangeRef.current(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.pointerEvents = "";
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function close() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
    onOpenChange(false);
  }

  async function handleRun() {
    const id = rukapayUserId.trim();
    if (!id) {
      setErrorMsg("RukaPay user ID is required.");
      return;
    }

    setErrorMsg("");
    setResult(null);
    setIsRunning(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await mutation.mutateAsync({
        rukapay_user_id: id,
        wallet_id: walletId.trim() || undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setResult(data);
      toast.success(
        `Score ${data.credit_score_result.total_score} · band ${data.credit_score_result.risk_band}`,
        {
          description: `Decision: ${String(
            data.credit_score_result.suggested_decision || ""
          ).replace(/_/g, " ")}`,
        }
      );
    } catch (err) {
      const message = scoringErrorMessage(err);
      if (!message) return; // canceled
      setErrorMsg(message);
      toast.error("Scoring failed", { description: message });
    } finally {
      setIsRunning(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  const score = result?.credit_score_result;

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-[1] flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white shadow-xl outline-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Run credit scoring
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {borrowerLabel
                ? `Re-run scoring for ${borrowerLabel}.`
                : "Trigger a fresh credit score for an enrolled borrower."}{" "}
              The borrower must be subscribed and have completed all consents.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={close}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              RukaPay user ID
            </label>
            <Input
              value={rukapayUserId}
              onChange={(e) => setRukapayUserId(e.target.value)}
              placeholder="e.g. 8e6c2a1b-..."
              readOnly={lockRukapayUserId}
              disabled={isRunning}
              className={lockRukapayUserId ? "bg-slate-50" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRunning) {
                  e.preventDefault();
                  void handleRun();
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              Wallet ID{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              placeholder="Leave empty for default scoring wallet"
              disabled={isRunning}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRunning) {
                  e.preventDefault();
                  void handleRun();
                }
              }}
            />
          </div>

          {errorMsg ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Scoring failed</p>
                <p className="mt-0.5 break-words text-rose-700">{errorMsg}</p>
              </div>
            </div>
          ) : null}

          {score ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Latest run
                </span>
                <Badge
                  variant={
                    score.suggested_decision === "eligible"
                      ? "success"
                      : score.suggested_decision === "under_review"
                        ? "warning"
                        : "danger"
                  }
                >
                  {String(score.suggested_decision || "").replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Score</p>
                  <p className="font-semibold text-slate-900">
                    {score.total_score}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Band</p>
                  <p className="font-semibold text-slate-900">
                    {score.risk_band}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Limit</p>
                  <p className="font-semibold text-slate-900">
                    {score.recommended_limit?.toLocaleString() ?? "—"}
                  </p>
                </div>
              </div>
              {score.reason_codes?.length ? (
                <p className="mt-2 text-xs text-slate-500">
                  Reasons: {score.reason_codes.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button variant="outline" type="button" onClick={close}>
            {isRunning ? "Cancel" : "Close"}
          </Button>
          <Button
            type="button"
            onClick={() => void handleRun()}
            disabled={isRunning || !rukapayUserId.trim()}
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="size-4" />
                {errorMsg || score ? "Run again" : "Run score"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
