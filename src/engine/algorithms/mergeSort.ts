import { StepBuilder } from "@/engine/builder";
import { parseNumberList } from "@/engine/algorithms/binarySearch";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  AuxPanel,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_ITEMS = 12;

/**
 * Pseudocode -> listing line. Both listings hoist `mid` past the early-return
 * block, and the Python merge body packs the two copy-back lines differently.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 15, 16, 16, 18],
  ts: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 15, 16, 16, 18],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19],
};

const PSEUDOCODE: string[] = [
  "function mergeSort(a, lo, hi)",
  "  if lo >= hi",
  "    return",
  "  mid <- floor((lo + hi) / 2)",
  "  mergeSort(a, lo, mid)",
  "  mergeSort(a, mid + 1, hi)",
  "  merge(a, lo, mid, hi)",
  "function merge(a, lo, mid, hi)",
  "  left <- a[lo..mid]",
  "  right <- a[mid+1..hi]",
  "  i <- 0, j <- 0, k <- lo",
  "  while i < size(left) and j < size(right)",
  "    if left[i] <= right[j]",
  "      a[k] <- left[i], i <- i + 1",
  "    else",
  "      a[k] <- right[j], j <- j + 1",
  "  copy any leftovers back into a",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function mergeSort(a, lo, hi) {",
    "  if (lo >= hi) {",
    "    return;",
    "  }",
    "  const mid = Math.floor((lo + hi) / 2);",
    "  mergeSort(a, lo, mid);",
    "  mergeSort(a, mid + 1, hi);",
    "  merge(a, lo, mid, hi);",
    "}",
    "function merge(a, lo, mid, hi) {",
    "  const left = a.slice(lo, mid + 1);",
    "  const right = a.slice(mid + 1, hi + 1);",
    "  let i = 0, j = 0, k = lo;",
    "  while (i < left.length && j < right.length) {",
    "    if (left[i] <= right[j]) a[k++] = left[i++];",
    "    else a[k++] = right[j++];",
    "  }",
    "  while (i < left.length) a[k++] = left[i++];",
    "  while (j < right.length) a[k++] = right[j++];",
    "}",
  ],
  ts: [
    "function mergeSort(a: number[], lo: number, hi: number): void {",
    "  if (lo >= hi) {",
    "    return;",
    "  }",
    "  const mid = Math.floor((lo + hi) / 2);",
    "  mergeSort(a, lo, mid);",
    "  mergeSort(a, mid + 1, hi);",
    "  merge(a, lo, mid, hi);",
    "}",
    "function merge(a: number[], lo: number, mid: number, hi: number): void {",
    "  const left = a.slice(lo, mid + 1);",
    "  const right = a.slice(mid + 1, hi + 1);",
    "  let i = 0, j = 0, k = lo;",
    "  while (i < left.length && j < right.length) {",
    "    if (left[i]! <= right[j]!) a[k++] = left[i++]!;",
    "    else a[k++] = right[j++]!;",
    "  }",
    "  while (i < left.length) a[k++] = left[i++]!;",
    "  while (j < right.length) a[k++] = right[j++]!;",
    "}",
  ],
  py: [
    "def merge_sort(a, lo, hi):",
    "    if lo >= hi:",
    "        return",
    "    mid = (lo + hi) // 2",
    "    merge_sort(a, lo, mid)",
    "    merge_sort(a, mid + 1, hi)",
    "    merge(a, lo, mid, hi)",
    "def merge(a, lo, mid, hi):",
    "    left = a[lo:mid + 1]",
    "    right = a[mid + 1:hi + 1]",
    "    i = j = 0",
    "    k = lo",
    "    while i < len(left) and j < len(right):",
    "        if left[i] <= right[j]:",
    "            a[k] = left[i]; i += 1",
    "        else:",
    "            a[k] = right[j]; j += 1",
    "        k += 1",
    "    a[k:hi + 1] = left[i:] + right[j:]",
  ],
};

function frameFor(
  values: number[],
  ranges: ArrayFrame["ranges"],
  marks: { compare?: number[]; write?: number; sorted?: [number, number] } | null,
): ArrayFrame {
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) states[i] = "idle";
  if (marks?.sorted) {
    for (let i = marks.sorted[0]; i <= marks.sorted[1]; i += 1) states[i] = "sorted";
  }
  for (const c of marks?.compare ?? []) states[c] = "compare";
  if (marks?.write !== undefined) states[marks.write] = "active";

  const pointers: ArrayFrame["pointers"] = [];
  if (marks?.write !== undefined) pointers.push({ name: "k", index: marks.write, color: "accent" });

  // Merging shows two brackets (left half + right half), the rest of the run
  // shows one. Reserving both keeps the canvas height constant across steps.
  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    ranges: [...ranges],
    rangeRows: 2,
  };
}

function auxFor(log: string[]): AuxPanel[] {
  return [
    {
      kind: "log",
      label: "Splits & merges",
      lines: log.length > 0 ? log.slice(-8) : ["nothing merged yet"],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const values = [...original];
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  const log: string[] = [];

  b.emit({
    frame: frameFor(
      values,
      [{ from: 0, to: values.length - 1, label: "whole list", tone: "tint" }],
      null,
    ),
    codeLine: 1,
    narration:
      "We begin with the whole list, which we will keep cutting in half until every piece is tiny.",
    detail:
      "Merge sort splits the list down to single values, then merges the pieces back together in order.",
    phase: "setup",
    isMilestone: true,
  });

  const sortRange = (lo: number, hi: number): void => {
    if (lo >= hi) {
      b.emit({
        frame: frameFor(values, [{ from: lo, to: hi, label: "single value", tone: "tint" }], {
          sorted: [lo, hi],
        }),
        codeLine: 3,
        narration: `A piece with just ${values[lo]!} in it is already sorted, so we hand it straight back.`,
        phase: "split",
      });
      return;
    }

    const mid = Math.floor((lo + hi) / 2);
    b.bump("splits");
    log.push(`split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}]`);
    b.emit({
      frame: frameFor(
        values,
        [
          { from: lo, to: mid, label: "left half", tone: "tint" },
          { from: mid + 1, to: hi, label: "right half", tone: "warning" },
        ],
        null,
      ),
      aux: auxFor(log),
      codeLine: 4,
      narration: `We cut the piece from ${lo} to ${hi} straight down the middle into two smaller pieces.`,
      phase: "split",
      isMilestone: true,
    });

    sortRange(lo, mid);
    sortRange(mid + 1, hi);

    const left = values.slice(lo, mid + 1);
    const right = values.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;

    b.emit({
      frame: frameFor(
        values,
        [
          { from: lo, to: mid, label: "sorted left", tone: "tint" },
          { from: mid + 1, to: hi, label: "sorted right", tone: "tint" },
        ],
        null,
      ),
      aux: auxFor(log),
      codeLine: 8,
      narration: `Both halves are sorted now, so we merge them back into one sorted run.`,
      phase: "merge",
      isMilestone: true,
    });

    while (i < left.length && j < right.length) {
      b.bump("comparisons");
      const takeLeft = left[i]! <= right[j]!;
      const value = takeLeft ? left[i]! : right[j]!;
      b.emit({
        frame: frameFor(values, [{ from: lo, to: hi, label: "merging", tone: "tint" }], {
          compare: [lo + i, mid + 1 + j],
          write: k,
        }),
        aux: auxFor(log),
        codeLine: takeLeft ? 14 : 16,
        narration: `${value} is the smaller of the two front values, so it goes into the merged run next.`,
        phase: "merge",
      });
      values[k] = value;
      b.bump("writes");
      if (takeLeft) i += 1;
      else j += 1;
      k += 1;
    }

    while (i < left.length) {
      values[k] = left[i]!;
      b.bump("writes");
      b.emit({
        frame: frameFor(values, [{ from: lo, to: hi, label: "merging", tone: "tint" }], {
          write: k,
        }),
        aux: auxFor(log),
        codeLine: 17,
        narration: `The right half ran out, so the leftover ${left[i]!} is copied across as it is.`,
        phase: "merge",
      });
      i += 1;
      k += 1;
    }
    while (j < right.length) {
      values[k] = right[j]!;
      b.bump("writes");
      b.emit({
        frame: frameFor(values, [{ from: lo, to: hi, label: "merging", tone: "tint" }], {
          write: k,
        }),
        aux: auxFor(log),
        codeLine: 17,
        narration: `The left half ran out, so the leftover ${right[j]!} is copied across as it is.`,
        phase: "merge",
      });
      j += 1;
      k += 1;
    }

    b.bump("merges");
    log.push(`merged [${lo}..${hi}] -> [${values.slice(lo, hi + 1).join(", ")}]`);
    b.emit({
      frame: frameFor(values, [{ from: lo, to: hi, label: "sorted run", tone: "tint" }], {
        sorted: [lo, hi],
      }),
      aux: auxFor(log),
      codeLine: 7,
      narration: `The piece from ${lo} to ${hi} is now a single sorted run.`,
      phase: "merge",
      isMilestone: true,
    });
  };

  sortRange(0, values.length - 1);

  b.emit({
    frame: frameFor(values, [], { sorted: [0, values.length - 1] }),
    codeLine: 17,
    narration: "All the pieces have been merged back together, so the whole list is sorted.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "merge-sort",
    `[${original.join(", ")}] (${original.length} values)`,
    `Sorted to [${values.join(", ")}]`,
  );
}

export const mergeSortModule: AlgorithmModule = {
  slug: "merge-sort",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "38, 27, 43, 3, 9, 82, 10",
      help: `Up to ${MAX_ITEMS} numbers, separated by commas.`,
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length > MAX_ITEMS) {
      return {
        ok: false,
        error: `Merge sort makes a lot of steps — please use ${MAX_ITEMS} numbers or fewer.`,
      };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Textbook seven", values: { values: "38, 27, 43, 3, 9, 82, 10" } },
    { label: "Already sorted", values: { values: "1, 2, 3, 4, 5, 6, 7, 8" } },
    { label: "Worst case: reversed", values: { values: "16, 15, 14, 13, 12, 11, 10, 9" } },
  ],
};

export default mergeSortModule;
