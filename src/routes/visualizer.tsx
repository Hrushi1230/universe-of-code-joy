import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronDown,
  ArrowRight,
  Code2,
  BookOpen,
  Star,
  Lock,
  MessageSquare,
  Repeat,
  BarChart3,
  GitBranch,
  GitMerge,
  Search,
  Grid,
  Layers,
  MoreHorizontal,
  Share2,
  Workflow,
  Flag,
  Tv,
} from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { DemoNotice } from "@/components/demo-notice";
import { pricingCatalogClaim } from "@/content/marketing-claims";

export const Route = createFileRoute("/visualizer")({
  component: VisualizerMarketingPage,
  head: () => ({
    meta: [
      { title: "Algora — The Visualizer | Watch every step. Understand every line." },
      {
        name: "description",
        content:
          "See state change in real time — the graph, the code, and the explanation always stay in sync.",
      },
      { property: "og:title", content: "Algora — The Visualizer" },
      {
        property: "og:description",
        content:
          "Master data structures and algorithms through synchronized visualization, code, and plain-English explanation.",
      },
    ],
  }),
});

/* -------------------------------------------------------------------------- */
/* Tree SVG Component for Feature 2 Mockup                                    */
/* -------------------------------------------------------------------------- */
function TreeSvg() {
  return (
    <svg
      viewBox="0 0 200 150"
      className="w-full h-auto"
      role="img"
      aria-label="BFS Tree Visualization"
    >
      {/* Connecting Edges */}
      <line x1="100" y1="30" x2="60" y2="70" stroke="var(--hairline)" strokeWidth="2" />
      <line x1="100" y1="30" x2="140" y2="70" stroke="var(--hairline)" strokeWidth="2" />
      <line x1="60" y1="70" x2="35" y2="115" stroke="var(--hairline)" strokeWidth="2" />
      <line x1="60" y1="70" x2="85" y2="115" stroke="var(--hairline)" strokeWidth="2" />

      {/* Node 1 (Active / Teal) */}
      <circle cx="100" cy="30" r="14" fill="var(--highlight)" />
      <text
        x="100"
        y="34"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="12"
        fontFamily="JetBrains Mono"
        fontWeight="600"
      >
        1
      </text>

      {/* Node 2 (Visited / Tint) */}
      <circle cx="60" cy="70" r="13" fill="var(--paper)" stroke="var(--hairline)" strokeWidth="2" />
      <text
        x="60"
        y="74"
        textAnchor="middle"
        fill="var(--ink)"
        fontSize="11"
        fontFamily="JetBrains Mono"
        fontWeight="600"
      >
        2
      </text>

      {/* Node 3 (Unvisited) */}
      <circle cx="140" cy="70" r="13" fill="var(--card)" stroke="var(--hairline)" strokeWidth="2" />
      <text
        x="140"
        y="74"
        textAnchor="middle"
        fill="var(--slate-soft)"
        fontSize="11"
        fontFamily="JetBrains Mono"
      >
        3
      </text>

      {/* Node 4 (Unvisited) */}
      <circle cx="35" cy="115" r="12" fill="var(--card)" stroke="var(--hairline)" strokeWidth="2" />
      <text
        x="35"
        y="119"
        textAnchor="middle"
        fill="var(--slate-soft)"
        fontSize="10"
        fontFamily="JetBrains Mono"
      >
        4
      </text>

      {/* Node 5 (Unvisited) */}
      <circle cx="85" cy="115" r="12" fill="var(--card)" stroke="var(--hairline)" strokeWidth="2" />
      <text
        x="85"
        y="119"
        textAnchor="middle"
        fill="var(--slate-soft)"
        fontSize="10"
        fontFamily="JetBrains Mono"
      >
        5
      </text>
    </svg>
  );
}

function VisualizerMarketingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-tint selection:text-accent-strong">
      <SiteNav active="Visualizer" />

      <main className="mx-auto max-w-[1320px] px-6 py-10 lg:px-8">
        {/* ----------------------------- Hero Section ----------------------------- */}
        <section className="text-center pt-4 pb-14">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent-strong/20 bg-tint px-3.5 py-1 font-mono text-[11px] font-medium tracking-wider text-accent-strong">
            <span className="text-[9px]">◆</span> THE VISUALIZER
          </div>

          {/* Heading */}
          <h1 className="mt-5 font-display text-[46px] sm:text-[58px] lg:text-[66px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink">
            Watch every step.
            <br />
            Understand every line{" "}
            <span className="inline-block h-3.5 w-3.5 bg-accent-strong align-baseline rounded-[1px] ml-0.5" />
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-[620px] mx-auto font-sans text-[16px] sm:text-[17px] leading-relaxed text-slate">
            See state change in real time — the graph, the code,
            <br className="hidden sm:inline" /> and the explanation always stay in sync.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/algorithms/$slug"
              params={{ slug: "binary-search" }}
              className="rounded-lg bg-accent-strong hover:bg-accent-strong/90 text-white font-sans text-[14px] font-medium px-6 py-3 transition-colors shadow-sm"
            >
              Try the demo
            </Link>
            <Link
              to="/explore"
              className="rounded-lg border border-hairline bg-card hover:bg-paper text-ink font-sans text-[14px] font-medium px-6 py-3 transition-colors"
            >
              See supported algorithms
            </Link>
          </div>
        </section>

        {/* -------------------- Interactive Showcase Section -------------------- */}
        <section className="relative my-6 max-w-[1240px] mx-auto">
          <div className="mx-auto mb-5 max-w-[720px]">
            <DemoNotice>
              The showcase below is an annotated preview. Open the Binary Search demo for real Play,
              Pause, Step, Replay, speed, code, state, and explanation controls.
            </DemoNotice>
          </div>
          {/* Callouts Bar Above Container */}
          <div className="hidden lg:grid grid-cols-[1.2fr_1.05fr_0.85fr] gap-6 mb-2 px-6 text-xs font-mono text-slate font-medium select-none">
            {/* Callout 1: current comparison */}
            <div className="flex flex-col items-center">
              <span className="rounded-md border border-hairline bg-card px-2.5 py-1 shadow-1 text-ink text-[11px]">
                current comparison
              </span>
              <div className="h-5 w-[1px] border-r border-dashed border-slate-soft/80 mt-1" />
            </div>

            {/* Callout 2: step 6 / 14 */}
            <div className="flex flex-col items-center">
              <span className="rounded-md border border-hairline bg-card px-2.5 py-1 shadow-1 text-ink text-[11px]">
                step 6 / 14
              </span>
              <div className="h-5 w-[1px] border-r border-dashed border-slate-soft/80 mt-1" />
            </div>

            {/* Callout 3: active line */}
            <div className="flex flex-col items-center">
              <span className="rounded-md border border-hairline bg-card px-2.5 py-1 shadow-1 text-ink text-[11px]">
                active line
              </span>
              <div className="h-5 w-[1px] border-r border-dashed border-slate-soft/80 mt-1" />
            </div>
          </div>

          {/* Main Visualizer Showcase Window */}
          <div className="rounded-[28px] border border-hairline bg-card p-6 shadow-2">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.05fr_0.85fr] gap-6 items-stretch">
              {/* PANEL 1: Quicksort Lomuto Array Canvas */}
              <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-card p-4">
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                    <span className="font-mono text-xs font-semibold text-ink">
                      Quicksort (Lomuto Partition)
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] bg-paper border border-hairline rounded px-2 py-0.5 text-slate">
                      <span>Pivot (index 8)</span>
                      <span className="font-bold text-ink bg-card px-1.5 rounded border border-hairline">
                        5
                      </span>
                    </div>
                  </div>

                  {/* Swap Annotation Bracket */}
                  <div className="relative h-7 mb-1">
                    <div className="absolute left-[34%] right-[20%] top-0 flex flex-col items-center">
                      <span className="font-mono text-[10px] text-accent-strong font-semibold bg-tint px-2 py-0.5 rounded border border-accent-strong/30 flex items-center gap-0.5">
                        swap ▾
                      </span>
                      <svg
                        viewBox="0 0 100 12"
                        className="w-full h-3 text-accent-strong"
                        aria-hidden="true"
                      >
                        <path
                          d="M 5 10 L 5 2 L 95 2 L 95 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Array Bars Container */}
                  <div className="flex items-end justify-between h-[135px] px-2 pb-2">
                    {[
                      { val: 8, height: "85%", index: 0 },
                      { val: 3, height: "35%", index: 1 },
                      { val: 7, height: "75%", index: 2 },
                      { val: 4, height: "45%", index: 3, active: true },
                      { val: 2, height: "25%", index: 4 },
                      { val: 6, height: "65%", index: 5 },
                      { val: 1, height: "18%", index: 6, active: true },
                      { val: 5, height: "55%", index: 7 },
                      { val: 5, height: "55%", index: 8, isPivot: true },
                    ].map((bar, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5 flex-1 max-w-[30px]"
                      >
                        <div
                          className={`w-full rounded-t-sm transition-all duration-200 flex items-end justify-center pb-1 ${
                            bar.active
                              ? "bg-highlight text-white"
                              : bar.isPivot
                                ? "bg-slate-soft/30 text-ink border border-slate-soft"
                                : "bg-hairline text-slate"
                          }`}
                          style={{ height: bar.height }}
                        >
                          <span className="font-mono text-[11px] font-semibold">{bar.val}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-soft">{bar.index}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Controls */}
                <div className="pt-4 border-t border-hairline mt-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Step to start"
                        disabled
                        className="cursor-default rounded border border-hairline bg-card p-1.5 text-ink opacity-55"
                      >
                        <SkipBack size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Step back"
                        disabled
                        className="cursor-default rounded border border-hairline bg-card p-1.5 text-ink opacity-55"
                      >
                        <ChevronDown size={13} strokeWidth={1.5} className="rotate-90" />
                      </button>
                      <button
                        type="button"
                        aria-label="Pause preview"
                        disabled
                        className="cursor-default rounded border border-hairline bg-card p-1.5 text-ink opacity-55"
                      >
                        <Pause size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Step forward"
                        disabled
                        className="cursor-default rounded border border-hairline bg-card p-1.5 text-ink opacity-55"
                      >
                        <SkipForward size={13} strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Timeline Nodes */}
                    <div className="flex flex-1 items-center justify-between px-3 relative">
                      <div className="absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 bg-hairline" />
                      <div className="absolute left-3 w-[45%] top-1/2 h-[2px] -translate-y-1/2 bg-highlight" />

                      {[
                        { step: "1" },
                        { step: "4" },
                        { step: "6", active: true },
                        { step: "8" },
                        { step: "10" },
                        { step: "14" },
                      ].map((node, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`rounded-full transition-all ${
                              node.active
                                ? "h-3.5 w-3.5 bg-highlight ring-4 ring-tint border-2 border-white"
                                : "h-2 w-2 bg-slate-soft"
                            }`}
                          />
                          <span className="font-mono text-[9px] text-slate mt-1">{node.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Speed Bar */}
                  <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-slate pt-2 border-t border-hairline/60">
                    <span>Speed</span>
                    <div className="flex-1 mx-3 h-1 bg-hairline rounded-full overflow-hidden relative">
                      <div className="h-full bg-highlight w-[75%]" />
                    </div>
                    <span className="text-ink font-medium">1.8x</span>
                  </div>
                </div>
              </div>

              {/* PANEL 2: Code Editor (Python) */}
              <div className="flex flex-col rounded-2xl border border-hairline bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-hairline bg-paper px-3.5 py-2 font-mono text-[11px] text-slate">
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    Code (Python) <ChevronDown size={13} strokeWidth={1.5} />
                  </span>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Code example"
                  className="p-3 font-mono text-[12px] leading-[1.65] overflow-x-auto flex-1 bg-card"
                >
                  {[
                    {
                      n: 1,
                      code: (
                        <>
                          <span className="text-accent-strong">def</span>{" "}
                          <span className="text-[#3f5a54]">partition</span>(arr, low, high):
                        </>
                      ),
                    },
                    { n: 2, code: <> pivot = arr[high]</> },
                    { n: 3, code: <> i = low - 1</> },
                    { n: 4, code: <>&nbsp;</> },
                    {
                      n: 5,
                      code: (
                        <>
                          {" "}
                          <span className="text-accent-strong">for</span> j{" "}
                          <span className="text-accent-strong">in</span> range(low, high):
                        </>
                      ),
                    },
                    {
                      n: 6,
                      code: (
                        <>
                          {" "}
                          <span className="text-accent-strong">if</span> arr[j] &lt;= pivot:
                        </>
                      ),
                    },
                    { n: 7, code: <> i += 1</> },
                    {
                      n: 8,
                      hl: true,
                      code: <> arr[i], arr[j] = arr[j], arr[i]</>,
                    },
                    { n: 9, code: <>&nbsp;</> },
                    { n: 10, code: <> arr[i + 1], arr[high] = arr[high], arr[i + 1]</> },
                    {
                      n: 11,
                      code: (
                        <>
                          {" "}
                          <span className="text-accent-strong">return</span> i + 1
                        </>
                      ),
                    },
                  ].map((row) => (
                    <div
                      key={row.n}
                      className={`flex items-center rounded px-1.5 py-0.5 ${
                        row.hl
                          ? "bg-tint text-ink font-medium border-l-2 border-accent-strong"
                          : "hover:bg-paper"
                      }`}
                    >
                      <span className="w-6 shrink-0 select-none text-right font-mono text-[10px] text-slate-soft mr-3">
                        {row.hl ? <span className="text-accent-strong font-bold">◆ 8</span> : row.n}
                      </span>
                      <span className="whitespace-pre">{row.code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PANEL 3: Explanation Panel */}
              <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-card p-4">
                <div>
                  <div className="border-b border-hairline pb-2 mb-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-soft uppercase tracking-wider">
                      EXPLANATION
                    </span>
                  </div>
                  <div className="space-y-3 font-sans text-[13px] leading-relaxed text-ink">
                    <p>We found an element smaller than or equal to the pivot.</p>
                    <p>
                      So we move it to the left side by swapping{" "}
                      <code className="font-mono text-xs bg-paper px-1 py-0.5 rounded border border-hairline">
                        arr[i]
                      </code>{" "}
                      and{" "}
                      <code className="font-mono text-xs bg-paper px-1 py-0.5 rounded border border-hairline">
                        arr[j]
                      </code>
                      .
                    </p>
                    <p className="text-slate">
                      This keeps all smaller elements on the left of{" "}
                      <code className="font-mono text-xs text-ink">i</code>.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-hairline">
                  <span className="font-mono text-[10px] text-slate-soft uppercase tracking-wider block mb-1">
                    STEP STATUS
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs text-accent-strong font-medium">
                    <span className="h-2 w-2 rounded-full bg-highlight" />
                    <span>Lomuto Partition in progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- 3 Feature Deep-Dive Blocks -------------------- */}
        <section className="my-20 space-y-16 max-w-[1240px] mx-auto">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4 max-w-[480px]">
              <div className="h-10 w-10 rounded-xl border border-hairline bg-card flex items-center justify-center text-accent-strong shadow-1">
                <Repeat size={20} strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-ink leading-snug">
                Step, rewind, and replay
              </h2>
              <p className="font-sans text-[15px] leading-relaxed text-slate">
                Scrub the timeline, step forward or backward, or replay at any speed. Learn at your
                pace without missing a thing.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-accent-strong hover:underline pt-2"
              >
                Learn more <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>

            {/* Standalone Player Control Preview Card */}
            <div className="rounded-2xl border border-hairline bg-card p-6 shadow-1">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <button
                    disabled
                    aria-label="Preview: step to start"
                    className="cursor-default rounded border border-hairline bg-paper p-2 text-ink opacity-55"
                  >
                    <SkipBack size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    disabled
                    aria-label="Preview: step back"
                    className="cursor-default rounded border border-hairline bg-paper p-2 text-ink opacity-55"
                  >
                    <ChevronDown size={14} strokeWidth={1.5} className="rotate-90" />
                  </button>
                  <button
                    disabled
                    aria-label="Preview: pause"
                    className="cursor-default rounded border border-hairline bg-paper p-2 text-ink opacity-55"
                  >
                    <Pause size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    disabled
                    aria-label="Preview: step forward"
                    className="cursor-default rounded border border-hairline bg-paper p-2 text-ink opacity-55"
                  >
                    <SkipForward size={14} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex flex-1 items-center justify-between px-4 relative max-w-[280px]">
                  <div className="absolute inset-x-4 top-1/2 h-[2px] -translate-y-1/2 bg-hairline" />
                  <div className="absolute left-4 w-[50%] top-1/2 h-[2px] -translate-y-1/2 bg-highlight" />

                  {["1", "4", "6", "8", "10", "14"].map((st, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`rounded-full ${
                          st === "6"
                            ? "h-3.5 w-3.5 bg-highlight ring-4 ring-tint border-2 border-white"
                            : "h-2 w-2 bg-slate-soft"
                        }`}
                      />
                      <span className="font-mono text-[10px] text-slate mt-1.5">{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between font-mono text-xs text-slate">
                <span>Speed</span>
                <div className="flex-1 mx-4 h-1.5 bg-hairline rounded-full overflow-hidden relative">
                  <div className="h-full bg-highlight w-[50%]" />
                </div>
                <span className="text-ink font-medium">1.0x</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Side-by-side Tree Canvas + Code Editor Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Standalone Tree + Code Preview (Left) */}
            <div className="order-2 lg:order-1 rounded-2xl border border-hairline bg-card p-4 shadow-1 grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] gap-4 items-center">
              {/* Left Panel: Tree Graph */}
              <div className="rounded-xl border border-hairline bg-paper p-3 flex items-center justify-center">
                <TreeSvg />
              </div>

              {/* Right Panel: Code Snippet */}
              <div className="font-mono text-[11px] leading-[1.6]">
                <div className="border-b border-hairline pb-1.5 mb-2 flex items-center justify-between text-slate-soft text-[10px]">
                  <span>bfs.py</span>
                  <span>Python</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate">
                    <span className="text-accent-strong">from</span> collections{" "}
                    <span className="text-accent-strong">import</span> deque
                  </div>
                  <div>&nbsp;</div>
                  <div>
                    <span className="text-accent-strong">def</span>{" "}
                    <span className="text-[#3f5a54]">bfs</span>(root):
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-accent-strong">if not</span> root:{" "}
                    <span className="text-accent-strong">return</span> []
                  </div>
                  <div>&nbsp;&nbsp;q, order = deque([root]), []</div>
                  <div>
                    &nbsp;&nbsp;<span className="text-accent-strong">while</span> q:
                  </div>
                  <div className="bg-tint text-ink border-l-2 border-accent-strong px-1.5 py-0.5 rounded font-medium flex items-center justify-between text-[10.5px]">
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;node = q.popleft()</span>
                    <span className="text-[9px] text-accent-strong font-bold">◆ 7</span>
                  </div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;order.append(node.val)</div>
                  <div>
                    &nbsp;&nbsp;&nbsp;&nbsp;q.extend(c for c in (node.left, node.right) if c)
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-accent-strong">return</span> order
                  </div>
                </div>
              </div>
            </div>

            {/* Content (Right) */}
            <div className="order-1 lg:order-2 space-y-4 max-w-[480px]">
              <div className="h-10 w-10 rounded-xl border border-hairline bg-card flex items-center justify-center text-accent-strong shadow-1">
                <Code2 size={20} strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-ink leading-snug">
                Code stays in sync
              </h2>
              <p className="font-sans text-[15px] leading-relaxed text-slate">
                The active line is always highlighted and mapped to the current state. See exactly
                how each line changes the structure.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-accent-strong hover:underline pt-2"
              >
                Learn more <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4 max-w-[480px]">
              <div className="h-10 w-10 rounded-xl border border-hairline bg-card flex items-center justify-center text-accent-strong shadow-1">
                <MessageSquare size={20} strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-ink leading-snug">
                Explain-as-you-go
              </h2>
              <p className="font-sans text-[15px] leading-relaxed text-slate">
                Plain-English explanations for every step. Understand the &ldquo;why&rdquo; behind
                the &ldquo;what&rdquo; as the algorithm runs.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-accent-strong hover:underline pt-2"
              >
                Learn more <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>

            {/* Explanation Preview Card (Right) */}
            <div className="rounded-2xl border border-hairline bg-card p-6 shadow-1 space-y-3">
              <span className="font-mono text-xs font-semibold text-accent-strong uppercase tracking-wider block">
                EXPLANATION
              </span>
              <p className="font-sans text-[14px] leading-relaxed text-ink">
                We dequeue node 2 from the queue and visit it.
              </p>
              <p className="font-sans text-[14px] leading-relaxed text-slate">
                Then we enqueue its unvisited children (4 and 5) so they can be explored next.
              </p>
              <p className="font-mono text-xs text-slate-soft pt-2 border-t border-hairline">
                This is Breadth-First Search (BFS).
              </p>
            </div>
          </div>
        </section>

        {/* -------------------- "Every algorithm, visualized" Grid -------------------- */}
        <section className="my-20 text-center max-w-[1240px] mx-auto">
          <h2 className="font-display text-[28px] sm:text-[34px] font-semibold text-ink">
            Every algorithm, visualized
          </h2>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {[
              { label: "BFS", icon: GitBranch },
              { label: "DFS", icon: Workflow },
              { label: "Dijkstra", icon: Share2 },
              { label: "Quicksort", icon: BarChart3, featured: true },
              { label: "Merge Sort", icon: GitMerge, featured: true },
              { label: "Binary Search", icon: Search },
              { label: "DP Table", icon: Grid, planned: true },
              { label: "Union-Find", icon: Layers, planned: true },
              { label: "Heap", icon: Tv },
              { label: "And more", icon: MoreHorizontal },
            ].map((algo, idx) => (
              <Link
                key={idx}
                to="/explore"
                className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
                  algo.featured
                    ? "border-accent-strong bg-card shadow-1 ring-1 ring-accent-strong/30"
                    : "border-hairline bg-card hover:bg-paper hover:border-slate-soft"
                }`}
              >
                {algo.featured && (
                  <span className="absolute top-2.5 right-2.5 bg-accent-strong text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Featured
                  </span>
                )}
                {"planned" in algo && algo.planned && (
                  <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 text-accent-strong font-mono text-[9px] font-semibold bg-tint px-1.5 py-0.5 rounded">
                    <Lock size={9} strokeWidth={1.5} /> Planned
                  </span>
                )}
                <algo.icon size={26} strokeWidth={1.5} className="text-accent-strong mb-3" />
                <span className="font-sans text-sm font-semibold text-ink">{algo.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* -------------------- Stats Banner Section -------------------- */}
        <section className="my-16">
          <div className="rounded-2xl border border-hairline bg-card p-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-hairline max-w-[1100px] mx-auto shadow-1">
            <div className="flex items-center justify-center gap-3.5 py-3 md:py-0">
              <div className="h-10 w-10 rounded-xl bg-tint border border-accent-strong/20 flex items-center justify-center text-accent-strong">
                <Code2 size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-ink">26</div>
                <div className="font-sans text-xs text-slate">catalog algorithms</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3.5 py-3 md:py-0">
              <div className="h-10 w-10 rounded-xl bg-tint border border-accent-strong/20 flex items-center justify-center text-accent-strong">
                <BookOpen size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-ink">56</div>
                <div className="font-sans text-xs text-slate">practice questions</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3.5 py-3 md:py-0">
              <div className="h-10 w-10 rounded-xl bg-tint border border-accent-strong/20 flex items-center justify-center text-accent-strong">
                <Star size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-ink">
                  {pricingCatalogClaim.value}
                </div>
                <div className="font-sans text-xs text-slate">runnable modules</div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- Bottom CTA Banner -------------------- */}
        <section className="my-16">
          <div className="rounded-[24px] border border-hairline bg-[#f0f9f7] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-[1240px] mx-auto text-center md:text-left relative overflow-hidden">
            {/* Left Graphic Preview */}
            <div className="h-16 w-24 rounded-xl border border-hairline bg-card flex items-center justify-center text-accent-strong shrink-0 shadow-1">
              <Play size={20} strokeWidth={1.5} fill="currentColor" />
            </div>

            {/* Center Content */}
            <div className="flex-1 max-w-[500px]">
              <h2 className="font-display text-[26px] sm:text-[30px] font-semibold text-ink">
                See it move. Start free.
              </h2>
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                <Link
                  to="/auth"
                  className="rounded-lg bg-accent-strong hover:bg-accent-strong/90 text-white font-sans text-sm font-medium px-6 py-3 transition-colors shadow-sm"
                >
                  Create free account
                </Link>
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
      </main>

      <SiteFooter />
    </div>
  );
}
