import type { CellState, EdgeState, Frame } from "@/engine/types";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const DURATION = 0.35;

export const FILL: Record<CellState, string> = {
  idle: "var(--viz-idle)",
  active: "var(--viz-active)",
  visited: "var(--viz-visited)",
  frontier: "var(--viz-frontier)",
  found: "var(--viz-found)",
  excluded: "var(--viz-excluded)",
  compare: "var(--viz-compare)",
  sorted: "var(--viz-sorted)",
};

export const INK: Record<CellState, string> = {
  idle: "var(--viz-idle-ink)",
  active: "var(--viz-active-ink)",
  visited: "var(--viz-visited-ink)",
  frontier: "var(--viz-frontier-ink)",
  found: "var(--viz-found-ink)",
  excluded: "var(--viz-excluded-ink)",
  compare: "var(--viz-compare-ink)",
  sorted: "var(--viz-sorted-ink)",
};

export const EDGE_STROKE: Record<EdgeState, string> = {
  idle: "var(--viz-edge)",
  active: "var(--viz-edge-active)",
  tree: "var(--viz-edge-tree)",
  rejected: "var(--viz-edge-rejected)",
};

export const EDGE_WIDTH: Record<EdgeState, number> = {
  idle: 0.7,
  active: 1.4,
  tree: 1.2,
  rejected: 0.6,
};

export const VIEW_BOX = "-8 -8 116 116";
export const NODE_R = 5;

/**
 * Pure metadata mapping cell states to their non-colour Lucide React symbol name.
 * Ensures colour is never the sole indicator of state changes (Criterion S7.2).
 */
export const STATE_ICON_NAMES: Record<CellState, string | null> = {
  idle: null,
  active: "Play",
  visited: "Check",
  sorted: "Lock",
  compare: "GitCompare",
  frontier: "Search",
  found: "Target",
  excluded: "Ban",
};

/**
 * Descriptive accessible labels for each visualizer cell state signal.
 */
export const STATE_LABELS: Record<CellState, string> = {
  idle: "Idle",
  active: "Current Active (Play symbol)",
  visited: "Visited (Check symbol)",
  sorted: "Locked Sorted (Lock symbol)",
  compare: "Comparing (Compare symbol)",
  frontier: "Frontier Candidate (Search symbol)",
  found: "Target Found (Target symbol)",
  excluded: "Excluded (Ban symbol)",
};

/* ---------------- legend ---------------- */

/**
 * A legend row describing one state currently on screen.
 *
 * The legend used to be four hardcoded BFS rows ("Current / Visited /
 * Discovered / Unvisited") shown on every algorithm — they described nothing on
 * an array module, since binary search only ever emits `idle`, `excluded`,
 * `compare` and `found`. Deriving rows from the frame keeps it honest.
 */
export interface LegendRow {
  state: CellState;
  label: string;
  fill: string;
}

/** Generic wording, used when a slug has no more specific term. */
const LEGEND_DEFAULT: Record<CellState, string> = {
  idle: "Not yet examined",
  active: "Current",
  visited: "Visited",
  frontier: "Discovered",
  found: "Found",
  excluded: "Ruled out",
  compare: "Comparing",
  sorted: "In final position",
};

/**
 * Per-algorithm wording. The same `CellState` means different things across
 * modules — `active` is the window itself in sliding-window but the current
 * node in BFS, and `excluded` is a discarded half in binary search but the
 * element leaving the window in sliding-window. Only slugs that need different
 * wording appear here; the rest fall back to `LEGEND_DEFAULT`.
 */
