import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ArrowRight, Mail } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { blogNewsletterClaim } from "@/content/marketing-claims";
import { DemoNotice } from "@/components/demo-notice";
import useHydrated from "@/hooks/useHydrated";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "The Algora Blog — Ideas on algorithms & interview prep" },
      {
        name: "description",
        content:
          "Preview planned Algora articles about algorithms, study techniques, and interview preparation.",
      },
      { property: "og:title", content: "The Algora Blog" },
      {
        property: "og:description",
        content: "Preview planned Algora articles about algorithms and interview preparation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
});

/* ---------- flat diagram thumbnails (teal / ink line art on paper) ---------- */

const INK = "var(--ink)";
const TEAL = "var(--primary)";
const TINT = "var(--primary-tint-strong)";
const LINE = "var(--viz-edge)";

function FeaturedArt() {
  return (
    <svg viewBox="0 0 304 272" className="h-full w-full" aria-hidden="true">
      {/* graph */}
      <g stroke={INK} strokeWidth="1.1" fill="none">
        <path d="M60 62 L104 30 L148 62" />
        <path d="M148 62 L128 108" />
        <path d="M60 62 L70 108" />
      </g>
      <g stroke={TEAL} strokeWidth="1.1" strokeDasharray="3 3" fill="none">
        <path d="M60 62 L128 108" />
        <path d="M104 30 L60 62" />
      </g>
      <Node x={104} y={30} label="1" fill={TINT} />
      <Node x={60} y={62} label="1" fill={TEAL} textLight />
      <Node x={148} y={62} label="3" fill="var(--card)" />
      <Node x={70} y={108} label="4" fill="var(--card)" />
      <Node x={128} y={108} label="5" fill="var(--card)" />
      {/* code lines */}
      <g>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={i}
            x={198}
            y={30 + i * 13}
            width={i % 3 === 0 ? 86 : i % 3 === 1 ? 62 : 74}
            height="4"
            rx="2"
            fill={i % 2 === 0 ? INK : TEAL}
            opacity={i % 2 === 0 ? 0.75 : 0.55}
          />
        ))}
      </g>
      {/* bars */}
      <g>
        {[
          [0, 46, true],
          [1, 62, false],
          [2, 30, true],
          [3, 70, true],
          [4, 38, true],
          [5, 78, false],
          [6, 26, false],
          [7, 56, false],
        ].map(([i, h, filled]) => (
          <rect
            key={i as number}
            x={44 + (i as number) * 30}
            y={222 - (h as number)}
            width="20"
            height={h as number}
            fill={filled ? TEAL : "var(--card)"}
            stroke={filled ? TEAL : INK}
            strokeWidth="1"
          />
        ))}
        <line x1="34" y1="222" x2="290" y2="222" stroke={INK} strokeWidth="1" />
        <path d="M284 217 L292 222 L284 227" fill="none" stroke={INK} strokeWidth="1" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <text
            key={i}
            x={54 + i * 30}
            y="240"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill={INK}
          >
            {i}
          </text>
        ))}
      </g>
    </svg>
  );
}

function Node({
  x,
  y,
  label,
  fill,
  textLight,
  r = 12,
}: {
  x: number;
  y: number;
  label: string;
  fill: string;
  textLight?: boolean;
  r?: number;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={fill}
        stroke={fill === "var(--card)" ? INK : TEAL}
        strokeWidth="1.2"
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
        fill={textLight ? "var(--card)" : INK}
      >
        {label}
      </text>
    </g>
  );
}

