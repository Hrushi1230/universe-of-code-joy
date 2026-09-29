import * as React from "react";
import { ArrayCanvas } from "@/components/viz/ArrayCanvas";
import { FrameView } from "@/components/viz/FrameView";
import type { TraceSession, TraceView } from "@/lib/trace";
import { traceFrame } from "@/lib/trace";
import { cn } from "@/lib/utils";

export interface TraceAlgorithmWorldProps {
  session: TraceSession;
  view: TraceView;
  /** Names of the boundaries the learner's last answer moved. */
  movedPointers?: readonly string[];
  className?: string;
}

/**
 * The learner's own algorithm world.
 *
 * Deliberately leaner than the guided panel: no narration, no reasoning layers,
 * no decision callouts and no counters. It renders ONLY state the learner has
 * already committed to, which is why `view` never carries a mid or a comparison
 * the learner has not answered yet.
 */
export function TraceAlgorithmWorld({
  session,
  view,
  movedPointers,
  className,
}: TraceAlgorithmWorldProps): React.ReactElement {
  const frame = React.useMemo(() => traceFrame(session, view), [session, view]);

  return (
    <section
      aria-label="Your trace"
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-card px-6 pb-5 pt-5 shadow-sm",
        className,
      )}
    >
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">
          Your trace
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-soft">
          you execute the steps
        </p>
      </div>

      <div className="relative mt-4 flex min-h-0 flex-1 flex-col justify-start gap-6 overflow-hidden pt-2">
        <div className="flex shrink-0 justify-center">
          {view.treeFrame ? (
            <FrameView frame={view.treeFrame} />
          ) : (
            <ArrayCanvas frame={frame} movedPointers={movedPointers} revealDecision={false} />
          )}
        </div>

        {/* The state table the learner is maintaining by hand. Values only —
            never the next value, and never the calculation that produces it. */}
        <dl className="mx-auto flex shrink-0 items-stretch gap-3">
          {(
            view.variables ?? [
              { label: "low", value: String(view.low) },
              { label: "mid", value: view.mid === null ? "—" : String(view.mid) },
              { label: "high", value: String(view.high) },
            ]
          ).map((cell) => (
            <div
              key={cell.label}
              className="min-w-[86px] rounded-xl border border-hairline bg-paper px-3 py-2 text-center"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-soft">
                {cell.label}
              </dt>
              <dd className="font-mono text-[16px] font-semibold text-ink">{cell.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default TraceAlgorithmWorld;
