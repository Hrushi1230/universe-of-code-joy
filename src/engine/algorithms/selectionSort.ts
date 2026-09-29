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

/** Pseudocode -> listing line. The braced listings close two loops before the swap. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 10, 11, 14],
  ts: [1, 2, 3, 4, 5, 6, 7, 10, 11, 14],
};

const PSEUDOCODE: string[] = [
  "function selectionSort(a)",
  "  n <- length(a)",
  "  for i from 0 to n - 2",
  "    min <- i",
  "    for j from i + 1 to n - 1",
  "      if a[j] < a[min]",
  "        min <- j",
  "    if min != i",
  "      swap a[i] and a[min]",
  "  return a",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function selectionSort(a) {",
    "  const n = a.length;",
    "  for (let i = 0; i < n - 1; i++) {",
    "    let min = i;",
    "    for (let j = i + 1; j < n; j++) {",
    "      if (a[j] < a[min]) {",
    "        min = j;",
    "      }",
    "    }",
    "    if (min !== i) {",
    "      [a[i], a[min]] = [a[min], a[i]];",
    "    }",
    "  }",
    "  return a;",
    "}",
  ],
  ts: [
    "function selectionSort(a: number[]): number[] {",
    "  const n = a.length;",
    "  for (let i = 0; i < n - 1; i++) {",
    "    let min = i;",
    "    for (let j = i + 1; j < n; j++) {",
    "      if (a[j]! < a[min]!) {",
    "        min = j;",
    "      }",
    "    }",
    "    if (min !== i) {",
    "      [a[i], a[min]] = [a[min]!, a[i]!];",
    "    }",
    "  }",
    "  return a;",
    "}",
  ],
  py: [
    "def selection_sort(a):",
    "    n = len(a)",
    "    for i in range(n - 1):",
    "        m = i",
    "        for j in range(i + 1, n):",
    "            if a[j] < a[m]:",
    "                m = j",
    "        if m != i:",
    "            a[i], a[m] = a[m], a[i]",
    "    return a",
  ],
};

function frameFor(
  values: number[],
  sortedTo: number,
  marks: { i?: number; j?: number; min?: number } | null,
  opts?: { swap?: boolean; allSorted?: boolean },
): ArrayFrame {
  const states: Record<number, CellState> = {};
  for (let k = 0; k < values.length; k += 1) {
    states[k] = opts?.allSorted || k < sortedTo ? "sorted" : "idle";
  }
  if (marks?.min !== undefined) states[marks.min] = "active";
  if (marks?.j !== undefined) states[marks.j] = "compare";

  const pointers: ArrayFrame["pointers"] = [];
  if (marks?.i !== undefined) pointers.push({ name: "i", index: marks.i });
  if (marks?.j !== undefined) pointers.push({ name: "j", index: marks.j });
  if (marks?.min !== undefined) pointers.push({ name: "min", index: marks.min, color: "accent" });

  const frame: ArrayFrame = {
    kind: "array",
    values: [...values],
    states,
    pointers,
    ranges:
      sortedTo > 0 && !opts?.allSorted
        ? [{ from: 0, to: sortedTo - 1, label: "already in place", tone: "tint" }]
        : [],
  };
  if (opts?.swap && marks?.i !== undefined && marks?.min !== undefined) {
    frame.swapPair = [marks.i, marks.min];
  }
  return frame;
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const values = [...original];
  const n = values.length;
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  b.emit({
    frame: frameFor(values, 0, null),
    codeLine: 2,
    narration: "We start with nothing sorted and the whole list still to search.",
    detail: "Selection sort finds the smallest remaining value and swaps it into the next slot.",
    phase: "setup",
    isMilestone: true,
  });

  for (let i = 0; i < n - 1; i += 1) {
    let min = i;
    b.bump("passes");
    b.emit({
      frame: frameFor(values, i, { i, min }),
      codeLine: 4,
      narration: `We assume ${values[i]!} is the smallest of what is left and start scanning to its right.`,
      phase: "scan-start",
      isMilestone: true,
    });

    for (let j = i + 1; j < n; j += 1) {
      b.bump("comparisons");
      b.emit({
        frame: frameFor(values, i, { i, j, min }),
        codeLine: 6,
        narration: `We check whether ${values[j]!} is smaller than our current smallest ${values[min]!}.`,
        phase: "compare",
      });
      if (values[j]! < values[min]!) {
        min = j;
        b.emit({
          frame: frameFor(values, i, { i, j, min }),
          codeLine: 7,
          narration: `${values[j]!} is the smallest value we have seen in this pass, so it becomes the new candidate.`,
          phase: "new-min",
        });
      }
    }

    if (min !== i) {
      b.bump("swaps");
      b.emit({
        frame: frameFor(values, i, { i, min }, { swap: true }),
        codeLine: 9,
        narration: `The smallest value ${values[min]!} swaps into position ${i} where it belongs.`,
        phase: "swap",
      });
      const tmp = values[i]!;
      values[i] = values[min]!;
      values[min] = tmp;
    }

    b.emit({
      frame: frameFor(values, i + 1, null),
      codeLine: 3,
      narration: `Position ${i} is now locked in, so the sorted part on the left grows by one.`,
      phase: "lock",
      isMilestone: true,
    });
  }

  b.emit({
    frame: frameFor(values, n, null, { allSorted: true }),
    codeLine: 10,
    narration:
      "Only one value is left over and it is already in the right place, so the list is sorted.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "selection-sort",
    `[${original.join(", ")}] (${n} values)`,
    `Sorted to [${values.join(", ")}]`,
  );
}

export const selectionSortModule: AlgorithmModule = {
  slug: "selection-sort",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "29, 10, 14, 37, 13",
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
    { label: "Classic five", values: { values: "29, 10, 14, 37, 13" } },
    { label: "Already sorted", values: { values: "1, 2, 3, 4, 5, 6" } },
    { label: "Worst case: reversed", values: { values: "9, 8, 7, 6, 5, 4, 3, 2, 1" } },
  ],
};

export default selectionSortModule;