function ThumbDijkstra() {
  return (
    <svg viewBox="0 0 232 132" className="h-full w-full" aria-hidden="true">
      <g stroke={INK} strokeWidth="1" fill="none">
        <path d="M78 24 L34 52 L50 100 L104 100 L120 52 Z" />
        <path d="M34 52 L104 100" strokeDasharray="3 3" stroke={TEAL} />
        <path d="M78 24 L50 100" strokeDasharray="3 3" stroke={TEAL} />
      </g>
      {[
        ["2", 34, 52, TINT],
        ["1", 78, 24, TINT],
        ["3", 120, 52, TINT],
        ["4", 50, 100, TINT],
        ["5", 104, 100, "var(--card)"],
      ].map(([l, x, y, f]) => (
        <Node
          key={l as string}
          label={l as string}
          x={x as number}
          y={y as number}
          fill={f as string}
          r={11}
        />
      ))}
      {[
        ["2", 52, 34],
        ["1", 62, 66],
        ["3", 84, 72],
        ["1", 104, 74],
        ["1", 78, 112],
      ].map(([t, x, y], i) => (
        <text
          key={i}
          x={x as number}
          y={y as number}
          fontFamily="JetBrains Mono, monospace"
          fontSize="8"
          fill={INK}
        >
          {t}
        </text>
      ))}
      {/* dist table */}
      <g>
        <rect x="160" y="14" width="56" height="104" fill="var(--card)" stroke={LINE} />
        <text
          x="188"
          y="28"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill={INK}
        >
          dist
        </text>
        <line x1="160" y1="34" x2="216" y2="34" stroke={LINE} />
        {[
          ["1", "0"],
          ["2", "2"],
          ["3", "3"],
          ["4", "6"],
          ["5", "4"],
        ].map(([a, b], i) => (
          <g key={i}>
            <text
              x="168"
              y={48 + i * 16}
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill={INK}
            >
              {a}
            </text>
            <text
              x="196"
              y={48 + i * 16}
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill={INK}
            >
              {b}
            </text>
            <line x1="160" y1={52 + i * 16} x2="216" y2={52 + i * 16} stroke={LINE} />
          </g>
        ))}
      </g>
    </svg>
  );
}

function ThumbRecursion() {
  return (
    <svg viewBox="0 0 232 132" className="h-full w-full" aria-hidden="true">
      <line x1="22" y1="18" x2="22" y2="108" stroke={TEAL} strokeWidth="1.2" />
      <path d="M18 102 L22 112 L26 102" fill="none" stroke={TEAL} strokeWidth="1.2" />
      {["factorial(4)", "factorial(3)", "factorial(2)", "factorial(1)"].map((t, i) => (
        <g key={t}>
          <rect
            x="36"
            y={16 + i * 24}
            width="94"
            height="20"
            rx="3"
            fill={i === 3 ? TINT : "var(--card)"}
            stroke={i === 3 ? TEAL : LINE}
          />
          <text
            x="83"
            y={30 + i * 24}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill={INK}
          >
            {t}
          </text>
        </g>
      ))}
      {["if n == 1", "  return 1", "return n *", "  factorial(n-1)"].map((t, i) => (
        <text
          key={t}
          x="146"
          y={34 + i * 20}
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
          fill={INK}
        >
          {t}
        </text>
      ))}
    </svg>
  );
}

function ThumbBigO() {
  return (
    <svg viewBox="0 0 232 132" className="h-full w-full" aria-hidden="true">
      <text
        x="116"
        y="24"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill={INK}
      >
        n
      </text>
      {["1", "2", "3", "···", "n"].map((t, i) => (
        <g key={i}>
          <rect x={44 + i * 30} y="36" width="30" height="26" fill="var(--card)" stroke={INK} />
          <text
            x={59 + i * 30}
            y="54"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill={INK}
          >
            {t}
          </text>
        </g>
      ))}
      <path
        d="M44 72 q0 10 10 10 h52 q10 0 10 10 q0 -10 10 -10 h52 q10 0 10 -10"
        fill="none"
        stroke={INK}
      />
      <text
        x="116"
        y="112"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="14"
        fill={INK}
      >
        O(n)
      </text>
    </svg>
  );
}

