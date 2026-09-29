import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  Circle,
  Lightbulb,
  Lock,
  Maximize2,
  Play,
  RotateCw,
  Send,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { fetchProblem, getProblem } from "@/content/problems";
import type { Problem } from "@/content/types";
import { getAlgorithm } from "@/content/algorithms";
import type { PracticeSearch } from "@/lib/practice-search";
import { validatePracticeSearch } from "@/lib/practice-search";
import { useHydrated } from "@/hooks/useHydrated";
import { useTestRunner } from "@/hooks/useTestRunner";
import { formatArgs, solveXp, type RunnerLang, type TestResult } from "@/lib/runner";
import { dayKey, useProgressStore } from "@/stores/progressStore";
import { useResultStore } from "@/stores/resultStore";

export const Route = createFileRoute("/practice/$slug")({
  /* Lightweight origin context only. Solved state stays authoritative, so a
     direct visit with no params renders exactly the same workspace. */
  validateSearch: (search: Record<string, unknown>): PracticeSearch =>
    validatePracticeSearch(search),
  loader: async ({ params }) => {
    const problem = await fetchProblem(params.slug);
    if (!problem) throw notFound();
    return { problem };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Challenge unavailable — Algora" }, { name: "robots", content: "noindex" }],
      };
    }
    const { problem } = loaderData;
    const description = `Solve ${problem.title} in a light-theme editor with live test cases, staged hints and instant XP rewards.`;
    return {
      meta: [
        { title: `${problem.title} practice challenge — Algora` },
        { name: "description", content: description },
        { property: "og:title", content: `${problem.title} practice challenge — Algora` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PracticeChallenge,
  notFoundComponent: ChallengeNotFound,
});

/* ---------------- language tabs ---------------- */

const LANGS: { id: RunnerLang; label: string }[] = [
  { id: "py", label: "Python" },
  { id: "js", label: "JavaScript" },
  { id: "ts", label: "TypeScript" },
];

const DIFFICULTY_CLASS: Record<Problem["difficulty"], string> = {
  easy: "border-primary bg-primary-tint text-primary",
  medium: "border-warning bg-warning-tint text-warning",
  hard: "border-destructive bg-destructive/10 text-destructive",
};

/** Renders `backticked` spans of a statement paragraph in the mono face. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
          <span key={i} className="font-mono">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ---------------- editor ---------------- */

interface EditorProps {
  code: string;
  lang: RunnerLang;
  langOpen: boolean;
  onToggleLang: () => void;
  onPickLang: (lang: RunnerLang) => void;
  onChange: (code: string) => void;
  onReset: () => void;
}

function CodeEditor({
  code,
  lang,
  langOpen,
  onToggleLang,
  onPickLang,
  onChange,
  onReset,
}: EditorProps) {
  const lineCount = Math.max(code.split("\n").length, 13);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);
  const gutterRef = useRef<HTMLDivElement>(null);

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-hairline bg-card">
      <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-hairline px-5">
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            onClick={onToggleLang}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-card px-4 font-mono text-[13px] text-foreground hover:bg-secondary"
          >
            {LANGS.find((l) => l.id === lang)?.label}
            <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          </button>
          {langOpen && (
            <ul
              role="listbox"
              className="absolute left-0 top-11 z-20 w-[168px] overflow-hidden rounded-xl border border-hairline bg-card py-1 shadow-lg"
            >
              {LANGS.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={l.id === lang}
                    onClick={() => onPickLang(l.id)}
                    className={`flex w-full items-center justify-between px-4 py-2 font-mono text-[12.5px] hover:bg-secondary ${
                      l.id === lang ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {l.label}
                    {l.id === lang && <Check className="h-3.5 w-3.5" strokeWidth={2.2} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 font-mono text-[13px] text-primary hover:underline"
        >
          <RotateCw className="h-4 w-4" strokeWidth={1.8} /> Reset code
        </button>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden py-2">
        <div
          ref={gutterRef}
          aria-hidden
          className="w-12 shrink-0 overflow-hidden pr-4 text-right font-mono text-[11.5px] leading-[21px] text-muted-foreground"
        >
          {lines.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          spellCheck={false}
          aria-label="Solution code editor"
          className="min-h-0 min-w-0 flex-1 resize-none whitespace-pre border-l border-hairline bg-transparent pl-4 pr-4 font-mono text-[11.5px] leading-[21px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
    </section>
  );
}

/* ---------------- test cases ---------------- */

function statusLabel(result: TestResult): string {
  if (result.outcome === "pass") return "Passed";
  if (result.outcome === "fail") return "Failed";
  if (result.outcome === "error") return "Error";
  return "Not run";
}

interface TestCasesProps {
  problem: Problem;
  results: TestResult[];
  error: string | null;
  running: boolean;
  showHidden: boolean;
  onToggleHidden: () => void;
}

function TestCases({
  problem,
  results,
  error,
  running,
  showHidden,
  onToggleHidden,
}: TestCasesProps) {
  const visible = showHidden ? problem.tests : problem.tests.filter((t) => !t.hidden);
  const hiddenCount = problem.tests.filter((t) => t.hidden).length;

  return (
    <section className="shrink-0 rounded-2xl border border-hairline bg-card">
      <div className="flex h-[52px] items-center justify-between border-b border-hairline px-5">
        <h2 className="text-[15px] font-semibold text-foreground">Test cases</h2>
        <button
          type="button"
          onClick={onToggleHidden}
          className="inline-flex items-center gap-2 font-mono text-[12.5px] text-muted-foreground hover:text-primary"
        >
          {showHidden
            ? "Show sample cases"
            : `View all test cases${hiddenCount ? ` (+${hiddenCount})` : ""}`}
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2.5 border-b border-hairline bg-destructive/5 px-5 py-3 font-mono text-[12px] leading-[19px] text-destructive">
          <X className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}
      <div className="divide-y divide-hairline">
        {visible.map((test, i) => {
          const result =
            results.find((r) => r.id === test.id) ??
            ({ id: test.id, outcome: "idle", actual: "—", expected: "—", ms: null } as TestResult);
          const passed = result.outcome === "pass";
          const bad = result.outcome === "fail" || result.outcome === "error";
          return (
            <div key={test.id} className="flex items-center gap-4 px-5 py-3">
              <span className="flex w-[124px] shrink-0 items-center gap-2.5">
                {passed ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                ) : bad ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive">
                    <X className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </span>
                ) : (
                  <Circle className="h-[18px] w-[18px] text-hairline" strokeWidth={1.8} />
                )}
                <span className="font-mono text-[13px] text-foreground">Test case {i + 1}</span>
              </span>
              <span className="min-w-0 flex-1 font-mono text-[12px] leading-[19px] text-muted-foreground">
                <div className="truncate">
                  Input: <span className="text-foreground">{formatArgs(test.input)}</span>
                </div>
                <div className="truncate">
                  Output: <span className="text-foreground">{running ? "…" : result.actual}</span>
                  <span className="px-1.5 text-hairline">·</span>
                  Expected: <span className="text-foreground">{result.expected}</span>
                </div>
              </span>
              <span
                className={`ml-auto inline-flex h-7 w-[76px] shrink-0 items-center justify-center rounded-lg font-mono text-[12px] ${
                  passed
                    ? "bg-primary-tint text-primary"
                    : bad
                      ? "bg-destructive/10 text-destructive"
                      : "border border-hairline bg-card text-muted-foreground"
                }`}
              >
                {running ? "Running" : statusLabel(result)}
              </span>
              <span className="w-[44px] shrink-0 text-right font-mono text-[12px] text-muted-foreground">
                {result.ms === null ? "—" : `${result.ms} ms`}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- page ---------------- */

const TABS = ["Description", "Hints", "Solutions"] as const;
type Tab = (typeof TABS)[number];

function ChallengeNotFound() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <AppSidebar active="Practice" collapsible />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Practice", "Not found"]} />
        <main className="flex min-h-0 flex-1 items-center justify-center px-6 py-4">
          <div className="rounded-2xl border border-hairline bg-card px-8 py-10 text-center">
            <h1 className="text-[22px] font-semibold text-foreground">Challenge not found</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              That practice problem does not exist yet.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function useElapsed(): string {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function PracticeChallenge() {
  const { problem } = Route.useLoaderData() as { problem: Problem };
  const search = Route.useSearch();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const timer = useElapsed();

  /* JavaScript first because it is the only language pair the worker can
     actually execute — see the Python note below the Run bar. */
  const [lang, setLang] = useState<RunnerLang>("js");
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("Description");
  const [hintsShown, setHintsShown] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [drafts, setDrafts] = useState<Record<RunnerLang, string>>(problem.starterCode);

  const stored = useProgressStore((s) => s.problems[problem.slug]);
  const bookmarked = useProgressStore((s) => s.bookmarks.includes(problem.slug));
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const markSolved = useProgressStore((s) => s.markSolved);
  const awardXp = useProgressStore((s) => s.awardXp);
  const touchStreak = useProgressStore((s) => s.touchStreak);
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);
  const setLastResult = useResultStore((s) => s.setLast);

  const runner = useTestRunner(problem.tests, problem.io);
  /** The worker executes JavaScript only; Python is editable but not runnable. */
  const langRunnable = lang !== "py";
  /* Only shown when the learner actually arrived from a lesson and the named
     algorithm resolves in the catalog. */
  const lessonAlgorithm =
    search.from === "lesson" && search.algorithm ? getAlgorithm(search.algorithm) : undefined;
  const solved = hydrated && Boolean(stored?.solvedAt);
  const attempts = hydrated ? (stored?.attempts ?? 0) : 0;
  const xpOffer = useMemo(
    () => (solved ? 0 : solveXp(problem.xp, attempts + 1, hintsShown)),
    [attempts, hintsShown, problem.xp, solved],
  );

  // Restore the last saved draft once persisted state is available.
  const restored = useRef(false);
  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    const last = stored?.lastCode;
    if (!last) return;
    setDrafts((d) => ({
      py: last.py || d.py,
      js: last.js || d.js,
      ts: last.ts || d.ts,
    }));
  }, [hydrated, stored]);

  const code = drafts[lang];
  const setCode = useCallback((next: string) => setDrafts((d) => ({ ...d, [lang]: next })), [lang]);

  const pickLang = useCallback(
    (next: RunnerLang) => {
      setLang(next);
      setLangOpen(false);
      runner.reset();
    },
    [runner],
  );

  const resetCode = useCallback(() => {
    setDrafts((d) => ({ ...d, [lang]: problem.starterCode[lang] }));
    runner.reset();
  }, [lang, problem.starterCode, runner]);

  const handleRun = useCallback(async () => {
    if (!langRunnable) return;
    const sample = problem.tests.filter((t) => !t.hidden);
    setShowHidden(false);
    const result = await runner.run(code, lang, sample);
    if (result.error) return;
    if (result.summary?.verdict === "accepted") {
      toast.success("Sample tests passed", { description: "Submit to run the hidden tests too." });
    }
  }, [code, lang, langRunnable, problem.tests, runner]);

  const handleSubmit = useCallback(async () => {
    if (!langRunnable) return;
    setShowHidden(true);
    recordAttempt(problem.slug, code, lang);
    const result = await runner.run(code, lang, problem.tests);
    if (result.error) {
      toast.error("Submission could not run", { description: result.error });
      return;
    }
    const summary = result.summary;
    if (!summary) return;
    if (summary.verdict !== "accepted") {
      toast.error(`${summary.passed}/${summary.total} tests passed`, {
        description: "Check the failing cases below and try again.",
      });
      return;
    }
    const firstSolve = !stored?.solvedAt;
    markSolved(problem.slug, summary.totalMs);
    touchStreak();
    let gained = 0;
    if (firstSolve) {
      gained = solveXp(problem.xp, attempts + 1, hintsShown);
      awardXp(gained, `problem:${problem.slug}`);
      toast.success(`Accepted — +${gained} XP`, {
        description: `${summary.total} tests passed in ${summary.totalMs} ms.`,
      });
    } else {
      toast.success("Accepted", { description: `${summary.total} tests passed again.` });
    }
    setLastResult({
      problemSlug: problem.slug,
      passed: summary.passed,
      total: summary.total,
      runtimeMs: summary.totalMs,
      attempts: attempts + 1,
      hintsUsed: hintsShown,
      xpAwarded: gained,
      lang,
      solvedToday: useProgressStore.getState().activity[dayKey()]?.solved ?? 0,
      ...(search.from === "lesson" ? { from: "lesson" as const } : {}),
      ...(lessonAlgorithm ? { algorithmSlug: lessonAlgorithm.slug } : {}),
      ...(search.stage ? { stage: search.stage } : {}),
      ...(search.problem ? { lessonProblemSlug: search.problem } : {}),
    });
    void navigate({ to: "/practice/results" });
  }, [
    attempts,
    awardXp,
    code,
    hintsShown,
    lang,
    langRunnable,
    lessonAlgorithm,
    markSolved,
    navigate,
    problem,
    recordAttempt,
    runner,
    setLastResult,
    search.from,
    search.problem,
    search.stage,
    stored,
    touchStreak,
  ]);

  const algorithm = getAlgorithm(problem.algorithmSlug);
  const rawCategory = algorithm?.category ?? "Practice";
  const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
  const statementParagraphs = problem.statementMarkdown.split("\n\n");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar active="Practice" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Practice", category, problem.title]} timer={timer} />

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-3 py-3 sm:px-4 lg:grid-cols-[minmax(0,470px)_minmax(0,1fr)] lg:overflow-hidden lg:px-6 lg:py-4">
          {/* Problem pane */}
          <section className="flex min-h-[640px] flex-col rounded-2xl border border-hairline bg-card lg:min-h-0">
            <div className="flex h-[52px] shrink-0 items-center gap-7 border-b border-hairline px-6">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  aria-current={tab === t}
                  className={`relative h-full font-sans text-[14px] ${
                    tab === t
                      ? "font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                  {tab === t && (
                    <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
              {lessonAlgorithm && (
                <div className="mb-3 flex flex-wrap items-center gap-x-2 font-mono text-[11.5px] text-muted-foreground">
                  <Link
                    to="/algorithms/$slug"
                    params={{ slug: lessonAlgorithm.slug }}
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-primary hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {lessonAlgorithm.name}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">
                    {search.stage === "solve"
                      ? "Solve stage \u00b7 Apply the pattern"
                      : search.stage === "code"
                        ? "Code stage \u2014 now implement it"
                        : "Lesson"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <span
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[12px] capitalize ${DIFFICULTY_CLASS[problem.difficulty]}`}
                >
                  {problem.difficulty}
                </span>
                <span className="rounded-lg border border-hairline bg-primary-tint px-2.5 py-1 font-mono text-[12px] text-primary">
                  {algorithm?.name ?? category}
                </span>
                {solved && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary-tint px-2.5 py-1 font-mono text-[12px] text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Solved
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="text-[26px] font-semibold leading-none tracking-tight text-foreground">
                  {problem.title}
                </h1>
                <button
                  type="button"
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark problem"}
                  aria-pressed={bookmarked}
                  onClick={() => toggleBookmark(problem.slug)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-card hover:bg-secondary ${
                    bookmarked
                      ? "border-primary text-primary"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`}
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              {tab === "Description" && (
                <>
                  {statementParagraphs.map((p, i) => (
                    <p
                      key={i}
                      className={`text-[13px] leading-[1.65] ${
                        i === statementParagraphs.length - 1 && statementParagraphs.length > 2
                          ? "mt-2.5 font-medium text-foreground"
                          : `${i === 0 ? "mt-3" : "mt-2.5"} text-muted-foreground`
                      }`}
                    >
                      <InlineCode text={p} />
                    </p>
                  ))}

                  {problem.examples.map((ex, i) => (
                    <div key={i} className="mt-4 border-t border-hairline pt-3">
                      <div className="text-[13px] font-semibold text-foreground">
                        Example {i + 1}:
                      </div>
                      <div className="mt-2 space-y-1.5 rounded-xl border border-hairline bg-background px-4 py-3 font-mono text-[12px] text-muted-foreground">
                        <div>
                          <span className="font-semibold text-foreground">Input:</span> {ex.input}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Output:</span> {ex.output}
                        </div>
                        {ex.explanation && (
                          <div>
                            <span className="font-semibold text-foreground">Explanation:</span>{" "}
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 border-t border-hairline pb-6 pt-3">
                    <div className="text-[13px] font-semibold text-foreground">Constraints:</div>
                    <ul className="mt-2 space-y-1.5 font-mono text-[12px] text-muted-foreground">
                      {problem.constraints.map((c) => (
                        <li key={c} className="flex gap-2.5">
                          <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {tab === "Hints" && (
                <div className="mt-4 space-y-3 pb-6">
                  {problem.hints.map((hint, i) => {
                    const revealed = i < hintsShown;
                    return (
                      <div
                        key={hint}
                        className="rounded-xl border border-hairline bg-background px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                            <Lightbulb className="h-4 w-4 text-primary" strokeWidth={1.8} /> Hint{" "}
                            {i + 1}
                          </span>
                          {!revealed && i === hintsShown && (
                            <button
                              type="button"
                              onClick={() => setHintsShown(i + 1)}
                              className="font-mono text-[12px] text-primary hover:underline"
                            >
                              Reveal (−10% XP)
                            </button>
                          )}
                        </div>
                        <p className="mt-2 text-[13px] leading-[1.65] text-foreground">
                          {revealed ? (
                            hint
                          ) : (
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
                              {i === hintsShown
                                ? "Locked — reveal to read"
                                : "Reveal the previous hint first"}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "Solutions" && (
                <div className="mt-4 pb-6">
                  {solved ? (
                    <div className="space-y-3">
                      <p className="text-[13px] leading-[1.65] text-muted-foreground">
                        Your accepted approach ran in {stored?.bestRuntimeMs ?? 0} ms across{" "}
                        {problem.tests.length} tests.
                      </p>
                      {algorithm && (
                        <div className="rounded-xl border border-hairline bg-background px-4 py-3">
                          <div className="font-mono text-[12px] text-muted-foreground">
                            Reference technique
                          </div>
                          <p className="mt-1.5 text-[13px] text-foreground">
                            {algorithm.name} — {algorithm.oneLiner}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-hairline bg-background px-4 py-6 text-center">
                      <Lock className="mx-auto h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        Solutions unlock once you submit an accepted answer.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex h-[52px] shrink-0 items-center gap-5 border-t border-hairline px-6">
              <span className="inline-flex items-center gap-2 font-mono text-[12.5px] text-foreground">
                <ThumbsUp className="h-4 w-4 text-primary" strokeWidth={1.8} /> 92%
              </span>
              <span className="font-mono text-[12.5px] text-muted-foreground">
                {attempts > 0 ? `${attempts} attempt${attempts === 1 ? "" : "s"} · ` : ""}
                {problem.tests.length} tests
              </span>
            </div>
          </section>

          {/* Editor column */}
          <div className="flex min-h-[780px] flex-col gap-4 lg:min-h-0">
            <CodeEditor
              code={code}
              lang={lang}
              langOpen={langOpen}
              onToggleLang={() => setLangOpen((o) => !o)}
              onPickLang={pickLang}
              onChange={setCode}
              onReset={resetCode}
            />
            <TestCases
              problem={problem}
              results={runner.results}
              error={runner.error}
              running={runner.status === "running"}
              showHidden={showHidden}
              onToggleHidden={() => setShowHidden((v) => !v)}
            />

            <div className="mt-auto flex shrink-0 flex-col gap-2.5 rounded-2xl border border-hairline bg-card px-5 py-3.5">
              {!langRunnable && (
                <p
                  role="status"
                  className="font-mono text-[12px] leading-[18px] text-muted-foreground"
                >
                  Python execution is not available yet — switch to JavaScript or TypeScript to run
                  the tests. You can still write and save Python here.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={runner.status === "running" || !langRunnable}
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-primary bg-card px-6 font-sans text-[14px] font-medium text-primary hover:bg-primary-tint disabled:opacity-60"
                >
                  <Play className="h-4 w-4 fill-current" strokeWidth={0} />{" "}
                  {runner.status === "running" ? "Running…" : "Run"}
                </button>
                <div className="ml-auto flex items-center gap-2 sm:gap-4">
                  <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/40 bg-card px-4 font-mono text-[12.5px] text-primary">
                    <Star className="h-3.5 w-3.5" strokeWidth={1.8} />{" "}
                    {solved ? "Solved" : `+${xpOffer} XP`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={runner.status === "running" || !langRunnable}
                    className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-primary px-7 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow disabled:opacity-60"
                  >
                    Submit <Send className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
