import * as React from "react";
import { MonitorPlay, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { TraceAlgorithmWorld } from "@/components/trace/TraceAlgorithmWorld";
import { TraceMove } from "@/components/trace/TraceMove";
import { TraceSummaryCard } from "@/components/trace/TraceSummaryCard";
import type { TraceExercise } from "@/content/trace-exercises";
import { useTraceSession } from "@/hooks/useTraceSession";
import type { TraceView } from "@/lib/trace";
import { cn } from "@/lib/utils";
import { useTraceStoreApi } from "@/stores/traceStore";

export interface TraceWorkspaceProps {
  exercise: TraceExercise | undefined;
  algoName: string;
  /** Implementation challenge the completion CTA opens; null hides it. */
  codeSlug?: string | null;
  algorithmSlug?: string;
  problemSlug?: string;
  className?: string;
}

/** Boundary names whose index differs between two learner-visible views. */
function movedBetween(prev: TraceView | null, next: TraceView): string[] {
  if (!prev) return [];
  if (prev.frame && next.frame) {
    const before = new Map(prev.frame.pointers.map((pointer) => [pointer.name, pointer.index]));
    return next.frame.pointers
      .filter((pointer) => before.get(pointer.name) !== pointer.index)
      .map((pointer) => pointer.name);
  }
  const moved: string[] = [];
  if (prev.low !== next.low) moved.push("lo");
  if (prev.high !== next.high) moved.push("hi");
  if (prev.mid !== next.mid && next.mid !== null) moved.push("mid");
  return moved;
}

/**
 * Trace Mode shell: the learner's algorithm world on the left, the single active
 * question on the right. Same column proportions as the guided workspace, but no
 * playback band — there is nothing to play, because the learner is the player.
 */
export function TraceWorkspace({
  exercise,
  algoName,
  codeSlug = null,
  algorithmSlug,
  problemSlug,
  className,
}: TraceWorkspaceProps): React.ReactElement {
  const storeApi = useTraceStoreApi();
  const { session, checkpoint, entry, view, progress, total, completed, hintsUsed, attempts } =
    useTraceSession(exercise);

  /* Emphasis follows the learner's own last committed change. */
  const prevViewRef = React.useRef<TraceView | null>(null);
  const moved = movedBetween(prevViewRef.current, view);
  React.useEffect(() => {
    prevViewRef.current = view;
  }, [view]);

  if (!exercise || !session) {
    return (
      <div className={cn("rounded-2xl border border-hairline bg-card shadow-sm", className)}>
        <EmptyState
          icon={MonitorPlay}
          title="Trace exercise coming soon"
          description={`We are still writing a hand-trace exercise for ${algoName}. The guided visualizer has everything else.`}
        />
      </div>
    );
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="grid min-h-0 flex-1 grid-cols-[58fr_42fr] gap-4">
        <TraceAlgorithmWorld
          session={session}
          view={view}
          movedPointers={moved}
          className="min-h-0"
        />

        <section
          aria-label="Trace it yourself"
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-hairline bg-card px-5 pb-4 pt-4 shadow-sm"
        >
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-[17px] font-semibold tracking-tight text-ink">
                {exercise.title}
              </h2>
              <p className="font-mono text-[11px] text-slate-soft">{exercise.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => storeApi.getState().restart()}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-card px-2.5 font-sans text-[12px] text-slate transition-colors hover:bg-tint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <RotateCcw aria-hidden="true" size={13} strokeWidth={1.6} />
              Restart
            </button>
          </div>

          {/* Progress through acknowledged learner steps, never through guided-player steps. */}
          <div className="shrink-0">
            <div
              role="progressbar"
              aria-label="Trace progress"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={progress}
              aria-valuetext={`${progress} of ${total} steps complete`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-paper"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {completed || !checkpoint ? (
              <TraceSummaryCard
                session={session}
                attempts={attempts}
                steps={total}
                hintsUsed={hintsUsed}
                onRestart={() => storeApi.getState().restart()}
                codeSlug={codeSlug}
                algorithmSlug={algorithmSlug}
                problemSlug={problemSlug}
                algoName={algoName}
              />
            ) : (
              <TraceMove
                checkpoint={checkpoint}
                entry={entry}
                position={progress + 1}
                total={total}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TraceWorkspace;
