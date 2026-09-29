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

/** Pseudocode -> listing line. JS merges the `if swapped` guard onto one line. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 11, 11, 13],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 11, 11, 13],
};

const PSEUDOCODE: string[] = [
  "function bubbleSort(a)",
  "  n <- length(a)",
  "  for pass from 0 to n - 2",
  "    swapped <- false",
  "    for i from 0 to n - pass - 2",
  "      if a[i] > a[i + 1]",
  "        swap a[i] and a[i + 1]",
  "        swapped <- true",
  "    if swapped = false",
  "      break",
  "  return a",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function bubbleSort(a) {",
    "  const n = a.length;",
    "  for (let pass = 0; pass < n - 1; pass++) {",
    "    let swapped = false;",
    "    for (let i = 0; i < n - pass - 1; i++) {",
    "      if (a[i] > a[i + 1]) {",
    "        [a[i], a[i + 1]] = [a[i + 1], a[i]];",
    "        swapped = true;",
    "      }",
    "    }",
    "    if (!swapped) break;",
    "  }",
    "  return a;",
    "}",
  ],
  ts: [
    "function bubbleSort(a: number[]): number[] {",
    "  const n = a.length;",
    "  for (let pass = 0; pass < n - 1; pass++) {",
    "    let swapped = false;",
    "    for (let i = 0; i < n - pass - 1; i++) {",
    "      if (a[i] > a[i + 1]) {",
    "        [a[i], a[i + 1]] = [a[i + 1], a[i]];",
    "        swapped = true;",
    "      }",
    "    }",
    "    if (!swapped) break;",
    "  }",
    "  return a;",
    "}",
  ],
  py: [
    "def bubble_sort(a):",
    "    n = len(a)",
    "    for p in range(n - 1):",
    "        swapped = False",
    "        for i in range(n - p - 1):",
    "            if a[i] > a[i + 1]:",
    "                a[i], a[i + 1] = a[i + 1], a[i]",
    "                swapped = True",
    "        if not swapped:",
    "            break",
    "    return a",
  ],
};

function frameFor(
  values: number[],
  sortedFrom: number,
  highlight: { a: number; b: number } | null,
  opts?: { swap?: boolean; allSorted?: boolean },
): ArrayFrame {
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = opts?.allSorted || i >= sortedFrom ? "sorted" : "idle";
  }
  if (highlight) {
    states[highlight.a] = "compare";
    states[highlight.b] = "compare";
  }

  const frame: ArrayFrame = {
    kind: "array",
    values: [...values],
    states,
    pointers: highlight
      ? [
          { name: "i", index: highlight.a },
          { name: "i+1", index: highlight.b },
        ]
      : [],
    ranges:
      sortedFrom < values.length && !opts?.allSorted
        ? [{ from: sortedFrom, to: values.length - 1, label: "already in place", tone: "tint" }]
        : [],
  };
  if (opts?.swap && highlight) frame.swapPair = [highlight.a, highlight.b];
  return frame;
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const values = [...original];
  const n = values.length;

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  let sortedFrom = n;

  b.emit({
    frame: frameFor(values, sortedFrom, null),
    codeLine: 2,
    narration: "We begin with the list exactly as it came in, nothing sorted yet.",
    detail:
      "Bubble sort repeatedly walks the list, nudging the biggest value it meets to the right.",
    phase: "setup",
    isMilestone: true,
  });

  for (let pass = 0; pass < n - 1; pass += 1) {
    b.bump("passes");
    let swapped = false;

    b.emit({
      frame: frameFor(values, sortedFrom, null),
      codeLine: 3,
      narration: `Pass ${pass + 1} starts, and we walk from the left again looking for neighbours in the wrong order.`,
      phase: "pass-start",
      isMilestone: true,
    });

    for (let i = 0; i < n - pass - 1; i += 1) {
      b.bump("comparisons");
      const left = values[i]!;
      const right = values[i + 1]!;

      b.emit({
        frame: frameFor(values, sortedFrom, { a: i, b: i + 1 }),
        codeLine: 6,
        narration: `We compare the neighbours ${left} and ${right} to see if they are the wrong way round.`,
        phase: "compare",
      });

      if (left > right) {
        b.bump("swaps");
        b.emit({
          frame: frameFor(values, sortedFrom, { a: i, b: i + 1 }, { swap: true }),
          codeLine: 7,
          narration: `${left} is bigger than ${right}, so the two swap places and the bigger value keeps drifting right.`,
          phase: "swap",
        });
        values[i] = right;
        values[i + 1] = left;
        swapped = true;
        b.emit({
          frame: frameFor(values, sortedFrom, { a: i, b: i + 1 }),
          codeLine: 8,
          narration: `After the swap, ${right} sits on the left and ${left} moves one step closer to its final home.`,
          phase: "swap",
        });
      }
    }

    sortedFrom = n - pass - 1;
    b.emit({
      frame: frameFor(values, sortedFrom, null),
      codeLine: 9,
      narration: `The pass is finished, so the value at the end of the list is locked in place for good.`,
      phase: "pass-end",
      isMilestone: true,
    });

    if (!swapped) {
      b.emit({
        frame: frameFor(values, sortedFrom, null, { allSorted: true }),
        codeLine: 10,
        narration:
          "Nothing needed swapping in that pass, which means the list is already sorted and we can stop early.",
        phase: "early-exit",
        isMilestone: true,
      });
      sortedFrom = 0;
      break;
    }
  }

  b.emit({
    frame: frameFor(values, 0, null, { allSorted: true }),
    codeLine: 11,
    narration: "Every value is now in the right spot, so we hand the sorted list back.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "bubble-sort",
    `[${original.join(", ")}] (${n} values)`,
    `Sorted to [${values.join(", ")}]`,
  );
}

export const bubbleSortModule: AlgorithmModule = {
  slug: "bubble-sort",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "5, 1, 4, 2, 8",
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
    { label: "Classic five", values: { values: "5, 1, 4, 2, 8" } },
    { label: "Best case: already sorted", values: { values: "1, 2, 3, 4, 5, 6, 7, 8" } },
    { label: "Worst case: reversed", values: { values: "9, 8, 7, 6, 5, 4, 3, 2, 1" } },
  ],
};

export default bubbleSortModule;
