import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Check, Lightbulb, Target, Trophy } from "lucide-react";
import {
  OnboardingFooter,
  OnboardingTopBar,
  StepBadge,
  TealPeriod,
} from "@/components/onboarding-chrome";
import {
  readOnboardingState,
  writeOnboardingState,
  type Commitment,
  type ExperienceLevel,
  type GoalKey,
} from "@/lib/onboarding";

export const Route = createFileRoute("/onboarding/goals")({
  component: GoalsPage,
  head: () => ({
    meta: [
      { title: "Learning goals — Algora onboarding" },
      {
        name: "description",
        content:
          "Step 1 of 3: pick your learning goals, weekly time commitment, and experience level so Algora can shape the right path.",
      },
      { property: "og:title", content: "Learning goals — Algora onboarding" },
      {
        property: "og:description",
        content:
          "Step 1 of 3: pick your learning goals so Algora can build a personalized algorithm-learning path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const GOALS: { key: GoalKey; icon: typeof Target; title: string; body: string }[] = [
  {
    key: "interview",
    icon: Target,
    title: "Interview prep",
    body: "Crack FAANG-style DS&A questions.",
  },
  {
    key: "coursework",
    icon: BookOpen,
    title: "Ace my coursework",
    body: "Keep up with CS classes and exams.",
  },
  {
    key: "competitive",
    icon: Trophy,
    title: "Competitive programming",
    body: "Train speed and pattern recognition.",
  },
  {
    key: "curiosity",
    icon: Lightbulb,
    title: "Curiosity & fundamentals",
    body: "Truly understand how algorithms work.",
  },
];

const COMMITMENTS: { key: Commitment; label: string }[] = [
  { key: "casual", label: "Casual · 1–2h" },
  { key: "steady", label: "Steady · 3–5h" },
  { key: "focused", label: "Focused · 6–9h" },
  { key: "intense", label: "Intense · 10h+" },
];

const LEVELS: { key: ExperienceLevel; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
];

function Segmented<T extends string>({
  options,
  active,
  onSelect,
  disabled,
}: {
  options: { key: T; label: string }[];
  active: T;
  onSelect: (key: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap overflow-hidden rounded-xl border border-hairline bg-card sm:inline-flex sm:w-auto sm:flex-nowrap">
      {options.map((option, i) => (
        <button
          key={option.key}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option.key)}
          className={[
            "min-w-0 flex-1 px-3 py-2.5 font-mono text-[12px] transition-colors sm:h-10 sm:flex-none sm:px-6 sm:py-0 sm:text-[13px]",
            i > 0 ? "border-l border-hairline" : "",
            option.key === active
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-secondary",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function GoalsPage() {
  const navigate = useNavigate();
  const [selectedGoals, setSelectedGoals] = useState<Set<GoalKey>>(new Set());
  const [commitment, setCommitment] = useState<Commitment>("steady");
  const [level, setLevel] = useState<ExperienceLevel>("beginner");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readOnboardingState();
    setSelectedGoals(new Set(saved.goals));
    setCommitment(saved.commitment);
    setLevel(saved.level);
    setReady(true);
  }, []);

  const toggleGoal = useCallback((key: GoalKey) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleContinue = useCallback(() => {
    writeOnboardingState({
      goals: Array.from(selectedGoals),
      commitment,
      level,
      assessmentAnswers: [],
      assessmentScore: null,
      assessmentSkipped: false,
      recommendedPathSlug: null,
    });
    navigate({ to: "/onboarding/assessment" });
  }, [selectedGoals, commitment, level, navigate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-foreground">
      <OnboardingTopBar current={1} right={<Link to="/paths">Skip for now</Link>} />

      <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-4 sm:items-center sm:px-6">
        <div className="w-full max-w-[920px] rounded-2xl border border-hairline bg-card px-5 py-5 shadow-sm sm:px-10 sm:py-7">
          <StepBadge>STEP 1 OF 3</StepBadge>

          <h1 className="mt-4 font-sans text-[27px] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-[34px]">
            What brings you to Algora?
            <TealPeriod />
          </h1>
          <p className="mt-2 font-mono text-[14px] text-muted-foreground">
            Pick your goals so we can shape the right path. Choose all that apply.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {GOALS.map(({ key, icon: Icon, title, body }) => {
              const selected = selectedGoals.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!ready}
                  onClick={() => toggleGoal(key)}
                  className={[
                    "flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary-tint/50"
                      : "border-hairline bg-card hover:bg-secondary/60",
                  ].join(" ")}
                >
                  <Icon className="h-7 w-7 shrink-0 text-primary" strokeWidth={1.6} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{title}</div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">{body}</div>
                  </div>
                  {selected ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-hairline" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="font-mono text-[13px] text-foreground">Weekly time commitment</div>
            <div className="mt-2">
              <Segmented
                options={COMMITMENTS}
                active={commitment}
                onSelect={setCommitment}
                disabled={!ready}
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="font-mono text-[13px] text-foreground">Experience level</div>
            <div className="mt-2">
              <Segmented options={LEVELS} active={level} onSelect={setLevel} disabled={!ready} />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-5">
            <Link
              to="/"
              className="flex h-11 items-center rounded-xl border border-hairline bg-card px-5 font-mono text-[14px] text-foreground transition-colors hover:bg-secondary sm:px-8"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!ready || selectedGoals.size === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-50 sm:px-8"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      <OnboardingFooter middle="Personalizing your experience" />
    </div>
  );
}
