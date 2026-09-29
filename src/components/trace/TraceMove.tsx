import * as React from "react";
import { Check, HelpCircle, Info, Lightbulb } from "lucide-react";
import { ChoiceGroup } from "@/components/learning/ChoiceGroup";
import { LearningFeedback } from "@/components/learning/LearningFeedback";
import type { TraceCheckpoint } from "@/lib/trace";
import type { TraceEntry } from "@/stores/traceStore";
import { useTraceStoreApi } from "@/stores/traceStore";
import { cn } from "@/lib/utils";

export interface TraceMoveProps {
  checkpoint: TraceCheckpoint;
  entry: TraceEntry;
  /** 1-based position, for "Step 3 of 10". */
  position: number;
  total: number;
  className?: string;
}

const KIND_LABEL: Record<TraceCheckpoint["kind"], string> = {
  "choose-mid": "Choose mid",
  compare: "Compare",
  action: "Move boundary",
  partition: "Choose transition",
  "pair-sum": "Choose pointer move",
  "container-area": "Choose limiting wall",
  "trapped-water": "Choose bounded side",
  "palindrome-action": "Choose pointer action",
  "move-zeroes": "Choose output action",
  "remove-duplicates": "Choose prefix action",
  "three-sum": "Choose triplet action",
  "level-order": "Choose queue action",
  "bst-validation": "Choose bounds result",
  result: "Result",
};

/**
 * The one question the learner is answering right now.
 *
 * A wrong answer never advances the trace: the store records the attempt and
 * this card explains the misconception, so the learner-visible algorithm state
 * can never drift away from the canonical execution.
 *
 * `data-player-keys="off"` keeps the global playback shortcuts from stealing
 * Space and the arrow keys while focus is inside the options.
 */
export function TraceMove({
  checkpoint,
  entry,
  position,
  total,
  className,
}: TraceMoveProps): React.ReactElement {
  const storeApi = useTraceStoreApi();
  const feedbackRef = React.useRef<HTMLParagraphElement | null>(null);
  const q = checkpoint.question;
  const id = checkpoint.id;

  const status = entry.status;
  const selected = entry.selectedOptionId ?? null;
  const isCorrect = status === "correct";
  const isRevealed = status === "revealed";
  const isIncorrect = status === "incorrect";
  const resolved = isCorrect || isRevealed;

  React.useEffect(() => {
    if (isCorrect || isRevealed || isIncorrect) feedbackRef.current?.focus();
  }, [isCorrect, isRevealed, isIncorrect]);

  const feedback = resolved
    ? q.explanation
    : isIncorrect && selected
      ? (q.feedback[selected] ?? q.explanation)
      : null;

  const heading = resolved
    ? isCorrect
      ? "Correct"
      : "Answer revealed"
    : isIncorrect
      ? "Not quite"
      : KIND_LABEL[checkpoint.kind];

  const hints = q.hints.slice(0, entry.hintLevel);

  return (
    <section
      aria-labelledby={`trace-heading-${id}`}
      data-player-keys="off"
      data-trace-move={status}
      className={cn("flex min-h-0 flex-col gap-2 overflow-hidden", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {resolved ? (
            isCorrect ? (
              <Check
                aria-hidden="true"
                size={14}
                strokeWidth={1.8}
                className="text-accent-strong"
              />
            ) : (
              <Info aria-hidden="true" size={14} strokeWidth={1.5} className="text-slate" />
            )
          ) : (
            <HelpCircle aria-hidden="true" size={14} strokeWidth={1.5} className="text-primary" />
          )}
          <h3
            id={`trace-heading-${id}`}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate"
          >
            {heading}
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-soft">
          Step {position} of {total}
        </span>
      </div>

      <p className="font-sans text-[13px] leading-relaxed text-ink">{q.prompt}</p>

      {q.context.length > 0 ? (
        <p className="font-mono text-[11px] text-slate-soft">{q.context.join("  ·  ")}</p>
      ) : null}

      {resolved ? null : (
        <ChoiceGroup
          name={`trace-${id}`}
          labelledBy={`trace-heading-${id}`}
          choices={q.options}
          selectedId={selected}
          onSelect={(optionId) => storeApi.getState().select(id, optionId)}
        />
      )}

      {hints.length > 0 && !resolved ? (
        <ul className="flex flex-col gap-1 rounded-lg border border-hairline bg-paper px-3 py-2">
          {hints.map((hint, i) => (
            <li key={hint} className="flex items-start gap-1.5 font-sans text-[12px] text-slate">
              <Lightbulb
                aria-hidden="true"
                size={12}
                strokeWidth={1.6}
                className="mt-0.5 shrink-0 text-primary"
              />
              <span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-soft">
                  hint {i + 1}
                </span>{" "}
                {hint}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <LearningFeedback
        tone={isIncorrect ? "incorrect" : resolved ? "correct" : "neutral"}
        message={feedback}
        {...(isIncorrect ? { prefix: "Not quite." } : {})}
        ref={feedbackRef}
      />

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {resolved ? (
          <button
            type="button"
            onClick={() => storeApi.getState().continueFrom(id)}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 font-sans text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
          >
            {position >= total ? "Complete trace" : "Next step"}
          </button>
        ) : isIncorrect ? (
          <>
            <button
              type="button"
              onClick={() => storeApi.getState().retry(id)}
              className="inline-flex h-9 items-center rounded-lg border border-primary/30 bg-card px-4 font-sans text-[13px] font-medium text-primary transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => storeApi.getState().reveal(id, q.correctOptionId)}
              className="inline-flex h-9 items-center rounded-lg px-2 font-sans text-[12px] text-slate underline decoration-hairline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Show answer
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!selected}
              onClick={() => storeApi.getState().check(id, q.correctOptionId)}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 font-sans text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            >
              Check answer
            </button>
            {entry.hintLevel < 3 ? (
              <button
                type="button"
                onClick={() => storeApi.getState().nextHint(id)}
                className="inline-flex h-9 items-center rounded-lg border border-primary/30 bg-card px-3 font-sans text-[12px] font-medium text-primary transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {entry.hintLevel === 0 ? "Hint" : "Next hint"}
              </button>
            ) : null}
            {entry.hintLevel >= 2 ? (
              <button
                type="button"
                onClick={() => storeApi.getState().reveal(id, q.correctOptionId)}
                className="inline-flex h-9 items-center rounded-lg px-2 font-sans text-[12px] text-slate underline decoration-hairline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Show answer
              </button>
            ) : null}
          </>
        )}
      </div>

      <span className="sr-only">{q.accessiblePrompt}</span>
    </section>
  );
}

export default TraceMove;
