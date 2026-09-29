import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { getAlgorithms } from "@/content/algorithms";
import { getLessons } from "@/content/lessons";
import { getProblems } from "@/content/problems";
import {
  dayKey,
  calendarDaysBetween,
  useProgressStore,
  migrateProgressState,
} from "@/stores/progressStore";
import type { ProgressData } from "@/stores/progressStore";
import { xpForLevel } from "@/lib/xp";

const store = useProgressStore;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
  store.getState().resetAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("streaks (local calendar days)", () => {
  it("same calendar day is a no-op", () => {
    store.getState().touchStreak();
    const first = store.getState().streak.current;
    vi.setSystemTime(new Date(2026, 0, 10, 22, 0, 0));
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(first);
  });

  it("23:50 then 00:10 next day increments", () => {
    vi.setSystemTime(new Date(2026, 0, 10, 23, 50, 0));
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(1);
    vi.setSystemTime(new Date(2026, 0, 11, 0, 10, 0));
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(2);
  });

  it("skipping two days resets to 1 and keeps longest", () => {
    store.getState().touchStreak();
    vi.setSystemTime(new Date(2026, 0, 11, 12, 0, 0));
    store.getState().touchStreak();
    vi.setSystemTime(new Date(2026, 0, 12, 12, 0, 0));
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(3);
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(1);
    expect(store.getState().streak.longest).toBe(3);
  });

  it("one missed day is covered by a freeze, and resets without one", () => {
    store.getState().touchStreak();
    vi.setSystemTime(new Date(2026, 0, 11, 12, 0, 0));
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(2);

    const freezes = store.getState().streak.freezesLeft;
    expect(freezes).toBeGreaterThan(0);
    vi.setSystemTime(new Date(2026, 0, 13, 12, 0, 0));
    store.getState().useFreeze();
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(3);
    expect(store.getState().streak.freezesLeft).toBe(freezes - 1);

    // burn remaining freezes, then a missed day must reset
    store.setState({ streak: { ...store.getState().streak, freezesLeft: 0 } });
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    store.getState().useFreeze();
    store.getState().touchStreak();
    expect(store.getState().streak.current).toBe(1);
  });
});

describe("xp and mastery", () => {
  it("awardXp reports leveledUp exactly on threshold crossings", () => {
    const threshold = xpForLevel(1);
    const first = store.getState().awardXp(threshold - 1, "test");
    expect(first.leveledUp).toBe(false);
    expect(first.newLevel).toBe(1);
    const second = store.getState().awardXp(1, "test");
    expect(second.leveledUp).toBe(true);
    expect(second.newLevel).toBe(2);
    const third = store.getState().awardXp(1, "test");
    expect(third.leveledUp).toBe(false);
  });

  it("masteryPct is 0 fresh, short of 100 on activity alone, and 100 with retention", () => {
    const lesson = getLessons()[0]!;
    const algoSlug = lesson.algorithmSlug;
    const related = getProblems().filter((p) => p.algorithmSlug === algoSlug);

    expect(store.getState().algorithms[algoSlug]).toBeUndefined();
    store.getState().recordStepsWatched(algoSlug, 5);
    store.getState().completeLesson(lesson.slug, 100);
    store.setState((s) => ({
      algorithms: {
        ...s.algorithms,
        [algoSlug]: {
          ...s.algorithms[algoSlug]!,
          problemsSolved: ["a", "b", "c"],
        },
      },
    }));
    store.getState().recordStepsWatched(algoSlug, 1); // re-derives masteryPct
    // Every stage completed once is "practiced", not "mastered": retention is missing.
    expect(store.getState().algorithms[algoSlug]!.masteryPct).toBe(75);
    expect(store.getState().algorithms[algoSlug]!.status).toBe("practiced");

    // Two successful reviews supply the retention quarter.
    store.getState().gradeCard(algoSlug, 3);
    store.getState().gradeCard(algoSlug, 3);
    expect(store.getState().algorithms[algoSlug]!.masteryPct).toBe(100);
    expect(store.getState().algorithms[algoSlug]!.status).toBe("mastered");
    expect(related.length).toBeGreaterThanOrEqual(0);

    const fresh = getAlgorithms().find((a) => a.slug !== algoSlug)!;
    store.getState().recordStepsWatched(fresh.slug, 0);
    expect(store.getState().algorithms[fresh.slug]).toBeUndefined();
  });
});

