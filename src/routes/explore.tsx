import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { AppSidebar, AppTopBar } from "@/components/app-shell";
import { AlgorithmThumbnail } from "@/components/common/AlgorithmThumbnail";
import { DifficultyBadge, EmptyState } from "@/components/common";
import { CATEGORY_META } from "@/content/algorithms";
import { exploreCatalogClaim } from "@/content/marketing-claims";
import type { Category, Difficulty } from "@/content/types";
import {
  buildExploreItems,
  exploreItemProgressPct,
  filterExploreItems,
  sortExploreItems,
  type ExploreItem,
  type ExploreSortKey,
} from "@/lib/explore-items";
import { useHydrated } from "@/hooks/useHydrated";
import { baselineProgress, useProgressStore, type ProgressData } from "@/stores/progressStore";

/* ---------------- search params ---------------- */

type SortKey = ExploreSortKey;

interface ExploreSearch {
  q?: string;
  category?: string[];
  difficulty?: string;
  sort?: SortKey;
  page?: number;
}

type ExploreSearchResolved = Required<ExploreSearch>;

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as Category[];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const DIFFICULTY_LABEL: Record<string, string> = {
  all: "All levels",
  easy: "Easy only",
  medium: "Medium only",
  hard: "Hard only",
};
const SORTS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "az", label: "A-Z" },
  { value: "difficulty", label: "Difficulty" },
  { value: "shortest", label: "Shortest first" },
];

const PAGE_SIZE = 9;

const DEFAULTS: ExploreSearchResolved = {
  q: "",
  category: [],
  difficulty: "all",
  sort: "recommended",
  page: 1,
};

