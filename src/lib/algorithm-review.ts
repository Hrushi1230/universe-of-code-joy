/**
 * Active-recall review session logic.
 *
 * Pure functions over review content + the existing SRS card record: no React,
 * no store, no router. The session never invents a second scheduler — it turns a
 * set of per-question outcomes into one grade for `progressStore.gradeCard`,
 * which owns ease, interval and due date.
 */
import { getReviewItemsByAlgorithm, getReviewItemsByProblem } from "@/content/review-items";
import type { ReviewItem } from "@/content/types";
import type { ReviewCard } from "@/stores/progressStore";

/**
 * How the learner arrived at the right answer. Independent recall and a reveal
 * are deliberately not worth the same retention evidence.
 */
export type ReviewOutcome = "first-try" | "retry" | "revealed" | "incorrect";

/** The curated set for an algorithm; empty means the Review stage stays inert. */
export function reviewSetFor(algorithmSlug: string, problemSlug?: string): ReviewItem[] {
  return problemSlug
    ? getReviewItemsByProblem(problemSlug).filter((item) => item.algorithmSlug === algorithmSlug)
    : getReviewItemsByAlgorithm(algorithmSlug);
}

/** True when this algorithm has a review set at all. */
export function hasReviewSet(algorithmSlug: string, problemSlug?: string): boolean {
  return reviewSetFor(algorithmSlug, problemSlug).length > 0;
}

/**
 * Classifies one answered question.
 *
 * `wrongAttempts` counts submissions that were not the answer. A revealed answer
 * is never "correct" evidence, even when the learner then clicks the right row.
 */
export function outcomeFor(input: {
  wrongAttempts: number;
  revealed: boolean;
  correct: boolean;
}): ReviewOutcome {
  if (input.revealed) return "revealed";
  if (!input.correct) return "incorrect";
  return input.wrongAttempts === 0 ? "first-try" : "retry";
}

/** Retention weight of one outcome, 0…1. */
export function outcomeScore(outcome: ReviewOutcome): number {
  switch (outcome) {
    case "first-try":
      return 1;
    case "retry":
      return 0.6;
    case "revealed":
      return 0.2;
    case "incorrect":
      return 0;
  }
}

/**
 * The single SRS grade for a finished session, in the scheduler's existing
 * 0–3 vocabulary (Again / Hard / Good / Easy). One grade per session means one
 * card update — never one per question.
 */
export function sessionGrade(outcomes: readonly ReviewOutcome[]): number {
  if (outcomes.length === 0) return 0;
  const mean = outcomes.reduce((sum, o) => sum + outcomeScore(o), 0) / outcomes.length;
  if (mean >= 0.95) return 3;
  if (mean >= 0.75) return 2;
  if (mean >= 0.45) return 1;
  return 0;
}

/**
 * Successful review repetitions on a card: repetitions that were not lapses.
 * This is the only retention signal the persisted model actually has.
 */
export function retentionReps(card: Pick<ReviewCard, "reps" | "lapses"> | undefined): number {
  if (!card) return 0;
  return Math.max(0, Math.round(card.reps) - Math.round(card.lapses));
}

/** Whole days from now until a card is due; 0 when it is due now or overdue. */
export function daysUntilDue(card: Pick<ReviewCard, "dueISO">, now: Date = new Date()): number {
  const due = new Date(card.dueISO).getTime();
  if (Number.isNaN(due)) return 0;
  return Math.max(0, Math.ceil((due - now.getTime()) / 86_400_000));
}

/**
 * Truthful next-review sentence derived from the card the scheduler just wrote.
 * Never a guess: with no card there is nothing to promise.
 */
export function nextReviewLabel(
  card: Pick<ReviewCard, "dueISO"> | undefined,
  now: Date = new Date(),
): string | null {
  if (!card) return null;
  const days = daysUntilDue(card, now);
  if (days === 0) return "Due again today";
  if (days === 1) return "Next review in 1 day";
  return `Next review in ${days} days`;
}

/** True when this card was already graded during the current calendar day. */
export function gradedToday(
  card: Pick<ReviewCard, "lastGradedISO"> | undefined,
  now: Date = new Date(),
): boolean {
  if (!card?.lastGradedISO) return false;
  const last = new Date(card.lastGradedISO);
  if (Number.isNaN(last.getTime())) return false;
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

/** Whether a card is due for review at `now`. */
export function isDue(
  card: Pick<ReviewCard, "dueISO"> | undefined,
  now: Date = new Date(),
): boolean {
  if (!card) return false;
  const due = new Date(card.dueISO).getTime();
  return !Number.isNaN(due) && due <= now.getTime();
}

/**
 * The Review stage's state on the lesson strip.
 *
 * - `none` — no card yet: review has never been scheduled
 * - `due` — scheduled and due now
 * - `scheduled` — graded earlier, next review is in the future
 * - `reviewed` — graded today
 */
export type ReviewStageState = "none" | "due" | "scheduled" | "reviewed";

export function reviewStageState(
  card: ReviewCard | undefined,
  now: Date = new Date(),
): ReviewStageState {
  if (!card) return "none";
  if (gradedToday(card, now)) return "reviewed";
  return isDue(card, now) ? "due" : "scheduled";
}
