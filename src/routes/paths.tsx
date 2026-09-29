import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Check,
  Lock,
  Target,
  Trophy,
  BookOpen,
  Code2,
  CalendarCheck,
  Play,
  ArrowRight,
  Layers,
  Flag,
} from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { getAlgorithm } from "@/content/algorithms";
import { getPaths } from "@/content/paths";
import { useHydrated } from "@/hooks/useHydrated";
import { baselineProgress, useProgressStore, type ProgressData } from "@/stores/progressStore";

export const Route = createFileRoute("/paths")({
  component: PathsPage,
  head: () => ({
    meta: [
      { title: "Guided Paths — Algora" },
      {
        name: "description",
        content:
          "Structured, gamified tracks that take you from confused to confident — learn a concept, visualize it, then lock it in.",
      },
      { property: "og:title", content: "Guided Paths — Algora" },
      {
        property: "og:description",
        content:
          "A clear route from confused to confident. Structured tracks with mastery unlocks and spaced repetition.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

/* -------------------------------------------------------------------------- */
/* Hero Header                                                                */
/* -------------------------------------------------------------------------- */
function Hero({ onChoose }: { onChoose: () => void }) {
  const navigate = useNavigate();
  return (
    <section className="text-center pt-6 pb-14">
      {/* Top Pill Badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-accent-strong/20 bg-tint px-3.5 py-1 font-mono text-[11px] font-medium tracking-wider text-accent-strong">
        <span className="text-[9px]">◆</span> GUIDED PATHS
      </div>

      {/* Heading */}
      <h1 className="mt-5 font-display text-[46px] sm:text-[58px] lg:text-[66px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink">
        A clear route from
        <br />
        confused to confident{" "}
        <span className="inline-block h-3.5 w-3.5 bg-accent-strong align-baseline rounded-[1px] ml-0.5" />
      </h1>

      {/* Subtitle */}
      <p className="mt-5 max-w-[620px] mx-auto font-sans text-[16px] sm:text-[17px] leading-relaxed text-slate">
        Structured, gamified tracks that take you step by step —
        <br className="hidden sm:inline" /> learn a concept, visualize it, then lock it in.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={onChoose}
          className="rounded-lg bg-accent-strong hover:bg-accent-strong/90 text-white font-sans text-[14px] font-medium px-6 py-3 transition-colors shadow-sm"
        >
          Choose your path
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/explore" })}
          className="rounded-lg border border-hairline bg-card hover:bg-paper text-ink font-sans text-[14px] font-medium px-6 py-3 transition-colors"
        >
          Browse all lessons
        </button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Path Cards Grid                                                            */
/* -------------------------------------------------------------------------- */
type PathCard = {
  slug: string;
  level: string;
  title: string;
  desc: string;
  progress: number;
  lessons: number;
  hours: number;
  bullets: string[];
  steps: { done: boolean; current?: boolean }[];
  active: boolean;
  foundation: boolean;
  nextSlug: string | null;
  icon: React.ReactNode;
};

const PATH_META: Record<string, { level: string; foundation?: boolean; icon: React.ReactNode }> = {
  "interview-prep": {
    level: "INTERMEDIATE",
    icon: <Target size={22} className="text-accent-strong" />,
  },
  "data-structures": {
    level: "BEGINNER",
    foundation: true,
    icon: <Layers size={22} className="text-accent-strong" />,
  },
  "competitive-programming": {
    level: "ADVANCED",
    icon: <Trophy size={22} className="text-accent-strong" />,
  },
};

function buildPathCards(progress: ProgressData, activeSlug: string | null): PathCard[] {
  const pctOf = (slug: string) => progress.algorithms[slug]?.masteryPct ?? 0;

  return getPaths().map((path) => {
    const allSlugs = path.modules.flatMap((m) => m.itemSlugs);
    const unique = Array.from(new Set(allSlugs));
    const totalPct = unique.reduce((sum, s) => sum + pctOf(s), 0);
    const pct = unique.length === 0 ? 0 : Math.round(totalPct / unique.length);
    const minutes = unique.reduce((sum, s) => sum + (getAlgorithm(s)?.estMinutes ?? 20), 0);

    const moduleDone = path.modules.map(
      (m) => m.itemSlugs.length > 0 && m.itemSlugs.every((s) => pctOf(s) >= 80),
    );
    const currentIndex = moduleDone.findIndex((d) => !d);
    const nextSlug =
      currentIndex === -1
        ? null
        : (path.modules[currentIndex]!.itemSlugs.find((s) => pctOf(s) < 80) ??
          path.modules[currentIndex]!.itemSlugs[0] ??
          null);

    return {
      slug: path.slug,
      level: PATH_META[path.slug]?.level ?? "INTERMEDIATE",
      title: path.title,
      desc: path.subtitle,
      progress: pct,
      lessons: allSlugs.length,
      hours: Math.max(1, Math.round(minutes / 60)),
      bullets: path.outcomes.slice(0, 3),
      steps: [
        { done: true },
        { done: pct > 20 },
        { done: pct > 40 },
        { done: pct > 60 },
        { done: pct > 80 },
        { done: pct >= 100 },
      ],
      active: activeSlug === path.slug,
      foundation: PATH_META[path.slug]?.foundation ?? false,
      nextSlug,
      icon: PATH_META[path.slug]?.icon ?? <Target size={22} className="text-accent-strong" />,
    };
  });
}

function PathTile({
  card,
  onStart,
  ready,
}: {
  card: PathCard;
  onStart: (card: PathCard) => void;
  ready: boolean;
}) {
  const featured = card.foundation;
  return (
    <div
      data-testid={`path-card-${card.slug}`}
      className={`relative flex flex-col justify-between rounded-2xl border bg-card p-6 transition-all ${
        card.active
          ? "border-accent-strong shadow-1 ring-2 ring-accent-strong/30"
          : featured
            ? "border-accent-strong shadow-1 ring-1 ring-accent-strong/30"
            : "border-hairline hover:border-slate-soft"
      }`}
    >
      {card.active ? (
        <span className="absolute -top-3.5 right-6 rounded-md bg-accent-strong px-3 py-1 font-sans text-xs font-semibold text-white shadow-sm">
          Current path
        </span>
      ) : featured ? (
        <span className="absolute -top-3.5 right-6 bg-accent-strong text-white font-sans text-xs font-semibold px-3 py-1 rounded-md shadow-sm">
          Foundation path
        </span>
      ) : null}

      <div>
        {/* Header Badge + Icon */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium tracking-wider text-slate uppercase bg-paper border border-hairline rounded px-2.5 py-1">
            {card.level}
          </span>
          {card.icon}
        </div>

        {/* Title & Subtitle */}
        <h2 className="mt-5 font-display text-[22px] font-semibold text-ink leading-tight">
          {card.title}
        </h2>
        <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-slate">{card.desc}</p>

        {/* Progress Bar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-highlight transition-all"
              style={{ width: `${card.progress}%` }}
            />
          </div>
          <span className="font-mono text-xs font-semibold text-ink">{card.progress}%</span>
        </div>

        {/* Lessons & Hours */}
        <div className="mt-3 font-mono text-[12px] text-slate-soft">
          {card.lessons} lessons &nbsp;-&nbsp; {card.hours} hrs
        </div>

        {/* Bullets */}
        <ul className="mt-5 space-y-2.5">
          {card.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 font-sans text-[13.5px] leading-snug text-ink"
            >
              <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-accent-strong text-white">
                <Check size={10} strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div>
        {/* Stepper Node Line */}
        <div className="mt-6 flex items-center justify-between px-1 relative">
          <div className="absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 bg-hairline" />
          {card.steps.map((s, i) => (
            <div key={i} className="relative z-10">
              <span
                className={`inline-flex size-5 items-center justify-center rounded-full border-2 transition-all ${
                  s.done
                    ? "border-accent-strong bg-accent-strong text-white"
                    : "border-hairline bg-card text-slate-soft"
                }`}
              >
                {s.done && <Check size={10} strokeWidth={3} />}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          aria-pressed={card.active}
          disabled={!ready}
          onClick={() => onStart(card)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-hairline bg-card px-4 py-3 font-sans text-[14px] font-medium text-ink transition-colors hover:border-slate-soft hover:bg-paper disabled:opacity-60"
        >
          {card.progress >= 100
            ? "Review path"
            : card.progress > 0
              ? "Continue path"
              : "Start path"}{" "}
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function PathsGrid({
  cards,
  onStart,
  ready,
}: {
  cards: PathCard[];
  onStart: (card: PathCard) => void;
  ready: boolean;
}) {
  return (
    <section id="paths-grid" className="mx-auto max-w-[1240px] px-6 pt-4">
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <PathTile key={c.slug} card={c} onStart={onStart} ready={ready} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Mastery Tree Node Graph Component with Vector Connector Lines              */
/* -------------------------------------------------------------------------- */
function NodeItem({ label, state }: { label: string; state: "done" | "current" | "locked" }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div
        className={`size-9 rounded-full flex items-center justify-center border-2 transition-all ${
          state === "done"
            ? "border-accent-strong bg-accent-strong text-white"
            : state === "current"
              ? "border-accent-strong bg-card text-accent-strong ring-4 ring-tint"
              : "border-hairline bg-paper text-slate-soft"
        }`}
      >
        {state === "done" && <Check size={14} strokeWidth={3} />}
        {state === "current" && <span className="size-2 rounded-full bg-highlight" />}
        {state === "locked" && <Lock size={12} strokeWidth={1.5} />}
      </div>
      <span className="mt-2 font-sans text-[12px] font-medium text-ink text-center max-w-[90px] leading-tight">
        {label}
      </span>
    </div>
  );
}

function MasteryMapSection() {
  return (
    <section className="mx-auto my-12 max-w-[1240px] px-6">
      <div className="rounded-2xl border border-hairline bg-card p-8 shadow-1">
        {/* Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6 mb-8">
          <div>
            <h2 className="font-display text-[22px] sm:text-[24px] font-semibold text-ink">
              Unlock nodes as you master concepts.
            </h2>
            <p className="mt-1 font-sans text-sm text-slate">
              Example structure only. Your live Mastery Map uses progress earned on this device.
            </p>
          </div>
          <div className="flex items-center gap-5 font-sans text-xs text-slate">
            <span className="flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-accent-strong text-white flex items-center justify-center">
                <Check size={9} strokeWidth={3} />
              </span>
              Mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-4 rounded-full border-2 border-highlight bg-card" />
              In progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-4 rounded-full border border-hairline bg-paper text-slate-soft flex items-center justify-center">
                <Lock size={8} strokeWidth={1.5} />
              </span>
              Locked
            </span>
          </div>
        </div>

        {/* 3-Tier Node Tree Diagram */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Path timeline"
          className="relative py-4 overflow-x-auto"
        >
          <div className="relative max-w-[1000px] mx-auto min-w-[750px]">
            {/* Top Horizontal Trunk Line */}
            <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-hairline z-0" />

            <div className="grid grid-cols-5 gap-4 items-start relative z-10">
              {/* Col 1: Arrays */}
              <div className="flex flex-col items-center">
                <NodeItem label="Arrays" state="done" />
                {/* Stem down & T-branch split line */}
                <div className="w-full flex flex-col items-center my-2">
                  <div className="h-5 w-[2px] bg-hairline" />
                  <div className="w-[60%] h-[2px] bg-hairline" />
                  <div className="w-[60%] flex justify-between">
                    <div className="h-5 w-[2px] bg-hairline" />
                    <div className="h-5 w-[2px] bg-hairline" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <NodeItem label="Arrays Basics" state="done" />
                  <NodeItem label="Two Pointer Technique" state="done" />
                </div>
              </div>

              {/* Col 2: Sorting */}
              <div className="flex flex-col items-center">
                <NodeItem label="Sorting" state="done" />
                {/* Stem down & T-branch split line */}
                <div className="w-full flex flex-col items-center my-2">
                  <div className="h-5 w-[2px] bg-hairline" />
                  <div className="w-[60%] h-[2px] bg-hairline" />
                  <div className="w-[60%] flex justify-between">
                    <div className="h-5 w-[2px] bg-hairline" />
                    <div className="h-5 w-[2px] bg-hairline" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <NodeItem label="Bubble Sort" state="done" />
                  <NodeItem label="Quick Sort" state="done" />
                </div>
              </div>

              {/* Col 3: Graphs */}
              <div className="flex flex-col items-center">
                <NodeItem label="Graphs" state="done" />
                {/* Stem down & T-branch split line */}
                <div className="w-full flex flex-col items-center my-2">
                  <div className="h-5 w-[2px] bg-hairline" />
                  <div className="w-[60%] h-[2px] bg-hairline" />
                  <div className="w-[60%] flex justify-between">
                    <div className="h-5 w-[2px] bg-hairline" />
                    <div className="h-5 w-[2px] bg-hairline" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <NodeItem label="BFS" state="done" />
                  <NodeItem label="DFS" state="done" />
                </div>
                <div className="h-8 w-[2px] bg-hairline my-2" />
                <NodeItem label="Dijkstra's Algorithm" state="locked" />
              </div>

              {/* Col 4: Dynamic Programming */}
              <div className="flex flex-col items-center">
                <NodeItem label="Dynamic Programming" state="current" />
                <div className="h-14 w-[2px] bg-hairline my-2" />
                <NodeItem label="DP on Sequences" state="locked" />
                <div className="h-8 w-[2px] bg-hairline my-2" />
                <NodeItem label="DP on Grids" state="locked" />
              </div>

              {/* Col 5: Advanced Topics */}
              <div className="flex flex-col items-center">
                <NodeItem label="Advanced Topics" state="locked" />
                <div className="h-14 w-[2px] bg-hairline my-2" />
                <NodeItem label="Greedy" state="locked" />
                <div className="h-8 w-[2px] bg-hairline my-2" />
                <NodeItem label="Segment Tree" state="locked" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <Link
            to="/mastery-map"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline bg-card px-5 font-sans text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            Open my live mastery map <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How It Works & product principles                                         */
/* -------------------------------------------------------------------------- */
function HowItWorks() {
  const items = [
    {
      n: "01",
      icon: <BookOpen size={22} className="text-accent-strong" />,
      title: "Learn a concept",
      desc: "Short, focused lessons break down complex ideas into simple building blocks.",
    },
    {
      n: "02",
      icon: <Code2 size={22} className="text-accent-strong" />,
      title: "Visualize + practice",
      desc: "See algorithms come to life and solve curated problems with instant feedback.",
    },
    {
      n: "03",
      icon: <CalendarCheck size={22} className="text-accent-strong" />,
      title: "Review with spaced repetition",
      desc: "Smart reviews at the right time help you remember and retain longer.",
    },
  ];
  return (
    <section className="mx-auto my-20 max-w-[1240px] px-6">
      <h2 className="text-center font-display text-[28px] sm:text-[34px] font-semibold text-ink">
        How a path works
      </h2>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((it, i) => (
          <div key={it.n} className={`px-4 ${i > 0 ? "md:border-l md:border-hairline" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="font-display text-[44px] font-bold text-accent-strong leading-none">
                {it.n}
              </div>
              <div className="h-10 w-10 rounded-lg bg-tint border border-accent-strong/20 flex items-center justify-center">
                {it.icon}
              </div>
            </div>
            <h3 className="mt-5 font-display text-[18px] font-semibold text-ink">{it.title}</h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-slate">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PathPrinciples() {
  const items = [
    {
      title: "Your progress is earned",
      body: "Path percentages come from your completed learning work, not a fabricated profile.",
    },
    {
      title: "You can change direction",
      body: "Starting another path updates the active path while keeping existing algorithm progress.",
    },
    {
      title: "Everything stays local",
      body: "Until account sync is connected, path selection and mastery remain on this device.",
    },
  ];
  return (
    <section className="mx-auto my-16 max-w-[1240px] px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-hairline bg-card p-6 shadow-1">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-tint text-accent-strong">
              <Check size={14} strokeWidth={2.5} />
            </span>
            <h3 className="mt-3 font-display text-[17px] font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 font-sans text-[14px] leading-relaxed text-slate">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Bottom CTA Banner                                                          */
/* -------------------------------------------------------------------------- */
function CtaBand({ onChoose }: { onChoose: () => void }) {
  return (
    <section className="mx-auto my-16 max-w-[1240px] px-6">
      <div className="rounded-[24px] border border-hairline bg-[#f0f9f7] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
        {/* Left Graphic Preview */}
        <div className="h-16 w-24 rounded-xl border border-hairline bg-card flex items-center justify-center text-accent-strong shrink-0 shadow-1">
          <Play size={20} strokeWidth={1.5} fill="currentColor" />
        </div>

        {/* Center Content */}
        <div className="flex-1 max-w-[500px]">
          <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-ink">
            Start your first path — free
          </h2>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
            <button
              type="button"
              onClick={onChoose}
              className="rounded-lg bg-accent-strong hover:bg-accent-strong/90 text-white font-sans text-sm font-medium px-6 py-3 transition-colors shadow-sm"
            >
              Choose your path
            </button>
          </div>
          <p className="font-mono text-xs text-slate-soft mt-3">
            No credit card. Reduced-motion friendly.
          </p>
        </div>

        {/* Right Graphic Flag */}
        <div className="h-16 w-16 rounded-full border border-dashed border-accent-strong/40 bg-card flex items-center justify-center text-accent-strong shrink-0">
          <Flag size={20} strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Paths Page Component                                                  */
/* -------------------------------------------------------------------------- */
function PathsPage() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const live = useProgressStore((s) => s);
  const setActivePath = useProgressStore((s) => s.setActivePath);
  const progress: ProgressData = hydrated ? live : baselineProgress;

  const cards = React.useMemo(() => buildPathCards(progress, progress.activePathSlug), [progress]);

  const scrollToGrid = () => {
    document.getElementById("paths-grid")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const onStart = (card: PathCard) => {
    setActivePath(card.slug);
    if (card.nextSlug) {
      navigate({ to: "/algorithms/$slug", params: { slug: card.nextSlug } });
    } else {
      navigate({ to: "/review" });
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-tint selection:text-accent-strong">
      <SiteNav active="Paths" />
      <main id="main-content">
        <Hero onChoose={scrollToGrid} />
        <PathsGrid cards={cards} onStart={onStart} ready={hydrated} />
        <MasteryMapSection />
        <HowItWorks />
        <PathPrinciples />
        <CtaBand onChoose={scrollToGrid} />
      </main>
      <SiteFooter />
    </div>
  );
}
