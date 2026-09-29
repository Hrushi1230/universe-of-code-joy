/**
 * Engine contract types. Pure TypeScript — no React, no DOM, no timers.
 * Unrelated to src/data/types.ts (content metadata).
 */

export type CellState =
  | "idle"
  | "active"
  | "visited"
  | "frontier"
  | "found"
  | "excluded"
  | "compare"
  | "sorted";

export type EdgeState = "idle" | "active" | "tree" | "rejected";

export type ArrayFrame = {
  kind: "array";
  /** Elevation scene: only water already finalized by this execution step. */
  rainWater?: {
    depths: number[];
    leftMax: number;
    rightMax: number;
    activeIndex?: number;
    added: number;
    done: boolean;
  };
  values: (number | string)[];
  /** index -> state */
  states: Record<number, CellState>;
  /**
   * `note` is a short expression shown under the pointer label — the arithmetic
   * that put the pointer where it is, e.g. `floor((0 + 9) / 2) = 4`. Keep it to
   * roughly 26 characters; the view clamps it to the canvas but cannot shrink it.
   */
  pointers: Array<{
    name: string;
    index: number;
    color?: "accent" | "warning" | "error";
    note?: string;
  }>;
  /**
   * Set on every frame of a run that will ever carry a pointer `note`. The view
   * reserves the note row up front — a row that appears and disappears between
   * steps would resize the canvas under the array.
   */
  pointerNotes?: boolean;
  ranges: Array<{ from: number; to: number; label?: string; tone?: "tint" | "warning" }>;
  /**
   * How many range rows the view should reserve. Set it to the largest
   * `ranges.length` the run will ever emit; merge-sort and sliding-window swing
   * between one and two, which resized the canvas mid-playback. Defaults to
   * `ranges.length` when absent.
   */
  rangeRows?: number;
  swapPair?: [number, number];
  /**
   * The value being hunted, drawn as a card above the row. Presentation only —
   * nothing in the engine reads it back.
   */
  target?: { label: string; value: number | string };
  /**
   * The single comparison this step is making, as three parts so the view can
   * lay them out (`16` `>` `13`) plus the plain-English verdict under them.
   */
  comparison?: {
    left: string;
    op: string;
    right: string;
    verdict?: string;
    tone?: "accent" | "error" | "warning";
  };
  /** What the comparison lets us conclude, shown as a callout under the strip. */
  decision?: { title: string; detail?: string; tone?: "accent" | "error" | "warning" };
};

export type TreeFrame = {
  kind: "tree";
  /** Optional engine-owned canvas for wide or compact tree layouts. */
  viewBox?: { minX: number; minY: number; width: number; height: number };
  nodes: Array<{
    id: string;
    label: string | number;
    x: number;
    y: number;
    state: CellState;
    badge?: string;
  }>;
  edges: Array<{ from: string; to: string; state: EdgeState; label?: string }>;
};

/**
 * One canonical set of heap slots drives both the complete-tree and backing-
 * array representations. Values may move between indices, but slot coordinates
 * stay constant for the full run so a swap never reflows either representation.
 */
export type HeapFrame = {
  kind: "heap";
  heapType: "min" | "max";
  /** Active heap prefix; slots at or after this boundary are outside the heap. */
  heapSize: number;
  slots: Array<{
    index: number;
    value: number | string;
    x: number;
    y: number;
    state: CellState;
    badge?: string;
  }>;
  /** Child index -> edge state. Missing entries use the active heap boundary. */
  edgeStates?: Record<number, EdgeState>;
  swapPair?: [number, number];
};

/**
 * Node coordinates are engine-owned percentages of the base teaching canvas.
 * Keep `nodeSlots` constant for every frame in a run so removals and temporary
 * detached nodes never resize or reflow the list between steps.
 */
export type LinkedListFrame = {
  kind: "linked-list";
  nodeSlots: number;
  nodes: Array<{
    id: string;
    label: string | number;
    x: number;
    y: number;
    state: CellState;
    badge?: string;
  }>;
  links: Array<{
    id: string;
    from: string;
    to: string | null;
    state: EdgeState;
    label?: string;
    detached?: boolean;
  }>;
  pointers: Array<{
    name: string;
    nodeId: string | null;
    color?: "accent" | "warning" | "error";
  }>;
};

export type GraphFrame = {
  kind: "graph";
  directed: boolean;
  weighted: boolean;
  nodes: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    state: CellState;
    dist?: number | null;
    parent?: string | null;
    indegree?: number;
    badge?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    weight?: number;
    state: EdgeState;
    label?: string;
  }>;
};

export type GridFrame = {
  kind: "grid";
  rows: number;
  cols: number;
  cells: Array<{ r: number; c: number; state: CellState; label?: string | number }>;
  path?: Array<[number, number]>;
};

export type TableFrame = {
  kind: "table";
  /** One row of indexed state or a row/column matrix. Inferred for legacy fixtures when absent. */
  layout?: "1d" | "2d";
  title?: string;
  rowLabels: (string | number)[];
  colLabels: (string | number)[];
  cells: Array<{
    r: number;
    c: number;
    value: string | number | null;
    state: CellState;
    /** Non-colour teaching role for this step. */
    role?: "base" | "dependency" | "target" | "write" | "result";
    annotation?: string;
  }>;
  /** The transition being evaluated beneath the stable table. */
  computation?: {
    phase: "read" | "compute" | "write";
    target: { r: number; c: number };
    dependencies: Array<{ r: number; c: number; label: string }>;
    formula: string;
    candidates: Array<{
      label: string;
      value: string | number;
      selected?: boolean;
    }>;
    result: string | number | null;
  };
};

