import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  Check,
  Flame,
  MonitorPlay,
  NotebookPen,
  Settings2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useHeaderStats } from "@/components/app-shell";
import { AlgoraGlyph } from "@/components/site-chrome";
import { CustomInputModal } from "@/components/player/CustomInputModal";
import { GoldenWorkspace } from "@/components/workspace/GoldenWorkspace";
import { TraceWorkspace } from "@/components/trace/TraceWorkspace";
import { getTraceExercise } from "@/content/trace-exercises";
import { createTraceStore, TraceStoreProvider } from "@/stores/traceStore";
import { LessonContextRow } from "@/components/workspace/LessonContextRow";
import { LessonStageStrip } from "@/components/workspace/LessonStageStrip";

import { Button } from "@/components/common/Button";
import { Chip } from "@/components/common/Chip";
import { ComplexityTag } from "@/components/common/ComplexityTag";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { DesktopScaleFrame } from "@/components/common/DesktopScaleFrame";
import { EmptyState } from "@/components/common/EmptyState";

import { Tooltip } from "@/components/common/Tooltip";
import { CATEGORY_META, getAlgorithm } from "@/content/algorithms";
import { getLessonByAlgorithm } from "@/content/lessons";
import { getProblem } from "@/content/problems";
import type { Algorithm } from "@/content/types";
import { getModule, getModuleForProblem, hasModuleForProblem } from "@/engine/registry";
import { useAutoplay } from "@/hooks/useAutoplay";
import { useHydrated } from "@/hooks/useHydrated";
import { usePlayerKeys } from "@/hooks/usePlayerKeys";
import { useSession } from "@/hooks/useSession";
import { hasReviewSet, reviewStageState } from "@/lib/algorithm-review";
import {
  isImplementationSolved,
  isTransferSolved,
  resolveImplementationSlug,
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
  resolveTransferSlug,
} from "@/lib/lesson-stages";
import { mergePlayerSearch, type AlgorithmSearch } from "@/lib/player-search";
import { cn } from "@/lib/utils";
import { progressPct } from "@/lib/xp";
import { usePlayerStore } from "@/stores/playerStore";
import { useProgressStore } from "@/stores/progressStore";

export const Route = createFileRoute("/algorithms/$slug")({
  validateSearch: (search: Record<string, unknown>): AlgorithmSearch => {
    const input =
      typeof search.input === "string" && search.input.length > 0 ? search.input : undefined;
    const rawStep = search.step;
    const stepNumber =
      typeof rawStep === "number"
        ? rawStep
        : typeof rawStep === "string" && rawStep.trim() !== ""
          ? Number(rawStep)
          : Number.NaN;
    const step =
      Number.isFinite(stepNumber) && stepNumber >= 0 ? Math.floor(stepNumber) : undefined;
    // Resolved against the catalog, so a hand-edited slug falls back to the
    // algorithm's own default rather than routing to a 404 on /practice.
    const problem =
      typeof search.problem === "string" && getProblem(search.problem) ? search.problem : undefined;
    // The only non-guided stage with a screen of its own so far.
    const stage = search.stage === "trace" ? ("trace" as const) : undefined;
    return {
      ...(input ? { input } : {}),
      ...(step !== undefined ? { step } : {}),
      ...(problem ? { problem } : {}),
      ...(stage ? { stage } : {}),
    };
  },
  component: AlgorithmWorkspace,
  head: ({ params, match }) => {
    const algo = getAlgorithm(params.slug);
    // The tab title follows the canvas for the same reason the <h1> does. `head`
    // has no `search` argument, but `match` carries the validated search schema,
    // so a shared link to a question visualizer is titled by the question.
    // Renamed only when the question drives the canvas, matching the <h1>. A
    // `?problem=` with no module of its own still shows the algorithm, so it
    // keeps the algorithm's title.
    const problem =
      match.search.problem && hasModuleForProblem(match.search.problem)
        ? getProblem(match.search.problem)
        : undefined;
    const named =
      problem && problem.algorithmSlug === params.slug
        ? problem.title
        : (algo?.name ?? "Algorithm");
    const title = `${named} visualizer — Algora`;
    const description =
      problem?.oneLiner ??
      algo?.summary.slice(0, 155) ??
      "Step through an algorithm with synchronized visualization, code, and plain-English narration.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
});

/* ---------------- base64 helpers (SSR-safe) ---------------- */

function encodeInputs(raw: Record<string, string>): string {
  const json = JSON.stringify(raw);
  if (typeof globalThis.btoa === "function") return globalThis.btoa(json);
  return Buffer.from(json, "utf-8").toString("base64");
}

function decodeInputs(value: string): Record<string, string> | null {
  try {
    const json =
      typeof globalThis.atob === "function"
        ? globalThis.atob(value)
        : Buffer.from(value, "base64").toString("utf-8");
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) out[k] = String(v);
    return out;
  } catch {
    return null;
  }
}

