import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { useIsReducedMotion as useReducedMotion } from "@/hooks/useReducedMotionSync";
import {
  Play,
  Pause,
  SkipForward,
  Check,
  Flame,
  Code2,
  SlidersHorizontal,
  CalendarCheck,
  ArrowRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { AlgoraGlyph, SiteNav, SiteFooter } from "@/components/site-chrome";
import { heroProofStats, universitySocialProofClaim } from "@/content/marketing-claims";
import { HOME_BFS_STEPS, type HomeBfsNode } from "@/lib/home-bfs";

export const Route = createFileRoute("/")({
  component: AlgoraLanding,
  head: () => ({
    meta: [
      { title: "Algora — See the algorithm think." },
      {
        name: "description",
        content:
          "Master data structures and interview prep through synchronized visualization, code, and plain-English explanation.",
      },
      { property: "og:title", content: "Algora — See the algorithm think." },
      {
        property: "og:description",
        content:
          "Gamified algorithm mastery through synchronized visualization, code, and plain-English explanation.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

/* --------------------------------- Nav ---------------------------------- */

/* --------------------------- Visualizer card ----------------------------- */
function TreeSvg({ step }: { step: number }) {
  const reduceMotion = useReducedMotion();
  const frame = HOME_BFS_STEPS[step];
  // 1 root, children 2 & 3; 2's children: 4,5; 3's children: 6,7; 4's child: 8
  const nodes: Record<number, { x: number; y: number }> = {
    1: { x: 300, y: 40 },
    2: { x: 180, y: 110 },
    3: { x: 420, y: 110 },
    4: { x: 110, y: 180 },
    5: { x: 250, y: 180 },
    6: { x: 360, y: 180 },
    7: { x: 490, y: 180 },
    8: { x: 60, y: 250 },
  };
  const edges: [number, number][] = [
    [1, 2],
    [1, 3],
    [2, 4],
    [2, 5],
    [3, 6],
    [3, 7],
    [4, 8],
  ];
  const current = frame.current;
  const visited = new Set<HomeBfsNode>(frame.visited);
  const stateFor = (id: number) =>
    id === current ? "current" : visited.has(id as HomeBfsNode) ? "visited" : "unvisited";
  const fill = (s: string) =>
    s === "current"
      ? "var(--primary)"
      : s === "visited"
        ? "var(--primary-tint-strong)"
        : "var(--card)";
  const stroke = (s: string) => (s === "unvisited" ? "var(--viz-edge)" : "var(--primary)");
  const textColor = (s: string) => (s === "current" ? "var(--card)" : "var(--ink)");
  return (
    <svg
      viewBox="0 0 560 290"
      className="w-full"
      role="img"
      aria-label={`Interactive breadth-first traversal. ${current === null ? "No node is current." : `Node ${current} is current.`} ${visited.size} nodes visited. Queue: ${frame.queue.length > 0 ? frame.queue.join(", ") : "empty"}.`}
    >
      {edges.map(([a, b]) => (
        <motion.line
          key={`${a}-${b}`}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="var(--viz-edge)"
          strokeWidth="1.25"
          initial={false}
          animate={{
            stroke: visited.has(b as HomeBfsNode) ? "var(--primary)" : "var(--viz-edge)",
          }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
        />
      ))}
      {Object.entries(nodes).map(([id, n]) => {
        const state = stateFor(Number(id));
        return (
          <motion.g
            key={id}
            initial={false}
            animate={{ scale: reduceMotion ? 1 : state === "current" ? 1.12 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={20}
              fill={fill(state)}
              stroke={stroke(state)}
              animate={{ fill: fill(state), stroke: stroke(state) }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              strokeWidth="1.75"
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fill={textColor(state)}
              fontSize="14"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="500"
            >
              {id}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

function VisualizerCard({ autoStartKey = 0 }: { autoStartKey?: number }) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { amount: 0.35 });
  const started = useRef(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (inView && !reduceMotion && !started.current) {
      started.current = true;
      setPlaying(true);
    }
    if (!inView) setPlaying(false);
    if (reduceMotion) setPlaying(false);
  }, [inView, reduceMotion]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!autoStartKey) return;
    started.current = true;
    setStep(0);
    setPlaying(!reduceMotion);
  }, [autoStartKey, reduceMotion]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setStep((currentStep) => {
        if (currentStep >= HOME_BFS_STEPS.length - 1) {
          setPlaying(false);
          return currentStep;
        }
        return currentStep + 1;
      });
    }, 1050 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, speed, step]);

  const activeStep = HOME_BFS_STEPS[step];
  const play = () => {
    started.current = true;
    if (step === HOME_BFS_STEPS.length - 1) setStep(0);
    setPlaying(!reduceMotion);
  };

  return (
    <motion.div
      ref={cardRef}
      id="home-traversal"
      data-testid="home-traversal"
      initial={reduceMotion ? false : { opacity: 0.65, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.12 }}
      className="rounded-2xl border border-hairline bg-card p-3 shadow-[0_1px_2px_rgba(14,21,19,0.04),0_8px_28px_-12px_rgba(14,21,19,0.08)] sm:p-5"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="font-mono text-sm text-foreground">
          Step {step + 1} / {HOME_BFS_STEPS.length}
        </div>
        <div className="hidden items-center gap-4 font-mono text-[11px] text-muted-foreground sm:flex">
          <LegendDot color="var(--primary)" label="Current" />
          <LegendDot color="var(--primary-tint-strong)" label="Visited" />
          <LegendDot color="var(--card)" label="Unvisited" ring />
        </div>
      </div>

      {/* Two-panel body: left = editor, right = graph */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* LEFT: Code editor */}
        <div className="overflow-hidden rounded-xl border border-hairline">
          <div className="flex items-center justify-between border-b border-hairline bg-paper px-3 py-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              bfs.py
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              Python <ChevronDown size={12} />
            </span>
          </div>
          <div className="bg-card font-mono text-[12px] leading-[1.7]">
            {[
              {
                n: 1,
                t: (
                  <>
                    <Kw>from</Kw> collections <Kw>import</Kw> deque
                  </>
                ),
              },
              { n: 2, t: <>&nbsp;</> },
              {
                n: 3,
                t: (
                  <>
                    <Kw>def</Kw> <Fn>bfs</Fn>(root):
                  </>
                ),
              },
              {
                n: 4,
                t: (
                  <>
                    &nbsp;&nbsp;&nbsp;&nbsp;<Kw>if</Kw> <Kw>not</Kw> root: <Kw>return</Kw> []
                  </>
                ),
              },
              { n: 5, t: <>&nbsp;&nbsp;&nbsp;&nbsp;q, order = deque([root]), []</> },
              {
                n: 6,
                t: (
                  <>
                    &nbsp;&nbsp;&nbsp;&nbsp;<Kw>while</Kw> q:
                  </>
                ),
              },
              {
                n: 7,
                t: <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;node = q.popleft()</>,
              },
              {
                n: 8,
                t: <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;order.append(node.val)</>,
              },
              {
                n: 9,
                t: (
                  <>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;children = (node.left,
                    node.right)
                  </>
                ),
              },
              {
                n: 10,
                t: (
                  <>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;q.extend(child for child in
                    children if child)
                  </>
                ),
              },
              {
                n: 11,
                t: (
                  <>
                    &nbsp;&nbsp;&nbsp;&nbsp;<Kw>return</Kw> order
                  </>
                ),
              },
            ].map((row) => (
              <div
                key={row.n}
                aria-current={activeStep.codeLines.includes(row.n) ? "step" : undefined}
                className={`flex ${activeStep.codeLines.includes(row.n) ? "bg-primary-tint" : ""}`}
              >
                <div className="w-9 shrink-0 select-none border-r border-hairline px-2 text-right text-muted-foreground">
                  {row.n}
                </div>
                <div className="px-3 text-foreground">{row.t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Tree + playback */}
        <div className="flex flex-col">
          <div className="flex-1 rounded-xl border border-hairline bg-paper p-3">
            <TreeSvg step={step} />
            <div className="mt-1 min-h-6 text-center font-mono text-[11px] text-muted-foreground">
              Queue: {activeStep.queue.length > 0 ? activeStep.queue.join(" → ") : "empty"}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1">
              <IconBtn
                aria-label="Pause traversal"
                onClick={() => setPlaying(false)}
                disabled={!playing}
              >
                <Pause size={13} strokeWidth={2} />
              </IconBtn>
              <IconBtn
                aria-label="Play traversal"
                onClick={play}
                disabled={playing || Boolean(reduceMotion)}
              >
                <Play size={13} strokeWidth={2} />
              </IconBtn>
              <IconBtn
                aria-label="Next traversal step"
                onClick={() => {
                  started.current = true;
                  setPlaying(false);
                  setStep((currentStep) => Math.min(currentStep + 1, HOME_BFS_STEPS.length - 1));
                }}
                disabled={step === HOME_BFS_STEPS.length - 1}
              >
                <SkipForward size={13} strokeWidth={2} />
              </IconBtn>
              <IconBtn
                aria-label="Replay traversal"
                onClick={() => {
                  started.current = true;
                  setStep(0);
                  setPlaying(!reduceMotion);
                }}
              >
                <RotateCcw size={13} strokeWidth={2} />
              </IconBtn>
            </div>
            <div className="flex w-full min-w-0 flex-1 items-center gap-2 sm:w-auto">
              <span className="font-mono text-[11px] text-muted-foreground">Speed</span>
              <input
                aria-label="Traversal speed"
                type="range"
                min="0.5"
                max="2"
                step="0.5"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="h-7 min-w-0 flex-1 accent-primary"
              />
              <span className="w-8 font-mono text-[11px] text-foreground">{speed.toFixed(1)}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation full width */}
      <div className="mt-4 rounded-xl border border-primary-tint-strong bg-primary-tint/50 p-4">
        <div className="mb-1 font-sans text-sm font-semibold text-primary">Explanation</div>
        <p
          className="min-h-[42px] font-sans text-[13.5px] leading-relaxed text-foreground/80"
          aria-live={playing ? "off" : "polite"}
        >
          {activeStep.explanation}
        </p>
      </div>
    </motion.div>
  );
}

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-code-keyword">{children}</span>;
}
function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-code-fn">{children}</span>;
}
function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">{label}</span>
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background: color,
          boxShadow: ring ? "inset 0 0 0 1px var(--viz-edge)" : undefined,
        }}
      />
    </div>
  );
}
function IconBtn({
  children,
  "aria-label": ariaLabel,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  "aria-label"?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 sm:h-7 sm:w-7"
    >
      {children}
    </button>
  );
}

function RevealSection({ children, className }: { children: React.ReactNode; className: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: [0.65, 1], y: [24, 0] }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

/* --------------------------------- Hero --------------------------------- */
function Hero() {
  const reduceMotion = useReducedMotion();
  const [autoStartKey, setAutoStartKey] = useState(0);

  const watchTraversal = () => {
    setAutoStartKey((key) => key + 1);
    window.requestAnimationFrame(() => {
      document.getElementById("home-traversal")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  };

  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:gap-12">
        {/* Left */}
        <motion.div
          className="pt-2"
          initial={false}
          animate={reduceMotion ? undefined : { opacity: [0.65, 1], x: [-18, 0] }}
          transition={{ duration: reduceMotion ? 0 : 0.48 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-tint-strong bg-primary-tint px-3 py-1.5 font-mono text-[11px] tracking-wide text-primary">
            <span className="text-primary">◆</span> ALGORITHM MASTERY, GAMIFIED
          </div>
          <h1 className="font-display text-[46px] font-semibold leading-[1.0] tracking-[-0.025em] text-foreground sm:text-[60px]">
            See the
            <br />
            algorithm
            <br />
            think
            <span className="ml-1 inline-block h-3 w-3 bg-primary align-baseline" />
          </h1>
          <p className="mt-7 max-w-[380px] font-sans text-[16px] leading-relaxed text-muted-foreground">
            Master data structures and interview prep through synchronized visualization, code, and
            plain-English explanation.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground hover:bg-primary-glow transition-colors"
            >
              Start free — no card
            </Link>
            <button
              type="button"
              onClick={watchTraversal}
              className="flex items-center gap-2 rounded-lg border border-hairline bg-card px-5 py-3 text-[14px] font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Play size={14} fill="currentColor" /> Watch a traversal
            </button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] text-muted-foreground">
            <span>{heroProofStats[0].rawText}</span>
            <span className="size-1 rounded-full bg-primary/70" />
            <span>{heroProofStats[1].rawText}</span>
            <span className="size-1 rounded-full bg-primary/70" />
            <span>{heroProofStats[2].rawText}</span>
          </div>
        </motion.div>
        {/* Right */}
        <VisualizerCard autoStartKey={autoStartKey} />
      </div>
    </section>
  );
}

/* ------------------------------ Social proof ---------------------------- */
function SocialProof() {
  return (
    <RevealSection className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
      <div className="mb-8 text-center font-sans text-sm text-muted-foreground">
        {universitySocialProofClaim.label}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-7 text-muted-foreground/80 lg:gap-16">
        {universitySocialProofClaim.institutions.map((topic) => (
          <div
            key={topic.id}
            aria-label={topic.fullName}
            className="rounded-full border border-hairline bg-card px-5 py-2 font-mono text-[12px] text-foreground/75"
          >
            {topic.name}
          </div>
        ))}
      </div>
    </RevealSection>
  );
}

/* ------------------------------- Gamification --------------------------- */
function GamificationSection() {
  return (
    <RevealSection className="mx-auto max-w-[1280px] px-4 py-16 sm:px-8 sm:py-20">
      <h2 className="mb-10 text-center font-display text-[34px] font-semibold tracking-[-0.02em] text-foreground sm:mb-14 sm:text-[44px]">
        Progress you can feel
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <GameCard
          title="Mastery Map"
          sub="Build skills. Unlock nodes."
          link="View all skills"
          href="/mastery-map"
          index={0}
        >
          <MasteryMap />
        </GameCard>
        <GameCard
          title="XP & Levels"
          sub="Every step earns XP."
          link="See rewards"
          href="/dashboard"
          index={1}
        >
          <XpRing />
        </GameCard>
        <GameCard
          title="Streak"
          sub="Consistency compounds."
          link="View calendar"
          href="/dashboard"
          index={2}
        >
          <StreakBlock />
        </GameCard>
        <GameCard
          title="Leagues"
          sub="Compete. Climb. Win."
          link="View leaderboard"
          href="/leagues"
          index={3}
        >
          <Leaderboard />
        </GameCard>
      </div>
    </RevealSection>
  );
}

function GameCard({
  title,
  sub,
  link,
  href,
  index,
  children,
}: {
  title: string;
  sub: string;
  link: string;
  href: "/mastery-map" | "/dashboard" | "/leagues";
  index: number;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col rounded-2xl border border-hairline bg-card p-6"
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: [0.65, 1], y: [18, 0] }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reduceMotion ? 0 : 0.38, delay: reduceMotion ? 0 : index * 0.06 }}
    >
      <div className="text-center">
        <div className="font-display text-lg font-semibold text-foreground">{title}</div>
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <div className="flex-1 py-5">{children}</div>
      <Link
        to={href}
        className="mt-auto flex items-center justify-center gap-1 font-mono text-[13px] text-primary hover:text-primary-glow"
      >
        {link} <ArrowRight size={12} />
      </Link>
    </motion.div>
  );
}

function MasteryMap() {
  const reduceMotion = useReducedMotion();
  const nodes = [
    { x: 100, y: 20, unlocked: true },
    { x: 55, y: 75, unlocked: true },
    { x: 145, y: 75, unlocked: true },
    { x: 175, y: 75, unlocked: false },
    { x: 30, y: 135, unlocked: false },
    { x: 80, y: 135, unlocked: false },
    { x: 130, y: 135, unlocked: false },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [1, 5],
    [2, 6],
  ];
  return (
    <svg
      viewBox="0 0 200 170"
      className="mx-auto w-full max-w-[220px]"
      role="img"
      aria-label="Skill tree milestone map"
    >
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="var(--viz-edge)"
          strokeWidth="1"
          strokeDasharray={!nodes[b].unlocked ? "3 3" : ""}
          initial={false}
          whileInView={reduceMotion ? undefined : { pathLength: [0, 1] }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : i * 0.06 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          initial={false}
          whileInView={reduceMotion ? undefined : { opacity: [0.5, 1], scale: [0.7, 1] }}
          viewport={{ once: true }}
          transition={{
            duration: reduceMotion ? 0 : 0.28,
            delay: reduceMotion ? 0 : 0.15 + i * 0.05,
          }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <circle
            cx={n.x}
            cy={n.y}
            r={14}
            fill={n.unlocked ? "var(--primary)" : "var(--secondary)"}
            stroke={n.unlocked ? "var(--primary)" : "var(--viz-edge)"}
            strokeWidth="1.25"
          />
          {n.unlocked ? (
            <path
              d={`M${n.x - 5},${n.y} L${n.x - 1},${n.y + 4} L${n.x + 5},${n.y - 3}`}
              stroke="var(--card)"
              strokeWidth="1.75"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <g
              transform={`translate(${n.x - 4}, ${n.y - 4})`}
              stroke="var(--slate-soft)"
              strokeWidth="1"
              fill="none"
            >
              <rect x="0" y="3" width="8" height="6" rx="1" fill="var(--slate-soft)" />
              <path d="M1.5 3 V1.5 A2.5 2.5 0 0 1 6.5 1.5 V3" />
            </g>
          )}
        </motion.g>
      ))}
    </svg>
  );
}

function XpRing() {
  const reduceMotion = useReducedMotion();
  const pct = 2150 / 2400;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--viz-idle)" strokeWidth="8" />
          <motion.circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            initial={false}
            whileInView={reduceMotion ? undefined : { strokeDashoffset: [c, c * (1 - pct)] }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-2xl font-semibold text-foreground">Lvl 12</div>
          <div className="font-mono text-[10px] text-muted-foreground">2,150 / 2,400 XP</div>
        </div>
      </div>
      <div className="mt-2 rounded-full bg-primary-tint px-2.5 py-0.5 font-mono text-[11px] text-primary">
        +40 XP
      </div>
    </div>
  );
}

function StreakBlock() {
  const reduceMotion = useReducedMotion();
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex flex-col items-center">
      <Flame size={44} className="text-primary" strokeWidth={1.75} fill="var(--tint)" />
      <div className="mt-2 font-display text-xl font-semibold text-foreground">23-day streak</div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1"
            initial={false}
            whileInView={reduceMotion ? undefined : { opacity: [0.5, 1], y: [5, 0] }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : i * 0.05 }}
          >
            <span className="font-mono text-[10px] text-muted-foreground">{d}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
              <Check size={9} className="text-primary-foreground" strokeWidth={3} />
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Leaderboard() {
  const reduceMotion = useReducedMotion();
  const rows = [
    { rank: 1, initial: "A", name: "Arjun", xp: "3,250" },
    { rank: 2, initial: "M", name: "Mei", xp: "3,120" },
    { rank: 3, initial: "J", name: "Jordan", xp: "2,980" },
  ];
  return (
    <div className="space-y-1.5 text-[12.5px]">
      {rows.map((r, index) => (
        <motion.div
          key={r.rank}
          className="flex items-center gap-2 px-1.5 py-1"
          initial={false}
          whileInView={reduceMotion ? undefined : { opacity: [0.5, 1], x: [-8, 0] }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : index * 0.08 }}
        >
          <span className="w-4 font-mono text-muted-foreground">{r.rank}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-tint font-mono text-[10px] text-primary">
            {r.initial}
          </span>
          <span className="flex-1 font-sans text-foreground">{r.name}</span>
          <span className="font-mono text-foreground">{r.xp} XP</span>
        </motion.div>
      ))}
      <div className="flex items-center gap-2 rounded-lg bg-primary-tint px-1.5 py-1.5">
        <span className="w-4 font-mono text-primary">12</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">
          Y
        </span>
        <span className="flex-1 font-sans font-medium text-foreground">You</span>
        <span className="font-mono text-foreground">2,150 XP</span>
      </div>
    </div>
  );
}

/* ------------------------------- Features ------------------------------- */
function Features() {
  const feats = [
    {
      icon: <Code2 size={22} className="text-primary" strokeWidth={1.75} />,
      title: "Synced code + visuals",
      body: "See every line of code reflected in the visualization in real time.",
      href: "/algorithms/binary-search" as const,
    },
    {
      icon: <SlidersHorizontal size={22} className="text-primary" strokeWidth={1.75} />,
      title: "Step-through debugger",
      body: "Control execution step-by-step and inspect state as you go.",
      href: "/visualizer" as const,
    },
    {
      icon: <CalendarCheck size={22} className="text-primary" strokeWidth={1.75} />,
      title: "Spaced-repetition review",
      body: "Reinforce what you learn with smart reviews that last.",
      href: "/review" as const,
    },
  ];
  return (
    <RevealSection className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-hairline">
        {feats.map((f, i) => (
          <motion.div
            key={i}
            className="border-b border-hairline pb-8 last:border-0 last:pb-0 md:border-b-0 md:px-8 md:pb-0 md:first:pl-0 md:last:pr-0"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {f.icon}
            <div className="mt-4 font-display text-[17px] font-semibold text-foreground">
              {f.title}
            </div>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            <a
              href={f.href}
              className="mt-4 inline-flex items-center gap-1 font-mono text-[13px] text-primary hover:text-primary-glow"
            >
              Learn more <ArrowRight size={12} />
            </a>
          </motion.div>
        ))}
      </div>
    </RevealSection>
  );
}

/* ------------------------------- CTA band ------------------------------- */
function CtaBand() {
  const reduceMotion = useReducedMotion();
  return (
    <RevealSection className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
      <div className="relative flex flex-col items-center justify-between gap-7 rounded-2xl border border-primary-tint-strong bg-primary-tint px-6 py-9 sm:px-10 lg:flex-row lg:px-14 lg:py-10">
        {/* left illustration */}
        <div className="rounded-lg border border-primary-tint-strong bg-card p-3">
          <div className="mb-1.5 flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-tint-strong" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary-tint-strong" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary-tint-strong" />
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              initial={false}
              whileInView={reduceMotion ? undefined : { x: [-4, 0], opacity: [0.5, 1] }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
            >
              <Play size={20} className="text-primary" fill="var(--primary)" />
            </motion.span>
            <AlgoraGlyph size={28} />
          </div>
        </div>

        {/* Center */}
        <div className="flex flex-1 flex-col items-center text-center">
          <h3 className="font-display text-[24px] font-semibold text-foreground sm:text-[28px]">
            Start your first traversal today
          </h3>
          <Link
            to="/auth"
            className="mt-5 rounded-lg bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground hover:bg-primary-glow transition-colors"
          >
            Create free account
          </Link>
          <p className="mt-3 font-mono text-[12px] text-muted-foreground">
            No credit card. Reduced-motion friendly.
          </p>
        </div>

        {/* Right flag */}
        <motion.svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          className="text-primary"
          aria-hidden="true"
          initial={false}
          whileInView={reduceMotion ? undefined : { rotate: [-8, 0], opacity: [0.5, 1] }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
        >
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="3 4"
          />
          <line x1="40" y1="18" x2="40" y2="58" stroke="currentColor" strokeWidth="1.5" />
          <path d="M40 22 L58 28 L40 34 Z" fill="currentColor" />
        </motion.svg>
      </div>
    </RevealSection>
  );
}

/* -------------------------------- Page ---------------------------------- */
function AlgoraLanding() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteNav active="Learn" />
      <main id="main-content">
        <Hero />
        <SocialProof />
        <GamificationSection />
        <Features />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
