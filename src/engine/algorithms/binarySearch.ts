import { StepBuilder } from "@/engine/builder";
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
  "function binarySearch(a, target)",
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
  "  return -1",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function binarySearch(a, target) {",
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
    "  return -1;",
    "}",
  ],
  ts: [
    "function binarySearch(a: number[], target: number): number {",
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
    "  return -1;",
    "}",
  ],
  py: [
    "def binary_search(a, target):",
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
    "    return -1",
  ],
};

/**
 * Pseudocode line -> listing line. Python matches 1:1; the braced listings run
 * three lines longer because of `}` and the trailing `return -1` placement, so
 * pseudo 12 ("return -1") lands on JS line 14, not 12.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14],
};

export function parseNumberList(
  raw: string,
): { ok: true; values: number[] } | { ok: false; error: string } {
  const text = raw.trim();
  if (text.length === 0)
    return { ok: false, error: "Enter at least one number, separated by commas." };
  const tokens = text
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0)
    return { ok: false, error: "Enter at least one number, separated by commas." };
  if (tokens.length > MAX_ITEMS) {
    return {
      ok: false,
      error: `That is ${tokens.length} numbers — please use ${MAX_ITEMS} or fewer so the animation stays readable.`,
    };
  }
  const values: number[] = [];
  for (const token of tokens) {
    const value = Number(token);
    if (!Number.isFinite(value)) {
      return {
        ok: false,
        error: `"${token}" is not a number. Use plain numbers like 3, -7 or 12.5.`,
      };
    }
    values.push(value);
  }
  return { ok: true, values };
}

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Caption under the window bracket. It carries the candidate count, and on the
 * step where the window shrinks it carries both sides of the halving — that
 * `10 → 5` is the only place O(log n) is visible as a number rather than a claim.
 */
function windowLabel(lo: number, hi: number, previous?: number): string {
  const size = Math.max(0, hi - lo + 1);
  if (previous !== undefined && previous !== size) {
    return `search window · ${previous} → ${plural(size, "candidate")}`;
  }
  return `search window · ${plural(size, "candidate")}`;
}