/* ---------------- workspace ---------------- */

function AlgorithmWorkspace(): React.ReactElement {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  /* Trace Mode has no playback, so the global shortcuts stand down: Space and
     the arrows belong to the learner's answer controls there. */
  const isTrace = search.stage === "trace";
  usePlayerKeys(!isTrace);
  useAutoplay();

  /* One trace store per workspace mount, mirroring how the player and prediction
     stores are scoped: a learner's guesses never reach the guided player. */
  const [traceStore] = React.useState(createTraceStore);
  const traceExercise = React.useMemo(
    () => getTraceExercise(slug, search.problem),
    [slug, search.problem],
  );

  const algo = getAlgorithm(slug);

  /**
   * Which module drives the canvas.
   *
   * Six searching questions share `algorithmSlug: "binary-search"`, so arriving
   * from one of their cards used to animate a plain binary search over an
   * unrelated array. When the question has its own module, play that instead —
   * the URL still names the algorithm, which keeps the header, complexity strip
   * and session recording pointed at the catalog entry.
   *
   * The question must belong to *this* algorithm. `?problem=` is user-editable,
   * and `validateSearch` only checks the slug exists — without this, a hand-typed
   * `/algorithms/quicksort?problem=koko-eating-bananas` would play Koko under a
   * quicksort header. Same stance `resolvePracticeSlug` takes on the same param.
   */
  const problemMod =
    search.problem && getProblem(search.problem)?.algorithmSlug === slug
      ? getModuleForProblem(search.problem)
      : undefined;
  const mod = problemMod ?? getModule(slug);
  /** The slug the player store loads: the question's when it has a module. */
  const modSlug = problemMod?.slug ?? slug;

  /**
   * The heading names whatever is actually on the canvas. Playing Koko under a
   * plain "Binary Search" title misdescribes the screen — the array, the counters
   * and the narration are all about eating speeds. The algorithm is still one
   * line up in the breadcrumb, so the technique being taught is not lost, and
   * the difficulty follows the same source so an easy question cannot inherit a
   * medium algorithm's badge.
   */
  const problemForTitle = problemMod ? getProblem(problemMod.slug) : undefined;
  const learningProblemSlug = problemForTitle?.slug;
  const heading = problemForTitle?.title ?? algo?.name ?? slug;
  const headingDifficulty = problemForTitle?.difficulty ?? algo?.difficulty;

  /**
   * The Code stage's implementation challenge, mapped in the algorithm catalog.
   * Null hides the chip and the Trace CTA rather than routing to a 404.
   */
  const codeSlug = React.useMemo(
    () =>
      learningProblemSlug
        ? resolveQuestionImplementationSlug(learningProblemSlug)
        : resolveImplementationSlug(slug),
    [learningProblemSlug, slug],
  );

  /**
   * Null for algorithms with no linked question — the button renders disabled.
   * Resolved away from the implementation challenge so Solve (apply the
   * technique elsewhere) never reopens Code (write the technique).
   */
  const practiceSlug = React.useMemo(
    () =>
      learningProblemSlug
        ? resolveQuestionTransferSlug(learningProblemSlug)
        : resolveTransferSlug(slug, undefined, undefined, codeSlug),
    [slug, learningProblemSlug, codeSlug],
  );

  const load = usePlayerStore((s) => s.load);
  const seek = usePlayerStore((s) => s.seek);
  const run = usePlayerStore((s) => s.run);
  const index = usePlayerStore((s) => s.index);
  const rawInputs = usePlayerStore((s) => s.rawInputs);

  const [customInputOpen, setCustomInputOpen] = React.useState(false);

  const hydrated = useHydrated();
  const { streak, xp, level } = useHeaderStats();
  const formatXp = (val: number): string => val.toLocaleString("en-US");

  const lesson = React.useMemo(
    () => (algo ? (getLessonByAlgorithm(algo.slug) ?? null) : null),
    [algo],
  );
  const lessonCompleted = useProgressStore((s) =>
    lesson ? Boolean(s.lessons[lesson.slug]?.completedAt) : false,
  );
  const lessonDone = hydrated && lessonCompleted;
  const lessonMastery = useProgressStore((s) => {
    if (!lesson) return 0;
    const p = s.lessons[lesson.slug];
    if (!p) return 0;
    return p.quizScore ?? (p.completedAt ? 100 : 0);
  });
  /* Mastery only reads after hydration so SSR and the first client paint agree. */
  const masteryPct = hydrated ? lessonMastery : 0;

  /* CODE completion is derived from the mapped problem's solved state — the one
     existing source of truth — never from a separate lesson-stage flag. */
  const codeSolved = useProgressStore((s) => isImplementationSolved(codeSlug, s));
  const codeComplete = hydrated && codeSolved;

  /* SOLVE completion reads the transfer question's own solved state: opening it,
     running tests or a failed submit all leave this false. */
  const transferSolved = useProgressStore((s) => isTransferSolved(practiceSlug, s));
  const solveComplete = hydrated && transferSolved;

  /* REVIEW reports the existing SRS card's schedule — due, scheduled or graded
     today — and stays inert for algorithms without a curated recall set. */
  const reviewAvailable = React.useMemo(
    () => hasReviewSet(slug, learningProblemSlug),
    [slug, learningProblemSlug],
  );
  const reviewKey = learningProblemSlug ?? slug;
  const reviewCard = useProgressStore((s) => s.reviewCards[reviewKey]);
  const reviewState = hydrated ? reviewStageState(reviewCard) : "none";

  const completeLesson = useProgressStore((s) => s.completeLesson);
  const awardXp = useProgressStore((s) => s.awardXp);
  const touchStreak = useProgressStore((s) => s.touchStreak);

  const onCompleteLesson = (): void => {
    if (!lesson || lessonDone) return;
    completeLesson(lesson.slug, 100);
    const { leveledUp, newLevel } = awardXp(lesson.xp, `lesson:${lesson.slug}`);
    touchStreak();
    toast.success(`+${lesson.xp} XP — lesson complete`, {
      description: leveledUp ? `Level ${newLevel} unlocked. ${lesson.title}` : lesson.title,
    });
  };

  /* record time, steps watched, streak and completion XP into progressStore */
  useSession({
    slug: algo ? slug : null,
    index,
    totalSteps: run?.steps.length ?? 0,
    enabled: Boolean(run),
  });

  /* mount: load from the deep link, else the module's first preset */
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    restoredRef.current = false;
  }, [modSlug]);

  React.useEffect(() => {
    if (!mod || restoredRef.current) return;
    const fromLink = search.input ? decodeInputs(search.input) : null;
    const preset = mod.presets[0]?.values;
    load(modSlug, fromLink ?? preset);
    if (search.step !== undefined) seek(search.step);
    restoredRef.current = true;
  }, [mod, modSlug, load, seek, search.input, search.step]);

  /* write input + step back into the URL, debounced */
  React.useEffect(() => {
    if (!run) return;
    const handle = window.setTimeout(() => {
      /* A route transition can keep this screen mounted briefly. Do not let a
         stale player sync rewrite the destination back into an algorithm URL. */
      if (window.location.pathname !== `/algorithms/${slug}`) return;
      void navigate({
        search: (prev: AlgorithmSearch) => mergePlayerSearch(prev, encodeInputs(rawInputs), index),
        replace: true,
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [run, rawInputs, index, navigate, slug]);

  const shareUrl = React.useCallback((): string => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("input", encodeInputs(rawInputs));
    url.searchParams.set("step", String(index));
    return url.toString();
  }, [rawInputs, index]);

  if (!algo) {
    return (
      <div className="flex h-screen w-full flex-col bg-background">
        <main className="flex-1 items-center justify-center p-8">
          <EmptyState
            icon={MonitorPlay}
            title="Algorithm not found"
            description={`We do not have an algorithm called "${slug}".`}
          />
        </main>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden bg-paper",
        !isTrace && modSlug === "trapping-rain-water" && "focused-visualizer",
      )}
    >
      <DesktopScaleFrame className="min-h-0 flex-1" scaleNarrow={false}>
        <div className="flex h-full w-full flex-col bg-paper">
          {/* Top Nav (Global) */}
          <header className="flex min-h-[60px] shrink-0 items-center justify-between border-b border-hairline bg-card px-4 sm:px-6 lg:h-[68px] lg:px-12 xl:px-24">
            <div className="flex min-w-0 items-center gap-6 lg:gap-12">
              <Link to="/" className="flex items-center gap-2">
                <AlgoraGlyph />
                <span className="font-mono text-[22px] font-medium tracking-tight text-foreground">
                  algora
                </span>
              </Link>
              <nav className="hidden items-center gap-8 font-mono text-[14px] lg:flex">
                <Link
                  to="/explore"
                  className="flex items-center gap-2 text-slate hover:text-ink transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                  Explore
                </Link>
                <Link
                  to="/algorithms/$slug"
                  params={{ slug }}
                  className="flex items-center gap-2 text-primary font-medium"
                >
                  <MonitorPlay size={16} />
                  Visualizer
                </Link>
                <Link
                  to="/practice/$slug"
                  params={{ slug: practiceSlug ?? slug }}
                  disabled={!practiceSlug}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    practiceSlug
                      ? "text-slate hover:text-ink"
                      : "pointer-events-none cursor-default text-slate/40",
                  )}
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Practice
                </Link>
                <Link
                  to="/explore"
                  className="flex items-center gap-2 text-slate hover:text-ink transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Playground
                </Link>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <span className="inline-flex h-9 items-center gap-2 rounded-full bg-tint px-3 font-mono text-[13px] text-primary">
                <Flame className="h-4 w-4 text-primary" strokeWidth={1.8} /> {streak}
              </span>
              <span className="hidden h-9 items-center rounded-full border border-hairline px-3 font-mono text-[13px] text-ink sm:inline-flex">
                {formatXp(xp)} XP
              </span>
              <button
                aria-label="Notifications"
                className="hidden text-slate transition-colors hover:text-ink sm:block"
              >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-mono text-[12px] text-primary">
                AL
              </span>
            </div>
          </header>

          {/* Main Workspace */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4 lg:px-8 lg:py-2 xl:px-12 2xl:px-20">
            {/* One compact lesson context row, then the learning-stage strip */}
            <div className="mb-3 flex shrink-0 flex-col gap-2">
              <LessonContextRow
                heading={heading}
                difficulty={headingDifficulty}
                estMinutes={lesson?.estMinutes ?? algo.estMinutes}
                complexity={algo.timeAvg}
                masteryPct={masteryPct}
                practiceSlug={practiceSlug}
              />
              <div className="flex items-center justify-between gap-3">
                <LessonStageStrip
                  active={isTrace ? "trace" : "visualize"}
                  practiceSlug={practiceSlug}
                  algorithmSlug={slug}
                  problemSlug={learningProblemSlug}
                  traceAvailable={traceExercise !== undefined}
                  codeSlug={codeSlug}
                  codeComplete={codeComplete}
                  solveComplete={solveComplete}
                  reviewAvailable={reviewAvailable}
                  reviewState={reviewState}
                />
                <button
                  type="button"
                  onClick={onCompleteLesson}
                  disabled={lessonDone || !lesson}
                  aria-pressed={lessonDone}
                  className={cn(
                    "inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 font-sans text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    lessonDone
                      ? "cursor-default border-primary/30 bg-tint text-primary"
                      : "cursor-pointer border-hairline text-ink hover:bg-tint",
                  )}
                >
                  {lessonDone ? (
                    <Check size={14} strokeWidth={2} />
                  ) : (
                    <Bookmark size={14} strokeWidth={1.5} />
                  )}
                  {lessonDone ? "Saved" : "Bookmark"}
                </button>
              </div>
            </div>

            {/* Guided: algorithm world | code + reasoning, playback band below.
                Trace: the learner's own world | the one active question. */}
            {isTrace ? (
              <TraceStoreProvider store={traceStore}>
                <TraceWorkspace
                  exercise={traceExercise}
                  algoName={heading}
                  codeSlug={codeSlug}
                  algorithmSlug={slug}
                  problemSlug={learningProblemSlug}
                />
              </TraceStoreProvider>
            ) : (
              <GoldenWorkspace algo={algo} module={mod} slug={modSlug} />
            )}
          </main>
        </div>
      </DesktopScaleFrame>

      {mod && (
        <CustomInputModal
          isOpen={customInputOpen}
          onClose={() => setCustomInputOpen(false)}
          module={mod}
          slug={modSlug}
        />
      )}
    </div>
  );
}
