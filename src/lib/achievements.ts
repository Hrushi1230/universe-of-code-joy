/**
 * Achievement evaluation. Every badge is a pure function of `progressStore` data, so
 * unlocking is idempotent and can be re-derived at any time.
 */
import { getAlgorithm } from "@/content/algorithms";
import { getAchievements } from "@/content/achievements";
import { getLessons } from "@/content/lessons";
import { getPaths } from "@/content/paths";
import { getQuests } from "@/content/quests";
import type { Achievement } from "@/content/types";
import type { ProgressData } from "@/stores/progressStore";
import { levelFromXp } from "./xp";

export interface AchievementState {
  achievement: Achievement;
  current: number;
  target: number;
  pct: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

function lessonsDone(state: ProgressData): string[] {
  return Object.entries(state.lessons)
    .filter(([, l]) => Boolean(l.completedAt))
    .map(([slug]) => slug);
}

function categoryLessonProgress(state: ProgressData, category: string): [number, number] {
  const inCategory = getLessons().filter(
    (l) => getAlgorithm(l.algorithmSlug)?.category === category,
  );
  const done = inCategory.filter((l) => state.lessons[l.slug]?.completedAt).length;
  return [done, Math.max(1, inCategory.length)];
}

function pathsComplete(state: ProgressData): number {
  return getPaths().filter((p) => {
    const slugs = p.modules.flatMap((m) => m.itemSlugs);
    return slugs.length > 0 && slugs.every((s) => (state.algorithms[s]?.masteryPct ?? 0) >= 60);
  }).length;
}

function solvedProblems(state: ProgressData): string[] {
  return Object.entries(state.problems)
    .filter(([, p]) => Boolean(p.solvedAt))
    .map(([slug]) => slug);
}

/** `[current, target]` for one achievement. */
export function achievementCounter(
  achievement: Achievement,
  state: ProgressData,
): [number, number] {
  const done = lessonsDone(state);
  const solved = solvedProblems(state);
  const claimed = Object.entries(state.quests).filter(([, q]) => Boolean(q.claimedAt));
  const questTransactions = Object.values(state.rewardTransactions ?? {}).filter(
    (transaction) => transaction.kind === "quest",
  );
  const claimedOf = (kind: "daily" | "weekly") => {
    if (questTransactions.length > 0) {
      return questTransactions.filter(
        (transaction) => getQuests().find((q) => q.id === transaction.referenceId)?.kind === kind,
      ).length;
    }
    return claimed.filter(([id]) => getQuests().find((q) => q.id === id)?.kind === kind).length;
  };

  switch (achievement.id) {
    case "first-steps":
      return [done.length, 1];
    case "quick-learner":
      return [done.length, 5];
    case "scholar":
      return [done.length, 25];
    case "master-of-lessons":
      return [done.length, Math.max(1, getLessons().length)];
    case "first-blood":
      return [solved.length, 1];
    case "problem-solver":
      return [solved.length, 10];
    case "grinder":
      return [solved.length, 50];
    case "perfectionist":
      return [Object.values(state.problems).filter((p) => p.solvedAt && p.attempts <= 1).length, 1];
    case "speed-demon":
      return [
        Object.values(state.problems).filter((p) => p.solvedAt && p.bestRuntimeMs !== null).length,
        1,
      ];
    case "streak-3":
      return [state.streak.longest, 3];
    case "streak-7":
      return [state.streak.longest, 7];
    case "streak-30":
      return [state.streak.longest, 30];
    case "graph-explorer":
      return categoryLessonProgress(state, "graphs");
    case "sorting-savant":
      return categoryLessonProgress(state, "sorting");
    case "tree-hugger":
      return categoryLessonProgress(state, "trees");
    case "hash-master":
      return categoryLessonProgress(state, "hashing");
    case "path-finisher":
      return [pathsComplete(state), 1];
    case "path-collector":
      return [pathsComplete(state), Math.max(1, getPaths().length)];
    case "quiz-whiz":
      return [Object.values(state.lessons).filter((l) => (l.quizScore ?? 0) >= 100).length, 10];
    case "night-owl":
      return [nightOrEarly(state, "night"), 1];
    case "early-bird":
      return [nightOrEarly(state, "early"), 1];
    case "quest-champion":
      return [claimedOf("daily"), 20];
    case "weekly-warrior":
      return [claimedOf("weekly"), 10];
    case "level-10":
      return [levelFromXp(state.xp), 10];
    default:
      return [0, 1];
  }
}

function nightOrEarly(state: ProgressData, when: "night" | "early"): number {
  return Object.values(state.lessons).filter((l) => {
    if (!l.completedAt) return false;
    const h = new Date(l.completedAt).getHours();
    return when === "night" ? h >= 0 && h < 4 : h < 7;
  }).length;
}

/** Derived state for every achievement in the catalog. */
export function evaluateAchievements(state: ProgressData): AchievementState[] {
  return getAchievements().map((achievement) => {
    const [current, target] = achievementCounter(achievement, state);
    const stored = state.achievements[achievement.id];
    const reached = current >= target;
    return {
      achievement,
      current: Math.min(current, target),
      target,
      pct: Math.min(100, Math.round((current / target) * 100)),
      unlocked: reached || Boolean(stored?.unlockedAt),
      unlockedAt: stored?.unlockedAt ?? null,
    };
  });
}

/** Ids that are earned by the data but not yet recorded in the store. */
export function newlyUnlocked(state: ProgressData): string[] {
  return evaluateAchievements(state)
    .filter((a) => a.unlocked && !a.unlockedAt)
    .map((a) => a.achievement.id);
}
