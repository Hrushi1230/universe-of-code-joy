import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Lock, Minus, Plus } from "lucide-react";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { getAlgorithm, getAlgorithms } from "@/content/algorithms";
import type { Category } from "@/content/types";
import { useHydrated } from "@/hooks/useHydrated";
import { sortRecommended } from "@/lib/recommend";
import { baselineProgress, useProgressStore, type ProgressData } from "@/stores/progressStore";

export const Route = createFileRoute("/mastery-map")({
  component: MasteryMap,
  head: () => ({
    meta: [
      { title: "Mastery map — your algorithm skill tree — Algora" },
      {
        name: "description",
        content:
          "See every algorithm skill tiered from Foundations to Graphs & Advanced, with live mastery and prerequisite guidance from progress on this device.",
      },
      { property: "og:title", content: "Mastery map — your algorithm skill tree — Algora" },
      {
        property: "og:description",
        content:
          "Your algorithm knowledge, mapped as a tiered skill tree with recommended next skills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TEAL = "var(--primary)";
const EDGE = "var(--hairline)";
const MUTED = "var(--slate)";

type NodeState = "mastered" | "progress" | "prerequisite";

type SkillNode = {
  slug: string;
  label: string;
  x: number;
  y: number;
  state: NodeState;
  pct: number;
};

const TIERS: { name: string; categories: Category[] }[] = [
  { name: "Foundations", categories: ["arrays", "strings", "linked-lists", "stacks-queues"] },
  { name: "Sorting & Searching", categories: ["sorting", "searching"] },
  { name: "Trees, Heaps & Hashing", categories: ["trees", "heaps", "hashing"] },
  {
    name: "Graphs & Advanced",
    categories: ["graphs", "greedy", "dp", "backtracking", "bit-manipulation", "math"],
  },
];

const TIER_X = [78, 288, 508, 736];
const ROW_H = 78;
const TOP_Y = 62;
const R = 21;

function nodeState(pct: number, prereqsMet: boolean): NodeState {
  if (pct >= 80) return "mastered";
  if (pct > 0) return "progress";
  return prereqsMet ? "progress" : "prerequisite";
}

function buildGraph(progress: ProgressData) {
  const pctOf = (slug: string) => progress.algorithms[slug]?.masteryPct ?? 0;
  const nodes: SkillNode[] = [];

  TIERS.forEach((tier, tierIndex) => {
    const inTier = getAlgorithms()
      .filter((a) => tier.categories.includes(a.category))
      .sort((a, b) => a.name.localeCompare(b.name));
    inTier.forEach((a, rowIndex) => {
      const pct = pctOf(a.slug);
      const prereqsMet = a.prerequisites.every((p) => pctOf(p) >= 50);
      nodes.push({
        slug: a.slug,
        label: a.name,
        x: TIER_X[tierIndex]!,
        y: TOP_Y + rowIndex * ROW_H,
        state: nodeState(pct, prereqsMet),
        pct,
      });
    });
  });

  const byId = new Map(nodes.map((n) => [n.slug, n]));
  const links: { from: SkillNode; to: SkillNode; dashed: boolean }[] = [];
  for (const a of getAlgorithms()) {
    const to = byId.get(a.slug);
    if (!to) continue;
    for (const p of a.prerequisites) {
      const from = byId.get(p);
      if (!from) continue;
      links.push({ from, to, dashed: to.state === "prerequisite" });
    }
  }

  const rows = Math.max(
    ...TIERS.map((t) => getAlgorithms().filter((a) => t.categories.includes(a.category)).length),
  );
  const height = TOP_Y + (rows - 1) * ROW_H + 70;
  return { nodes, links, height, byId };
}

function SkillTree({
  nodes,
  links,
  height,
  scale,
  onPick,
}: {
  nodes: SkillNode[];
  links: { from: SkillNode; to: SkillNode; dashed: boolean }[];
  height: number;
  scale: number;
  onPick: (slug: string) => void;
}) {
  const cx = 415;
  const cy = height / 2;

  return (
    <svg
      viewBox={`0 0 830 ${height}`}
      className="h-full min-w-[760px] w-full"
      role="group"
      aria-label="Algorithm skill tree"
    >
      {TIERS.map((t, i) => (
        <g key={t.name}>
          <text
            x={TIER_X[i]}
            y={16}
            textAnchor="middle"
            fill="var(--ink)"
            fontFamily="Instrument Sans, sans-serif"
            fontSize={13}
            fontWeight={600}
          >
            {t.name}
          </text>
          {i < TIERS.length - 1 && (
            <g stroke={MUTED} strokeWidth={1.2} fill="none">
              <line
                x1={(TIER_X[i]! + TIER_X[i + 1]!) / 2 - 12}
                y1={12}
                x2={(TIER_X[i]! + TIER_X[i + 1]!) / 2 + 12}
                y2={12}
              />
              <path
                d={`M${(TIER_X[i]! + TIER_X[i + 1]!) / 2 + 7} 7 L${
                  (TIER_X[i]! + TIER_X[i + 1]!) / 2 + 12
                } 12 L${(TIER_X[i]! + TIER_X[i + 1]!) / 2 + 7} 17`}
              />
            </g>
          )}
        </g>
      ))}

      <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}>
        {links.map(({ from, to, dashed }) => {
          const midX = (from.x + R + (to.x - R)) / 2;
          return (
            <path
              key={`${from.slug}-${to.slug}`}
              d={`M${from.x + R} ${from.y} H${midX} V${to.y} H${to.x - R}`}
              fill="none"
              stroke={EDGE}
              strokeWidth={1.4}
              strokeDasharray={dashed ? "5 4" : undefined}
            />
          );
        })}

        {nodes.map((s) => {
          const c = 2 * Math.PI * (R - 2);
          return (
            <g
              key={s.slug}
              role="button"
              tabIndex={0}
              className="cursor-pointer outline-none focus-visible:[&>circle]:stroke-primary"
              aria-label={`${s.label} — ${s.state}, ${s.pct}% mastery`}
              onClick={() => onPick(s.slug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(s.slug);
                }
              }}
            >
              <title>{`${s.label} — ${s.pct}% mastery`}</title>

              {s.state === "mastered" && (
                <>
                  <circle cx={s.x} cy={s.y} r={R} fill={TEAL} />
                  <path
                    d={`M${s.x - 7} ${s.y} l5 5 l9 -10`}
                    fill="none"
                    stroke="var(--card)"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {s.state === "progress" && (
                <>
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={R}
                    fill="var(--card)"
                    stroke={EDGE}
                    strokeWidth={3}
                  />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={R - 2}
                    fill="none"
                    stroke={TEAL}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={`${(c * s.pct) / 100} ${c}`}
                    transform={`rotate(-90 ${s.x} ${s.y})`}
                  />
                  <text
                    x={s.x}
                    y={s.y + 4}
                    textAnchor="middle"
                    fill="var(--ink)"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={11}
                  >
                    {s.pct}%
                  </text>
                </>
              )}

              {s.state === "prerequisite" && (
                <>
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={R}
                    fill="var(--secondary)"
                    stroke={EDGE}
                    strokeWidth={1.5}
                  />
                  <text
                    x={s.x}
                    y={s.y + 4}
                    textAnchor="middle"
                    fill={MUTED}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={11}
                  >
                    0%
                  </text>
                </>
              )}

              <text
                x={s.x}
                y={s.y + R + 17}
                textAnchor="middle"
                fill={s.state === "prerequisite" ? MUTED : "var(--ink)"}
                fontFamily="Instrument Sans, sans-serif"
                fontSize={12}
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function MasteryMap() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const live = useProgressStore((s) => s);
  const progress: ProgressData = hydrated ? live : baselineProgress;
  const [scale, setScale] = React.useState(1);

  const { nodes, links, height } = React.useMemo(() => buildGraph(progress), [progress]);

  const counts = React.useMemo(() => {
    const mastered = nodes.filter((n) => n.state === "mastered").length;
    const inProgress = nodes.filter((n) => n.state === "progress").length;
    return { mastered, inProgress, prerequisite: nodes.length - mastered - inProgress };
  }, [nodes]);

  const recommended = React.useMemo(() => {
    const candidates = nodes.filter((n) => n.state !== "mastered").map((n) => n.slug);
    return sortRecommended(candidates, progress).slice(0, 2);
  }, [nodes, progress]);

  const go = (slug: string) => navigate({ to: "/algorithms/$slug", params: { slug } });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar active="My Path" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar
          crumbs={["Mastery map"]}
          xp={`${progress.xp.toLocaleString()} XP`}
          search
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-7">
          <h1 className="shrink-0 text-[28px] font-semibold leading-none tracking-tight text-foreground">
            Mastery map
          </h1>
          <p className="mt-2 shrink-0 font-mono text-[13px] text-muted-foreground">
            Your algorithm knowledge, mapped.{" "}
            <span className="text-foreground">
              {counts.mastered} of {nodes.length} skills mastered.
            </span>
          </p>

          <div className="mt-3 grid shrink-0 grid-cols-3 gap-2 sm:max-w-[584px] sm:gap-4">
            {[
              { label: "Mastered", value: counts.mastered, teal: true },
              { label: "In progress", value: counts.inProgress, dot: true },
              { label: "Prereqs first", value: counts.prerequisite, lock: true },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-hairline bg-card px-3 py-3 sm:px-5"
              >
                <div className="font-mono text-[12.5px] text-muted-foreground">{s.label}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`font-mono text-[24px] font-medium leading-none ${
                      s.teal ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {s.value}
                  </span>
                  {s.teal && <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" />}
                  {s.dot && <span className="h-2 w-2 rounded-full bg-primary" />}
                  {s.lock && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-4 pb-2 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Canvas */}
            <section className="relative flex min-h-[500px] flex-col rounded-2xl border border-hairline bg-card p-3 sm:p-4 lg:min-h-0">
              <div className="min-h-0 flex-1 overflow-auto">
                <SkillTree nodes={nodes} links={links} height={height} scale={scale} onPick={go} />
              </div>

              <div className="mt-2 flex shrink-0 flex-wrap items-center gap-2">
                <div className="inline-flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-card px-3 py-2 sm:gap-5 sm:px-4">
                  <span className="inline-flex items-center gap-2 font-mono text-[12px] text-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3.4} />
                    </span>
                    Mastered
                  </span>
                  <span className="inline-flex items-center gap-2 font-mono text-[12px] text-foreground">
                    <span className="h-4 w-4 rounded-full border-2 border-hairline border-t-primary border-l-primary" />
                    In progress
                  </span>
                  <span className="inline-flex items-center gap-2 font-mono text-[12px] text-foreground">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
                    Prerequisites first
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    aria-label="Zoom out"
                    onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
                    className="flex h-9 w-10 items-center justify-center rounded-xl border border-hairline bg-card text-foreground hover:bg-secondary"
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                  <button
                    aria-label="Zoom in"
                    onClick={() => setScale((s) => Math.min(1.8, +(s + 0.1).toFixed(2)))}
                    className="flex h-9 w-10 items-center justify-center rounded-xl border border-hairline bg-card text-foreground hover:bg-secondary"
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                  <button
                    onClick={() => setScale(1)}
                    className="h-9 rounded-xl border border-hairline bg-card px-4 font-mono text-[12.5px] text-foreground hover:bg-secondary"
                  >
                    Fit
                  </button>
                </div>
              </div>
            </section>

            {/* Recommended next */}
            <section className="flex min-h-0 flex-col overflow-auto rounded-2xl border border-hairline bg-card p-5">
              <h2 className="text-[16px] font-semibold text-foreground">Recommended next</h2>
              <p className="mt-2 font-mono text-[12px] leading-[1.6] text-muted-foreground">
                Keep learning to unlock the next set of powerful skills.
              </p>

              {recommended.length === 0 && (
                <p className="mt-4 font-mono text-[12px] text-muted-foreground">
                  Every skill on the map is mastered. Head to Review to keep it sharp.
                </p>
              )}

              {recommended.map((slug) => {
                const algo = getAlgorithm(slug);
                if (!algo) return null;
                const prereqs = algo.prerequisites
                  .map((p) => getAlgorithm(p)?.name ?? p)
                  .slice(0, 4);
                return (
                  <div key={slug} className="mt-4 border-t border-hairline pt-4 first:border-t-0">
                    <div className="flex gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-primary-tint/60 font-mono text-[13px] font-medium text-primary">
                        {progress.algorithms[slug]?.masteryPct ?? 0}%
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-semibold leading-tight text-foreground">
                          {algo.name}
                        </div>
                        <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                          {algo.oneLiner}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 font-mono text-[12px] text-primary">
                      {prereqs.length > 0 ? "Prerequisites" : "No prerequisites"}
                    </div>
                    {prereqs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prereqs.map((p) => (
                          <span
                            key={p}
                            className="rounded-lg border border-hairline bg-card px-2.5 py-1 font-mono text-[11.5px] text-muted-foreground"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2.5 flex justify-end">
                      <button
                        onClick={() => go(slug)}
                        className="inline-flex items-center gap-2 font-sans text-[13.5px] font-medium text-primary hover:underline"
                      >
                        Start <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="mt-5 border-t border-hairline pt-4">
                <h3 className="font-sans text-[13.5px] font-medium text-foreground">
                  All skills · keyboard list ({nodes.length})
                </h3>
                <ul id="mastery-skill-list" className="mt-3 max-h-52 space-y-1 overflow-y-auto">
                  {nodes.map((node) => (
                    <li key={node.slug}>
                      <Link
                        to="/algorithms/$slug"
                        params={{ slug: node.slug }}
                        className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-2 font-mono text-[12px] text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span>{node.label}</span>
                        <span className="text-muted-foreground">
                          {node.state === "prerequisite" ? "prerequisites first" : `${node.pct}%`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate({ to: "/explore", search: { sort: "recommended" } })}
                className="mt-auto inline-flex items-center gap-2 border-t border-hairline pt-4 font-sans text-[13.5px] font-medium text-primary hover:underline"
              >
                View all recommended skills <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
