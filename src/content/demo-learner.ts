import type { Category } from "./types";
import { levelFromXp, xpForLevel } from "@/lib/xp";

export interface DailyActivity {
  date: string;
  xpEarned: number;
  lessonsCompleted: number;
  problemsSolved: number;
  minutesActive: number;
}

export interface DemoLearner {
  handle: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  longestStreak: number;
  joinedAt: string;
  mastery: Record<Category, number>;
  achievementIds: string[];
  activity: DailyActivity[];
}

export type MockUser = DemoLearner;

const DEMO_XP = 4820;
const DEMO_LEVEL = levelFromXp(DEMO_XP);
const DEMO_XP_TO_NEXT = xpForLevel(DEMO_LEVEL);

export const demoLearner: DemoLearner = {
  handle: "local_learner",
  name: "Local Learner",
  level: DEMO_LEVEL,
  xp: DEMO_XP,
  xpToNextLevel: DEMO_XP_TO_NEXT,
  streak: 12,
  longestStreak: 21,
  joinedAt: "2024-09-03T00:00:00.000Z",
  mastery: {
    arrays: 82,
    strings: 64,
    "linked-lists": 58,
    "stacks-queues": 71,
    trees: 45,
    heaps: 33,
    hashing: 60,
    graphs: 28,
    sorting: 90,
    searching: 88,
    greedy: 15,
    dp: 10,
    backtracking: 12,
    "bit-manipulation": 20,
    math: 40,
  },
  achievementIds: [
    "first-steps",
    "quick-learner",
    "first-blood",
    "streak-3",
    "streak-7",
    "perfectionist",
    "sorting-savant",
  ],
  activity: [
    {
      date: "2025-03-01",
      xpEarned: 120,
      lessonsCompleted: 2,
      problemsSolved: 1,
      minutesActive: 35,
    },
    { date: "2025-03-02", xpEarned: 90, lessonsCompleted: 1, problemsSolved: 1, minutesActive: 28 },
    { date: "2025-03-03", xpEarned: 0, lessonsCompleted: 0, problemsSolved: 0, minutesActive: 0 },
    {
      date: "2025-03-04",
      xpEarned: 150,
      lessonsCompleted: 2,
      problemsSolved: 2,
      minutesActive: 42,
    },
    { date: "2025-03-05", xpEarned: 60, lessonsCompleted: 1, problemsSolved: 0, minutesActive: 18 },
    {
      date: "2025-03-06",
      xpEarned: 200,
      lessonsCompleted: 2,
      problemsSolved: 3,
      minutesActive: 55,
    },
    {
      date: "2025-03-07",
      xpEarned: 110,
      lessonsCompleted: 1,
      problemsSolved: 1,
      minutesActive: 30,
    },
    { date: "2025-03-08", xpEarned: 0, lessonsCompleted: 0, problemsSolved: 0, minutesActive: 0 },
    {
      date: "2025-03-09",
      xpEarned: 175,
      lessonsCompleted: 2,
      problemsSolved: 2,
      minutesActive: 48,
    },
    {
      date: "2025-03-10",
      xpEarned: 130,
      lessonsCompleted: 1,
      problemsSolved: 2,
      minutesActive: 36,
    },
    { date: "2025-03-11", xpEarned: 95, lessonsCompleted: 1, problemsSolved: 1, minutesActive: 25 },
    {
      date: "2025-03-12",
      xpEarned: 210,
      lessonsCompleted: 3,
      problemsSolved: 2,
      minutesActive: 60,
    },
    { date: "2025-03-13", xpEarned: 80, lessonsCompleted: 1, problemsSolved: 0, minutesActive: 20 },
    { date: "2025-03-14", xpEarned: 0, lessonsCompleted: 0, problemsSolved: 0, minutesActive: 0 },
    {
      date: "2025-03-15",
      xpEarned: 140,
      lessonsCompleted: 2,
      problemsSolved: 1,
      minutesActive: 38,
    },
    {
      date: "2025-03-16",
      xpEarned: 160,
      lessonsCompleted: 2,
      problemsSolved: 2,
      minutesActive: 45,
    },
    { date: "2025-03-17", xpEarned: 75, lessonsCompleted: 1, problemsSolved: 0, minutesActive: 22 },
    {
      date: "2025-03-18",
      xpEarned: 190,
      lessonsCompleted: 2,
      problemsSolved: 3,
      minutesActive: 52,
    },
    {
      date: "2025-03-19",
      xpEarned: 100,
      lessonsCompleted: 1,
      problemsSolved: 1,
      minutesActive: 30,
    },
    { date: "2025-03-20", xpEarned: 0, lessonsCompleted: 0, problemsSolved: 0, minutesActive: 0 },
    {
      date: "2025-03-21",
      xpEarned: 220,
      lessonsCompleted: 3,
      problemsSolved: 2,
      minutesActive: 58,
    },
    {
      date: "2025-03-22",
      xpEarned: 130,
      lessonsCompleted: 1,
      problemsSolved: 2,
      minutesActive: 34,
    },
    { date: "2025-03-23", xpEarned: 90, lessonsCompleted: 1, problemsSolved: 1, minutesActive: 24 },
    {
      date: "2025-03-24",
      xpEarned: 175,
      lessonsCompleted: 2,
      problemsSolved: 2,
      minutesActive: 47,
    },
    { date: "2025-03-25", xpEarned: 60, lessonsCompleted: 1, problemsSolved: 0, minutesActive: 16 },
    { date: "2025-03-26", xpEarned: 0, lessonsCompleted: 0, problemsSolved: 0, minutesActive: 0 },
    {
      date: "2025-03-27",
      xpEarned: 205,
      lessonsCompleted: 2,
      problemsSolved: 3,
      minutesActive: 55,
    },
    {
      date: "2025-03-28",
      xpEarned: 150,
      lessonsCompleted: 2,
      problemsSolved: 1,
      minutesActive: 40,
    },
    {
      date: "2025-03-29",
      xpEarned: 115,
      lessonsCompleted: 1,
      problemsSolved: 2,
      minutesActive: 32,
    },
    {
      date: "2025-03-30",
      xpEarned: 185,
      lessonsCompleted: 2,
      problemsSolved: 2,
      minutesActive: 50,
    },
  ],
};

export const mockUser: DemoLearner = demoLearner;

import { getContentClient } from "./client";

/**
 * Synchronous content accessor for the demo learner profile.
 */
export function getDemoLearner(): DemoLearner {
  return demoLearner;
}

/**
 * Asynchronous content accessor for the demo learner profile (Seam 1 / S10.2).
 */
export async function fetchDemoLearner(): Promise<DemoLearner> {
  return getContentClient().getDemoLearner();
}
