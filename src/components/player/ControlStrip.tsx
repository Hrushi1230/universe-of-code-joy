import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore, useCanStepBack, useCanStepForward } from "@/stores/playerStore";
import { usePredictionGate } from "@/hooks/usePredictionGate";

import { SpeedControl } from "@/components/player/SpeedControl";

/**
 * The single compact playback row: transport controls on the left, an optional
 * centred slot (the phase timeline) and speed plus Next on the right. The canvas
 * gets the height, so this stays one row.
 */
export interface ControlStripProps {
  /** Rendered centred between the two control clusters — the phase timeline. */
  children?: React.ReactNode;
  className?: string;
}

export function ControlStrip({ children, className }: ControlStripProps): React.ReactElement {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const reset = usePlayerStore((s) => s.reset);
  const index = usePlayerStore((s) => s.index);
  const total = usePlayerStore((s) => s.run?.steps.length ?? 0);
  /* The semantic phase of the canonical current step — same source as the timeline. */
  const phaseLabel = usePlayerStore((s) => {
    const step = s.run?.steps[s.index];
    return step ? (step.timelineLabel ?? step.phase) : null;
  });
  const canBack = useCanStepBack();
  const canForward = useCanStepForward();
  /* An unresolved prediction checkpoint owns the forward action: the gate is the
     primary control, while Previous and Restart stay available. */
  const { isBlocking } = usePredictionGate();
  const isEnded = total > 0 && index >= total - 1;

  const side =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 font-sans text-[13px] font-medium text-ink transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <div
      className={cn("flex w-full flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-5", className)}
    >
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label="Previous step (←)"
          aria-disabled={!canBack}
          onClick={() => {
            if (canBack) prev();
          }}
          className={cn(side, "w-9 justify-center px-0")}
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label={`${isPlaying ? "Pause" : isEnded ? "Replay" : "Play"} (Space)`}
          aria-disabled={total === 0 || isBlocking}
          onClick={() => {
            if (total > 0 && !isBlocking) toggle();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 font-sans text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-40 sm:gap-2 sm:px-4"
        >
          {isPlaying ? (
            <Pause size={16} strokeWidth={2} />
          ) : isEnded ? (
            <RotateCcw size={16} strokeWidth={2} />
          ) : (
            <Play size={16} strokeWidth={2} />
          )}
          {isPlaying ? "Pause" : isEnded ? "Replay" : "Play"}
        </button>
        <button
          type="button"
          aria-label={isBlocking ? "Answer the prediction to continue" : "Next step (→)"}
          aria-disabled={!canForward || isBlocking}
          onClick={() => {
            if (canForward && !isBlocking) next();
          }}
          className={cn(side, "w-9 justify-center px-0")}
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          aria-label="Restart from the first step (R)"
          aria-disabled={total === 0}
          onClick={() => {
            if (total > 0) reset();
          }}
          className={cn(side, "w-9 justify-center px-0")}
        >
          <RotateCcw size={16} strokeWidth={1.5} />
        </button>
      </div>

      {children ? (
        <div className="order-3 flex min-w-0 basis-full justify-center sm:order-none sm:flex-1 sm:basis-auto">
          {children}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex shrink-0 items-center gap-4">
        {/* The phase is what the learner should remember; the number is context. */}
        <div className="flex flex-col items-end leading-tight">
          <span className="font-sans text-[13px] font-semibold text-ink">{phaseLabel ?? "—"}</span>
          <span className="font-mono text-[11px] tabular-nums text-slate-soft">
            {total === 0 ? "Step 0 of 0" : `Step ${index + 1} of ${total}`}
          </span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="font-sans text-[13px] font-medium text-slate">Speed</span>
          <SpeedControl />
        </div>
      </div>
    </div>
  );
}

export default ControlStrip;
