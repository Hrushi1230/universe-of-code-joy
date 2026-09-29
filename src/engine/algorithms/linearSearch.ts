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
  "function linearSearch(a, target)",
  "  for i <- 0 to length(a) - 1",
  "    if a[i] = target",
  "      return i",
  "  return -1",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function linearSearch(a, target) {",
    "  for (let i = 0; i < a.length; i += 1) {",
    "    if (a[i] === target) {",
    "      return i;",
    "    }",
    "  }",
    "  return -1;",
    "}",
  ],
  ts: [
    "function linearSearch(a: number[], target: number): number {",
    "  for (let i = 0; i < a.length; i += 1) {",
    "    if (a[i] === target) {",
    "      return i;",
    "    }",
    "  }",
    "  return -1;",
    "}",
  ],
  py: [
    "def linear_search(a, target):",
    "    for i in range(len(a)):",
    "        if a[i] == target:",
    "            return i",
    "    return -1",
  ],
};

/**
 * Pseudocode line -> listing line. Python matches 1:1 so it needs no entry. The
 * braced listings run three lines longer, so pseudo 5 ("return -1") lands on
 * JS line 7 rather than 5 — the off-by-one that A7 fixed on binary search.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 7],
  ts: [1, 2, 3, 4, 7],
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Worst-case comparisons binary search would need on `n` sorted values.
 *
 * Only meaningful when the input is actually sorted — binary search cannot run
 * at all otherwise — so the caller gates on that before showing it. This is the
 * mirror of the `linear worst` counter binary search carries: same array, same
 * target, the two costs side by side.
 */
function binaryWorst(n: number): number {
  if (n <= 0) return 0;
  return Math.floor(Math.log2(n)) + 1;
}

interface FrameSpec {
  /** Index being looked at, or null on the setup and final frames. */
  cursor: number | null;
  /** How many cells at the front have been checked and ruled out. */
  checked: number;
  found?: number;
  total: number;
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { cursor, checked, found, total } = spec;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = i < checked ? "excluded" : "idle";
  }
  if (cursor !== null && cursor < values.length) states[cursor] = "compare";
  if (found !== undefined) states[found] = "found";

  const remaining = total - checked;
  return {
    kind: "array",
    values: [...values],
    states,
    pointers: cursor === null ? [] : [{ name: "i", index: cursor, color: "accent" }],
    // Reserved on every frame so the canvas keeps one height for the whole run,
    // even though linear search has no arithmetic to print under the pointer.
    pointerNotes: true,
    ranges:
      remaining > 0
        ? [
            {
              from: checked,
              to: values.length - 1,
              label: `not checked yet · ${plural(remaining, "candidate")}`,
              tone: "tint",
            },
          ]
        : [],
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const values = parsed["values"] as number[];
  const target = parsed["target"] as number;
  const n = values.length;

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  const sorted = values.every((v, i) => i === 0 || values[i - 1]! <= v);
  let comparisons = 0;
  let foundIndex = -1;

  // The counterpart to binary search's `linear worst`. Bumped before the first
  // emit so it sits on every step and `comparisons` is seen climbing past it.
  // Unconditional, including on unsorted input: this is a property of n, not of
  // the input order — binary search sorts first either way (binarySearch.ts does
  // exactly that), so the number it would pay is 4 for n=10 regardless. Gating
  // it on `sorted` also gave that one preset a narrower counter strip than the
  // other three, which is the column-stability problem C3 fixed.
  b.bump("binary worst", binaryWorst(n));

  b.emit({
    frame: frameFor(values, { cursor: null, checked: 0, total: n }),
    codeLine: 2,
    narration: `We walk the list from the front, looking for ${target}.`,
    detail: `No shortcuts are available: the list ${sorted ? "happens to be sorted, but linear search does not use that" : "is unsorted, so there is no way to skip ahead"}. Every one of the ${plural(n, "value")} may have to be checked.`,
    phase: "setup",
    isMilestone: true,
  });

  for (let i = 0; i < n; i += 1) {
    const value = values[i]!;
    b.bump("comparisons");
    comparisons += 1;

    b.emit({
      frame: frameFor(values, { cursor: i, checked: i, total: n }),
      codeLine: 3,
      narration: `Is ${value} equal to ${target}?`,
      detail:
        value === target
          ? `Yes. That took ${plural(comparisons, "comparison")}.`
          : `No. Index ${i} is ruled out, and nothing about ${value} says anything about what comes next — so exactly one candidate is eliminated.`,
      phase: "compare",
      isMilestone: true,
    });

    if (value === target) {
      foundIndex = i;
      b.emit({
        frame: frameFor(values, { cursor: i, checked: i, found: i, total: n }),
        codeLine: 4,
        narration: `Found ${target} at index ${i}.`,
        detail: sorted
          ? `${plural(comparisons, "comparison")} against binary search's worst case of ${binaryWorst(n)} on the same sorted list. That gap is the whole reason binary search exists.`
          : `${plural(comparisons, "comparison")} out of a possible ${n}. Binary search would need only ${binaryWorst(n)} — but it would have to sort this list first, which costs more than one scan. For a single search on unsorted data, this is the right choice.`,
        phase: "found",
        isMilestone: true,
      });
      break;
    }

    b.emit({
      frame: frameFor(values, { cursor: null, checked: i + 1, total: n }),
      codeLine: 2,
      narration:
        i + 1 < n
          ? `Move on to index ${i + 1}. ${plural(n - i - 1, "candidate")} left.`
          : `That was the last index, so the loop is finished.`,
      // The mirror of binary search's halving line. Both plans lean on this
      // number; here it only ever falls by one, which is the point.
      detail: `${plural(n - i, "candidate")} → ${n - i - 1}. One comparison removes one candidate, which is what makes this O(n).`,
      phase: "narrow-right",
      // Deliberately NOT a milestone, unlike binary search's narrow step. There,
      // the cut is the event worth anchoring on; here advancing by one is
      // bookkeeping and the comparison is the event. Marking both put a scrubber
      // tick on every single step, which makes the ticks say nothing.
    });
  }

  if (foundIndex === -1) {
    b.emit({
      frame: frameFor(values, { cursor: null, checked: n, total: n }),
      codeLine: 5,
      narration: `Every index has been checked, so ${target} is not in this list.`,
      detail: `Ruling out a missing value costs the full ${plural(comparisons, "comparison")} — there is no earlier point at which linear search can know the answer.`,
      phase: "done",
      isMilestone: true,
    });
  }

  const inputSummary = `[${values.join(", ")}], target ${target}`;
  const result =
    foundIndex === -1
      ? `${target} not found after ${plural(comparisons, "comparison")}`
      : `Found ${target} at index ${foundIndex} after ${plural(comparisons, "comparison")}`;

  return b.finish("linear-search", inputSummary, result);
}

export const linearSearchModule: AlgorithmModule = {
  slug: "linear-search",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91",
      help: `Up to ${MAX_ITEMS} numbers. Sorting is not required.`,
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
    // Deliberately the same list and target as binary search's default preset,
    // so the two pages are directly comparable: 6 comparisons here, 3 there.
    {
      label: "Same list as binary search",
      values: { values: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91", target: "23" },
    },
    {
      label: "Best case: first element",
      values: { values: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91", target: "2" },
    },
    {
      label: "Unsorted input",
      values: { values: "38, 5, 91, 12, 56, 2, 72, 16, 8, 23", target: "72" },
    },
    {
      label: "Worst case: missing",
      values: { values: "2, 5, 8, 12, 16, 23, 38, 56, 72, 91", target: "17" },
    },
  ],
};

export default linearSearchModule;
