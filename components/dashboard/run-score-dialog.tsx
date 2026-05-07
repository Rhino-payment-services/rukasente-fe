"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Loader2, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RunScoringResponse,
  useRunScoring,
} from "@/hooks/use-scoring";

type RunScoreDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initialRukapayUserId?: string;
  initialWalletId?: string;
  // When true the rukapay user id field is read-only (re-run from a row).
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
  const [rukapayUserId, setRukapayUserId] = useState(initialRukapayUserId);
  const [walletId, setWalletId] = useState(initialWalletId);
  const [result, setResult] = useState<RunScoringResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const mutation = useRunScoring();

  // Reset local state every time the dialog is (re)opened, so a fresh target
  // populates the inputs and stale results/errors from a previous open are gone.
  useEffect(() => {
    if (open) {
      setRukapayUserId(initialRukapayUserId);
      setWalletId(initialWalletId);
      setResult(null);
      setErrorMsg("");
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleRun() {
    const id = rukapayUserId.trim();
    if (!id) {
      setErrorMsg("RukaPay user ID is required.");
      return;
    }
    setErrorMsg("");
    try {
      const data = await mutation.mutateAsync({
        rukapay_user_id: id,
        wallet_id: walletId.trim() || undefined,
      });
      setResult(data);
      toast.success(
        `Score ${data.credit_score_result.total_score} · band ${data.credit_score_result.risk_band}`,
        {
          description: `Decision: ${data.credit_score_result.suggested_decision.replace(
            /_/g,
            " "
          )}`,
        }
      );
    } catch (err) {
      const e = err as {
        response?: { data?: { error?: { message?: string } }; status?: number };
        message?: string;
      };
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.error?.message;
      const message =
        apiMsg ??
        (status === 401
          ? "Your session has expired. Please sign in again."
          : e?.message) ??
        "Failed to run scoring";
      setErrorMsg(message);
      toast.error("Scoring failed", { description: message });
    }
  }

  const score = result?.credit_score_result;
  const isPending = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Run credit scoring</DialogTitle>
          <DialogDescription>
            {borrowerLabel
              ? `Re-run scoring for ${borrowerLabel}.`
              : "Trigger a fresh credit score for an enrolled borrower."}{" "}
            The borrower must be subscribed and have completed all consents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">
              RukaPay user ID
            </label>
            <Input
              value={rukapayUserId}
              onChange={(e) => setRukapayUserId(e.target.value)}
              placeholder="e.g. 8e6c2a1b-..."
              readOnly={lockRukapayUserId}
              className={lockRukapayUserId ? "bg-slate-50" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  e.preventDefault();
                  void handleRun();
                }
              }}
            />
            <p className="text-xs text-slate-500">
              Required only when the borrower has multiple linked wallets and no
              default scoring wallet is set.
            </p>
          </div>

          {errorMsg ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMsg}</span>
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
                  {score.suggested_decision.replace(/_/g, " ")}
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

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleRun}
            disabled={isPending || !rukapayUserId.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="size-4" />
                Run score
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
