"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientMounted } from "@/lib/use-client-mounted";

export type ScoreResultFeedback =
  | {
      kind: "success";
      name: string;
      score: number;
      band: string;
      decision: string;
      limit?: number;
    }
  | { kind: "error"; name: string; message: string };

type ScoreResultModalProps = {
  feedback: ScoreResultFeedback | null;
  onClose: () => void;
};

/**
 * Lightweight portal modal (no Radix) for score success / failure.
 * Avoids focus-lock freezes seen with Dialog primitives.
 */
export function ScoreResultModal({ feedback, onClose }: ScoreResultModalProps) {
  const mounted = useClientMounted();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!feedback) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [feedback]);

  if (!mounted || !feedback) return null;

  const isError = feedback.kind === "error";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none"
      >
        <div
          className={
            isError
              ? "border-b border-rose-100 bg-gradient-to-br from-rose-50 to-white px-5 pb-5 pt-6"
              : "border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-5 pb-5 pt-6"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={
                  isError
                    ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600"
                    : "flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                }
              >
                {isError ? (
                  <AlertCircle className="size-5" />
                ) : (
                  <CheckCircle2 className="size-5" />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  {isError ? "Scoring failed" : "Score complete"}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {feedback.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {isError ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-500">
                What went wrong
              </p>
              <p className="mt-1.5 break-words text-sm leading-relaxed text-rose-900">
                {feedback.message}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Decision
                </span>
                <Badge
                  variant={
                    feedback.decision === "eligible"
                      ? "success"
                      : feedback.decision === "under review"
                        ? "warning"
                        : "danger"
                  }
                >
                  {feedback.decision}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                    {feedback.score}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Band
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {feedback.band}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Limit
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                    {feedback.limit != null
                      ? feedback.limit.toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button type="button" onClick={onClose} className="min-w-[96px]">
            {isError ? "Close" : "Done"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
