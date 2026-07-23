import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function ScoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scoring</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure credit scoring rules and review results. Rules define how
          each factor (KYC, transaction history, etc.) contributes to a
          borrower&apos;s credit score. Results, eligibility decisions and
          manual review cases are generated automatically when a borrower is
          scored.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Open one of the modules below to manage a specific part of scoring.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/credit-score/rules"
              className="rounded-md border border-border p-4 hover:bg-muted/40"
            >
              <h3 className="font-medium">Credit score rules</h3>
              <p className="text-sm text-muted-foreground">
                Create and adjust rules used to compute borrower scores.
              </p>
            </Link>
            <Link
              href="/scoring/results"
              className="rounded-md border border-border p-4 hover:bg-muted/40"
            >
              <h3 className="font-medium">Score results</h3>
              <p className="text-sm text-muted-foreground">
                View generated score outcomes and recommended limits.
              </p>
            </Link>
            <Link
              href="/scoring/eligibility"
              className="rounded-md border border-border p-4 hover:bg-muted/40"
            >
              <h3 className="font-medium">Eligibility decisions</h3>
              <p className="text-sm text-muted-foreground">
                See who qualified and why.
              </p>
            </Link>
            <Link
              href="/scoring/manual-review"
              className="rounded-md border border-border p-4 hover:bg-muted/40"
            >
              <h3 className="font-medium">Manual review cases</h3>
              <p className="text-sm text-muted-foreground">
                Resolve cases that need human review.
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
