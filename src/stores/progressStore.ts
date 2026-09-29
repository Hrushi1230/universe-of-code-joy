import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAlgorithm } from "@/content/algorithms";
import { getLesson } from "@/content/lessons";
import { getProblem } from "@/content/problems";
import { levelFromXp } from "@/lib/xp";

export type AlgorithmStatus = "locked" | "new" | "watched" | "learning" | "practiced" | "mastered";

export type CodeLang = "js" | "ts" | "py";

export interface AlgorithmProgress {
  status: AlgorithmStatus;
  stepsWatched: number;
  lessonDone: boolean;
  quizScore: number | null;
  problemsSolved: string[];
  lastSeenISO: string;
  masteryPct: number;
}

export interface LessonProgress {
  completedAt: string | null;
  sectionIndex: number;
  quizScore: number | null;
}

export interface ProblemProgress {
  attempts: number;
  solvedAt: string | null;
  bestRuntimeMs: number | null;
  lastCode: Record<CodeLang, string>;
}

export interface ReviewCard {
  ease: number;
  intervalDays: number;
  dueISO: string;
  reps: number;
  lapses: number;
  /** Last time this card was graded — drives the daily review quest. */
  lastGradedISO?: string;
}

export interface QuestProgress {
  progress: number;
  claimedAt: string | null;
  periodKey: string;
}

export interface AchievementProgress {
  unlockedAt: string | null;
  progress: number;
}

export interface RewardTransaction {
  kind: "quest" | "achievement" | "shop";
  referenceId: string;
  amount: number;
  createdAt: string;
}

export interface ActivityRow {
  xp: number;
  minutes: number;
  steps: number;
  solved: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastActiveISO: string | null;
  freezesLeft: number;
}

export interface ProgressData {
  xp: number;
  level: number;
  streak: StreakState;
  algorithms: Record<string, AlgorithmProgress>;
  lessons: Record<string, LessonProgress>;
  problems: Record<string, ProblemProgress>;
  reviewCards: Record<string, ReviewCard>;
  quests: Record<string, QuestProgress>;
  achievements: Record<string, AchievementProgress>;
  rewardTransactions?: Record<string, RewardTransaction>;
  activity: Record<string, ActivityRow>;
  bookmarks: string[];
  activePathSlug: string | null;
}

