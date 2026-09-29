import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CalendarDays, Info, Route as RouteIcon, Star } from "lucide-react";
import {
  OnboardingFooter,
  OnboardingTopBar,
  StepBadge,
  TealPeriod,
} from "@/components/onboarding-chrome";
import useHydrated from "@/hooks/useHydrated";
import { getAlgorithm } from "@/content/algorithms";
import { getPath, getPaths } from "@/content/paths";
import {
  calibratedLevel,
  defaultOnboardingState,
  readOnboardingState,
  recommendationReason,
  recommendPath,
  writeOnboardingState,
  type OnboardingState,
} from "@/lib/onboarding";
import { usePrefsStore } from "@/stores/prefsStore";
import { useProgressStore } from "@/stores/progressStore";

export const Route = createFileRoute("/onboarding/path")({
  component: PathResultPage,
  head: () => ({
    meta: [
      { title: "Your personalized path — Algora onboarding" },
      {
        name: "description",
        content:
          "Step 3 of 3: review a recommendation derived from your saved goal, pace, and diagnostic answers.",
      },
      { property: "og:title", content: "Your personalized path — Algora onboarding" },
      {
        property: "og:description",
        content:
          "Review your locally generated learning-path recommendation and start a real catalog lesson.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const COMMITMENT_LABELS = {
  casual: "1–2 hours / week",
  steady: "3–5 hours / week",
  focused: "6–9 hours / week",
  intense: "10+ hours / week",
} as const;

function XpRing() {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" role="img" aria-label="Level 1 progress">
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="var(--primary-tint-strong)"
        strokeWidth="4"
      />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${c * 0.04} ${c}`}
        transform="rotate(-90 30 30)"
      />
      <text
        x="30"
        y="34"
        textAnchor="middle"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
        fill="var(--foreground)"
      >
        Lvl 1
      </text>
    </svg>
  );
}

function PathResultPage() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const userEmail = usePrefsStore((s) => s.profile.email);
  const setActivePath = useProgressStore((s) => s.setActivePath);
  const [onboarding, setOnboarding] = useState<OnboardingState>(defaultOnboardingState);

  useEffect(() => {
    const saved = readOnboardingState();
    const recommendedPathSlug = saved.recommendedPathSlug ?? recommendPath(saved.goals);
    const next = writeOnboardingState({ recommendedPathSlug });
    setOnboarding(next);
  }, []);

  const path =
    getPath(onboarding.recommendedPathSlug ?? recommendPath(onboarding.goals)) ?? getPaths()[0]!;
  const lessonSlugs = useMemo(
    () => path.modules.flatMap((module) => module.itemSlugs).filter((slug) => getAlgorithm(slug)),
    [path],
  );
  const firstLessons = lessonSlugs.slice(0, 3).map((slug) => getAlgorithm(slug)!);
  const stats = [
    {
      icon: BarChart3,
      label: "Starting point",
      value: calibratedLevel(
        onboarding.level,
        onboarding.assessmentScore,
        onboarding.assessmentTotal,
        onboarding.assessmentSkipped,
      ),
      teal: false,
    },
    { icon: CalendarDays, label: "Catalog path", value: `${path.weeks} weeks`, teal: false },
    {
      icon: Star,
      label: "Saved pace",
      value: COMMITMENT_LABELS[onboarding.commitment],
      teal: true,
    },
  ];

  const handleStartLearning = useCallback(() => {
    setActivePath(path.slug);
    writeOnboardingState({ recommendedPathSlug: path.slug });
    const firstSlug = lessonSlugs[0];
    if (firstSlug) navigate({ to: "/algorithms/$slug", params: { slug: firstSlug } });
    else navigate({ to: "/dashboard" });
  }, [lessonSlugs, navigate, path.slug, setActivePath]);

  const handleRetake = useCallback(() => {
    writeOnboardingState({
      assessmentAnswers: [],
      assessmentScore: null,
      assessmentSkipped: false,
    });
    navigate({ to: "/onboarding/assessment" });
  }, [navigate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-foreground">
      <OnboardingTopBar
        current={3}
        right={
          <span>
            {hydrated && userEmail ? `Local profile · ${userEmail}` : "Saved on this device"}
          </span>
        }
      />

      <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-4 sm:items-center sm:px-6">
        <div className="w-full max-w-[960px] rounded-2xl border border-hairline bg-card px-5 py-5 shadow-sm sm:px-9 sm:py-6">
          <StepBadge>YOUR PATH IS READY</StepBadge>

          <h1 className="mt-3 font-sans text-[27px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[34px]">
            Your recommended path: {path.title}
            <TealPeriod />
          </h1>
          <p className="mt-2 font-mono text-[13.5px] text-muted-foreground">
            {recommendationReason(onboarding)}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {stats.map(({ icon: Icon, label, value, teal }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-tint">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
                </span>
                <div>
                  <div className="font-mono text-[12px] text-muted-foreground">{label}</div>
                  <div
                    className={[
                      "font-mono text-[16px]",
                      teal ? "text-primary" : "text-foreground",
                    ].join(" ")}
                  >
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl border border-hairline bg-card px-5 py-4">
              <div className="text-[14px] font-semibold text-foreground">Your skill roadmap</div>

              <div
                tabIndex={0}
                role="region"
                aria-label="Recommended path timeline"
                className="mt-4 flex overflow-x-auto pb-2"
              >
                {path.modules.slice(0, 6).map((module, i) => (
                  <div key={module.title} className="flex items-start">
                    {i > 0 && (
                      <span className="mt-[18px] h-[2px] w-3 shrink-0 bg-primary-tint-strong" />
                    )}
                    <div className="flex w-[92px] shrink-0 flex-col items-center text-center">
                      <span
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-full font-mono text-[14px]",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary-tint-strong text-foreground",
                        ].join(" ")}
                      >
                        {i + 1}
                      </span>
                      <span className="mt-2 whitespace-nowrap font-mono text-[11px] text-primary">
                        {i === 0 ? "Start here" : "Then"}
                      </span>
                      <span className="mt-0.5 line-clamp-2 font-mono text-[11px] leading-[15px] text-foreground">
                        {module.title.replace(/^Week \d+(?:-\d+)?: |^Module \d+: /, "")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-6 font-mono text-[11px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Current
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-tint-strong" /> Later modules
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-hairline bg-card px-5 py-4">
              <div className="text-[14px] font-semibold text-foreground">First 3 lessons</div>
              <div className="mt-3 space-y-2.5">
                {firstLessons.map((lesson) => (
                  <div key={lesson.slug} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-card">
                      <RouteIcon className="h-4.5 w-4.5 text-primary" strokeWidth={1.7} />
                    </span>
                    <span className="flex-1 text-[14px] text-foreground">{lesson.name}</span>
                    <span className="rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                      {lesson.estMinutes}m
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-4">
                <XpRing />
                <div className="flex-1">
                  <div className="font-mono text-[13px] text-primary">
                    {lessonSlugs.length} catalog algorithms
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Progress is recorded locally when you begin.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-2 font-mono text-[12.5px] text-muted-foreground">
            <Info className="h-4 w-4" /> You can adjust goals or retake the diagnostic before
            starting.
          </p>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-t border-hairline pt-4">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/onboarding/goals"
                className="flex h-11 items-center rounded-xl border border-primary bg-card px-5 font-mono text-[14px] text-primary transition-colors hover:bg-primary-tint/60 sm:px-7"
              >
                Adjust goals
              </Link>
              <button
                type="button"
                onClick={handleRetake}
                className="flex h-11 items-center rounded-xl border border-hairline bg-card px-5 font-mono text-[14px] text-foreground transition-colors hover:bg-secondary"
              >
                Retake diagnostic
              </button>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleStartLearning}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-8 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                Start learning <ArrowRight className="h-4 w-4" />
              </button>
              <span className="mt-2 max-w-[260px] text-center font-mono text-[11.5px] text-muted-foreground">
                Opens {firstLessons[0]?.name ?? "the first available lesson"} and saves this path
                locally.
              </span>
            </div>
          </div>
        </div>
      </main>

      <OnboardingFooter middle="Welcome aboard" />
    </div>
  );
}