const LEGEND_BY_SLUG: Record<string, Partial<Record<CellState, string>>> = {
  "binary-search": {
    idle: "Still in the window",
    compare: "Midpoint",
    frontier: "Half that survives",
    excluded: "Discarded",
    found: "Target found",
  },
  /* Linear search has no window and discards nothing in bulk: `excluded` is a
     value ruled out one at a time, which is the whole contrast with the
     binary-search wording directly above. */
  "linear-search": {
    idle: "Not checked yet",
    compare: "Checking now",
    excluded: "Checked, not a match",
    found: "Target found",
  },
  "two-sum": {
    idle: "Still a candidate",
    compare: "Current pair",
    excluded: "Endpoint ruled out",
    found: "Target pair",
  },
  "container-with-most-water": {
    idle: "Possible wall",
    compare: "Current walls",
    excluded: "Wall ruled out",
    found: "Best container walls",
  },
  "trapping-rain-water": {
    idle: "Unresolved bar",
    active: "Resolved boundary bar",
    compare: "Boundary maxima",
    found: "Water added here",
    sorted: "Water resolved",
  },
  "valid-palindrome": {
    idle: "Unchecked character",
    active: "Skipped or mismatched",
    compare: "Current endpoints",
    found: "Normalized match",
    excluded: "Proved or ignored",
  },
  "move-zeroes": {
    idle: "Unfinished slot",
    active: "Read or skipped value",
    compare: "Current read/write slot",
    found: "Copied non-zero",
    excluded: "Scanned output slot",
    sorted: "Final output prefix",
  },
  "remove-duplicates-from-sorted-array": {
    idle: "Unscanned value",
    active: "Skipped duplicate",
    compare: "Current and last unique",
    found: "Copied unique value",
    excluded: "Outside unique prefix",
    sorted: "Final unique prefix",
  },
  "three-sum": {
    idle: "Pair candidate",
    active: "Fixed anchor",
    compare: "Current endpoints",
    found: "Recorded triplet",
    excluded: "Ruled out or processed",
    sorted: "Sweep complete",
  },
  "binary-tree-level-order": {
    idle: "Not discovered",
    active: "Current dequeued node",
    frontier: "Waiting in queue",
    visited: "Recorded in a level",
  },
  "validate-binary-search-tree": {
    idle: "Not yet checked",
    active: "Current bounds check",
    visited: "Bounds valid",
    excluded: "BST violation",
  },
  /* Keyed by QUESTION slug, not algorithm slug: this is a problem-keyed module,
     and WorkspacePanels passes `run.slug`. Nearly binary search's wording, but
     the cells are candidate *slots* rather than candidate values, and `found`
     means the target was already in the list rather than a successful hunt. */
  "search-insert-position": {
    idle: "Could still be the slot",
    compare: "Midpoint",
    frontier: "Half that survives",
    excluded: "Cannot be the slot",
    found: "Already in the list",
  },
  /* Also question-keyed. The two ruled-out sides mean opposite things here, which
     is why they get two states rather than both reading "Discarded": below `lo`
     every version passed the check, above `hi` every version failed it. */
  "first-bad-version": {
    idle: "Could be the first bad",
    compare: "Version under test",
    frontier: "Half that survives",
    visited: "Passes the check",
    excluded: "Bad, but not the first",
    found: "First bad version",
  },
  /* Also question-keyed. The only module in the family with no target, so two
     cells are under test at once. Both labels name themselves rather than relying
     on their position, because LEGEND_ORDER puts `active` above `compare` — right
     for sliding-window ("Current window" then "Entering") and quicksort ("Pivot"
     then "Compared to pivot"), so it is the wording that gives here, not the
     shared order. The ruled-out sides are slopes rather than verdicts. */
  "peak-index-in-mountain-array": {
    idle: "Could be the peak",
    compare: "The cell under test",
    active: "Its right neighbour",
    frontier: "Half that survives",
    visited: "On the way up",
    excluded: "On the way down",
    found: "The peak",
  },
  /* Also question-keyed. Two cells are lit as in the mountain module, but they are
     not neighbours: `active` is a[hi], the moving yardstick the midpoint is
     measured against. Self-describing labels for the same reason as above. The two
     ruled-out sides say where the cut is, not which slope we are on. */
  "find-minimum-in-rotated-sorted-array": {
    idle: "Could be the minimum",
    compare: "The midpoint under test",
    active: "The yardstick, a[hi]",
    frontier: "Half that survives",
    visited: "Before the cut",
    excluded: "After the minimum",
    found: "The minimum",
  },
  /* Also question-keyed, and the only module anywhere that uses `sorted` for
     something other than a finished sort — here it shades the half proven to be in
     ascending order, which is the whole insight the question turns on. Both
     ruled-out sides share one state, unlike the find-minimum module above: here
     they mean the same thing, since a discarded cell is simply one the target
     cannot be in. */
  "search-rotated-sorted-array": {
    idle: "Could hold the target",
    compare: "The midpoint tested",
    sorted: "This half is in order",
    frontier: "Half that survives",
    excluded: "Ruled out",
    found: "Target found",
  },
  /* Also question-keyed, and the only module whose cells are not input at all: the
     row is every candidate *answer*, 1 to max(piles). So `idle` says "answer"
     rather than "target", and the two ruled-out sides are opposites in the mirror
     image of first-bad-version — a speed below `lo` was measured and ran out of
     time, while one above `hi` finishes in time but is not the slowest that does. */
  "koko-eating-bananas": {
    idle: "Could be the answer",
    compare: "The speed being tested",
    frontier: "Half that survives",
    visited: "Works, but not slowest",
    excluded: "Too slow to finish",
    found: "Slowest that works",
  },
  "sliding-window": {
    idle: "Outside the window",
    active: "Current window",
    compare: "Entering",
    excluded: "Leaving",
    found: "Best window",
  },
  "sort-colors": {
    idle: "Not classified yet",
    compare: "Classifying now",
    visited: "Middle partition: 1",
    sorted: "Final partition: 0 or 2",
  },
  quicksort: {
    active: "Pivot",
    compare: "Compared to pivot",
    excluded: "Outside this partition",
    sorted: "In final position",
  },
  "heap-sort": { active: "Sifting", sorted: "Removed from heap" },
  dijkstra: { frontier: "Reachable", visited: "Distance settled" },
  "topological-sort": { frontier: "Ready (no deps left)", visited: "Placed in order" },
};

export function legendLabel(slug: string, state: CellState): string {
  return LEGEND_BY_SLUG[slug]?.[state] ?? LEGEND_DEFAULT[state];
}

/** Every state present in `frame`, whatever its kind. */
export function statesInFrame(frame: Frame): Set<CellState> {
  const states = new Set<CellState>();
  switch (frame.kind) {
    case "array":
      for (const state of Object.values(frame.states)) states.add(state);
      break;
    case "tree":
    case "heap":
    case "linked-list":
    case "graph":
      for (const item of frame.kind === "heap" ? frame.slots : frame.nodes) {
        states.add(item.state);
      }
      break;
    case "grid":
    case "table":
      for (const cell of frame.cells) states.add(cell.state);
      break;
  }
  return states;
}

/** Fixed display order, so rows never reshuffle as states come and go. */
const LEGEND_ORDER: CellState[] = [
  "active",
  "compare",
  "frontier",
  "found",
  "visited",
  "sorted",
  "excluded",
  "idle",
];

/**
 * Legend rows for the states actually present in `frame`, in a stable order.
 * Empty for a frame of nothing but `idle` cells — there is nothing to explain.
 */
export function legendRows(frame: Frame, slug: string): LegendRow[] {
  const present = statesInFrame(frame);
  if (present.size <= 1 && present.has("idle")) return [];
  return LEGEND_ORDER.filter((state) => present.has(state)).map((state) => ({
    state,
    label: legendLabel(slug, state),
    fill: FILL[state],
  }));
}
