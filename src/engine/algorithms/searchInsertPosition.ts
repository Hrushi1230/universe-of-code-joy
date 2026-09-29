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

const PSEUDOCODE: string[] = [
  "function searchInsert(a, target)",
  "  lo <- 0",
  "  hi <- length(a) - 1",
  "  while lo <= hi",
  "    mid <- floor((lo + hi) / 2)",
  "    if a[mid] = target",
  "      return mid",
  "    else if a[mid] < target",
  "      lo <- mid + 1",
  "    else",
  "      hi <- mid - 1",
  "  return lo",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function searchInsert(a, target) {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo <= hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] === target) {",
    "      return mid;",
    "    } else if (a[mid] < target) {",
    "      lo = mid + 1;",
    "    } else {",
    "      hi = mid - 1;",
    "    }",
    "  }",
    "  return lo;",
    "}",
  ],
  ts: [
    "function searchInsert(a: number[], target: number): number {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo <= hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] === target) {",
    "      return mid;",
    "    } else if (a[mid] < target) {",
    "      lo = mid + 1;",
    "    } else {",
    "      hi = mid - 1;",
    "    }",
    "  }",
    "  return lo;",
    "}",
  ],
  py: [
    "def search_insert(a, target):",
    "    lo = 0",
    "    hi = len(a) - 1",
    "    while lo <= hi:",
    "        mid = (lo + hi) // 2",
    "        if a[mid] == target:",
    "            return mid",
    "        elif a[mid] < target:",
    "            lo = mid + 1",
    "        else:",
    "            hi = mid - 1",
    "    return lo",
  ],
};

/**
 * Identical shape to binary search's map, because the listings are the same
 * length — the only textual difference is `return lo` in place of `return -1`,
 * which is the entire lesson of this question.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14],
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

function windowLabel(lo: number, hi: number, previous?: number): string {
  const size = Math.max(0, hi - lo + 1);
  if (previous !== undefined && previous !== size) {
    return `search window · ${previous} → ${plural(size, "candidate")}`;
  }
  return `search window · ${plural(size, "candidate")}`;
}

/** Where `target` would sit, written as the gap it falls into. */
function gapLabel(values: number[], slot: number): string {
  const left = slot > 0 ? values[slot - 1] : undefined;
  const right = slot < values.length ? values[slot] : undefined;
  if (left === undefined) return `before ${right}`;
  if (right === undefined) return `after ${left}`;
  return `between ${left} and ${right}`;
}

