import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { MasteryRing } from "@/components/common/MasteryRing";
import { cn } from "@/lib/utils";
import type { Algorithm, Difficulty } from "@/content/types";

export interface LessonContextRowProps {
  heading: string;
  difficulty: Difficulty | undefined;
  estMinutes: number;
  complexity: string;
  masteryPct: number;
  practiceSlug: string | null;
  className?: string;
}

/**
 * One compact row of lesson context under the global nav — name, difficulty,
 * time, complexity, mastery — replacing the tall hero block so the workspace
 * keeps the vertical space for learning.
 */
export function LessonContextRow({
  heading,
  difficulty,
  estMinutes,
  complexity,
  masteryPct,
  practiceSlug,
  className,
}: LessonContextRowProps): React.ReactElement {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-3 sm:gap-4", className)}>
      <h1 className="min-w-0 flex-1 truncate font-display text-[19px] font-semibold tracking-tight text-ink sm:flex-none">
        {heading}
      </h1>
      {difficulty ? <DifficultyBadge difficulty={difficulty} /> : null}
      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-slate">
        <Clock size={13} strokeWidth={1.5} /> {estMinutes} min
      </span>
      <span className="font-mono text-[12px] text-slate">{complexity}</span>

      <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:justify-start sm:gap-4">
        <span className="inline-flex items-center gap-2 font-mono text-[12px] text-slate">
          Mastery
          <MasteryRing pct={masteryPct} />
        </span>
        <Link
          to="/practice/$slug"
          params={{ slug: practiceSlug ?? "" }}
          disabled={!practiceSlug}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-4 font-sans text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            practiceSlug
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "pointer-events-none cursor-default bg-primary/40 text-primary-foreground",
          )}
        >
          Practice <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

/** Convenience: the complexity label shown in the context row. */
export function averageComplexity(algo: Algorithm): string {
  return algo.timeAvg;
}

export default LessonContextRow;
