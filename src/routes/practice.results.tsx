import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, LineChart, Network, Star, StickyNote } from "lucide-react";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { getAlgorithm } from "@/content/algorithms";
import { getProblem, getProblems } from "@/content/problems";
import useHydrated from "@/hooks/useHydrated";
import { useDueCardCount } from "@/hooks/useProgress";
import { hasReviewSet } from "@/lib/algorithm-review";
import { resolveQuestionTransferSlug, resolveTransferSlug } from "@/lib/lesson-stages";
import { xpAtLevelStart, xpForLevel } from "@/lib/xp";
import { baselineProgress, dayKey, useProgressStore } from "@/stores/progressStore";
import { useResultStore } from "@/stores/resultStore";

export const Route = createFileRoute("/practice/results")({
  component: ChallengeResults,
  head: () => ({
    meta: [
      { title: "Challenge results — tests, runtime and XP — Algora" },
      {
        name: "description",
        content:
          "Runtime, test pass rate, complexity and XP breakdown for your latest accepted solution, plus what to learn next.",
      },
      { property: "og:title", content: "Challenge results — tests, runtime and XP — Algora" },
      {
        property: "og:description",
        content: "See your runtime, complexity, XP earned and your recommended next challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/* subtle flat teal confetti flecks */
const FLECKS = [
  { x: 62, y: 58, r: -18, w: 8 },
  { x: 118, y: 30, r: 24, w: 6 },
  { x: 152, y: 96, r: -40, w: 5 },
  { x: 214, y: 22, r: 12, w: 4 },
  { x: 690, y: 34, r: -25, w: 7 },
  { x: 742, y: 78, r: 30, w: 5 },
  { x: 786, y: 46, r: -12, w: 6 },
  { x: 812, y: 100, r: 40, w: 4 },
];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Flecks() {
  return (
    <svg
      viewBox="0 0 860 130"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-6 h-32 w-full"
    >
      {FLECKS.map((f, i) => (
        <rect
          key={i}
          x={f.x}
          y={f.y}
          width={f.w}
          height={f.w}
          transform={`rotate(${f.r} ${f.x + f.w / 2} ${f.y + f.w / 2})`}
          className="fill-highlight/35"
          rx={1}
        />
      ))}
    </svg>
  );
}

function ComplexityCurve() {
  return (
    <svg viewBox="0 0 190 96" className="h-[96px] w-[190px]" aria-hidden="true">
      <line x1={10} y1={4} x2={10} y2={86} stroke="var(--hairline)" strokeDasharray="3 3" />
      <line x1={10} y1={86} x2={182} y2={86} stroke="var(--hairline)" strokeDasharray="3 3" />
      <path
        d="M14 82 C 70 80, 120 62, 158 18"
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path d="M150 16 L162 12 L158 24 Z" fill="var(--primary)" opacity={0.75} />
    </svg>
  );
}

const formatOrdinal = (n: number): string => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

function ChallengeResults() {
  const hydrated = useHydrated();
  const last = useResultStore((s) => s.last);
  const live = useProgressStore((s) => s);
  const state = hydrated ? live : baselineProgress;
  const dueCards = useDueCardCount();

  /** The problem we are reporting on: the fresh submission, else the latest solve. */
  const problem = useMemo(() => {
    if (last) return getProblem(last.problemSlug) ?? null;
    const solved = Object.entries(state.problems)
      .filter(([, p]) => Boolean(p.solvedAt))
      .sort((a, b) => (b[1].solvedAt ?? "").localeCompare(a[1].solvedAt ?? ""));
    const slug = solved[0]?.[0];
    return slug ? (getProblem(slug) ?? null) : null;
  }, [last, state.problems]);

  const record = problem ? state.problems[problem.slug] : undefined;
  const algorithm = problem ? getAlgorithm(problem.algorithmSlug) : undefined;
  const solvedToday = last?.solvedToday ?? state.activity[dayKey()]?.solved ?? 0;

  const nextProblem = useMemo(
    () => getProblems().find((p) => p.slug !== problem?.slug && !state.problems[p.slug]?.solvedAt),
    [problem?.slug, state.problems],
  );

  /* Came from a Golden Lesson stage: the obvious next action is the lesson, not
     an unrelated challenge. Generic submissions keep the existing behaviour. */
  const lessonAlgorithm =
    last?.from === "lesson" && last.algorithmSlug ? getAlgorithm(last.algorithmSlug) : undefined;
  const lessonProblem =
    lessonAlgorithm && last?.lessonProblemSlug ? getProblem(last.lessonProblemSlug) : undefined;
  const lessonStage = last?.from === "lesson" ? last.stage : undefined;

  /* Code accepted: the next skill is recognising the pattern elsewhere, so the
     primary action becomes the transfer challenge rather than the lesson. */
  const transferSlug = useMemo(
    () =>
      lessonProblem
        ? resolveQuestionTransferSlug(lessonProblem.slug)
        : lessonAlgorithm
          ? resolveTransferSlug(lessonAlgorithm.slug)
          : null,
    [lessonAlgorithm, lessonProblem],
  );
  const codeHandoff = Boolean(
    lessonAlgorithm && lessonStage === "code" && transferSlug && transferSlug !== problem?.slug,
  );
  const solveDone = Boolean(lessonAlgorithm && lessonStage === "solve");

  const level = state.level;
  const levelStart = xpAtLevelStart(level);
  const levelEnd = xpForLevel(level + 1);
  const span = Math.max(1, levelEnd - levelStart);
  const pct = Math.min(100, Math.max(0, Math.round(((state.xp - levelStart) / span) * 100)));

  if (!problem) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar active="Practice" collapsible />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppWorkspaceBar crumbs={["Practice", "Results"]} />
          <main className="flex min-h-0 flex-1 items-center justify-center px-6 py-4">
            <section className="w-full max-w-[520px] rounded-2xl border border-hairline bg-card px-8 py-10 text-center">
              <h1 className="text-[22px] font-semibold text-foreground">No results yet</h1>
              <p className="mt-2 font-mono text-[13px] text-muted-foreground">
                Solve a challenge and your runtime, tests and XP breakdown will appear here.
              </p>
              <Link
                to="/practice/$slug"
                params={{ slug: getProblems()[0]!.slug }}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
              >
                Start a challenge <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const runtime = last?.runtimeMs ?? record?.bestRuntimeMs ?? 0;
  const stats = [
    { label: "Runtime", value: `${runtime}`, unit: "ms", note: runtime <= 50 ? "fast path" : "" },
    {
      label: "Tests",
      value: `${last?.passed ?? problem.tests.length}`,
      unit: `/ ${last?.total ?? problem.tests.length}`,
    },
    { label: "Attempts", value: `${record?.attempts ?? last?.attempts ?? 1}` },
    {
      label: "XP earned",
      value: `+${last?.xpAwarded ?? 0}`,
      teal: true,
      note: last?.hintsUsed ? `${last.hintsUsed} hint${last.hintsUsed > 1 ? "s" : ""} used` : "",
    },
  ];

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <AppSidebar active="Practice" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Practice", problem.title, "Results"]} />

        <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
          <section className="relative w-full max-w-[900px] rounded-2xl border border-hairline bg-card px-4 pb-6 pt-5 sm:px-8">
            <Flecks />

            {/* Header */}
            <div className="relative flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
              <span className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full bg-primary-tint">
                <Check className="h-9 w-9 text-primary" strokeWidth={2.4} />
              </span>
              <div>
                <h1 className="flex items-baseline justify-center gap-1.5 font-mono text-[26px] font-medium leading-none tracking-tight text-foreground sm:justify-start sm:text-[38px]">
                  All tests passed
                  <span className="h-[9px] w-[9px] rounded-[2px] bg-primary" />
                </h1>
                <p className="mt-2.5 font-mono text-[14px] text-muted-foreground">
                  {solvedToday > 0
                    ? `Nice — that\u2019s your ${ordinal(solvedToday)} solve today.`
                    : `Nice work on ${problem.title}.`}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-hairline bg-card px-5 py-3.5 text-center"
                >
                  <div className="font-mono text-[12.5px] text-muted-foreground">
                    {s.label} <span className="text-primary">·</span>
                  </div>
                  <div
                    className={`mt-1 font-mono text-[26px] font-medium leading-none ${
                      s.teal ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {s.value}
                    {s.unit && (
                      <span className="ml-1 text-[15px] text-muted-foreground">{s.unit}</span>
                    )}
                  </div>
                  <div className="mt-1.5 h-[17px] font-mono text-[12.5px] text-primary">
                    {s.note ?? ""}
                  </div>
                </div>
              ))}
            </div>

            {/* Complexity */}
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-hairline bg-card px-4 py-4 sm:gap-5 sm:px-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                <LineChart className="h-5 w-5 text-primary" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[12.5px] text-muted-foreground">Complexity</div>
                <div className="mt-0.5 font-mono text-[19px] font-medium text-foreground">
                  Time {algorithm?.timeAvg ?? "O(n)"} <span className="text-primary">·</span> Space{" "}
                  {algorithm?.space ?? "O(1)"}
                </div>
                <p className="mt-1.5 font-mono text-[12.5px] leading-[1.55] text-muted-foreground">
                  The reference solution for {problem.title} runs in {algorithm?.timeAvg ?? "O(n)"}{" "}
                  time and {algorithm?.space ?? "O(1)"} space.
                  <br />
                  {algorithm?.oneLiner ?? "Compare your approach against the visualiser."}
                </p>
              </div>
              <span className="hidden sm:block">
                <ComplexityCurve />
              </span>
            </div>

            {/* XP strip */}
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-hairline bg-primary-tint/50 px-4 py-3.5 sm:gap-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                <Star className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[13.5px] text-foreground">
                  Lvl {level} <span className="text-primary">·</span>{" "}
                  <span className="text-muted-foreground">
                    {state.xp.toLocaleString("en-US")} / {levelEnd.toLocaleString("en-US")} XP
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="inline-flex h-9 shrink-0 items-center rounded-xl border border-primary/40 bg-card px-3.5 font-mono text-[12.5px] text-primary">
                +{last?.xpAwarded ?? 0} XP
              </span>
              <span className="hidden shrink-0 font-mono text-[12.5px] text-muted-foreground sm:inline">
                {Math.max(0, levelEnd - state.xp).toLocaleString("en-US")} XP to Level {level + 1}
              </span>
            </div>

            {/* What's next */}
            <div className="mt-4 rounded-2xl border border-hairline bg-card p-4">
              <h2 className="text-[15px] font-semibold text-foreground">What&rsquo;s next</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {[
                  nextProblem
                    ? {
                        icon: Network,
                        title: `Try: ${nextProblem.title}`,
                        meta:
                          nextProblem.difficulty.charAt(0).toUpperCase() +
                          nextProblem.difficulty.slice(1),
                        body: nextProblem.statementMarkdown.split("\n")[0]?.slice(0, 64) ?? "",
                        to: "/practice/$slug" as const,
                        params: { slug: nextProblem.slug },
                      }
                    : {
                        icon: Network,
                        title: "Explore algorithms",
                        meta: "Catalog",
                        body: "You have solved every challenge in the catalog.",
                        to: "/explore" as const,
                        params: undefined,
                      },
                  {
                    icon: StickyNote,
                    title: `Review: ${algorithm?.name ?? "your cards"}`,
                    meta: `${dueCards} card${dueCards === 1 ? "" : "s"}`,
                    body: "Reinforce the patterns behind this problem.",
                    to: "/review" as const,
                    params: undefined,
                  },
                ].map(({ icon: Icon, title, meta, body, to, params }) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-xl border border-hairline bg-card px-4 py-3"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-foreground">
                        {title} <span className="text-primary">·</span>{" "}
                        <span className="font-mono text-[12.5px] font-normal text-muted-foreground">
                          {meta}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[12px] text-muted-foreground">
                        {body}
                      </p>
                    </div>
                    <Link
                      to={to}
                      params={params as never}
                      className="inline-flex shrink-0 items-center gap-2 font-sans text-[13px] font-medium text-primary hover:underline"
                    >
                      Start <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Lesson-stage handoff: one clear next skill, no redirect */}
            {codeHandoff && (
              <div className="mt-4 rounded-2xl border border-primary/40 bg-primary-tint/40 px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-foreground">
                  Next: apply the pattern
                </h2>
                <p className="mt-1 font-mono text-[12.5px] leading-[1.6] text-muted-foreground">
                  You implemented {lessonAlgorithm?.name}. Now apply the same shrinking-search-space
                  reasoning to a different problem.
                </p>
              </div>
            )}
            {solveDone && (
              <div className="mt-4 rounded-2xl border border-hairline bg-card px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-foreground">
                  Why the pattern worked
                </h2>
                <ul className="mt-1.5 space-y-1 font-mono text-[12.5px] leading-[1.6] text-muted-foreground">
                  {lessonAlgorithm?.slug === "two-pointers" ? (
                    <>
                      <li>two endpoints bounded the remaining candidates,</li>
                      <li>each comparison proved one endpoint could be discarded,</li>
                      <li>both pointers moved monotonically without revisiting ruled-out work.</li>
                    </>
                  ) : (
                    <>
                      <li>the candidate indices were ordered,</li>
                      <li>each comparison removed one side,</li>
                      <li>
                        low identified the first valid insertion position when the search ended.
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* Footer buttons */}
            <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                to="/practice/$slug"
                params={{ slug: problem.slug }}
                className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-primary bg-card px-6 font-sans text-[14px] font-medium text-primary hover:bg-primary-tint"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.9} /> Back to problem
              </Link>
              <Link
                to="/algorithms/$slug"
                params={{ slug: problem.algorithmSlug }}
                search={lessonProblem ? { problem: lessonProblem.slug } : {}}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-primary bg-card px-6 font-sans text-[14px] font-medium text-primary hover:bg-primary-tint sm:mx-auto"
              >
                View walkthrough
              </Link>
              {codeHandoff && transferSlug ? (
                <Link
                  to="/practice/$slug"
                  params={{ slug: transferSlug }}
                  search={{
                    from: "lesson" as const,
                    algorithm: lessonAlgorithm!.slug,
                    ...(lessonProblem ? { problem: lessonProblem.slug } : {}),
                    stage: "solve" as const,
                  }}
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-primary px-7 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
                >
                  Apply {lessonAlgorithm?.name} to a new problem{" "}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              ) : solveDone &&
                lessonAlgorithm &&
                hasReviewSet(lessonAlgorithm.slug, lessonProblem?.slug) ? (
                <Link
                  to="/review"
                  search={{
                    algorithm: lessonAlgorithm.slug,
                    ...(lessonProblem ? { problem: lessonProblem.slug } : {}),
                  }}
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-primary px-7 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
                >
                  Continue to Review <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              ) : solveDone ? (
                <Link
                  to="/review"
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-primary px-7 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
                >
                  Continue to Review <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              ) : lessonAlgorithm ? (
                <Link
                  to="/algorithms/$slug"
                  params={{ slug: lessonAlgorithm.slug }}
                  search={lessonProblem ? { problem: lessonProblem.slug } : {}}
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-primary px-7 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
                >
                  Continue {lessonAlgorithm.name} lesson{" "}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              ) : (
                <Link
                  to={nextProblem ? "/practice/$slug" : "/explore"}
                  params={(nextProblem ? { slug: nextProblem.slug } : undefined) as never}
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-primary px-7 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
                >
                  Next challenge <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
