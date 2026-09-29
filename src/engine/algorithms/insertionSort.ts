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

/** Pseudocode -> listing line. The braced listings close the while before line 8. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 9, 11],
  ts: [1, 2, 3, 4, 5, 6, 7, 9, 11],
};

const PSEUDOCODE: string[] = [
  "function insertionSort(a)",
  "  for i from 1 to length(a) - 1",
  "    key <- a[i]",
  "    j <- i - 1",
  "    while j >= 0 and a[j] > key",
  "      a[j + 1] <- a[j]",
  "      j <- j - 1",
  "    a[j + 1] <- key",
  "  return a",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function insertionSort(a) {",
    "  for (let i = 1; i < a.length; i++) {",
    "    const key = a[i];",
    "    let j = i - 1;",
    "    while (j >= 0 && a[j] > key) {",
    "      a[j + 1] = a[j];",
    "      j -= 1;",
    "    }",
    "    a[j + 1] = key;",
    "  }",
    "  return a;",
    "}",
  ],
  ts: [
    "function insertionSort(a: number[]): number[] {",
    "  for (let i = 1; i < a.length; i++) {",
    "    const key = a[i]!;",
    "    let j = i - 1;",
    "    while (j >= 0 && a[j]! > key) {",
    "      a[j + 1] = a[j]!;",
    "      j -= 1;",
    "    }",
    "    a[j + 1] = key;",
    "  }",
    "  return a;",
    "}",
  ],
  py: [
    "def insertion_sort(a):",
    "    for i in range(1, len(a)):",
    "        key = a[i]",
    "        j = i - 1",
    "        while j >= 0 and a[j] > key:",
    "            a[j + 1] = a[j]",
    "            j -= 1",
    "        a[j + 1] = key",
    "    return a",
  ],
};

function frameFor(
  values: number[],
  sortedTo: number,
  highlight: { key?: number; compare?: number } | null,
  opts?: { allSorted?: boolean; holeAt?: number },
): ArrayFrame {
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = opts?.allSorted || i <= sortedTo ? "sorted" : "idle";
  }
  if (highlight?.compare !== undefined) states[highlight.compare] = "compare";
  if (highlight?.key !== undefined) states[highlight.key] = "active";

  const pointers: ArrayFrame["pointers"] = [];
  if (highlight?.key !== undefined)
    pointers.push({ name: "i", index: highlight.key, color: "accent" });
  if (highlight?.compare !== undefined) pointers.push({ name: "j", index: highlight.compare });
  if (opts?.holeAt !== undefined)
    pointers.push({ name: "hole", index: opts.holeAt, color: "warning" });

  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    ranges:
      sortedTo >= 0 && !opts?.allSorted
        ? [{ from: 0, to: sortedTo, label: "sorted so far", tone: "tint" }]
        : [],
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const values = [...original];
  const n = values.length;
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  b.emit({
    frame: frameFor(values, 0, null),
    codeLine: 1,
    narration: "We treat the first value as an already sorted hand of one card.",
    detail:
      "Insertion sort grows a sorted prefix on the left, inserting each new value into its place.",
    phase: "setup",
    isMilestone: true,
  });

  for (let i = 1; i < n; i += 1) {
    b.bump("insertions");
    const key = values[i]!;

    b.emit({
      frame: frameFor(values, i - 1, { key: i }),
      codeLine: 3,
      narration: `We pick up ${key} and look for the right spot for it inside the sorted part on the left.`,
      phase: "pick-key",
      isMilestone: true,
    });

    let j = i - 1;
    while (j >= 0 && values[j]! > key) {
      b.bump("comparisons");
      b.emit({
        frame: frameFor(values, i - 1, { key: i, compare: j }),
        codeLine: 5,
        narration: `${values[j]!} is bigger than ${key}, so it has to slide one place to the right.`,
        phase: "shift",
      });
      b.bump("shifts");
      values[j + 1] = values[j]!;
      j -= 1;
      b.emit({
        frame: frameFor(values, i - 1, { compare: j + 1 }, { holeAt: j + 1 }),
        codeLine: 6,
        narration: `The bigger value has moved right, leaving a gap where ${key} might belong.`,
        phase: "shift",
      });
    }
    if (j >= 0) b.bump("comparisons");

    values[j + 1] = key;
    b.emit({
      frame: frameFor(values, i, { key: j + 1 }),
      codeLine: 8,
      narration: `${key} drops into the gap, so the sorted part on the left is now one value longer.`,
      phase: "insert",
      isMilestone: true,
    });
  }

  b.emit({
    frame: frameFor(values, n - 1, null, { allSorted: true }),
    codeLine: 9,
    narration: "Every value has been inserted, so the whole list is sorted.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "insertion-sort",
    `[${original.join(", ")}] (${n} values)`,
    `Sorted to [${values.join(", ")}]`,
  );
}

export const insertionSortModule: AlgorithmModule = {
  slug: "insertion-sort",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "5, 2, 9, 1, 6",
      help: `Up to ${MAX_ITEMS} numbers, separated by commas.`,
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Classic five", values: { values: "5, 2, 9, 1, 6" } },
    { label: "Best case: already sorted", values: { values: "1, 2, 3, 4, 5, 6, 7, 8" } },
    { label: "Worst case: reversed", values: { values: "9, 8, 7, 6, 5, 4, 3, 2, 1" } },
  ],
};

export default insertionSortModule;