function ThumbSpaced() {
  return (
    <svg viewBox="0 0 232 132" className="h-full w-full" aria-hidden="true">
      {["1d", "3d", "7d", "14d"].map((t, i) => (
        <g key={t}>
          <rect
            x={24 + i * 46}
            y="42"
            width="34"
            height="26"
            rx="4"
            fill="var(--card)"
            stroke={INK}
          />
          <text
            x={41 + i * 46}
            y="59"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill={INK}
          >
            {t}
          </text>
          {i < 3 && <path d={`M${58 + i * 46} 55 h8`} stroke={INK} strokeWidth="1" markerEnd="" />}
          {i < 3 && (
            <path
              d={`M${64 + i * 46} 51 L${69 + i * 46} 55 L${64 + i * 46} 59`}
              fill="none"
              stroke={INK}
            />
          )}
          <circle cx={41 + i * 46} cy="90" r="8" fill={TEAL} />
          <path
            d={`M${37 + i * 46} 90 l3 3 l5 -6`}
            fill="none"
            stroke="var(--card)"
            strokeWidth="1.6"
          />
        </g>
      ))}
      <path d="M200 55 h22" stroke={TEAL} strokeDasharray="3 3" />
    </svg>
  );
}

function ThumbDfsBfs() {
  return (
    <svg viewBox="0 0 232 132" className="h-full w-full" aria-hidden="true">
      <text
        x="52"
        y="18"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="9"
        fill={INK}
      >
        DFS
      </text>
      <text
        x="176"
        y="18"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="9"
        fill={INK}
      >
        BFS
      </text>
      {[0, 1].map((g) => {
        const ox = g === 0 ? 0 : 124;
        return (
          <g key={g}>
            <g stroke={LINE} strokeWidth="1" fill="none" strokeDasharray="3 3">
              <path d={`M${52 + ox} 40 L${28 + ox} 70 M${52 + ox} 40 L${76 + ox} 70`} />
              <path d={`M${28 + ox} 70 L${14 + ox} 100 M${28 + ox} 70 L${42 + ox} 100`} />
              <path d={`M${76 + ox} 70 L${62 + ox} 100 M${76 + ox} 70 L${90 + ox} 100`} />
            </g>
            {g === 0 ? (
              <g stroke={TEAL} strokeWidth="1.2" fill="none">
                <path d={`M52 40 L28 70 L14 100`} />
              </g>
            ) : (
              <g stroke={TEAL} strokeWidth="1.2" fill="none" strokeDasharray="4 3">
                <path d="M152 70 L200 70" />
              </g>
            )}
            <Node x={52 + ox} y={40} label="" fill={TINT} r={9} />
            <Node x={28 + ox} y={70} label="" fill={g === 0 ? TINT : TINT} r={9} />
            <Node x={76 + ox} y={70} label="" fill={g === 0 ? "var(--card)" : TINT} r={9} />
            <Node x={14 + ox} y={100} label="" fill={g === 0 ? TINT : "var(--card)"} r={9} />
            <Node x={42 + ox} y={100} label="" fill="var(--card)" r={9} />
            <Node x={62 + ox} y={100} label="" fill="var(--card)" r={9} />
            <Node x={90 + ox} y={100} label="" fill="var(--card)" r={9} />
          </g>
        );
      })}
    </svg>
  );
}

function ThumbStudyPlan() {
  const checks = [
    [0, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 1, 1],
    [1, 1, 0, 0, 0],
  ];
  return (
    <svg viewBox="0 0 232 132" className="h-full w-full" aria-hidden="true">
      <rect x="36" y="18" width="160" height="14" fill={TEAL} />
      {checks.map((row, r) =>
        row.map((c, i) => (
          <g key={`${r}-${i}`}>
            <rect
              x={36 + i * 32}
              y={32 + r * 20}
              width="32"
              height="20"
              fill="var(--card)"
              stroke={LINE}
            />
            {c === 1 && (
              <path
                d={`M${46 + i * 32} ${42 + r * 20} l4 4 l7 -8`}
                fill="none"
                stroke={TEAL}
                strokeWidth="1.6"
              />
            )}
          </g>
        )),
      )}
    </svg>
  );
}

/* ---------------------------------- page ---------------------------------- */

const CATEGORIES = [
  "All",
  "Algorithms",
  "Data Structures",
  "Interview Prep",
  "Study Tips",
  "Product",
];