describe("idempotent local rewards", () => {
  it("credits one quest reward per quest period", () => {
    expect(store.getState().claimQuestReward("daily-xp", "2026-01-10", 100, 25)).toBe(true);
    expect(store.getState().claimQuestReward("daily-xp", "2026-01-10", 100, 25)).toBe(false);
    expect(store.getState().xp).toBe(25);
    expect(store.getState().quests["daily-xp"]?.claimedAt).toBeTruthy();
    expect(store.getState().rewardTransactions?.["quest:daily-xp:2026-01-10"]).toBeDefined();

    expect(store.getState().claimQuestReward("daily-xp", "2026-01-11", 100, 25)).toBe(true);
    expect(store.getState().xp).toBe(50);
  });

  it("records one XP award for an achievement", () => {
    expect(store.getState().unlockAchievementReward("first-steps", 100, 25)).toBe(true);
    expect(store.getState().unlockAchievementReward("first-steps", 100, 25)).toBe(false);
    expect(store.getState().xp).toBe(25);
    expect(store.getState().achievements["first-steps"]?.unlockedAt).toBeTruthy();
  });

  it("deduplicates a confirmed shop transaction and checks affordability", () => {
    store.setState({ xp: 400, level: 1 });
    expect(store.getState().redeemReward("shop:freeze:intent-1", "freeze", 200, 1)).toBe(true);
    expect(store.getState().redeemReward("shop:freeze:intent-1", "freeze", 200, 1)).toBe(false);
    expect(store.getState().xp).toBe(200);
    expect(store.getState().streak.freezesLeft).toBe(3);

    expect(store.getState().redeemReward("shop:freeze:intent-2", "freeze", 300, 1)).toBe(false);
    expect(store.getState().xp).toBe(200);
  });
});

describe("activity + unknown slugs", () => {
  it("every action upserts today and xp accumulates", () => {
    const key = dayKey();
    expect(store.getState().activity[key]).toBeUndefined();
    store.getState().awardXp(50, "a");
    expect(store.getState().activity[key]!.xp).toBe(50);
    store.getState().awardXp(25, "b");
    expect(store.getState().activity[key]!.xp).toBe(75);
    store.getState().toggleBookmark(getAlgorithms()[0]!.slug);
    store.getState().setActivePath(null);
    store.getState().recordStepsWatched(getAlgorithms()[0]!.slug, 4);
    expect(store.getState().activity[key]!.steps).toBe(4);
    expect(store.getState().activity[key]!.xp).toBe(75);
  });

  it("unknown slugs never create records", () => {
    store.getState().recordStepsWatched("not-a-real-algorithm", 5);
    store.getState().completeLesson("not-a-real-lesson", 100);
    store.getState().recordAttempt("not-a-real-problem", "x", "js");
    store.getState().markSolved("not-a-real-problem", 12);
    store.getState().gradeCard("not-a-real-algorithm", 3);
    store.getState().toggleBookmark("not-a-real-algorithm");
    expect(store.getState().algorithms["not-a-real-algorithm"]).toBeUndefined();
    expect(store.getState().lessons["not-a-real-lesson"]).toBeUndefined();
    expect(store.getState().problems["not-a-real-problem"]).toBeUndefined();
    expect(store.getState().reviewCards["not-a-real-algorithm"]).toBeUndefined();
    expect(store.getState().bookmarks).toHaveLength(0);
  });
});