export interface ProgressActions {
  awardXp: (amount: number, reason: string) => { leveledUp: boolean; newLevel: number };
  recordStepsWatched: (slug: string, n: number) => void;
  recordMinutes: (slug: string | null, minutes: number) => void;
  markLessonSection: (slug: string, i: number) => void;
  completeLesson: (slug: string, quizScore: number) => void;
  recordAttempt: (problemSlug: string, code: string, lang: CodeLang) => void;
  markSolved: (problemSlug: string, runtimeMs: number) => void;
  touchStreak: () => void;
  useFreeze: () => boolean;
  gradeCard: (cardId: string, grade: number) => void;
  setQuestProgress: (id: string, n: number, periodKey?: string) => void;
  claimQuest: (id: string) => void;
  unlockAchievement: (id: string, progress?: number) => void;
  claimQuestReward: (id: string, periodKey: string, progress: number, xp: number) => boolean;
  unlockAchievementReward: (id: string, progress: number, xp: number) => boolean;
  redeemReward: (
    transactionId: string,
    itemId: string,
    cost: number,
    freezesGranted?: number,
  ) => boolean;
  addFreeze: (n: number) => void;
  toggleBookmark: (slug: string) => void;
  setActivePath: (slug: string | null) => void;
  resetAll: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

/* ---------------- calendar helpers (LOCAL timezone, calendar days) ---------------- */

/** Local or explicit timezone 'YYYY-MM-DD' key for a date. */
export function dayKey(d: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${day}`;
  }
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole calendar days between two instants, using local or explicit timezone civil boundaries. */
export function calendarDaysBetween(fromISO: string, toDate: Date, timeZone?: string): number {
  const from = new Date(fromISO);
  if (Number.isNaN(from.getTime())) return Number.POSITIVE_INFINITY;
  const fromKey = dayKey(from, timeZone);
  const toKey = dayKey(toDate, timeZone);
  const [y1, m1, d1] = fromKey.split("-").map(Number);
  const [y2, m2, d2] = toKey.split("-").map(Number);
  const a = Date.UTC(y1!, m1! - 1, d1!);
  const b = Date.UTC(y2!, m2! - 1, d2!);
  return Math.round((b - a) / 86_400_000);
}

/* ---------------- mastery (always derived) ---------------- */

/**
 * How much of mastery each kind of evidence can account for. Activity alone
 * (watching, reading, one accepted submission) can never reach 100: the last
 * quarter is retention, which only successful later reviews can supply.
 */
export const MASTERY_WEIGHTS = {
  watched: 15,
  lesson: 20,
  quiz: 15,
  solved: 25,
  retention: 25,
} as const;

/** Successful review repetitions needed for full retention credit. */
export const MASTERY_RETENTION_REPS = 2;

export function computeMasteryPct(
  entry: {
    stepsWatched: number;
    lessonDone: boolean;
    quizScore: number | null;
    problemsSolved: string[];
  },
  card?: Pick<ReviewCard, "reps" | "lapses">,
): number {
  const watched = entry.stepsWatched > 0 ? MASTERY_WEIGHTS.watched : 0;
  const lesson = entry.lessonDone ? MASTERY_WEIGHTS.lesson : 0;
  const quiz = ((entry.quizScore ?? 0) / 100) * MASTERY_WEIGHTS.quiz;
  const solved = Math.min(entry.problemsSolved.length / 3, 1) * MASTERY_WEIGHTS.solved;
  const successfulReviews = card ? Math.max(0, Math.round(card.reps) - Math.round(card.lapses)) : 0;
  const retention =
    Math.min(successfulReviews / MASTERY_RETENTION_REPS, 1) * MASTERY_WEIGHTS.retention;
  return Math.round(Math.min(100, Math.max(0, watched + lesson + quiz + solved + retention)));
}

function statusFor(entry: AlgorithmProgress): AlgorithmStatus {
  if (entry.masteryPct >= 100) return "mastered";
  if (entry.problemsSolved.length > 0) return "practiced";
  if (entry.lessonDone) return "learning";
  if (entry.stepsWatched > 0) return "watched";
  return "new";
}

function blankAlgorithm(nowISO: string): AlgorithmProgress {
  return {
    status: "new",
    stepsWatched: 0,
    lessonDone: false,
    quizScore: null,
    problemsSolved: [],
    lastSeenISO: nowISO,
    masteryPct: 0,
  };
}

function blankProblem(): ProblemProgress {
  return {
    attempts: 0,
    solvedAt: null,
    bestRuntimeMs: null,
    lastCode: { js: "", ts: "", py: "" },
  };
}

const knownAlgorithm = (slug: string): boolean => Boolean(getAlgorithm(slug));
const knownLesson = (slug: string): boolean => Boolean(getLesson(slug));
const knownProblem = (slug: string): boolean => Boolean(getProblem(slug));

/* ---------------- default + seed ---------------- */

function emptyState(): ProgressData {
  return {
    xp: 0,
    level: 1,
    streak: { current: 0, longest: 0, lastActiveISO: null, freezesLeft: 2 },
    algorithms: {},
    lessons: {},
    problems: {},
    reviewCards: {},
    quests: {},
    achievements: {},
    rewardTransactions: {},
    activity: {},
    bookmarks: [],
    activePathSlug: null,
  };
}

/**
 * Deterministic pre-hydration snapshot. Identical on server and client, so UI that
 * reads persisted progress can render this until `useHydrated()` flips to true.
 */
export const baselineProgress: ProgressData = emptyState();

/* ---------------- store migration (v1 -> v2) ---------------- */

export function migrateProgressState(persisted: unknown, version: number): ProgressData {
  const base = emptyState();
  if (!persisted || typeof persisted !== "object") {
    return base;
  }

  const data = persisted as Record<string, unknown>;

  if (version < 2) {
    const xp = typeof data.xp === "number" && !Number.isNaN(data.xp) ? data.xp : base.xp;
    const level =
      typeof data.level === "number" && !Number.isNaN(data.level) ? data.level : levelFromXp(xp);
    const streak =
      data.streak && typeof data.streak === "object"
        ? { ...base.streak, ...(data.streak as Record<string, unknown>) }
        : base.streak;

    return {
      ...base,
      ...data,
      xp,
      level,
      streak: streak as StreakState,
      rewardTransactions:
        data.rewardTransactions && typeof data.rewardTransactions === "object"
          ? (data.rewardTransactions as Record<string, RewardTransaction>)
          : {},
    } as ProgressData;
  }

  if (version < 3) {
    const next = { ...base, ...data } as ProgressData;
    const legacySeedDetected =
      next.xp >= 4820 &&
      next.streak.current === 12 &&
      next.streak.longest === 21 &&
      Object.keys(next.activity).some((key) => key.startsWith("2025-03-"));

    if (legacySeedDetected) {
      next.xp = Math.max(0, next.xp - 4820);
      next.level = levelFromXp(next.xp);
      if (next.streak.lastActiveISO === null) next.streak = { ...base.streak };
      next.activity = Object.fromEntries(
        Object.entries(next.activity).filter(([key]) => !key.startsWith("2025-03-")),
      );
      next.algorithms = Object.fromEntries(
        Object.entries(next.algorithms).filter(
          ([, entry]) => entry.lastSeenISO !== "2024-09-03T00:00:00.000Z",
        ),
      );
      next.achievements = Object.fromEntries(
        Object.entries(next.achievements).filter(
          ([, entry]) => entry.unlockedAt !== "2024-09-03T00:00:00.000Z",
        ),
      );
    }
    next.rewardTransactions = next.rewardTransactions ?? {};
    return next;
  }

  return {
    ...base,
    ...data,
    rewardTransactions:
      data.rewardTransactions && typeof data.rewardTransactions === "object"
        ? (data.rewardTransactions as Record<string, RewardTransaction>)
        : {},
  } as ProgressData;
}

/* ---------------- store ---------------- */

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => {
      /** Upsert today's activity row on every mutation. */
      const touchActivity = (
        state: ProgressData,
        patch: Partial<ActivityRow> = {},
      ): Record<string, ActivityRow> => {
        const key = dayKey();
        const prev = state.activity[key] ?? { xp: 0, minutes: 0, steps: 0, solved: 0 };
        return {
          ...state.activity,
          [key]: {
            xp: prev.xp + (patch.xp ?? 0),
            minutes: prev.minutes + (patch.minutes ?? 0),
            steps: prev.steps + (patch.steps ?? 0),
            solved: prev.solved + (patch.solved ?? 0),
          },
        };
      };

      const updateAlgorithm = (
        slug: string,
        mutate: (entry: AlgorithmProgress) => AlgorithmProgress,
        activityPatch: Partial<ActivityRow> = {},
      ): void => {
        if (!knownAlgorithm(slug)) return;
        set((s) => {
          const nowISO = new Date().toISOString();
          const current = s.algorithms[slug] ?? blankAlgorithm(nowISO);
          const next = mutate({ ...current, problemsSolved: [...current.problemsSolved] });
          next.lastSeenISO = nowISO;
          next.masteryPct = computeMasteryPct(next, s.reviewCards[slug]);
          next.status = statusFor(next);
          return {
            algorithms: { ...s.algorithms, [slug]: next },
            activity: touchActivity(s, activityPatch),
          };
        });
      };

      return {
        ...emptyState(),

        awardXp: (amount, _reason) => {
          const delta = Number.isFinite(amount) ? Math.round(amount) : 0;
          const before = get().level;
          const xp = Math.max(0, get().xp + delta);
          const newLevel = levelFromXp(xp);
          set((s) => ({
            xp,
            level: newLevel,
            activity: touchActivity(s, { xp: Math.max(0, delta) }),
          }));
          return { leveledUp: newLevel > before, newLevel };
        },

        recordStepsWatched: (slug, n) => {
          const steps = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
          if (steps === 0) return;
          updateAlgorithm(slug, (e) => ({ ...e, stepsWatched: e.stepsWatched + steps }), { steps });
        },

        recordMinutes: (slug, minutes) => {
          const m = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
          if (m === 0) return;
          if (slug && knownAlgorithm(slug)) {
            updateAlgorithm(slug, (e) => e, { minutes: m });
            return;
          }
          set((s) => ({ activity: touchActivity(s, { minutes: m }) }));
        },

        markLessonSection: (slug, i) => {
          if (!knownLesson(slug)) return;
          const index = Number.isFinite(i) && i > 0 ? Math.round(i) : 0;
          set((s) => {
            const prev = s.lessons[slug] ?? {
              completedAt: null,
              sectionIndex: 0,
              quizScore: null,
            };
            return {
              lessons: {
                ...s.lessons,
                [slug]: { ...prev, sectionIndex: Math.max(prev.sectionIndex, index) },
              },
              activity: touchActivity(s),
            };
          });
        },

        completeLesson: (slug, quizScore) => {
          if (!knownLesson(slug)) return;
          const score = Math.min(100, Math.max(0, Math.round(quizScore || 0)));
          const lesson = getLesson(slug);
          set((s) => {
            const prev = s.lessons[slug] ?? {
              completedAt: null,
              sectionIndex: 0,
              quizScore: null,
            };
            return {
              lessons: {
                ...s.lessons,
                [slug]: {
                  completedAt: new Date().toISOString(),
                  sectionIndex: Math.max(prev.sectionIndex, (lesson?.sections.length ?? 1) - 1),
                  quizScore: score,
                },
              },
              activity: touchActivity(s),
            };
          });
          if (lesson) {
            updateAlgorithm(lesson.algorithmSlug, (e) => ({
              ...e,
              lessonDone: true,
              quizScore: Math.max(e.quizScore ?? 0, score),
            }));
          }
        },

        recordAttempt: (problemSlug, code, lang) => {
          if (!knownProblem(problemSlug)) return;
          set((s) => {
            const prev = s.problems[problemSlug] ?? blankProblem();
            return {
              problems: {
                ...s.problems,
                [problemSlug]: {
                  ...prev,
                  attempts: prev.attempts + 1,
                  lastCode: { ...prev.lastCode, [lang]: code },
                },
              },
              activity: touchActivity(s),
            };
          });
        },

        markSolved: (problemSlug, runtimeMs) => {
          if (!knownProblem(problemSlug)) return;
          const problem = getProblem(problemSlug);
          const ms = Number.isFinite(runtimeMs) ? Math.max(0, Math.round(runtimeMs)) : null;
          set((s) => {
            const prev = s.problems[problemSlug] ?? blankProblem();
            return {
              problems: {
                ...s.problems,
                [problemSlug]: {
                  ...prev,
                  solvedAt: prev.solvedAt ?? new Date().toISOString(),
                  bestRuntimeMs:
                    ms === null ? prev.bestRuntimeMs : Math.min(prev.bestRuntimeMs ?? ms, ms),
                },
              },
              activity: touchActivity(s, { solved: 1 }),
            };
          });
          if (problem) {
            updateAlgorithm(problem.algorithmSlug, (e) => ({
              ...e,
              problemsSolved: e.problemsSolved.includes(problemSlug)
                ? e.problemsSolved
                : [...e.problemsSolved, problemSlug],
            }));
          }
        },

        touchStreak: () => {
          set((s) => {
            const now = new Date();
            const nowISO = now.toISOString();
            const last = s.streak.lastActiveISO;
            if (!last) {
              const current = Math.max(1, s.streak.current || 1);
              return {
                streak: {
                  ...s.streak,
                  current,
                  longest: Math.max(s.streak.longest, current),
                  lastActiveISO: nowISO,
                },
                activity: touchActivity(s),
              };
            }
            const diff = calendarDaysBetween(last, now);
            if (diff <= 0) {
              return { activity: touchActivity(s) };
            }
            // Exactly one missed calendar day is repairable with a freeze.
            const freezeCovers = diff === 2 && s.streak.freezesLeft > 0;
            const current = diff === 1 || freezeCovers ? s.streak.current + 1 : 1;
            return {
              streak: {
                ...s.streak,
                current,
                longest: Math.max(s.streak.longest, current),
                lastActiveISO: nowISO,
                freezesLeft: freezeCovers ? s.streak.freezesLeft - 1 : s.streak.freezesLeft,
              },
              activity: touchActivity(s),
            };
          });
        },

        /** Repairs a single missed calendar day. Returns whether a freeze was spent. */
        useFreeze: () => {
          const s = get();
          if (s.streak.freezesLeft <= 0 || !s.streak.lastActiveISO) return false;
          const now = new Date();
          const diff = calendarDaysBetween(s.streak.lastActiveISO, now);
          if (diff !== 2) return false; // exactly one missed day
          set((st) => ({
            streak: {
              ...st.streak,
              freezesLeft: st.streak.freezesLeft - 1,
              lastActiveISO: new Date(now.getTime() - 86_400_000).toISOString(),
            },
            activity: touchActivity(st),
          }));
          return true;
        },

        gradeCard: (cardId, grade) => {
          if (!knownAlgorithm(cardId)) return;
          const g = Math.min(3, Math.max(0, Math.round(grade || 0)));
          set((s) => {
            const prev =
              s.reviewCards[cardId] ??
              ({
                ease: 2.5,
                intervalDays: 1,
                dueISO: new Date().toISOString(),
                reps: 0,
                lapses: 0,
              } as ReviewCard);
            const lapsed = g === 0;
            const ease = Math.min(
              3,
              Math.max(1.3, prev.ease + (g === 0 ? -0.2 : g === 1 ? -0.1 : g === 3 ? 0.1 : 0)),
            );
            const intervalDays = lapsed ? 1 : Math.max(1, Math.round(prev.intervalDays * ease));
            const due = new Date(Date.now() + intervalDays * 86_400_000).toISOString();
            const card: ReviewCard = {
              ease,
              intervalDays,
              dueISO: due,
              reps: prev.reps + 1,
              lapses: prev.lapses + (lapsed ? 1 : 0),
              lastGradedISO: new Date().toISOString(),
            };
            /* Retention is part of mastery, so a graded card re-derives the
               algorithm row it belongs to — never a duplicate mastery flag. */
            const entry = s.algorithms[cardId];
            const algorithms = entry
              ? {
                  ...s.algorithms,
                  [cardId]: (() => {
                    const next = { ...entry, masteryPct: computeMasteryPct(entry, card) };
                    return { ...next, status: statusFor(next) };
                  })(),
                }
              : s.algorithms;
            return {
              reviewCards: { ...s.reviewCards, [cardId]: card },
              algorithms,
              activity: touchActivity(s),
            };
          });
        },

        setQuestProgress: (id, n, periodKey) => {
          set((s) => {
            const prev = s.quests[id] ?? { progress: 0, claimedAt: null, periodKey: dayKey() };
            const key = periodKey ?? prev.periodKey;
            // A new period wipes the previous claim so the reward can be earned again.
            const claimedAt = key === prev.periodKey ? prev.claimedAt : null;
            return {
              quests: {
                ...s.quests,
                [id]: { progress: Math.max(0, Math.round(n || 0)), periodKey: key, claimedAt },
              },
              activity: touchActivity(s),
            };
          });
        },

        claimQuest: (id) => {
          set((s) => {
            const prev = s.quests[id];
            if (!prev || prev.claimedAt) return { activity: touchActivity(s) };
            return {
              quests: { ...s.quests, [id]: { ...prev, claimedAt: new Date().toISOString() } },
              activity: touchActivity(s),
            };
          });
        },

        unlockAchievement: (id, progress = 100) => {
          set((s) => {
            const prev = s.achievements[id];
            if (prev?.unlockedAt) return { activity: touchActivity(s) };
            return {
              achievements: {
                ...s.achievements,
                [id]: { unlockedAt: new Date().toISOString(), progress },
              },
              activity: touchActivity(s),
            };
          });
        },

        claimQuestReward: (id, periodKey, progress, xpAward) => {
          const transactionId = `quest:${id}:${periodKey}`;
          let claimed = false;
          set((s) => {
            const transactions = s.rewardTransactions ?? {};
            const previous = s.quests[id];
            if (
              transactions[transactionId] ||
              (previous?.periodKey === periodKey && Boolean(previous.claimedAt))
            ) {
              return {};
            }

            const amount = Number.isFinite(xpAward) ? Math.max(0, Math.round(xpAward)) : 0;
            const now = new Date().toISOString();
            const xp = s.xp + amount;
            claimed = true;
            return {
              xp,
              level: levelFromXp(xp),
              quests: {
                ...s.quests,
                [id]: {
                  progress: Math.max(0, Math.round(progress || 0)),
                  periodKey,
                  claimedAt: now,
                },
              },
              rewardTransactions: {
                ...transactions,
                [transactionId]: {
                  kind: "quest",
                  referenceId: id,
                  amount,
                  createdAt: now,
                },
              },
              activity: touchActivity(s, { xp: amount }),
            };
          });
          return claimed;
        },

        unlockAchievementReward: (id, progress, xpAward) => {
          const transactionId = `achievement:${id}`;
          let unlocked = false;
          set((s) => {
            const transactions = s.rewardTransactions ?? {};
            if (transactions[transactionId] || s.achievements[id]?.unlockedAt) return {};

            const amount = Number.isFinite(xpAward) ? Math.max(0, Math.round(xpAward)) : 0;
            const now = new Date().toISOString();
            const xp = s.xp + amount;
            unlocked = true;
            return {
              xp,
              level: levelFromXp(xp),
              achievements: {
                ...s.achievements,
                [id]: { unlockedAt: now, progress: Math.max(0, Math.round(progress || 0)) },
              },
              rewardTransactions: {
                ...transactions,
                [transactionId]: {
                  kind: "achievement",
                  referenceId: id,
                  amount,
                  createdAt: now,
                },
              },
              activity: touchActivity(s, { xp: amount }),
            };
          });
          return unlocked;
        },

        redeemReward: (transactionId, itemId, cost, freezesGranted = 0) => {
          let redeemed = false;
          set((s) => {
            const transactions = s.rewardTransactions ?? {};
            const price = Number.isFinite(cost) ? Math.max(0, Math.round(cost)) : 0;
            const freezes = Number.isFinite(freezesGranted)
              ? Math.max(0, Math.round(freezesGranted))
              : 0;
            if (
              !transactionId ||
              transactions[transactionId] ||
              s.xp < price ||
              (freezes > 0 && s.streak.freezesLeft >= 9)
            ) {
              return {};
            }

            const now = new Date().toISOString();
            const xp = s.xp - price;
            redeemed = true;
            return {
              xp,
              level: levelFromXp(xp),
              streak: {
                ...s.streak,
                freezesLeft: Math.min(9, s.streak.freezesLeft + freezes),
              },
              rewardTransactions: {
                ...transactions,
                [transactionId]: {
                  kind: "shop",
                  referenceId: itemId,
                  amount: -price,
                  createdAt: now,
                },
              },
            };
          });
          return redeemed;
        },

        addFreeze: (n) => {
          const count = Number.isFinite(n) ? Math.round(n) : 0;
          if (count === 0) return;
          set((s) => ({
            streak: {
              ...s.streak,
              freezesLeft: Math.max(0, Math.min(9, s.streak.freezesLeft + count)),
            },
          }));
        },

        toggleBookmark: (slug) => {
          if (!knownAlgorithm(slug)) return;
          set((s) => ({
            bookmarks: s.bookmarks.includes(slug)
              ? s.bookmarks.filter((b) => b !== slug)
              : [...s.bookmarks, slug],
            activity: touchActivity(s),
          }));
        },

        setActivePath: (slug) => {
          set((s) => ({ activePathSlug: slug, activity: touchActivity(s) }));
        },

        resetAll: () => {
          set({ ...emptyState() });
        },
      };
    },
    {
      name: "algora-progress",
      version: 4,
      migrate: migrateProgressState,
    },
  ),
);
