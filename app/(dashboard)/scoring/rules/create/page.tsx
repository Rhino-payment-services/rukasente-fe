"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreRuleCreatePayload, useCreateScoringRule } from "@/hooks/use-scoring";

export default function CreateScoringRulePage() {
  const createRule = useCreateScoringRule();

  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState("threshold");
  const [weight, setWeight] = useState("1");
  const [metric, setMetric] = useState("kyc_outcome");
  const [operator, setOperator] = useState(">=");
  const [thresholdValue, setThresholdValue] = useState("0");
  const [minValue, setMinValue] = useState("0");
  const [maxValue, setMaxValue] = useState("100");
  const [outcome, setOutcome] = useState("approve");
  const [trueOutcome, setTrueOutcome] = useState("approve");
  const [falseOutcome, setFalseOutcome] = useState("manual_review");
  const [error, setError] = useState("");

  const impactText = useMemo(() => {
    const weightPct = `${(Number(weight || 0) * 100).toFixed(0)}%`;
    if (ruleType === "threshold") {
      return `This rule checks ${metric} ${operator} ${thresholdValue}. If true, it applies outcome "${outcome}" and contributes ${weightPct} of total score weight.`;
    }
    if (ruleType === "range") {
      return `This rule checks whether ${metric} is between ${minValue} and ${maxValue}. Matching records apply outcome "${outcome}" with weight contribution ${weightPct}.`;
    }
    return `This rule evaluates ${metric} as true/false. True -> "${trueOutcome}", False -> "${falseOutcome}", with weight contribution ${weightPct}.`;
  }, [
    weight,
    ruleType,
    metric,
    operator,
    thresholdValue,
    minValue,
    maxValue,
    outcome,
    trueOutcome,
    falseOutcome,
  ]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      let configJson: Record<string, unknown>;
      if (ruleType === "threshold") {
        configJson = {
          metric,
          operator,
          threshold: Number(thresholdValue),
          outcome,
        };
      } else if (ruleType === "range") {
        configJson = {
          metric,
          min: Number(minValue),
          max: Number(maxValue),
          outcome,
        };
      } else {
        configJson = {
          metric,
          true_outcome: trueOutcome,
          false_outcome: falseOutcome,
        };
      }

      const payload: ScoreRuleCreatePayload = {
        key: key.trim(),
        description: description.trim(),
        rule_type: ruleType.trim(),
        weight: Number(weight),
        config_json: configJson,
        is_active: true,
      };
      await createRule.mutateAsync(payload);
      window.location.href = "/scoring/rules";
    } catch (err) {
      setError((err as Error).message || "Failed to create scoring rule.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Create scoring rule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define a new rule and how much it should influence total credit score.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/scoring/rules">Back to rules</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Rule key (e.g. kyc_rejected_outcome)"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
              >
                <option value="threshold">threshold</option>
                <option value="range">range</option>
                <option value="boolean">boolean</option>
              </select>
            </div>
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Metric (e.g. kyc_score)"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              />
              <Input
                placeholder="Weight (e.g. 1)"
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            {ruleType === "threshold" && (
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                >
                  <option value=">=">{">="}</option>
                  <option value=">">{">"}</option>
                  <option value="<=">{"<="}</option>
                  <option value="<">{"<"}</option>
                  <option value="==">{"=="}</option>
                </select>
                <Input
                  placeholder="Threshold value"
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                />
                <Input
                  placeholder="Outcome (e.g. approve/manual_review)"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </div>
            )}
            {ruleType === "range" && (
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Min value"
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
                <Input
                  placeholder="Max value"
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
                <Input
                  placeholder="Outcome (e.g. approve/manual_review)"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </div>
            )}
            {ruleType === "boolean" && (
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Outcome if TRUE"
                  value={trueOutcome}
                  onChange={(e) => setTrueOutcome(e.target.value)}
                />
                <Input
                  placeholder="Outcome if FALSE"
                  value={falseOutcome}
                  onChange={(e) => setFalseOutcome(e.target.value)}
                />
              </div>
            )}
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-1">How this rule affects scoring</p>
              <p className="text-sm text-muted-foreground">{impactText}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={createRule.isPending}>
              {createRule.isPending ? "Creating..." : "Create rule"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