const POSTS = [
  {
    art: <ThumbDijkstra />,
    tag: "ALGORITHMS",
    title: "A visual guide to Dijkstra",
    excerpt: "See how Dijkstra's algorithm explores the graph step by step.",
    meta: "7 min read",
  },
  {
    art: <ThumbRecursion />,
    tag: "STUDY TIPS",
    title: "Master recursion with the call stack",
    excerpt: "Understand recursion visually and avoid the most common pitfalls.",
    meta: "6 min read",
  },
  {
    art: <ThumbBigO />,
    tag: "INTERVIEW PREP",
    title: "Big-O without the panic",
    excerpt: "A friendly primer to reason about time and space complexity.",
    meta: "5 min read",
  },
  {
    art: <ThumbSpaced />,
    tag: "STUDY TIPS",
    title: "Why spaced repetition works",
    excerpt: "The science behind better retention and how to use it daily.",
    meta: "5 min read",
  },
  {
    art: <ThumbDfsBfs />,
    tag: "ALGORITHMS",
    title: "DFS vs BFS: when to use which",
    excerpt: "Compare depth-first and breadth-first search with clear examples.",
    meta: "6 min read",
  },
  {
    art: <ThumbStudyPlan />,
    tag: "STUDY TIPS",
    title: "Building a 30-day study plan",
    excerpt: "A practical plan to stay consistent and track real progress.",
    meta: "6 min read",
  },
];

