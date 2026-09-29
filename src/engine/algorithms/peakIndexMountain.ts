import { StepBuilder } from "@/engine/builder";
import { parseNumberList } from "@/engine/algorithms/binarySearch";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_ITEMS = 12;
/** A mountain needs something to climb and something to descend. */
const MIN_ITEMS = 3;

const PSEUDOCODE: string[] = [
  "function peakIndex(a)",
  "  lo <- 0",
  "  hi <- length(a) - 1",
  "  while lo < hi",
  "    mid <- floor((lo + hi) / 2)",
  "    if a[mid] < a[mid + 1]",
  "      lo <- mid + 1",
  "    else",
  "      hi <- mid",
  "  return lo",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function peakIndexInMountainArray(a) {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo < hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] < a[mid + 1]) {",
    "      lo = mid + 1;",
    "    } else {",
    "      hi = mid;",
    "    }",
    "  }",
    "  return lo;",
    "}",
  ],
  ts: [
    "function peakIndexInMountainArray(a: number[]): number {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo < hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] < a[mid + 1]) {",
    "      lo = mid + 1;",
    "    } else {",
    "      hi = mid;",
    "    }",
    "  }",
    "  return lo;",
    "}",
  ],
  py: [
    "def peak_index(a):",
    "    lo = 0",
    "    hi = len(a) - 1",
    "    while lo < hi:",
    "        mid = (lo + hi) // 2",
    "        if a[mid] < a[mid + 1]:",
    "            lo = mid + 1",
    "        else:",
    "            hi = mid",
    "    return lo",
  ],
};

/** Python is 1:1; JS and TS only drift at `return lo`, below two closing braces. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * States the invariant rather than the mechanics: whatever else changes, the peak
 * is always somewhere inside [lo, hi]. That is the claim the whole algorithm rests
 * on, and it is the one thing worth repeating on every frame.
 */
function windowLabel(lo: number, hi: number, previous?: number): string {
  const size = Math.max(0, hi - lo + 1);
  if (previous !== undefined && previous !== size) {
    return `peak is in here · ${previous} → ${plural(size, "cell")}`;
  }
  return `peak is in here · ${plural(size, "cell")}`;
}

interface FrameSpec {
  lo: number;
  hi: number;
  /** The cell we are standing on, or null when nothing is under test. */
  mid: number | null;
  showMidMath?: boolean;
  survivor?: { from: number; to: number };
  found?: number;
  label: string;
}

/**
 * Two cells are under test here, not one — this question has no target to compare
 * against, only `a[mid]` against its right neighbour. `mid` gets `compare` and
 * `mid + 1` gets `active`, so the pair is one glance rather than two identical
 * plates, and the legend can name them separately.
 *
 * `survivor` is applied last, and membership decides which of the pair lights up
 * as surviving: uphill keeps the neighbour and drops `mid`, downhill keeps `mid`
 * and drops the neighbour. Same code, mirrored result — that is the branch.
 */
