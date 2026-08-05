"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { RequirePerm } from "@/components/auth/require-perm";
import { Perm, hasPermission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";

export default function ScoringPage() {
  const { permissions } = usePermissions();

  const links = [
    {
      href: "/credit-score/rules",
      title: "Credit score rules",
      description: "Create and adjust rules used to compute borrower scores.",
      perm: Perm.ScoringRuleView,
    },
    {
      href: "/scoring/results",
      title: "Score results",
      description: "View generated score outcomes and recommended limits.",
      perm: Perm.ScoringView,
    },
    {
      href: "/loan-score-limits",
      title: "Score loan limits",
      description: "Map score bands to maximum loan amounts.",
      perm: Perm.LoanScoreLimitView,
    },
    {
      href: "/scoring/eligibility",
      title: "Eligibility",
      description: "Review eligibility decisions from scoring.",
      anyOf: [Perm.EligibilityDecisionView, Perm.EligibilityView],
    },
    {
      href: "/scoring/manual-review",
      title: "Manual review",
      description: "Handle cases flagged for manual review.",
      perm: Perm.ManualReviewView,
    },
  ].filter((l) => {
    if (l.anyOf) return l.anyOf.some((k) => hasPermission(permissions, k));
    return hasPermission(permissions, l.perm!);
  });

  return (
    <RequirePerm
      anyOf={[
        Perm.ScoringView,
        Perm.ScoringRuleView,
        Perm.ManualReviewView,
        Perm.LoanScoreLimitView,
        Perm.EligibilityDecisionView,
        Perm.EligibilityView,
      ]}
      description="You need a scoring-related permission to open this section."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Scoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md border border-border p-4 hover:bg-muted/40"
                >
                  <h3 className="font-medium">{l.title}</h3>
                  <p className="text-sm text-muted-foreground">{l.description}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RequirePerm>
  );
}
