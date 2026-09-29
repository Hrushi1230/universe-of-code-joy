import { getPath, getPaths } from "@/content/paths";

export const ONBOARDING_STORAGE_KEY = "algora-onboarding";

export type GoalKey = "interview" | "coursework" | "competitive" | "curiosity";
export type Commitment = "casual" | "steady" | "focused" | "intense";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface OnboardingState {
  goals: GoalKey[];
  commitment: Commitment;
  level: ExperienceLevel;
  assessmentAnswers: string[];
  assessmentScore: number | null;
  assessmentTotal: number;
  assessmentSkipped: boolean;
  recommendedPathSlug: string | null;
}

export const defaultOnboardingState: OnboardingState = {
  goals: [],
  commitment: "steady",
  level: "beginner",
  assessmentAnswers: [],
  assessmentScore: null,
  assessmentTotal: 3,
  assessmentSkipped: false,
  recommendedPathSlug: null,
};

const GOALS = new Set<GoalKey>(["interview", "coursework", "competitive", "curiosity"]);
const COMMITMENTS = new Set<Commitment>(["casual", "steady", "focused", "intense"]);
const LEVELS = new Set<ExperienceLevel>(["beginner", "intermediate", "advanced"]);

export function parseOnboardingState(raw: string | null): OnboardingState {
  if (!raw) return defaultOnboardingState;
  try {
    const value = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      goals: Array.isArray(value.goals)
        ? value.goals.filter((goal): goal is GoalKey => GOALS.has(goal as GoalKey))
        : [],
      commitment: COMMITMENTS.has(value.commitment as Commitment)
        ? (value.commitment as Commitment)
        : "steady",
      level: LEVELS.has(value.level as ExperienceLevel)
        ? (value.level as ExperienceLevel)
        : "beginner",
      assessmentAnswers: Array.isArray(value.assessmentAnswers)
        ? value.assessmentAnswers.filter((answer): answer is string => typeof answer === "string")
        : [],
      assessmentScore: typeof value.assessmentScore === "number" ? value.assessmentScore : null,
      assessmentTotal:
        typeof value.assessmentTotal === "number" && value.assessmentTotal > 0
          ? value.assessmentTotal
          : 3,
      assessmentSkipped: value.assessmentSkipped === true,
      recommendedPathSlug:
        typeof value.recommendedPathSlug === "string" && getPath(value.recommendedPathSlug)
          ? value.recommendedPathSlug
          : null,
    };
  } catch {
    return defaultOnboardingState;
  }
}

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return defaultOnboardingState;
  return parseOnboardingState(window.localStorage.getItem(ONBOARDING_STORAGE_KEY));
}

export function writeOnboardingState(update: Partial<OnboardingState>): OnboardingState {
  const next = { ...readOnboardingState(), ...update };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function recommendPath(goals: GoalKey[]): string {
  const preferredGoal = goals[0];
  const slug =
    preferredGoal === "competitive"
      ? "competitive-programming"
      : preferredGoal === "interview"
        ? "interview-prep"
        : "data-structures";
  return getPath(slug)?.slug ?? getPaths()[0]!.slug;
}

export function calibratedLevel(
  selfReported: ExperienceLevel,
  score: number | null,
  total: number,
  skipped: boolean,
): string {
  if (skipped || score === null) {
    return `${selfReported[0]!.toUpperCase()}${selfReported.slice(1)} (self-selected)`;
  }
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return "Advanced starting point";
  if (ratio >= 0.45) return "Intermediate starting point";
  return "Foundations starting point";
}

export function recommendationReason(state: OnboardingState): string {
  const goal = state.goals[0];
  if (!goal) {
    return "No goal is saved yet, so this uses the foundation path and your default local pace. Adjust goals to personalize it.";
  }
  const reason =
    goal === "competitive"
      ? "competitive-programming goal"
      : goal === "interview"
        ? "interview-prep goal"
        : goal === "coursework"
          ? "coursework goal"
          : "fundamentals goal";
  return `Recommended from your ${reason}; pace and starting point come from your saved weekly commitment and diagnostic.`;
}

export function weeklyGoalMinutes(commitment: Commitment): number {
  return {
    casual: 90,
    steady: 240,
    focused: 450,
    intense: 600,
  }[commitment];
}
