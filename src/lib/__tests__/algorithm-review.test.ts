import { beforeEach, describe, expect, it } from "vitest";
import { getReviewItemsByAlgorithm, reviewItems } from "@/content/review-items";
import { validateReviewItem } from "@/content/schemas";
import {
  daysUntilDue,
  gradedToday,
  hasReviewSet,
  isDue,
  nextReviewLabel,
  outcomeFor,
  outcomeScore,
  retentionReps,
  reviewSetFor,
  reviewStageState,
  sessionGrade,
} from "@/lib/algorithm-review";
import {
  computeMasteryPct,
  MASTERY_RETENTION_REPS,
  useProgressStore,
  type ReviewCard,
} from "@/stores/progressStore";

function card(patch: Partial<ReviewCard> = {}): ReviewCard {
  return {
    ease: 2.5,
    intervalDays: 1,
    dueISO: new Date(0).toISOString(),
    reps: 0,
    lapses: 0,
    ...patch,
  };
}

describe("Binary Search review content (Phase 10)", () => {
  it("every review item satisfies the content schema", () => {
    for (const item of reviewItems) {
      const result = validateReviewItem(item);
      expect(result.success, `${item.id}: ${result.error?.message}`).toBe(true);
    }
  });

  it("covers each retention concept exactly once, with no duplicate prompts", () => {
    const set = getReviewItemsByAlgorithm("binary-search");
    expect(set.length).toBeGreaterThanOrEqual(4);
    expect(set.length).toBeLessThanOrEqual(6);
    expect(set.map((i) => i.kind).sort()).toEqual(
      ["boundary", "code", "concept", "midpoint", "pattern", "termination"].sort(),
    );
    expect(new Set(set.map((i) => i.prompt)).size).toBe(set.length);
    expect(new Set(set.map((i) => i.id)).size).toBe(set.length);
  });

  it("never leaks the answer through the given state", () => {
    for (const item of getReviewItemsByAlgorithm("binary-search")) {
      const answer = item.choices.find((c) => c.id === item.answerId)!;
      for (const line of item.given) {
        expect(line).not.toBe(answer.label);
      }
    }
  });

  it("resolves a set only for algorithms that have one", () => {
    expect(hasReviewSet("binary-search")).toBe(true);
    expect(hasReviewSet("dijkstra")).toBe(false);
    expect(reviewSetFor("dijkstra")).toEqual([]);
  });

  it("keeps Sort Colors and Two Sum review sets independent", () => {
    expect(reviewSetFor("two-pointers", "sort-colors")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "two-sum")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "container-with-most-water")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "trapping-rain-water")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "valid-palindrome")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "move-zeroes")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "remove-duplicates-from-sorted-array")).toHaveLength(6);
    expect(reviewSetFor("two-pointers", "three-sum")).toHaveLength(6);
    expect(reviewSetFor("level-order", "binary-tree-level-order")).toHaveLength(6);
    expect(reviewSetFor("binary-search", "two-sum")).toEqual([]);
    expect(hasReviewSet("two-pointers", "two-sum")).toBe(true);
  });
});

describe("Review answer outcomes", () => {
  it("distinguishes first try, retry, reveal and incorrect", () => {
    expect(outcomeFor({ wrongAttempts: 0, revealed: false, correct: true })).toBe("first-try");
    expect(outcomeFor({ wrongAttempts: 1, revealed: false, correct: true })).toBe("retry");
    expect(outcomeFor({ wrongAttempts: 1, revealed: true, correct: true })).toBe("revealed");
    expect(outcomeFor({ wrongAttempts: 2, revealed: false, correct: false })).toBe("incorrect");
  });

  it("never scores a reveal as independent recall", () => {
    expect(outcomeScore("first-try")).toBeGreaterThan(outcomeScore("retry"));
    expect(outcomeScore("retry")).toBeGreaterThan(outcomeScore("revealed"));
    expect(outcomeScore("revealed")).toBeGreaterThan(outcomeScore("incorrect"));
  });

  it("maps a session to one grade in the existing 0-3 vocabulary", () => {
    expect(sessionGrade([])).toBe(0);
    expect(sessionGrade(["first-try", "first-try", "first-try"])).toBe(3);
    expect(sessionGrade(["first-try", "first-try", "retry"])).toBe(2);
    expect(sessionGrade(["retry", "retry", "revealed"])).toBe(1);
    expect(sessionGrade(["incorrect", "incorrect", "revealed"])).toBe(0);
  });
});

