import * as React from "react";
import { ArrowRight } from "lucide-react";
import { PredictionGate } from "@/components/player/PredictionGate";
import { usePredictionGate } from "@/hooks/usePredictionGate";
import { deriveReasoning } from "@/lib/reasoning";
import { cn } from "@/lib/utils";
import { useCurrentStep, usePlayerStore } from "@/stores/playerStore";

export function ExplainPane({ className }: { className?: string }): React.ReactElement {
  const run = usePlayerStore((s) => s.run);
  const index = usePlayerStore((s) => s.index);
  const step = useCurrentStep();
  const goNext = usePlayerStore((s) => s.next);
  /* Prediction is interaction state, never execution state: the gate reads the
     same canonical index the reasoning does. */
  const { prediction, entry, showGate } = usePredictionGate();

  const prevStep = run && index > 0 ? (run.steps[index - 1] ?? null) : null;
  /* Reasoning is derived from the same canonical step the canvas, the variable
     board and the code pane read, so the panel can never disagree with them. */
  const reasoning = deriveReasoning(step, prevStep, index + 1);

  if (!run || !step || !reasoning) {
    return (
      <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
        <p className="t-body text-slate">Run the algorithm to see the explanation.</p>
      </div>
    );
  }

  const hasNextStep = index + 1 < run.steps.length;

  return (
    <div
      className={cn("flex flex-col rounded-xl border border-hairline bg-card shadow-sm", className)}
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="font-sans text-[14px] font-medium text-ink">Reasoning</h2>
        {/* Step counting is secondary information next to the reasoning itself. */}
        <span className="font-mono text-[11px] text-slate-soft">
          Step {index + 1} / {run.steps.length}
        </span>
      </div>

      {/* No aria-live here: the workspace already announces one concise summary
          per step, and four regions talking at once is unusable on autoplay. */}
      {/* Spacing, not type size, is what makes an ordinary run fit without a
          scrollbar — the DESIGN_SYSTEM type scale is untouched. */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden px-4 py-3">
        <div>
          <h3 className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
            What happened
          </h3>
          {/* Keyed on the step so only the text cross-fades — the panel stays put. */}
          <p
            key={`happened-${index}`}
            className="viz-swap font-sans text-[13px] leading-relaxed text-ink"
          >
            {reasoning.happened}
          </p>
        </div>

        {/* An open prediction checkpoint replaces Why / Invariant / Next entirely:
            each of those names the branch the learner is being asked to predict. */}
        {showGate && prediction ? (
          <PredictionGate prediction={prediction} entry={entry} />
        ) : (
          <>
            {reasoning.why ? (
              <div>
                <h3 className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                  Why
                </h3>
                {/* Why is the reasoning that matters most, so it keeps ink weight. */}
                <p
                  key={`why-${index}`}
                  className="viz-swap font-sans text-[13px] leading-relaxed text-ink"
                >
                  {reasoning.why}
                </p>
              </div>
            ) : null}

            {reasoning.invariant ? (
              <div>
                <h3 className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                  {reasoning.invariantLabel}
                </h3>
                <p
                  key={`invariant-${index}`}
                  className="viz-swap rounded-lg border border-primary/20 bg-tint px-3 py-2 font-sans text-[13px] leading-relaxed text-ink"
                >
                  {reasoning.invariant}
                </p>
              </div>
            ) : null}

            {/* Terminal steps have no Next: the section and its control both go
                away rather than offering a stale action. */}
            {reasoning.next && hasNextStep ? (
              <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2.5">
                <p
                  key={`next-${index}`}
                  className="min-w-0 flex-1 font-sans text-[12px] leading-relaxed text-slate"
                >
                  Next: {reasoning.next}
                </p>
                <button
                  type="button"
                  aria-label="Next step (→)"
                  onClick={goNext}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-card text-primary transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <ArrowRight size={16} strokeWidth={1.8} />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default ExplainPane;
