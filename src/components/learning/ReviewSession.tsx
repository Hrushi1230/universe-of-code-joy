import * as React from "react";
import { Check } from "lucide-react";
import { ChoiceGroup } from "@/components/learning/ChoiceGroup";
import { LearningFeedback } from "@/components/learning/LearningFeedback";
import type { ReviewItem } from "@/content/types";
import { outcomeFor, type ReviewOutcome } from "@/lib/algorithm-review";
import { cn } from "@/lib/utils";

export interface ReviewSessionProps {
  algorithmName: string;
  items: ReviewItem[];
  /** True when today's card was already graded: the session runs without scheduling. */
  practiceOnly: boolean;
  /** Called exactly once, when the last question has been resolved. */
  onComplete: (outcomes: ReviewOutcome[]) => void;
  /** Truthful next-review sentence, derived from the SRS card after grading. */
  nextReviewLabel: string | null;
  /** Rendered under the completion card — the route owns navigation. */
  footer?: React.ReactNode;
  className?: string;
}

interface Resolved {
  /** The recorded outcome once the question is closed, else null. */
  outcome: ReviewOutcome | null;
  wrongAttempts: number;
  revealed: boolean;
}

const FRESH: Resolved = { outcome: null, wrongAttempts: 0, revealed: false };

/**
 * The compact active-recall review session: one question at a time, answer
 * before explanation, one corrective sentence per wrong choice, and a single
 * outcome list handed back to the existing scheduler at the end.
 */
export function ReviewSession({
  algorithmName,
  items,
  practiceOnly,
  onComplete,
  nextReviewLabel,
  footer,
  className,
}: ReviewSessionProps): React.ReactElement {
  const [index, setIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [state, setState] = React.useState<Resolved>(FRESH);
  const [outcomes, setOutcomes] = React.useState<ReviewOutcome[]>([]);
  const [done, setDone] = React.useState(false);
  const feedbackRef = React.useRef<HTMLParagraphElement>(null);
  const reported = React.useRef(false);

  const item = items[index];
  const total = items.length;
  const closed = state.outcome !== null;

  /* The session result reaches the store once, no matter how the component
     re-renders or whether the learner navigates back afterwards. */
  React.useEffect(() => {
    if (!done || reported.current) return;
    reported.current = true;
    onComplete(outcomes);
  }, [done, onComplete, outcomes]);

  const close = (outcome: ReviewOutcome): void => {
    setState((s) => ({ ...s, outcome }));
    setOutcomes((prev) => [...prev, outcome]);
    requestAnimationFrame(() => feedbackRef.current?.focus());
  };

  const check = (): void => {
    if (!item || closed || !selected) return;
    const correct = selected === item.answerId;
    if (correct) {
      close(outcomeFor({ wrongAttempts: state.wrongAttempts, revealed: false, correct: true }));
      return;
    }
    const wrongAttempts = state.wrongAttempts + 1;
    setState((s) => ({ ...s, wrongAttempts }));
    if (wrongAttempts >= 2) {
      setState({ outcome: "incorrect", wrongAttempts, revealed: false });
      setOutcomes((prev) => [...prev, "incorrect"]);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } else {
      requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  };

  const reveal = (): void => {
    if (!item || closed) return;
    setState((s) => ({ ...s, revealed: true }));
    close("revealed");
  };

  const advance = (): void => {
    setSelected(null);
    setState(FRESH);
    if (index + 1 >= total) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  if (done || !item) {
    const firstTry = outcomes.filter((o) => o === "first-try").length;
    return (
      <section
        aria-labelledby="review-complete-heading"
        className={cn(
          "mx-auto w-full max-w-[560px] rounded-2xl border border-hairline bg-card px-4 py-7 text-center sm:px-8 sm:py-9",
          className,
        )}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tint">
          <Check className="h-7 w-7 text-primary" strokeWidth={2.2} />
        </span>
        <h1 id="review-complete-heading" className="mt-4 text-[22px] font-semibold text-ink">
          {algorithmName} review complete
        </h1>
        <p className="mt-2 font-mono text-[13px] text-slate">
          {firstTry} of {total} recalled on the first try.
        </p>
        {practiceOnly ? (
          <p className="mt-2 font-mono text-[12.5px] text-slate-soft">
            Already reviewed today — this run was practice, so the schedule is unchanged.
          </p>
        ) : nextReviewLabel ? (
          <p className="mt-2 font-mono text-[12.5px] text-primary">{nextReviewLabel}</p>
        ) : null}
        {footer ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{footer}</div>
        ) : null}
      </section>
    );
  }

  const chosen = selected ? item.choices.find((c) => c.id === selected) : undefined;
  const isCorrect = state.outcome === "first-try" || state.outcome === "retry";
  const message = closed
    ? isCorrect || state.outcome === "revealed" || state.outcome === "incorrect"
      ? isCorrect
        ? item.explanation
        : `The answer is “${item.choices.find((c) => c.id === item.answerId)?.label}”. ${item.explanation}`
      : null
    : state.wrongAttempts > 0
      ? `${chosen?.misconception ?? ""}${item.hint ? ` ${item.hint}` : ""}`.trim() || null
      : null;

  return (
    <section
      aria-labelledby="review-question-heading"
      className={cn(
        "mx-auto w-full max-w-[640px] rounded-2xl border border-hairline bg-card px-4 pb-6 pt-5 sm:px-7",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-tint px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.1em] text-primary">
          {item.kind}
        </span>
        <span className="font-mono text-[12.5px] text-slate">
          Review {index + 1} of {total}
        </span>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${Math.round(((index + (closed ? 1 : 0)) / total) * 100)}%` }}
        />
      </div>

      <h1
        id="review-question-heading"
        className="mt-4 font-sans text-[17px] font-semibold leading-[1.4] text-ink"
      >
        {item.prompt}
      </h1>

      {item.given.length > 0 && (
        <ul className="mt-3 space-y-0.5 rounded-xl border border-hairline bg-paper px-4 py-3">
          {item.given.map((line) => (
            <li key={line} className="font-mono text-[12.5px] text-ink">
              {line}
            </li>
          ))}
        </ul>
      )}

      <ChoiceGroup
        className="mt-4"
        name={`review-${item.id}`}
        labelledBy="review-question-heading"
        choices={item.choices}
        selectedId={selected}
        onSelect={setSelected}
        disabled={closed}
      />

      <LearningFeedback
        ref={feedbackRef}
        className="mt-3"
        tone={closed ? (isCorrect ? "correct" : "neutral") : "incorrect"}
        prefix={closed ? (isCorrect ? "Correct." : undefined) : "Not quite."}
        message={message}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        {closed ? (
          <button
            type="button"
            onClick={advance}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-6 font-sans text-[13.5px] font-medium text-primary-foreground hover:bg-primary-glow"
          >
            {index + 1 >= total ? "Finish review" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            onClick={check}
            disabled={!selected}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-6 font-sans text-[13.5px] font-medium text-primary-foreground hover:bg-primary-glow disabled:opacity-45"
          >
            Check answer
          </button>
        )}
        {!closed && state.wrongAttempts > 0 ? (
          <button
            type="button"
            onClick={reveal}
            className="font-sans text-[13px] text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            Show answer
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default ReviewSession;