function asStringArray(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string" && value.length > 0
      ? value.split(",")
      : [];
  return raw.filter(
    (v): v is string => typeof v === "string" && (CATEGORY_KEYS as string[]).includes(v),
  );
}

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  validateSearch: (search: Record<string, unknown>): ExploreSearch => {
    const difficulty =
      typeof search["difficulty"] === "string" &&
      (DIFFICULTIES as string[]).includes(search["difficulty"])
        ? (search["difficulty"] as string)
        : DEFAULTS.difficulty;
    const sort = SORTS.some((s) => s.value === search["sort"])
      ? (search["sort"] as SortKey)
      : DEFAULTS.sort;
    const rawPage = Number(search["page"]);
    return {
      q: typeof search["q"] === "string" ? search["q"].slice(0, 100) : DEFAULTS.q,
      category: asStringArray(search["category"]),
      difficulty,
      sort,
      page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
    };
  },
  head: () => ({
    meta: [
      { title: "Explore algorithms — Algora" },
      {
        name: "description",
        content:
          "Browse interactive algorithm visualizers across data structures, graphs, sorting, searching, and dynamic programming.",
      },
      { property: "og:title", content: "Explore algorithms — Algora" },
      {
        property: "og:description",
        content:
          "Filter and open step-through visualizers for BFS, Dijkstra, Quicksort, DP tables and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TealPeriod() {
  return <span className="ml-1 inline-block h-2.5 w-2.5 bg-primary align-baseline" />;
}

/* ---------------- card ---------------- */

/**
 * One card shell for both kinds. The status pills that used to sit beside the
 * title are gone.
 *
 * Both kinds open the visualizer: an algorithm opens its own, a question opens
 * the one for the algorithm it teaches. Explore is the visual-first surface, and
 * /practice/$slug renders no visualizer of its own — routing questions straight
 * there would skip the animation entirely. The visualizer's own "Practice"
 * button is the way on to the editor.
 */
function ExploreCard({
  item,
  progress,
}: {
  item: ExploreItem;
  progress: ProgressData;
}): React.ReactElement {
  const pct = exploreItemProgressPct(item, progress);
  // thumbnailSlug is always an algorithm slug — for a question, its parent.
  const params = { slug: item.thumbnailSlug };
  const linkSearch = item.kind === "question" ? { problem: item.slug } : {};

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card">
      <Link
        to="/algorithms/$slug"
        params={params}
        search={linkSearch}
        className="group flex flex-1 items-start gap-4 px-5 pb-4 pt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="h-[112px] w-[150px] shrink-0">
          <AlgorithmThumbnail
            slug={item.thumbnailSlug}
            problemSlug={item.kind === "question" ? item.slug : undefined}
            animateOnHover
            className="h-full min-h-0"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[17px] font-semibold leading-tight text-foreground">
              {item.title}
            </h2>
          </div>
          <p className="mt-2 text-[13.5px] leading-[1.45] text-muted-foreground">{item.oneLiner}</p>
        </div>
      </Link>

      <div className="flex items-center gap-3 border-t border-hairline px-5 py-3">
        <DifficultyBadge difficulty={item.difficulty} className="shrink-0" />
        <span className="w-[42px] shrink-0 font-mono text-[12.5px] text-primary">{pct}%</span>
        <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-viz-idle">
          <span
            className="block h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </span>
        <Link
          to="/algorithms/$slug"
          params={params}
          search={linkSearch}
          className="ml-2 inline-flex shrink-0 items-center gap-1.5 font-mono text-[12.5px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.9} />
        </Link>
      </div>
    </article>
  );
}

/* ---------------- page ---------------- */

function ExplorePage(): React.ReactElement {
  const rawSearch = Route.useSearch();
  const search = React.useMemo<ExploreSearchResolved>(
    () => ({ ...DEFAULTS, ...rawSearch }),
    [rawSearch],
  );
  const navigate = useNavigate({ from: Route.fullPath });
  const hydrated = useHydrated();
  const storedAlgorithms = useProgressStore((s) => s.algorithms);
  const storedProblems = useProgressStore((s) => s.problems);

  /**
   * Only these two slices are read here — by the recommended scorer and by the
   * card progress bars — so subscribing to just them keeps unrelated store
   * writes (xp, streak, activity) from re-rendering the whole grid. The rest of
   * the shape comes from the baseline purely to satisfy `ProgressData`.
   */
  const progress = React.useMemo<ProgressData>(
    () =>
      hydrated
        ? { ...baselineProgress, algorithms: storedAlgorithms, problems: storedProblems }
        : baselineProgress,
    [hydrated, storedAlgorithms, storedProblems],
  );

  const allItems = React.useMemo(() => buildExploreItems(), []);

  const [queryInput, setQueryInput] = React.useState(search.q);
  const [debouncedQuery, setDebouncedQuery] = React.useState(search.q);

  React.useEffect(() => {
    setQueryInput(search.q);
    setDebouncedQuery(search.q);
  }, [search.q]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(queryInput), 200);
    return () => window.clearTimeout(t);
  }, [queryInput]);

  React.useEffect(() => {
    if (debouncedQuery === search.q) return;
    const t = window.setTimeout(() => {
      void navigate({
        search: (prev: ExploreSearch) => ({
          ...DEFAULTS,
          ...prev,
          q: debouncedQuery,
          page: 1,
        }),
        replace: true,
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [debouncedQuery, search.q, navigate]);

  const patch = React.useCallback(
    (next: Partial<ExploreSearch>) => {
      void navigate({
        search: (prev: ExploreSearch) => ({ ...DEFAULTS, ...prev, ...next }),
        replace: true,
      });
    },
    [navigate],
  );

  const clearAll = React.useCallback(() => {
    setQueryInput("");
    setDebouncedQuery("");
    void navigate({ search: { ...DEFAULTS }, replace: true });
  }, [navigate]);

  const results = React.useMemo(
    () =>
      sortExploreItems(
        filterExploreItems(allItems, {
          query: debouncedQuery,
          categories: search.category,
          difficulty: search.difficulty,
        }),
        search.sort,
        progress,
      ),
    [allItems, debouncedQuery, search.category, search.difficulty, search.sort, progress],
  );

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, search.page), pageCount);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const set = new Set<number>([1, 2, 3, pageCount, page]);
    const sorted = [...set].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
    const out: (number | "gap")[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("gap");
      out.push(p);
    });
    return out;
  }, [page, pageCount]);

  const activeCategory: Category | "all" = (search.category[0] as Category) ?? "all";

  const filtersActive =
    search.q !== "" ||
    search.category.length > 0 ||
    search.difficulty !== "all" ||
    search.sort !== "recommended";

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-foreground">
      <AppSidebar active="Explore" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopBar title="Explore" searchValue={queryInput} onSearchChange={setQueryInput} />

        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-8 sm:pt-7">
          <h1 className="text-[30px] font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-[34px]">
            Explore algorithms
            <TealPeriod />
          </h1>
          <p className="mt-3 font-mono text-[13.5px] text-muted-foreground">
            {exploreCatalogClaim.rawText}
          </p>

          {/* Filter bar */}
          <div className="mt-5 rounded-2xl border border-hairline bg-card px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="pt-0.5 font-mono text-[12px] text-muted-foreground">Category</div>

              <div className="flex w-full flex-wrap items-end gap-3 sm:gap-6 md:w-auto md:flex-nowrap">
                <div className="min-w-[132px] flex-1 sm:flex-none">
                  <label
                    htmlFor="explore-difficulty"
                    className="mb-2 block font-mono text-[12px] text-muted-foreground"
                  >
                    Difficulty
                  </label>
                  <select
                    id="explore-difficulty"
                    value={search.difficulty}
                    onChange={(e) => patch({ difficulty: e.target.value, page: 1 })}
                    className="h-11 w-full rounded-xl border border-hairline bg-card px-3.5 font-mono text-[13.5px] text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[136px]"
                  >
                    {(["all", ...DIFFICULTIES] as string[]).map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABEL[d]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[160px] flex-1 sm:flex-none">
                  <label
                    htmlFor="explore-sort"
                    className="mb-2 block font-mono text-[12px] text-muted-foreground"
                  >
                    Sort:
                  </label>
                  <select
                    id="explore-sort"
                    value={search.sort}
                    onChange={(e) => patch({ sort: e.target.value as SortKey, page: 1 })}
                    className="h-11 w-full rounded-xl border border-hairline bg-card px-3.5 font-mono text-[13.5px] text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[194px]"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              {(["all", ...CATEGORY_KEYS] as (Category | "all")[]).map((c) => {
                const active = activeCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ category: c === "all" ? [] : [c], page: 1 })}
                    className={[
                      "h-11 whitespace-nowrap rounded-xl px-5 font-mono text-[13.5px] transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-hairline bg-card text-foreground hover:bg-secondary",
                    ].join(" ")}
                  >
                    {c === "all" ? "All" : CATEGORY_META[c].label}
                  </button>
                );
              })}
            </div>
          </div>

          {filtersActive && (
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-[12.5px] text-muted-foreground">
                {results.length} of {allItems.length} results
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="font-mono text-[12.5px] text-primary underline-offset-2 hover:underline"
              >
                clear all filters
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-hairline bg-card">
              <EmptyState
                icon={SearchX}
                title="No results match these filters"
                description="Try a different search term, or clear the filters to see everything."
                action={{ label: "Clear all filters", onClick: clearAll }}
              />
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {pageItems.map((item) => (
                  <ExploreCard key={`${item.kind}:${item.slug}`} item={item} progress={progress} />
                ))}
              </div>

              {pageCount > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-8 flex items-center justify-center gap-2.5"
                >
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page === 1}
                    onClick={() => patch({ page: page - 1 })}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === "gap" ? (
                      <span
                        key={`gap-${i}`}
                        className="w-8 text-center font-mono text-[13.5px] text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                        onClick={() => patch({ page: p })}
                        className={[
                          "h-11 w-11 rounded-xl font-mono text-[13.5px] transition-colors",
                          p === page
                            ? "bg-primary text-primary-foreground"
                            : "border border-hairline bg-card text-foreground hover:bg-secondary",
                        ].join(" ")}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page === pageCount}
                    onClick={() => patch({ page: page + 1 })}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