function BlogPage() {
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return POSTS.filter((post) => {
      const matchesCategory = category === "All" || post.tag === category.toUpperCase();
      const matchesQuery =
        !normalizedQuery ||
        `${post.title} ${post.excerpt} ${post.tag}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Header
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          ready={hydrated}
        />
        {category === "All" && !query.trim() && <Featured />}
        <Grid
          posts={filteredPosts}
          onReset={() => {
            setQuery("");
            setCategory("All");
          }}
        />
        <Newsletter />
      </main>
      <SiteFooter />
    </div>
  );
}

function Header({
  query,
  setQuery,
  category,
  setCategory,
  ready,
}: {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  ready: boolean;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-10 pt-12 text-center sm:px-8 sm:pt-16">
      <span className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-primary">
        <span className="text-[9px]">◆</span> THE ALGORA BLOG
      </span>
      <h1 className="mx-auto mt-8 max-w-[820px] font-display text-[42px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-[54px]">
        Ideas on algorithms,
        <br />
        learning, and getting hired
        <span className="ml-1 inline-block size-[10px] translate-y-[-2px] bg-primary" />
      </h1>
      <p className="mx-auto mt-5 max-w-[620px] font-sans text-[16px] text-muted-foreground">
        Deep dives, study techniques, and interview prep from the Algora team.
      </p>

      <div className="mx-auto mt-8 flex max-w-[450px] items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 transition-all">
        <input
          className="w-full bg-transparent font-sans text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Search articles, topics, or guides..."
          aria-label="Search articles"
          disabled={!ready}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Search size={18} className="shrink-0 text-primary" strokeWidth={2} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            disabled={!ready}
            onClick={() => setCategory(c)}
            className={`rounded-xl px-5 py-2.5 font-mono text-[13px] transition-colors disabled:cursor-wait disabled:opacity-60 ${
              category === c
                ? "bg-primary text-primary-foreground"
                : "border border-hairline bg-card text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-6 sm:px-8">
      <article className="rounded-2xl border border-hairline bg-card p-6 shadow-[0_1px_2px_rgba(14,21,19,0.04)]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <div className="rounded-xl bg-secondary p-4">
            <FeaturedArt />
          </div>
          <div className="flex flex-col justify-center py-2 lg:pr-6">
            <div className="inline-flex w-fit rounded-md bg-primary-tint px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-primary">
              INTERVIEW PREP
            </div>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-[1.2] tracking-[-0.015em] text-foreground">
              How to actually explain your time complexity in interviews
            </h2>
            <p className="mt-4 max-w-[520px] font-sans text-[15px] leading-relaxed text-muted-foreground">
              A clear framework to think out loud, handle edge cases, and communicate complexity
              with confidence. Includes real examples and a handy cheat sheet.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-tint font-mono text-[12px] font-medium text-primary">
                PR
              </span>
              <span className="font-mono text-[12px] text-muted-foreground">Editorial preview</span>
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[12px] text-muted-foreground">Draft</span>
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[12px] text-muted-foreground">8 min read</span>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-sans text-[15px] font-medium text-primary">
              Article coming soon <ArrowRight size={16} strokeWidth={2} />
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}

function Grid({ posts, onReset }: { posts: typeof POSTS; onReset: () => void }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-8 sm:pt-20">
      <h2 className="text-center font-display text-[26px] font-semibold tracking-[-0.01em] text-foreground">
        Latest articles
      </h2>
      {posts.length ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.title}
              className="flex flex-col rounded-2xl border border-hairline bg-card p-5 transition-shadow hover:shadow-[0_6px_20px_rgba(14,21,19,0.06)]"
            >
              <div className="rounded-xl bg-secondary/60 p-3">
                <div className="aspect-[232/132] w-full">{p.art}</div>
              </div>
              <div className="mt-5 font-mono text-[11px] tracking-[0.12em] text-primary">
                {p.tag}
              </div>
              <h3 className="mt-2 font-display text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                {p.title}
              </h3>
              <p className="mt-2.5 font-sans text-[14px] leading-relaxed text-muted-foreground">
                {p.excerpt}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-6 font-mono text-[12px] text-muted-foreground">
                Editorial preview <span className="size-1.5 rounded-full bg-primary" /> {p.meta}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-hairline bg-card px-6 py-12 text-center">
          <p className="font-sans text-[16px] text-foreground">
            No article previews match this search.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 font-mono text-[13px] text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-card px-6 py-3 font-sans text-[15px] font-medium text-primary hover:border-primary"
        >
          Show all previews <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-4 pt-16 sm:px-8 sm:pt-20">
      <div className="rounded-2xl border border-hairline bg-primary-tint/60 px-5 py-10 sm:px-10 sm:py-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-10">
          <span className="mx-auto grid size-[86px] place-items-center rounded-full border border-primary/30 bg-card/70 lg:mx-0">
            <Mail size={30} className="text-primary" strokeWidth={1.5} />
          </span>
          <div className="text-center">
            <h2 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-foreground">
              Get one sharp idea every week
            </h2>
            <p className="mt-2 font-sans text-[15px] text-muted-foreground">
              Study techniques and algorithm breakdowns. No spam.
            </p>
            <div className="mx-auto mt-6 flex max-w-[440px] items-stretch">
              <input
                disabled
                className="min-w-0 flex-1 rounded-l-xl border border-hairline bg-card px-4 py-3 font-sans text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                placeholder="Enter your email"
                aria-label="Email address"
              />
              <button
                disabled
                className="shrink-0 rounded-r-xl bg-primary px-4 font-sans text-[14px] font-medium text-primary-foreground opacity-55 sm:px-6"
              >
                Coming soon
              </button>
            </div>
            <p className="mt-5 font-mono text-[12px] text-muted-foreground">
              {blogNewsletterClaim.rawText}
            </p>
            <div className="mx-auto mt-4 max-w-[520px]">
              <DemoNotice>No email is collected or stored.</DemoNotice>
            </div>
          </div>
          <div className="mx-auto lg:mx-0">
            <NoteArt />
          </div>
        </div>
      </div>
    </section>
  );
}

function NoteArt() {
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" fill="none" aria-hidden="true">
      <path d="M22 14 h44 l14 14 v58 h-58 z" fill="var(--card)" stroke={INK} strokeWidth="1.2" />
      <path d="M66 14 v14 h14" fill="none" stroke={INK} strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1="32"
          y1={40 + i * 8}
          x2={i % 2 ? 62 : 70}
          y2={40 + i * 8}
          stroke={TEAL}
          strokeWidth="1.4"
        />
      ))}
      <path
        d="M76 76 l16 -22 l6 4 l-16 22 l-8 3 z"
        fill="var(--card)"
        stroke={INK}
        strokeWidth="1.2"
      />
    </svg>
  );
}