export type Frame =
  | ArrayFrame
  | TreeFrame
  | HeapFrame
  | LinkedListFrame
  | GraphFrame
  | GridFrame
  | TableFrame;

export type RecursionState = "enter" | "active" | "return" | "success" | "failure" | "undo";

export type CallStackPanel = {
  kind: "callstack";
  label: string;
  /** Frames are ordered from the root call to the currently executing call. */
  frames: Array<{
    id: string;
    call: string;
    args: Array<{ name: string; value: string }>;
    state: RecursionState;
    /** Branch, candidate, pivot, or other choice being explored. */
    choice?: string;
    /** Return value or terminal explanation. */
    result?: string;
  }>;
};

export type AuxPanel =
  | { kind: "stack"; label: string; items: Array<{ id: string; label: string; state?: CellState }> }
  | { kind: "queue"; label: string; items: Array<{ id: string; label: string; state?: CellState }> }
  | CallStackPanel
  | { kind: "keyvalue"; label: string; rows: Array<{ k: string; v: string; highlight?: boolean }> }
  | { kind: "log"; label: string; lines: string[] }
  /**
   * One row per input item with what it costs at the current candidate answer,
   * plus that total judged against a budget.
   *
   * Needed by "binary search the answer" questions, where the searched axis is a
   * range of candidate answers rather than the input itself: each probe is an O(n)
   * computation over the whole input instead of a lookup, so the sum has to be on
   * screen to be checkable. Deliberately a new kind rather than a reuse of
   * `keyvalue` — dijkstra, heap-sort and sliding-window all emit `keyvalue` panels
   * that the player currently does not render, so widening that path would have
   * changed three visualizers nobody asked to change.
   */
  | {
      kind: "cost";
      label: string;
      rows: Array<{ id: string; item: string; cost: string }>;
      total?: { label: string; value: string; budget: string; ok: boolean };
    };

export type Step = {
  /** index in the step list, filled by the builder */
  i: number;
  frame: Frame;
  /** stack / queue / recursive calls / dist table / log beside the main view */
  aux?: AuxPanel[];
  /** 1-based line in the algorithm's pseudocode */
  codeLine: number;
  /** ONE plain-English sentence, present tense */
  narration: string;
  /** optional deeper 1-2 sentences */
  detail?: string;
  /** e.g. 'partition', 'relax-edges' — used for the timeline */
  phase: string;
  /** Short human label for the timeline node, e.g. 'Compare'. Falls back to `phase`. */
  timelineLabel?: string;

  /** comparisons, swaps, visits, pushes... */
  counters: Record<string, number>;
  /** scrubber tick marks + quiz anchor points */
  isMilestone?: boolean;
};

/**
 * Translates a pseudocode line number into the line to highlight in a real
 * language listing.
 *
 * Braced languages need closing lines that pseudocode does not have, and some
 * listings merge two pseudocode lines into one statement, so the two are not
 * 1:1 — before this existed, `codeLine: 12` on binary search highlighted
 * `return -1` in Python and a bare `}` in JS.
 *
 * `map[lang][pseudoLine - 1]` is the 1-based line in that listing, or 0 when
 * that listing has no counterpart at all (highlight nothing rather than
 * highlight the wrong statement). A module with no entry for a language falls
 * back to identity, which is only correct when that listing has no extra
 * closing lines.
 */
export type CodeLineMap = Partial<Record<"js" | "ts" | "py", number[]>>;

export type AlgorithmRun = {
  slug: string;
  steps: Step[];
  pseudocode: string[];
  /** Real-language listings; line numbers do NOT match `codeLine` — see `codeMap`. */
  codeByLang: Record<"js" | "ts" | "py", string[]>;
  /** Per-language translation of `Step.codeLine`. Absent means identity. */
  codeMap?: CodeLineMap;
  inputSummary: string;
  /** human-readable outcome */
  result: string;
  totalCounters: Record<string, number>;
  /** True if steps reached MAX_FRAMES and simulation was truncated early */
  truncated?: boolean;
};

export type InputField =
  | { name: string; label: string; kind: "numbers"; default: string; help?: string; max?: number }
  | { name: string; label: string; kind: "number"; default: number; min: number; max: number }
  | { name: string; label: string; kind: "text"; default: string }
  | { name: string; label: string; kind: "select"; default: string; options: string[] }
  | { name: string; label: string; kind: "graph"; default: string; help?: string }
  | { name: string; label: string; kind: "grid"; default: string; help?: string };

export type ValidationResult =
  | { ok: true; parsed: Record<string, unknown> }
  | { ok: false; error: string };

export type AlgorithmModule = {
  slug: string;
  inputs: InputField[];
  validate(raw: Record<string, string>): ValidationResult;
  run(parsed: Record<string, unknown>): AlgorithmRun;
  presets: Array<{ label: string; values: Record<string, string> }>;
};
