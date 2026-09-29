import type { Achievement } from "./types";

export const achievements: Achievement[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your very first lesson.",
    icon: "Footprints",
    tier: "bronze",
    xp: 25,
    criteria: "Complete 1 lesson",
  },
  {
    id: "quick-learner",
    name: "Quick Learner",
    description: "Complete 5 lessons.",
    icon: "BookOpen",
    tier: "bronze",
    xp: 50,
    criteria: "Complete 5 lessons",
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Complete 25 lessons.",
    icon: "GraduationCap",
    tier: "silver",
    xp: 150,
    criteria: "Complete 25 lessons",
  },
  {
    id: "master-of-lessons",
    name: "Master of Lessons",
    description: "Complete every lesson in the catalog.",
    icon: "Crown",
    tier: "platinum",
    xp: 500,
    criteria: "Complete all lessons",
  },
  {
    id: "first-blood",
    name: "First Blood",
    description: "Solve your first coding problem.",
    icon: "Swords",
    tier: "bronze",
    xp: 25,
    criteria: "Solve 1 problem",
  },
  {
    id: "problem-solver",
    name: "Problem Solver",
    description: "Solve 10 coding problems.",
    icon: "Puzzle",
    tier: "silver",
    xp: 200,
    criteria: "Solve 10 problems",
  },
  {
    id: "grinder",
    name: "Grinder",
    description: "Solve 50 coding problems.",
    icon: "Dumbbell",
    tier: "gold",
    xp: 400,
    criteria: "Solve 50 problems",
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Pass all tests on a problem on your first submission.",
    icon: "Gem",
    tier: "silver",
    xp: 75,
    criteria: "Pass all tests on first submission",
  },
  {
    id: "speed-demon",
    name: "First Benchmark",
    description: "Record a runtime for an accepted local solution.",
    icon: "Zap",
    tier: "gold",
    xp: 150,
    criteria: "Save 1 accepted result with a measured runtime",
  },
  {
    id: "streak-3",
    name: "Warming Up",
    description: "Maintain a 3-day learning streak.",
    icon: "Flame",
    tier: "bronze",
    xp: 30,
    criteria: "Reach a 3-day streak",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day learning streak.",
    icon: "CalendarCheck",
    tier: "silver",
    xp: 100,
    criteria: "Reach a 7-day streak",
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    description: "Maintain a 30-day learning streak.",
    icon: "Rocket",
    tier: "platinum",
    xp: 600,
    criteria: "Reach a 30-day streak",
  },
  {
    id: "graph-explorer",
    name: "Graph Explorer",
    description: "Complete every graph algorithm lesson.",
    icon: "Waypoints",
    tier: "gold",
    xp: 250,
    criteria: "Complete all graphs-category lessons",
  },
  {
    id: "sorting-savant",
    name: "Sorting Savant",
    description: "Complete every sorting algorithm lesson.",
    icon: "ArrowDownUp",
    tier: "gold",
    xp: 250,
    criteria: "Complete all sorting-category lessons",
  },
  {
    id: "tree-hugger",
    name: "Tree Hugger",
    description: "Complete every tree algorithm lesson.",
    icon: "GitBranch",
    tier: "silver",
    xp: 180,
    criteria: "Complete all trees-category lessons",
  },
  {
    id: "hash-master",
    name: "Hash Master",
    description: "Complete every hashing algorithm lesson.",
    icon: "Hash",
    tier: "silver",
    xp: 150,
    criteria: "Complete all hashing-category lessons",
  },
  {
    id: "path-finisher",
    name: "Path Finisher",
    description: "Complete a full learning path.",
    icon: "Milestone",
    tier: "gold",
    xp: 300,
    criteria: "Complete 1 learning path",
  },
  {
    id: "path-collector",
    name: "Path Collector",
    description: "Complete every learning path in the current catalog.",
    icon: "Trophy",
    tier: "platinum",
    xp: 750,
    criteria: "Complete all learning paths",
  },
  {
    id: "quiz-whiz",
    name: "Quiz Whiz",
    description: "Score 100% on 10 lesson quizzes.",
    icon: "Brain",
    tier: "silver",
    xp: 120,
    criteria: "Score 100% on 10 quizzes",
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Complete a lesson after midnight.",
    icon: "Moon",
    tier: "bronze",
    xp: 20,
    criteria: "Complete a lesson between 12am and 4am",
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Complete a lesson before 7am.",
    icon: "Sunrise",
    tier: "bronze",
    xp: 20,
    criteria: "Complete a lesson before 7am",
  },
  {
    id: "quest-champion",
    name: "Quest Champion",
    description: "Complete 20 daily quests.",
    icon: "ScrollText",
    tier: "silver",
    xp: 140,
    criteria: "Complete 20 daily quests",
  },
  {
    id: "weekly-warrior",
    name: "Weekly Warrior",
    description: "Complete 10 weekly quests.",
    icon: "CalendarDays",
    tier: "gold",
    xp: 220,
    criteria: "Complete 10 weekly quests",
  },
  {
    id: "level-10",
    name: "Double Digits",
    description: "Reach account level 10.",
    icon: "Star",
    tier: "gold",
    xp: 300,
    criteria: "Reach level 10",
  },
];

export function getAchievement(id: string): Achievement | undefined {
  return achievements.find((a) => a.id === id);
}

export function getAchievements(): Achievement[] {
  return achievements;
}

export function getAchievementsByTier(tier: Achievement["tier"]): Achievement[] {
  return achievements.filter((a) => a.tier === tier);
}

export async function fetchAchievement(id: string): Promise<Achievement | null> {
  return getAchievement(id) ?? null;
}

export async function fetchAchievements(): Promise<Achievement[]> {
  return getAchievements();
}

export async function fetchAchievementsByTier(tier: Achievement["tier"]): Promise<Achievement[]> {
  return getAchievementsByTier(tier);
}