interface FrameSpec {
  lo: number;
  hi: number;
  mid: number | null;
  showMidMath?: boolean;
  survivor?: { from: number; to: number };
  found?: number;
  /**
   * The insertion slot, marked once the window is empty. Drawn as a zero-width
   * `insert` pointer rather than a cell state, because the answer is a gap
   * *between* cells — and when the target belongs at the end the slot is index
   * `n`, which is not a cell at all.
   */
  insertAt?: number;
  label: string;
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { lo, hi, mid, showMidMath, survivor, found, insertAt, label } = spec;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = i < lo || i > hi ? "excluded" : "idle";
  }
  if (survivor) {
    const from = Math.max(0, survivor.from);
    const to = Math.min(values.length - 1, survivor.to);
    for (let i = from; i <= to; i += 1) states[i] = "frontier";
  }
  if (mid !== null && mid >= lo && mid <= hi) states[mid] = "compare";
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
  if (insertAt !== undefined) {
    pointers.push({
      name: "insert",
      index: insertAt,
      color: "warning",
      note: gapLabel(values, insertAt),
    });
  }

  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    // Reserved on every frame, so the canvas keeps one height for the whole run
    // rather than growing on probe steps and shrinking on narrowing steps.
    pointerNotes: true,
    ranges: lo <= hi ? [{ from: lo, to: hi, label, tone: "tint" }] : [],
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const target = parsed["target"] as number;
  const values = [...original].sort((a, b) => a - b);
  const wasSorted = original.every((v, i) => v === values[i]);

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  let lo = 0;
  let hi = values.length - 1;
  let foundIndex = -1;
  let comparisons = 0;

  // Bumped before the first emit so the column is on every step: the point is to
  // watch `comparisons` climb towards a number that was there from the start.
  // Scanning left to right to find the slot only costs n when the target belongs
  // at the very end, which is what "worst" claims.
  b.bump("linear worst", values.length);

  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, label: windowLabel(lo, hi) }),
    codeLine: 3,
    narration: `We want the index of ${target} — or the slot where it would keep the list sorted.`,
    detail: `${wasSorted ? "The list is already sorted, which is what makes halving valid." : "The list was sorted first, because halving only works on sorted data."} Every one of the ${plural(values.length, "value")} is still a candidate, and so is the gap after the last one.`,
    phase: "setup",
    isMilestone: true,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midValue = values[mid]!;
    const size = hi - lo + 1;

    b.emit({
      frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
      codeLine: 5,
      narration: `The middle of the window is index ${mid}, which holds ${midValue}.`,
      detail: `mid = floor((lo + hi) / 2) = floor((${lo} + ${hi}) / 2) = ${mid}.${size === 1 ? " One candidate is left, so this look settles where the target goes." : ` One look rules out about half of the ${plural(size, "candidate")}.`}`,
      phase: "probe",
      isMilestone: true,
    });

    b.bump("comparisons");
    comparisons += 1;

    if (midValue === target) {
      foundIndex = mid;
      b.emit({
        frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
        codeLine: 6,
        narration: `Is ${midValue} equal to ${target}? Yes.`,
        phase: "compare",
      });
      b.emit({
        frame: frameFor(values, {
          lo: mid,
          hi: mid,
          mid,
          found: mid,
          label: windowLabel(mid, mid),
        }),
        codeLine: 7,
        narration: `${target} is already here at index ${mid}, so that index is the answer.`,
        detail: `When the target already exists, its own index is where it "belongs" — nothing has to move. Found after ${plural(comparisons, "comparison")}.`,
        phase: "found",
        isMilestone: true,
      });
      break;
    }

    const goesRight = midValue < target;
    const nextLo = goesRight ? mid + 1 : lo;
    const nextHi = goesRight ? hi : mid - 1;
    const dropped = size - Math.max(0, nextHi - nextLo + 1);

    b.emit({
      frame: frameFor(values, {
        lo,
        hi,
        mid,
        showMidMath: true,
        // The surviving half lights up *before* the other half is cut, so the
        // discard reads as a consequence rather than a sudden colour change.
        survivor: { from: nextLo, to: nextHi },
        label: windowLabel(lo, hi),
      }),
      codeLine: goesRight ? 8 : 10,
      narration: goesRight
        ? `${midValue} is smaller than ${target}, so ${target} belongs somewhere to the right.`
        : `${midValue} is bigger than ${target}, so ${target} belongs somewhere to the left.`,
      detail: `The list is sorted, so every value ${goesRight ? "left of" : "right of"} ${midValue} is ${goesRight ? "smaller" : "bigger"} too, and none of them can be the slot. That one comparison rules out ${plural(dropped, "candidate")}.`,
      phase: "compare",
    });

    const remaining = Math.max(0, nextHi - nextLo + 1);
    b.emit({
      frame: frameFor(values, {
        lo: nextLo,
        hi: nextHi,
        mid: null,
        label: windowLabel(nextLo, nextHi, size),
      }),
      codeLine: goesRight ? 9 : 11,
      narration: goesRight
        ? `lo jumps to ${nextLo}, leaving ${plural(remaining, "candidate")} in the window.`
        : `hi drops to ${nextHi}, leaving ${plural(remaining, "candidate")} in the window.`,
      detail:
        remaining === 0
          ? `${plural(size, "candidate")} → 0. The window is empty, and where lo stopped is the answer.`
          : `${plural(size, "candidate")} → ${remaining}. Halving on every step is what makes this O(log n) instead of O(n).`,
      phase: goesRight ? "narrow-right" : "narrow-left",
      isMilestone: true,
    });

    lo = nextLo;
    hi = nextHi;
  }

  if (foundIndex === -1) {
    const atEnd = lo === values.length;
    const nextValue = atEnd ? undefined : values[lo]!;
    const prevValue = lo > 0 ? values[lo - 1]! : undefined;

    b.emit({
      frame: frameFor(values, { lo, hi, mid: null, insertAt: lo, label: windowLabel(lo, hi) }),
      codeLine: 12,
      narration: atEnd
        ? `The window is empty and lo stopped at ${lo}, one past the last index — ${target} belongs on the end.`
        : `The window is empty and lo stopped at ${lo}, so ${target} belongs right there.`,
      // This is the whole question. Binary search returns -1 here; this one
      // returns lo, because lo has been squeezed onto the boundary all along.
      detail: `${target} is not in the list, but lo is not a failure — it is the answer. Every value left of lo is smaller than ${target}${prevValue === undefined ? "" : ` (${prevValue})`}, and every value from lo onward is bigger${nextValue === undefined ? ", and there are none" : ` (${nextValue})`}, so index ${lo} is the only slot that keeps the list sorted. It took ${plural(comparisons, "comparison")}.`,
      phase: "done",
      isMilestone: true,
    });
  }

  const inputSummary = wasSorted
    ? `[${values.join(", ")}] (already sorted), target ${target}`
    : `[${original.join(", ")}] auto-sorted to [${values.join(", ")}], target ${target}`;

  const result =
    foundIndex === -1
      ? `${target} inserts at index ${lo}`
      : `${target} is already at index ${foundIndex}`;

  return b.finish("search-insert-position", inputSummary, result);
}

export const searchInsertPositionModule: AlgorithmModule = {
  slug: "search-insert-position",
  inputs: [
    {
      name: "values",
      label: "Sorted numbers",
      kind: "numbers",
      default: "10, 20, 30, 40, 50, 60, 70, 80, 90",
      help: "Up to 12 numbers. Unsorted input is sorted for you.",
      max: MAX_ITEMS,
    },
    { name: "target", label: "Target", kind: "number", default: 35, min: -9999, max: 9999 },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const targetRaw = (raw["target"] ?? "").trim();
    if (targetRaw.length === 0) {
      return { ok: false, error: "Enter the number you want to place." };
    }
    const target = Number(targetRaw);
    if (!Number.isFinite(target)) {
      return { ok: false, error: `"${targetRaw}" is not a valid target number.` };
    }
    return { ok: true, parsed: { values: list.values, target } };
  },
  run,
  // Deliberately NOT binary search's array. These cards exist because six
  // questions all looked like a plain binary search; reusing its ten values made
  // this one look like it too, whatever the header said. Round tens make "35
  // falls in a gap" legible at a glance, which is the whole question.
  presets: [
    {
      label: "Inserts in the middle",
      values: { values: "10, 20, 30, 40, 50, 60, 70, 80, 90", target: "35" },
    },
    {
      label: "Already in the list",
      values: { values: "10, 20, 30, 40, 50, 60, 70, 80, 90", target: "60" },
    },
    {
      label: "Belongs past the end",
      values: { values: "10, 20, 30, 40, 50, 60, 70, 80, 90", target: "99" },
    },
    {
      label: "Belongs at the front",
      values: { values: "10, 20, 30, 40, 50, 60, 70, 80, 90", target: "5" },
    },
  ],
};

export default searchInsertPositionModule;
