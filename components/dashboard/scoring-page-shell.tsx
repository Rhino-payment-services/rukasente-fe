"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileSearch,
  Gauge,
  Scale,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SCORING_TABS = [
  {
    href: "/credit-score/rules",
    label: "Rules",
    hint: "How points are awarded",
  },
  {
    href: "/scoring/results",
    label: "Score results",
    hint: "Computed Ruka Scores",
  },
  {
    href: "/loan-score-limits",
    label: "Score limits",
    hint: "Score → max loan amount",
  },
  {
    href: "/scoring/eligibility",
    label: "Eligibility",
    hint: "Can they borrow?",
  },
  {
    href: "/scoring/manual-review",
    label: "Manual review",
    hint: "Staff decisions",
  },
] as const;

const PIPELINE = [
  {
    step: "1",
    title: "Score",
    body: "Wallet + KYC + history → Ruka Score",
    icon: Gauge,
  },
  {
    step: "2",
    title: "Decide",
    body: "Eligible, not eligible, or needs review",
    icon: Scale,
  },
  {
    step: "3",
    title: "Review",
    body: "Staff resolves borderline cases",
    icon: FileSearch,
  },
  {
    step: "4",
    title: "Lend",
    body: "Eligible borrowers can apply",
    icon: ClipboardCheck,
  },
] as const;

type ScoringPageShellProps = {
  title: string;
  description: string;
  activeStep?: "score" | "decide" | "review" | "lend";
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function ScoringPageShell({
  title,
  description,
  activeStep = "decide",
  children,
  actions,
}: ScoringPageShellProps) {
  const pathname = usePathname();
  const stepIndex =
    activeStep === "score"
      ? 0
      : activeStep === "decide"
        ? 1
        : activeStep === "review"
          ? 2
          : 3;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#08163d] via-[#0c2258] to-[#14306e] text-white shadow-sm">
        <div className="relative px-5 py-6 md:px-7 md:py-7">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
                <Sparkles className="size-3" />
                Credit scoring workflow
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-[1.7rem]">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-white/70">
                {description}
              </p>
            </div>
            {actions ? <div className="relative">{actions}</div> : null}
          </div>

          <div className="relative mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((item, i) => (
              <PipelineStep
                key={item.step}
                {...item}
                active={i === stepIndex}
                done={i < stepIndex}
              />
            ))}
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {SCORING_TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "min-w-[120px] flex-1 rounded-lg px-3 py-2 transition",
                active
                  ? "bg-[#08163d] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="text-xs font-semibold">{tab.label}</div>
              <div
                className={cn(
                  "text-[10px]",
                  active ? "text-white/70" : "text-slate-400"
                )}
              >
                {tab.hint}
              </div>
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

function PipelineStep({
  step,
  title,
  body,
  icon: Icon,
  active,
  done,
}: {
  step: string;
  title: string;
  body: string;
  icon: LucideIcon;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3 transition",
        active
          ? "border-white/30 bg-white/15"
          : done
            ? "border-white/10 bg-white/5"
            : "border-white/10 bg-black/10"
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
            active ? "bg-white text-[#08163d]" : "bg-white/15 text-white/80"
          )}
        >
          {step}
        </span>
        <Icon className="size-3.5 text-white/70" />
        <span className="text-xs font-semibold text-white">{title}</span>
      </div>
      <p className="text-[11px] leading-snug text-white/65">{body}</p>
    </div>
  );
}

export function ScoringStatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    default: "border-slate-200 bg-white",
    success: "border-emerald-200/80 bg-emerald-50/50",
    warning: "border-amber-200/80 bg-amber-50/50",
    danger: "border-rose-200/80 bg-rose-50/50",
    info: "border-sky-200/80 bg-sky-50/50",
  } as const;
  const valueTone = {
    default: "text-slate-900",
    success: "text-emerald-800",
    warning: "text-amber-800",
    danger: "text-rose-800",
    info: "text-sky-800",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3 shadow-sm", tones[tone])}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", valueTone[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ScoringExplainCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; body: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex gap-2.5 text-xs leading-relaxed">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#08163d]" />
            <div>
              <span className="font-medium text-slate-800">{item.label}</span>
              <span className="text-slate-500"> — {item.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Human-readable labels for eligibility / review statuses. */
export function explainEligibilityStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "eligible":
      return "Qualified to apply for loans";
    case "not_eligible":
      return "Not qualified for new loans right now";
    case "under_review":
      return "Waiting for a staff decision";
    case "pending":
      return "Decision not finalized yet";
    default:
      return status.replaceAll("_", " ");
  }
}

export function explainDecisionSource(source: string): string {
  switch (source.toLowerCase()) {
    case "system_score":
      return "Automatic from the score engine";
    case "supervisor_override":
      return "Staff decision after manual review";
    case "manual":
      return "Entered manually by staff";
    default:
      return source.replaceAll("_", " ") || "—";
  }
}

export function explainReasonCode(code: string): string {
  switch (code.toUpperCase()) {
    case "RULE_ENGINE_V1":
      return "Based on current credit score rules";
    case "MANUAL_REVIEW_APPROVED":
      return "Approved by staff in manual review";
    case "MANUAL_REVIEW_REJECTED":
      return "Rejected by staff in manual review";
    default:
      return code.replaceAll("_", " ") || "—";
  }
}

export function explainReviewStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "open":
      return "New — not yet claimed by a reviewer";
    case "in_review":
      return "A staff member is working this case";
    case "resolved":
      return "Closed with an approve / reject decision";
    default:
      return status.replaceAll("_", " ");
  }
}

export function shortId(id: string, size = 8) {
  if (!id) return "—";
  return id.length <= size ? id : `${id.slice(0, size)}…`;
}