function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { lo, hi, mid, showMidMath, survivor, found, label } = spec;
  const n = values.length;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < n; i += 1) {
    states[i] = i < lo ? "visited" : i > hi ? "excluded" : "idle";
  }
  if (mid !== null) {
    states[mid] = "compare";
    // Always a real index while the loop runs: lo < hi forces mid < hi <= n - 1.
    if (mid + 1 < n) states[mid + 1] = "active";
  }
  if (survivor) {
    const from = Math.max(0, survivor.from);
    const to = Math.min(n - 1, survivor.to);
    for (let i = from; i <= to; i += 1) states[i] = "frontier";
  }
  if (found !== undefined) states[found] = "found";

  const pointers: ArrayFrame["pointers"] = [
    { name: "lo", index: lo },
    { name: "hi", index: hi },
  ];
  if (mid !== null) {
    pointers.push({
      name: "mid",
      index: mid,
      color: "accent",
      ...(showMidMath ? { note: `(${lo} + ${hi}) / 2 = ${mid}` } : {}),
    });
  }

  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    pointerNotes: true,
    ranges: lo <= hi ? [{ from: lo, to: hi, label, tone: "tint" }] : [],
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  // Deliberately NOT sorted, unlike its sibling modules: the order *is* the
  // question. Sorting a mountain would destroy the only structure being searched.
  const values = parsed["values"] as number[];
  const n = values.length;

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  let lo = 0;
  let hi = n - 1;
  let comparisons = 0;

  b.bump("comparisons", 0);
  // Adjacent pairs, not cells: a left-to-right scan stops at the first pair that
  // goes down, and there are only n - 1 pairs to check.
  b.bump("linear worst", n - 1);

  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, label: windowLabel(lo, hi) }),
    codeLine: 3,
    narration: `The values climb to a peak and then fall. Find the index of that peak.`,
    detail: `There is no target to look for here — nothing to compare a cell against except its own neighbour. That turns out to be enough: one look at a[mid] and a[mid + 1] says which way the ground slopes, and the slope says which side the summit is on. Walking the ${plural(n - 1, "pair")} in order would find it too, just slower.`,
    phase: "setup",
    isMilestone: true,
  });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const here = values[mid]!;
    const next = values[mid + 1]!;
    const size = hi - lo + 1;

    b.emit({
      frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
      codeLine: 5,
      narration: `Stand on index ${mid} and look one step right, at index ${mid + 1}.`,
      detail: `mid = floor((lo + hi) / 2) = floor((${lo} + ${hi}) / 2) = ${mid}. Comparing a[${mid}] = ${here} with a[${mid + 1}] = ${next} settles which half of the ${plural(size, "cell")} still in play can hold the peak.`,
      phase: "probe",
      isMilestone: true,
    });

    b.bump("comparisons");
    comparisons += 1;
    const uphill = here < next;

    const nextLo = uphill ? mid + 1 : lo;
    const nextHi = uphill ? hi : mid;
    const remaining = nextHi - nextLo + 1;

    b.emit({
      frame: frameFor(values, {
        lo,
        hi,
        mid,
        showMidMath: true,
        survivor: { from: nextLo, to: nextHi },
        label: windowLabel(lo, hi),
      }),
      codeLine: 6,
      narration: uphill
        ? `${here} < ${next} — the ground is still rising, so we are on the way up.`
        : `${here} > ${next} — the ground is falling, so the summit is already behind or underfoot.`,
      detail: uphill
        ? `On the way up, every cell from lo to ${mid} is lower than the one after it, so none of them can be the summit. The peak has to be at ${mid + 1} or further right.`
        : `Once the ground falls, a[${mid}] is higher than everything to its right, so the peak cannot be past ${mid}. It might be ${mid} itself, which is why ${mid} stays in play.`,
      phase: "compare",
    });

    b.emit({
      frame: frameFor(values, {
        lo: nextLo,
        hi: nextHi,
        mid: null,
        label: windowLabel(nextLo, nextHi, size),
      }),
      codeLine: uphill ? 7 : 9,
      narration: uphill
        ? `lo climbs to ${nextLo}, abandoning the slope we already know rises.`
        : `hi drops to ${nextHi} — onto the cell we just tested, not past it.`,
      detail: uphill
        ? `lo <- mid + 1 is safe because a rising cell is provably not the peak. ${plural(size, "cell")} → ${remaining}.`
        : `hi <- mid, not mid - 1. This is where a copy-pasted binary search breaks: a[mid] being higher than its neighbour is exactly what a peak looks like, so throwing mid away could throw away the answer. ${plural(size, "cell")} → ${remaining}.`,
      phase: uphill ? "narrow-right" : "narrow-left",
      isMilestone: true,
    });

    lo = nextLo;
    hi = nextHi;
  }

  const peak = lo;
  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, found: peak, label: windowLabel(lo, hi) }),
    codeLine: 10,
    narration: `lo and hi have closed on index ${peak}, holding ${values[peak]!} — the peak.`,
    detail: `Neither pointer ever stepped over the summit: lo only moved past cells that were still rising and hi only moved onto a cell that could be the peak, so the invariant in the caption held from the first step to the last. ${plural(comparisons, "comparison")} instead of the ${plural(n - 1, "pair")} a walk could need.`,
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "peak-index-in-mountain-array",
    `[${values.join(", ")}]`,
    `the peak is ${values[peak]!} at index ${peak}`,
  );
}

/**
 * A real check, not a formality: the algorithm is only correct on a genuine
 * mountain, so a shape that is not one has to be rejected with the reason rather
 * than animated into a confidently wrong answer.
 *
 * Plateaus fall out of this for free — a pair of equal values stops the climb and
 * then fails the descent, and the error names the pair.
 */
function findPeak(a: number[]): number | string {
  const n = a.length;
  let i = 0;
  while (i + 1 < n && a[i]! < a[i + 1]!) i += 1;
  if (i === 0) {
    return `A mountain has to rise first, but a[0] = ${a[0]!} is not below a[1] = ${a[1]!}.`;
  }
  if (i === n - 1) {
    return `A mountain has to come down again, but these values only rise, up to a[${n - 1}] = ${a[n - 1]!}.`;
  }
  for (let j = i; j + 1 < n; j += 1) {
    if (!(a[j]! > a[j + 1]!)) {
      return `After the peak at index ${i} the values must keep falling, but a[${j}] = ${a[j]!} is not above a[${j + 1}] = ${a[j + 1]!}.`;
    }
  }
  return i;
}

export const peakIndexMountainModule: AlgorithmModule = {
  slug: "peak-index-in-mountain-array",
  inputs: [
    {
      name: "values",
      label: "Mountain",
      kind: "numbers",
      default: "1, 3, 7, 12, 20, 15, 9, 4, 2",
      help: `${MIN_ITEMS} to ${MAX_ITEMS} numbers that rise to a single peak, then fall.`,
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const values = list.values;
    if (values.length < MIN_ITEMS) {
      return {
        ok: false,
        error: `A mountain needs at least ${MIN_ITEMS} values — a rise, a peak and a fall.`,
      };
    }
    const peak = findPeak(values);
    if (typeof peak === "string") return { ok: false, error: peak };
    return { ok: true, parsed: { values } };
  },
  run,
  presets: [
    { label: "Summit in the middle", values: { values: "1, 3, 7, 12, 20, 15, 9, 4, 2" } },
    { label: "Steep start, long descent", values: { values: "2, 9, 8, 7, 5, 4, 3, 1" } },
    { label: "Long climb, sheer drop", values: { values: "1, 2, 4, 8, 16, 32, 64, 5" } },
    /* Twelve cells use the full fixed teaching width, so this preset draws a mountain and
       the search visibly walks the slope. That threshold is ArrayView's own
       (a box narrower than its digits becomes a bar), so if it ever moves this
       preset stays correct if the cell treatment changes. */
    {
      label: "See the mountain",
      values: {
        values: "10, 40, 90, 150, 220, 300, 390, 480, 570, 650, 720, 100",
      },
    },
  ],
};

export default peakIndexMountainModule;
