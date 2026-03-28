"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactLoading } from "@/components/ui/loading";
import {
  useEligibilityDecisions,
  useManualReviewCases,
  useScoringResults,
  useScoringRules,
} from "@/hooks/use-scoring";

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-64">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ScoringPage() {
  const results = useScoringResults();
  const rules = useScoringRules();
  const manual = useManualReviewCases();
  const elig = useEligibilityDecisions();

  const sections = [
    { title: "Score results", q: results },
    { title: "Rules", q: rules },
    { title: "Manual review", q: manual },
    { title: "Eligibility decisions", q: elig },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Scoring</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(({ title, q }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {q.isLoading && <CompactLoading />}
              {q.error && (
                <p className="text-destructive text-sm">
                  {(q.error as Error).message}
                </p>
              )}
              {q.data !== undefined && <JsonPreview value={q.data} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