describe("store migration v1 -> v2 (S5.8)", () => {
  it("upgrades a raw v1 JSON payload to v2 while preserving XP, level, and streak", () => {
    const rawV1Json = JSON.stringify({
      state: {
        xp: 2500,
        level: 3,
        streak: {
          current: 14,
          longest: 21,
          lastActiveISO: "2026-01-09T22:00:00.000Z",
          freezesLeft: 1,
        },
        algorithms: {
          "binary-search": {
            status: "mastered",
            stepsWatched: 15,
            lessonDone: true,
            quizScore: 100,
            problemsSolved: ["p1"],
            lastSeenISO: "2026-01-08T10:00:00.000Z",
            masteryPct: 100,
          },
        },
      },
      version: 1,
    });

    const parsed = JSON.parse(rawV1Json);
    const migrated = migrateProgressState(parsed.state, parsed.version);

    expect(migrated.xp).toBe(2500);
    expect(migrated.level).toBe(3);
    expect(migrated.streak.current).toBe(14);
    expect(migrated.streak.longest).toBe(21);
    expect(migrated.streak.lastActiveISO).toBe("2026-01-09T22:00:00.000Z");
    expect(migrated.streak.freezesLeft).toBe(1);
    expect(migrated.algorithms["binary-search"]?.status).toBe("mastered");

    expect(migrated.reviewCards).toEqual({});
    expect(migrated.quests).toEqual({});
    expect(migrated.achievements).toEqual({});
    expect(migrated.rewardTransactions).toEqual({});
    expect(migrated.bookmarks).toEqual([]);
  });

  it("handles corrupt or empty v1 payloads gracefully without losing defaults", () => {
    const corrupt = migrateProgressState(null, 1);
    expect(corrupt.xp).toBe(0);
    expect(corrupt.level).toBe(1);
    expect(corrupt.streak.current).toBe(0);
    expect(corrupt.streak.freezesLeft).toBe(2);
  });

  it("removes the legacy demo seed while preserving later local activity", () => {
    const migrated = migrateProgressState(
      {
        xp: 4870,
        level: 5,
        streak: { current: 12, longest: 21, lastActiveISO: null, freezesLeft: 2 },
        algorithms: {
          seeded: {
            status: "learning",
            stepsWatched: 24,
            lessonDone: false,
            quizScore: null,
            problemsSolved: [],
            lastSeenISO: "2024-09-03T00:00:00.000Z",
            masteryPct: 15,
          },
          "binary-search": {
            status: "learning",
            stepsWatched: 4,
            lessonDone: false,
            quizScore: null,
            problemsSolved: [],
            lastSeenISO: "2026-09-12T10:00:00.000Z",
            masteryPct: 15,
          },
        },
        activity: {
          "2025-03-01": { xp: 120, minutes: 35, steps: 0, solved: 1 },
          "2026-09-12": { xp: 50, minutes: 10, steps: 4, solved: 0 },
        },
        achievements: {},
      },
      2,
    );

    expect(migrated.xp).toBe(50);
    expect(migrated.activity["2025-03-01"]).toBeUndefined();
    expect(migrated.activity["2026-09-12"]?.xp).toBe(50);
    expect(migrated.algorithms["seeded"]).toBeUndefined();
    expect(migrated.algorithms["binary-search"]).toBeDefined();
  });
});

describe("multi-timezone streak evaluation (S4.8, S11.5/R-9)", () => {
  it("Asia/Kolkata (IST) at 01:00 — late night study does not break a 23-day streak", () => {
    const lastActiveISO = "2026-01-10T18:00:00.000Z";
    const currentSessionDate = new Date("2026-01-10T19:30:00.000Z");

    expect(dayKey(new Date(lastActiveISO), "Asia/Kolkata")).toBe("2026-01-10");
    expect(dayKey(currentSessionDate, "Asia/Kolkata")).toBe("2026-01-11");

    const diff = calendarDaysBetween(lastActiveISO, currentSessionDate, "Asia/Kolkata");
    expect(diff).toBe(1);

    const prevStreak = 23;
    const newStreak = diff === 1 ? prevStreak + 1 : 1;
    expect(newStreak).toBe(24);
  });

  it("Pacific/Auckland midnight edge — transitions cleanly across midnight", () => {
    const session1 = "2026-01-10T10:55:00.000Z";
    const session2 = new Date("2026-01-10T11:05:00.000Z");

    expect(dayKey(new Date(session1), "Pacific/Auckland")).toBe("2026-01-10");
    expect(dayKey(session2, "Pacific/Auckland")).toBe("2026-01-11");

    const diff = calendarDaysBetween(session1, session2, "Pacific/Auckland");
    expect(diff).toBe(1);
  });

  it("America/Los_Angeles (PST) evening study schedules remain stable across UTC date changes", () => {
    const day1 = "2026-01-11T05:00:00.000Z";
    const day2 = new Date("2026-01-12T04:00:00.000Z");

    expect(dayKey(new Date(day1), "America/Los_Angeles")).toBe("2026-01-10");
    expect(dayKey(day2, "America/Los_Angeles")).toBe("2026-01-11");

    const diff = calendarDaysBetween(day1, day2, "America/Los_Angeles");
    expect(diff).toBe(1);
  });
});