describe("Review scheduling through the existing SRS", () => {
  beforeEach(() => {
    useProgressStore.getState().resetAll();
  });

  it("a successful session pushes the due date into the future and counts a rep", () => {
    useProgressStore
      .getState()
      .gradeCard("binary-search", sessionGrade(["first-try", "first-try"]));
    const next = useProgressStore.getState().reviewCards["binary-search"]!;
    expect(next.reps).toBe(1);
    expect(next.lapses).toBe(0);
    expect(new Date(next.dueISO).getTime()).toBeGreaterThan(Date.now());
    expect(gradedToday(next)).toBe(true);
  });

  it("a failed session resets the interval and records a lapse", () => {
    useProgressStore
      .getState()
      .gradeCard("binary-search", sessionGrade(["incorrect", "incorrect"]));
    const next = useProgressStore.getState().reviewCards["binary-search"]!;
    expect(next.intervalDays).toBe(1);
    expect(next.lapses).toBe(1);
    expect(retentionReps(next)).toBe(0);
  });

  it("grades one card per session, never one per question", () => {
    useProgressStore.getState().gradeCard("binary-search", 2);
    expect(Object.keys(useProgressStore.getState().reviewCards)).toEqual(["binary-search"]);
  });

  it("reports schedule state without claiming mastery", () => {
    expect(reviewStageState(undefined)).toBe("none");
    const now = new Date("2026-08-26T12:00:00.000Z");
    expect(reviewStageState(card({ dueISO: "2026-08-20T12:00:00.000Z" }), now)).toBe("due");
    expect(reviewStageState(card({ dueISO: "2026-09-02T12:00:00.000Z" }), now)).toBe("scheduled");
    expect(
      reviewStageState(
        card({ dueISO: "2026-09-02T12:00:00.000Z", lastGradedISO: now.toISOString() }),
        now,
      ),
    ).toBe("reviewed");
  });

  it("derives a truthful next-review label, or none at all", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    expect(nextReviewLabel(undefined, now)).toBeNull();
    expect(nextReviewLabel(card({ dueISO: "2026-08-25T12:00:00.000Z" }), now)).toBe(
      "Due again today",
    );
    expect(nextReviewLabel(card({ dueISO: "2026-08-27T12:00:00.000Z" }), now)).toBe(
      "Next review in 1 day",
    );
    expect(nextReviewLabel(card({ dueISO: "2026-09-01T12:00:00.000Z" }), now)).toBe(
      "Next review in 6 days",
    );
    expect(daysUntilDue(card({ dueISO: "not-a-date" }), now)).toBe(0);
    expect(isDue(undefined, now)).toBe(false);
  });
});

describe("Mastery requires retention, not activity alone", () => {
  const fullActivity = {
    stepsWatched: 40,
    lessonDone: true,
    quizScore: 100,
    problemsSolved: ["binary-search-classic", "search-insert-position", "koko-eating-bananas"],
  };

  it("opening the lesson does not move mastery", () => {
    expect(
      computeMasteryPct({
        stepsWatched: 0,
        lessonDone: false,
        quizScore: null,
        problemsSolved: [],
      }),
    ).toBe(0);
  });

  it("code and solve acceptance alone cannot reach mastered", () => {
    const pct = computeMasteryPct({
      stepsWatched: 30,
      lessonDone: true,
      quizScore: 100,
      problemsSolved: ["binary-search-classic", "search-insert-position"],
    });
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it("every stage completed once is still short of mastered", () => {
    expect(computeMasteryPct(fullActivity)).toBe(75);
  });

  it("one review is not permanent mastery; repeated successful reviews get there", () => {
    const one = computeMasteryPct(fullActivity, card({ reps: 1, lapses: 0 }));
    expect(one).toBeGreaterThan(75);
    expect(one).toBeLessThan(100);
    expect(computeMasteryPct(fullActivity, card({ reps: MASTERY_RETENTION_REPS, lapses: 0 }))).toBe(
      100,
    );
  });

  it("lapsed reviews do not count as retention evidence", () => {
    expect(computeMasteryPct(fullActivity, card({ reps: 4, lapses: 4 }))).toBe(75);
  });
});
