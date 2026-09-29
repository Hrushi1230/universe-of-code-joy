import { StepBuilder } from "@/engine/builder";
import { parseNumberList } from "@/engine/algorithms/binarySearch";
import { checkRotatedShape, rotationNote, rotationOf } from "@/engine/algorithms/rotatedArray";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const PSEUDOCODE: string[] = [
  "function findMin(a)",
  "  lo <- 0",
  "  hi <- length(a) - 1",
  "  while lo < hi",
  "    mid <- floor((lo + hi) / 2)",
  "    if a[mid] > a[hi]",
  "      lo <- mid + 1",
  "    else",
  "      hi <- mid",
  "  return a[lo]",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function findMin(a) {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo < hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] > a[hi]) {",
    "      lo = mid + 1;",
    "    } else {",
    "      hi = mid;",
    "    }",
    "  }",
    "  return a[lo];",
    "}",
  ],
  ts: [
    "function findMin(a: number[]): number {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo < hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] > a[hi]) {",
    "      lo = mid + 1;",
    "    } else {",
    "      hi = mid;",
    "    }",
    "  }",
    "  return a[lo];",
    "}",
  ],
  py: [
    "def find_min(a):",
    "    lo = 0",
    "    hi = len(a) - 1",
    "    while lo < hi:",
    "        mid = (lo + hi) // 2",
    "        if a[mid] > a[hi]:",
    "            lo = mid + 1",
    "        else:",
    "            hi = mid",
    "    return a[lo]",
  ],
};

