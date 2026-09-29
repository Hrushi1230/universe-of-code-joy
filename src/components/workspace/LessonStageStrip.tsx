import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Check, Dot } from "lucide-react";
import type { ReviewStageState } from "@/lib/algorithm-review";
import { cn } from "@/lib/utils";

export type LessonStage =
  | "concept"
  | "watch"
  | "visualize"
  | "predict"
  | "trace"
  | "code"
  | "solve"
  | "review";

const STAGES: Array<{ id: LessonStage; label: string }> = [
  { id: "concept", label: "Concept" },
  { id: "watch", label: "Watch" },
  { id: "visualize", label: "Visualize" },
  { id: "predict", label: "Predict" },
  { id: "trace", label: "Trace" },
  { id: "code", label: "Code" },
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
];

export interface LessonStageStripProps {
  /** The stage this screen is. */
  active: LessonStage;
  /** Question slug for the Solve stage; null disables it. */
  practiceSlug: string | null;
  /** Algorithm the Trace and Visualize links point at. */
  algorithmSlug?: string;
  /** Question whose Code/Solve/Trace/Review mappings are active. */
  problemSlug?: string;
  /** True when this algorithm has a hand-trace exercise; false keeps it inert. */
  traceAvailable?: boolean;
  /** Implementation challenge for the Code stage; null keeps the chip inert. */
  codeSlug?: string | null;
  /** True when that implementation challenge is already solved. */
  codeComplete?: boolean;
  /** True when the transfer challenge behind Solve is already solved. */
  solveComplete?: boolean;
  /** True when this algorithm has a curated recall set; false keeps Review inert. */
  reviewAvailable?: boolean;
  /**
   * Review's scheduling state, never a mastery claim: `due` shows a dot,
   * `reviewed` (graded today) and `scheduled` show a check.
   */
  reviewState?: ReviewStageState;
  className?: string;
}

/**
 * The learning-journey strip: Concept — Watch — Visualize — Predict — Trace —
 * Code — Solve — Review. Stages without their own screen yet render as inert
 * labels rather than dead links.
 */
export function LessonStageStrip({
  active,
  practiceSlug,
  algorithmSlug,
  problemSlug,
  traceAvailable = false,
  codeSlug = null,
  codeComplete = false,
  solveComplete = false,
  reviewAvailable = false,
  reviewState = "none",
  className,
}: LessonStageStripProps): React.ReactElement {
  return (
    <nav
      aria-label="Lesson stages"
      className={cn("flex items-center gap-1 overflow-hidden", className)}
    >
      {STAGES.map((stage) => {
        const isActive = stage.id === active;
        const base =
          "inline-flex h-7 shrink-0 items-center rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors";
        if (isActive) {
          return (
            <span
              key={stage.id}
              aria-current="step"
              className={cn(base, "bg-tint font-semibold text-primary")}
            >
              {stage.label}
            </span>
          );
        }
        /* Trace and Visualize are the same route with a different stage param,
           so the header, lesson context row and this strip never remount. */
        if (algorithmSlug && (stage.id === "trace" ? traceAvailable : stage.id === "visualize")) {
          return (
            <Link
              key={stage.id}
              to="/algorithms/$slug"
              params={{ slug: algorithmSlug }}
              search={(prev: Record<string, unknown>) => ({
                ...prev,
                ...(stage.id === "trace" ? { stage: "trace" as const } : { stage: undefined }),
              })}
              className={cn(base, "text-slate hover:bg-tint hover:text-ink")}
            >
              {stage.label}
            </Link>
          );
        }
        /* Code opens the existing implementation challenge, and shows a check
           once that challenge is actually solved — visiting is not completion. */
        if (stage.id === "code" && codeSlug) {
          return (
            <Link
              key={stage.id}
              to="/practice/$slug"
              params={{ slug: codeSlug }}
              search={{
                from: "lesson" as const,
                ...(algorithmSlug ? { algorithm: algorithmSlug } : {}),
                ...(problemSlug ? { problem: problemSlug } : {}),
                stage: "code" as const,
              }}
              className={cn(
                base,
                "gap-1.5",
                codeComplete
                  ? "text-primary hover:bg-tint"
                  : "text-slate hover:bg-tint hover:text-ink",
              )}
            >
              {stage.label}
              {codeComplete ? <Check aria-label="complete" size={12} strokeWidth={2.4} /> : null}
            </Link>
          );
        }
        /* Solve opens the transfer question — a different problem from Code —
           and shows a check only once that question is actually accepted. */
        if (stage.id === "solve" && practiceSlug) {
          return (
            <Link
              key={stage.id}
              to="/practice/$slug"
              params={{ slug: practiceSlug }}
              search={{
                from: "lesson" as const,
                ...(algorithmSlug ? { algorithm: algorithmSlug } : {}),
                ...(problemSlug ? { problem: problemSlug } : {}),
                stage: "solve" as const,
              }}
              className={cn(
                base,
                "gap-1.5",
                solveComplete
                  ? "text-primary hover:bg-tint"
                  : "text-slate hover:bg-tint hover:text-ink",
              )}
            >
              {stage.label}
              {solveComplete ? <Check aria-label="complete" size={12} strokeWidth={2.4} /> : null}
            </Link>
          );
        }
        /* Review opens the curated recall set. Its marker reports scheduling
           only — a dot when due now, a check once graded — never mastery. */
        if (stage.id === "review" && reviewAvailable && algorithmSlug) {
          const reviewed = reviewState === "reviewed" || reviewState === "scheduled";
          return (
            <Link
              key={stage.id}
              to="/review"
              search={{
                algorithm: algorithmSlug,
                ...(problemSlug ? { problem: problemSlug } : {}),
              }}
              className={cn(
                base,
                "gap-1",
                reviewState === "none"
                  ? "text-slate hover:bg-tint hover:text-ink"
                  : "text-primary hover:bg-tint",
              )}
            >
              {stage.label}
              {reviewState === "due" ? (
                <Dot aria-label="due for review" size={14} strokeWidth={4} />
              ) : reviewed ? (
                <Check aria-label="reviewed" size={12} strokeWidth={2.4} />
              ) : null}
            </Link>
          );
        }
        return (
          <span key={stage.id} className={cn(base, "text-slate-soft")}>
            {stage.label}
          </span>
        );
      })}
    </nav>
  );
}

export default LessonStageStrip;