interface FrameSpec {
  lo: number;
  hi: number;
  /** The probed index, or null before the first probe and after the last one. */
  mid: number | null;
  /**
   * Show `floor((lo + hi) / 2) = mid` under the mid pointer.
   *
   * Only true on the frames where that sum is still the live calculation. Once
   * the window has narrowed, `lo` or `hi` has moved while `mid` has not, so the
   * same expression would print numbers that no longer add up to the pointer
   * it sits under.
   */
  showMidMath?: boolean;
  /** Half that must still contain the target — shown while we decide, before we cut. */
  survivor?: { from: number; to: number };
  found?: number;
  label: string;
  /** The value being hunted, drawn as a card above the row. */
  target?: number;
  comparison?: ArrayFrame["comparison"];
  decision?: ArrayFrame["decision"];
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { lo, hi, mid, showMidMath, survivor, found, label, target, comparison, decision } = spec;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = i < lo || i > hi ? "excluded" : "idle";
  }
  if (survivor) {
    const from = Math.max(0, survivor.from);
    const to = Math.min(values.length - 1, survivor.to);
    for (let i = from; i <= to; i += 1) states[i] = "frontier";
  }
  // Only badge the probe while it is still inside the window. Once the window
  // has moved past it, it was discarded like everything else on that side, and
  // keeping it purple made the probed cell the one cell that never collapsed.
  if (mid !== null && mid >= lo && mid <= hi) states[mid] = "compare";
  if (found !== undefined) states[found] = "found";

  // Emitted even when lo > hi. The pointers crossing *is* the stop condition of
  // the algorithm; hiding them meant a failed search ended on a frame with no
  // pointers at all, exactly when the ending needed explaining.
  const pointers: ArrayFrame["pointers"] = [
    { name: "lo", index: lo },
    { name: "hi", index: hi },
  ];
  if (mid !== null) {
    pointers.push({
      name: "mid",
      index: mid,
      color: "accent",
      // C4: the one line of arithmetic in the algorithm, under the pointer it
      // produced, with this step's numbers substituted in.
      ...(showMidMath ? { note: `(${lo} + ${hi}) / 2 = ${mid}` } : {}),
    });
  }

  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    // Every frame reserves the note row, so the canvas keeps one height for the
    // whole run instead of growing on probe steps and shrinking on narrow steps.
    pointerNotes: true,
    ranges: lo <= hi ? [{ from: lo, to: hi, label, tone: "tint" }] : [],
    ...(target !== undefined ? { target: { label: "target", value: target } } : {}),
    ...(comparison ? { comparison } : {}),
    ...(decision ? { decision } : {}),
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

  // C3: the counter strip shows live counters, so the comparison a learner
  // actually cares about — "versus checking one at a time" — is carried as a
  // counter of its own instead of only appearing in prose on the last step.
  // Bumped before the first emit so it is on every step: the whole point is to
  // watch `comparisons` climb towards a number that was there from the start.
  // "worst" because scanning left to right only costs n when the target is last
  // or missing, which is exactly what the narration claims ("up to").
  b.bump("linear worst", values.length);

  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, label: windowLabel(lo, hi), target }),
    codeLine: 3,
    narration: `We start by looking at the whole sorted list and hunting for ${target}.`,
    detail: `${wasSorted ? "Binary search only works on sorted data, and this list already is." : "The list was sorted first, because binary search only works on sorted data."} All ${plural(values.length, "value")} are still candidates.`,
    phase: "setup",
    timelineLabel: "Setup",
    isMilestone: true,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midValue = values[mid]!;
    const size = hi - lo + 1;

    b.emit({
      frame: frameFor(values, {
        lo,
        hi,
        mid,
        showMidMath: true,
        label: windowLabel(lo, hi),
        target,
        decision: {
          title: `mid = floor((${lo} + ${hi}) / 2) = ${mid}`,
          detail: `Index ${mid} holds ${midValue}. That is the only cell we need to read.`,
        },
      }),
      codeLine: 5,
      narration: `The middle of the window is index ${mid}, which holds ${midValue}.`,
      // B3: the one line of arithmetic in the algorithm, with the live numbers in it.
      detail: `mid = floor((lo + hi) / 2) = floor((${lo} + ${hi}) / 2) = ${mid}.${size === 1 ? " Only one candidate is left, so this look settles it." : ` One look rules out about half of the ${plural(size, "candidate")}.`}`,
      phase: "probe",
      timelineLabel: "Find mid",
      isMilestone: true,
    });

    b.bump("comparisons");
    comparisons += 1;

    // B6: comparing and cutting used to be one frame. They are two ideas, so
    // they are now two steps — ask the question, then act on the answer.
    if (midValue === target) {
      foundIndex = mid;
      b.emit({
        frame: frameFor(values, {
          lo,
          hi,
          mid,
          showMidMath: true,
          label: windowLabel(lo, hi),
          target,
          comparison: {
            left: String(midValue),
            op: "=",
            right: String(target),
            verdict: "the middle value is the target",
            tone: "accent",
          },
        }),
        codeLine: 6,
        narration: `Is ${midValue} equal to ${target}? Yes.`,
        phase: "compare",
        timelineLabel: "Compare",
      });
      b.emit({
        frame: frameFor(values, {
          lo: mid,
          hi: mid,
          mid,
          found: mid,
          label: windowLabel(mid, mid),
          target,
          comparison: {
            left: String(midValue),
            op: "=",
            right: String(target),
            verdict: `found at index ${mid}`,
            tone: "accent",
          },
          decision: {
            title: `Found ${target} at index ${mid}`,
            detail: `${plural(comparisons, "comparison")} instead of up to ${plural(values.length, "comparison")}.`,
          },
        }),
        codeLine: 7,
        narration: `The middle value is exactly ${target}, so the search is over.`,
        detail: `Found after ${plural(comparisons, "comparison")}. Checking left to right would have taken up to ${plural(values.length, "comparison")}.`,
        phase: "found",
        timelineLabel: "Found",
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
        target,
        comparison: {
          left: String(midValue),
          op: goesRight ? "<" : ">",
          right: String(target),
          verdict: goesRight
            ? `the target must be to the right of index ${mid}`
            : `the target must be to the left of index ${mid}`,
          tone: goesRight ? "accent" : "warning",
        },
        decision: {
          title: goesRight ? "Discard the left half" : "Discard the right half",
          detail: `The list is sorted, so that one comparison rules out ${plural(dropped, "candidate")}.`,
          tone: goesRight ? "accent" : "warning",
        },
      }),
      codeLine: goesRight ? 8 : 10,
      narration: goesRight
        ? `${midValue} is smaller than ${target}, so the target can only be to the right.`
        : `${midValue} is bigger than ${target}, so the target can only be to the left.`,
      detail: `The list is sorted, so every value on the ${goesRight ? "left" : "right"} of ${midValue} is ${goesRight ? "smaller" : "bigger"} too. That single comparison rules out ${plural(dropped, "candidate")}.`,
      phase: "compare",
      timelineLabel: "Compare",
    });

    const remaining = Math.max(0, nextHi - nextLo + 1);
    b.emit({
      frame: frameFor(values, {
        lo: nextLo,
        hi: nextHi,
        mid: null,
        label: windowLabel(nextLo, nextHi, size),
        target,
        decision: {
          title: goesRight ? `lo moves to ${nextLo}` : `hi moves to ${nextHi}`,
          detail: `${plural(size, "candidate")} → ${remaining}. Halving every step is what makes this O(log n).`,
        },
      }),
      codeLine: goesRight ? 9 : 11,
      narration: goesRight
        ? `lo jumps to ${nextLo}, leaving ${plural(remaining, "candidate")} in the window.`
        : `hi drops to ${nextHi}, leaving ${plural(remaining, "candidate")} in the window.`,
      // B4: the halving, as a number the learner can watch shrink.
      detail:
        remaining === 0
          ? `${plural(size, "candidate")} → 0. The last candidate has been ruled out, so there is nowhere left to look.`
          : `${plural(size, "candidate")} → ${remaining}. Halving on every step is what makes this O(log n) instead of O(n).`,
      phase: goesRight ? "narrow-right" : "narrow-left",
      timelineLabel: "Eliminate",
      // B5: the scrubber used to tick everywhere *except* the halving steps.
      isMilestone: true,
    });

    lo = nextLo;
    hi = nextHi;
  }

  if (foundIndex === -1) {
    b.emit({
      frame: frameFor(values, {
        lo,
        hi,
        mid: null,
        label: windowLabel(lo, hi),
        target,
        decision: {
          title: `${target} is not in this list`,
          detail: `lo (${lo}) passed hi (${hi}), so the window is empty.`,
          tone: "error",
        },
      }),
      codeLine: 12,
      narration: `lo (${lo}) has passed hi (${hi}), so the window is empty and ${target} is not in this list.`,
      detail: `The pointers crossing is the stop condition: there is nowhere left that could still hold ${target}. It took ${plural(comparisons, "comparison")} to rule out all ${plural(values.length, "value")}.`,
      phase: "done",
      timelineLabel: "Not found",
      isMilestone: true,
    });
  }

  const inputSummary = wasSorted
    ? `[${values.join(", ")}] (already sorted), target ${target}`
    : `[${original.join(", ")}] auto-sorted to [${values.join(", ")}], target ${target}`;

  const result =
    foundIndex === -1 ? `${target} not found` : `Found ${target} at index ${foundIndex}`;

  return b.finish("binary-search", inputSummary, result);
}