/** Python is 1:1; JS and TS only drift at `return a[lo]`, below two closing braces. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

function windowLabel(lo: number, hi: number, previous?: number): string {
  const size = Math.max(0, hi - lo + 1);
  if (previous !== undefined && previous !== size) {
    return `minimum is in here · ${previous} → ${plural(size, "cell")}`;
  }
  return `minimum is in here · ${plural(size, "cell")}`;
}

interface FrameSpec {
  lo: number;
  hi: number;
  mid: number | null;
  showMidMath?: boolean;
  survivor?: { from: number; to: number };
  found?: number;
  label: string;
}

/**
 * Two cells are lit on a probe, as in the mountain module, but they are not
 * neighbours: `mid` is measured against `a[hi]`, the right end of the window. On a
 * wide window those cells are far apart, and that reach is the point — the
 * yardstick is a moving part of the window, not a fixed target.
 *
 * `survivor` is applied last so membership decides which of the two joins the
 * surviving side: a high midpoint drops out and the yardstick's half lives, a low
 * midpoint survives and the yardstick's half dies.
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
    // Never the same cell as `mid`: lo < hi forces mid < hi.
    states[hi] = "active";
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
  // Not sorted, and not sortable: the rotation is the structure being searched.
  const values = parsed["values"] as number[];
  const n = values.length;

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  let lo = 0;
  let hi = n - 1;
  let comparisons = 0;

  b.bump("comparisons", 0);
  b.bump("linear worst", Math.max(0, n - 1));

  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, label: windowLabel(lo, hi) }),
    codeLine: 3,
    narration: `A sorted list, cut somewhere and swapped end to end. Find the smallest value.`,
    // The single most important design decision in this algorithm, stated up
    // front because everything after it is a consequence.
    detail: `The yardstick is a[hi], the value at the right end of the window — not a target and not the neighbour. Measuring against a[lo] instead looks equally reasonable and is quietly broken: in a list that was never rotated every midpoint above lo is larger than a[lo], so lo marches right and strides straight past the smallest value sitting at index 0. Comparing against the right end gets that case free.`,
    phase: "setup",
    isMilestone: true,
  });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const here = values[mid]!;
    const right = values[hi]!;
    const size = hi - lo + 1;

    b.emit({
      frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
      codeLine: 5,
      narration: `Measure the middle, a[${mid}] = ${here}, against the right end, a[${hi}] = ${right}.`,
      detail: `mid = floor((lo + hi) / 2) = floor((${lo} + ${hi}) / 2) = ${mid}. ${hi - mid === 1 ? "Those two cells happen to be adjacent in a window this narrow." : `Those two cells are ${plural(hi - mid, "cell")} apart — the comparison reaches across the window rather than looking next door.`}`,
      phase: "probe",
      isMilestone: true,
    });

    b.bump("comparisons");
    comparisons += 1;
    const midIsHigh = here > right;

    const nextLo = midIsHigh ? mid + 1 : lo;
    const nextHi = midIsHigh ? hi : mid;
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
      narration: midIsHigh
        ? `${here} > ${right}, so the cut has to be somewhere after index ${mid}.`
        : `${here} < ${right}, so index ${mid} to index ${hi} is one unbroken rising run.`,
      detail: midIsHigh
        ? `In a rotated list every value before the cut is larger than every value after it. a[${mid}] being larger than the right end puts ${mid} on the high side, before the cut, and so is everything from lo up to it. The smallest value is past ${mid}.`
        : `A rising run contains no cut, so the smallest value in it is its first element. That makes ${mid} the best candidate seen so far and rules out everything after it — but not ${mid} itself.`,
      phase: "compare",
    });

    b.emit({
      frame: frameFor(values, {
        lo: nextLo,
        hi: nextHi,
        mid: null,
        label: windowLabel(nextLo, nextHi, size),
      }),
      codeLine: midIsHigh ? 7 : 9,
      narration: midIsHigh
        ? `lo moves to ${nextLo}, past the whole high side we just ruled out.`
        : `hi drops to ${nextHi} — onto the candidate, not past it.`,
      detail: midIsHigh
        ? `lo <- mid + 1 is safe because a[${mid}] is provably not the smallest — something after it is smaller. ${plural(size, "cell")} → ${remaining}.`
        : `hi <- mid, not mid - 1, and for the usual reason in this family: a[${mid}] is still the smallest thing seen, so discarding it could discard the answer. Note that hi moving also moves the yardstick — next round measures against a different cell. ${plural(size, "cell")} → ${remaining}.`,
      phase: midIsHigh ? "narrow-right" : "narrow-left",
      isMilestone: true,
    });

    lo = nextLo;
    hi = nextHi;
  }

  const at = lo;
  const rotation = rotationOf(values);
  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, found: at, label: windowLabel(lo, hi) }),
    codeLine: 10,
    narration:
      comparisons === 0
        ? `One cell, so it is both the whole list and its minimum: ${values[at]!}.`
        : `lo and hi have closed on index ${at}, holding ${values[at]!} — the minimum.`,
    detail:
      comparisons === 0
        ? `The loop never ran. With a single cell there is no window to halve and nothing to measure against.`
        : `${rotation === 0 ? "This list was never actually rotated, and the yardstick handled it without a special case: every midpoint measured below the right end, so hi walked down to index 0." : `The cut sits between index ${rotation - 1} and index ${rotation}, and lo and hi converged on the low side of it.`} ${plural(comparisons, "comparison")} instead of the ${plural(Math.max(0, n - 1), "comparison")} a scan would need.`,
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "find-minimum-in-rotated-sorted-array",
    `[${values.join(", ")}] (${rotationNote(values)})`,
    `the minimum is ${values[at]!} at index ${at}`,
  );
}

const WHY_UNIQUE =
  "With duplicates, comparing a[mid] to a[hi] cannot tell which side the cut is on.";

export const findMinimumRotatedModule: AlgorithmModule = {
  slug: "find-minimum-in-rotated-sorted-array",
  inputs: [
    {
      name: "values",
      label: "Rotated sorted list",
      kind: "numbers",
      default: "4, 5, 6, 7, 0, 1, 2",
      help: "A sorted list of unique numbers, cut once and swapped end to end.",
      max: 12,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const problem = checkRotatedShape(list.values, WHY_UNIQUE);
    if (problem) return { ok: false, error: problem };
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Cut in the middle", values: { values: "4, 5, 6, 7, 0, 1, 2" } },
    { label: "Cut near the end", values: { values: "3, 4, 5, 1, 2" } },
    /* The case that justifies measuring against a[hi] rather than a[lo]: an
       unrotated list, where an a[lo] comparison would walk right past index 0. */
    { label: "Never rotated at all", values: { values: "11, 13, 15, 17" } },
    /* Twelve cells use the full fixed teaching width, so
       this preset still shows two rising ramps with a cliff between them, and
       the search visibly closing on the foot of the cliff. Degrades to boxes if
       that threshold ever moves. */
    {
      label: "See the cliff",
      values: {
        values: "235, 245, 255, 265, 275, 305, 105, 125, 145, 165, 185, 205",
      },
    },
  ],
};

export default findMinimumRotatedModule;