export const binarySearchModule: AlgorithmModule = {
  slug: "binary-search",
  inputs: [
    {
      name: "values",
      label: "Sorted numbers",
      kind: "numbers",
      default: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91",
      help: "Up to 12 numbers. Unsorted input is sorted for you.",
      max: MAX_ITEMS,
    },
    { name: "target", label: "Target", kind: "number", default: 23, min: -9999, max: 9999 },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const targetRaw = (raw["target"] ?? "").trim();
    if (targetRaw.length === 0)
      return { ok: false, error: "Enter the number you want to search for." };
    const target = Number(targetRaw);
    if (!Number.isFinite(target)) {
      return { ok: false, error: `"${targetRaw}" is not a valid target number.` };
    }
    return { ok: true, parsed: { values: list.values, target } };
  },
  run,
  presets: [
    {
      label: "Found in the middle",
      values: { values: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91", target: "23" },
    },
    {
      label: "Unsorted input",
      values: { values: "38, 5, 91, 12, 56, 2, 72, 16, 8, 23", target: "72" },
    },
    {
      label: "Worst case: missing & last",
      values: { values: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12", target: "13" },
    },
    // C9: the other three presets all narrow rightward at least once. This one
    // never does — `hi` walks down while `lo` stays at 0 — which is the case
    // that shows the window collapsing towards the front of the list.
    {
      label: "Target at the very front",
      values: { values: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91", target: "2" },
    },
  ],
};

export default binarySearchModule;
