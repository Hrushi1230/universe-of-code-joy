import { StepBuilder } from "@/engine/builder";
import { parseNumberList } from "@/engine/algorithms/binarySearch";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  AuxPanel,
  CallStackPanel,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_ITEMS = 12;

/** Pseudocode -> listing line. The braced listings close the early return first. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16],
  ts: [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16],
};

const PSEUDOCODE: string[] = [
  "function quicksort(a, lo, hi)",
  "  if lo >= hi",
  "    return",
  "  pivot <- a[hi]",
  "  i <- lo",
  "  for j from lo to hi - 1",
  "    if a[j] < pivot",
  "      swap a[i] and a[j]",
  "      i <- i + 1",
  "  swap a[i] and a[hi]",
  "  quicksort(a, lo, i - 1)",
  "  quicksort(a, i + 1, hi)",
  "  return a",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function quicksort(a, lo, hi) {",
    "  if (lo >= hi) {",
    "    return a;",
    "  }",
    "  const pivot = a[hi];",
    "  let i = lo;",
    "  for (let j = lo; j < hi; j++) {",
    "    if (a[j] < pivot) {",
    "      [a[i], a[j]] = [a[j], a[i]];",
    "      i++;",
    "    }",
    "  }",
    "  [a[i], a[hi]] = [a[hi], a[i]];",
    "  quicksort(a, lo, i - 1);",
    "  quicksort(a, i + 1, hi);",
    "  return a;",
    "}",
  ],
  ts: [
    "function quicksort(a: number[], lo: number, hi: number): number[] {",
    "  if (lo >= hi) {",
    "    return a;",
    "  }",
    "  const pivot = a[hi]!;",
    "  let i = lo;",
    "  for (let j = lo; j < hi; j++) {",
    "    if (a[j]! < pivot) {",
    "      [a[i], a[j]] = [a[j]!, a[i]!];",
    "      i++;",
    "    }",
    "  }",
    "  [a[i], a[hi]] = [a[hi]!, a[i]!];",
    "  quicksort(a, lo, i - 1);",
    "  quicksort(a, i + 1, hi);",
    "  return a;",
    "}",
  ],
  py: [
    "def quicksort(a, lo, hi):",
    "    if lo >= hi:",
    "        return a",
    "    pivot = a[hi]",
    "    i = lo",
    "    for j in range(lo, hi):",
    "        if a[j] < pivot:",
    "            a[i], a[j] = a[j], a[i]",
    "            i += 1",
    "    a[i], a[hi] = a[hi], a[i]",
    "    quicksort(a, lo, i - 1)",
    "    quicksort(a, i + 1, hi)",
    "    return a",
  ],
};

function frameFor(
  values: number[],
  placed: Set<number>,
  range: { lo: number; hi: number } | null,
  marks: { pivot?: number; i?: number; j?: number; swap?: [number, number] } | null,
): ArrayFrame {
  const states: Record<number, CellState> = {};
  for (let k = 0; k < values.length; k += 1) {
    states[k] = placed.has(k)
      ? "sorted"
      : range && (k < range.lo || k > range.hi)
        ? "excluded"
        : "idle";
  }
  if (marks?.j !== undefined) states[marks.j] = "compare";
  if (marks?.pivot !== undefined) states[marks.pivot] = "active";

  const pointers: ArrayFrame["pointers"] = [];
  if (marks?.pivot !== undefined)
    pointers.push({ name: "pivot", index: marks.pivot, color: "warning" });
  if (marks?.i !== undefined) pointers.push({ name: "i", index: marks.i, color: "accent" });
  if (marks?.j !== undefined) pointers.push({ name: "j", index: marks.j });

  const frame: ArrayFrame = {
    kind: "array",
    values: [...values],
    states,
    pointers,
    ranges: range
      ? [{ from: range.lo, to: range.hi, label: "current partition", tone: "tint" }]
      : [],
  };
  if (marks?.swap) frame.swapPair = marks.swap;
  return frame;
}

function auxFor(frames: CallStackPanel["frames"]): AuxPanel[] {
  return [
    {
      kind: "callstack",
      label: "Recursive calls",
      frames,
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const values = [...original];
  const placed = new Set<number>();
  const calls: CallStackPanel["frames"] = [];
  let callSequence = 0;
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  b.emit({
    frame: frameFor(values, placed, { lo: 0, hi: values.length - 1 }, null),
    aux: auxFor(calls),
    codeLine: 1,
    narration: "We start with the whole list as one big partition to sort.",
    detail:
      "Quicksort picks a pivot, pushes smaller values left and bigger values right, then repeats on each side.",
    phase: "setup",
    isMilestone: true,
  });

  const sortRange = (lo: number, hi: number): void => {
    const call: CallStackPanel["frames"][number] = {
      id: `quicksort-${callSequence}`,
      call: "quicksort",
      args: [
        { name: "lo", value: String(lo) },
        { name: "hi", value: String(hi) },
      ],
      state: "enter",
    };
    callSequence += 1;
    calls.push(call);
    b.emit({
      frame: frameFor(values, placed, lo <= hi ? { lo, hi } : null, null),
      aux: auxFor(calls),
      codeLine: 1,
      narration:
        lo <= hi
          ? `We enter quicksort for the partition from ${lo} to ${hi}.`
          : `We enter quicksort with crossed boundaries ${lo} and ${hi}, so this branch is empty.`,
      phase: "enter",
    });

    if (lo > hi) {
      call.state = "return";
      call.result = "empty range";
      b.emit({
        frame: frameFor(values, placed, null, null),
        aux: auxFor(calls),
        codeLine: 3,
        narration: "The boundaries have crossed, so this empty recursive call returns immediately.",
        phase: "return",
      });
      calls.pop();
      return;
    }
    if (lo === hi) {
      placed.add(lo);
      call.state = "success";
      call.result = `${values[lo]!} fixed`;
      b.emit({
        frame: frameFor(values, placed, { lo, hi }, null),
        aux: auxFor(calls),
        codeLine: 3,
        narration: `A partition holding only ${values[lo]!} is already in the right place.`,
        phase: "return",
      });
      calls.pop();
      return;
    }

    const pivot = values[hi]!;
    call.state = "active";
    call.choice = `pivot a[${hi}] = ${pivot}`;
    b.bump("partitions");
    b.emit({
      frame: frameFor(values, placed, { lo, hi }, { pivot: hi }),
      aux: auxFor(calls),
      codeLine: 4,
      narration: `We choose the last value ${pivot} as the pivot for the partition from ${lo} to ${hi}.`,
      phase: "choose-pivot",
      isMilestone: true,
    });

    let i = lo;
    for (let j = lo; j < hi; j += 1) {
      b.bump("comparisons");
      b.emit({
        frame: frameFor(values, placed, { lo, hi }, { pivot: hi, i, j }),
        codeLine: 7,
        aux: auxFor(calls),
        narration: `We check whether ${values[j]!} is smaller than the pivot ${pivot}.`,
        phase: "partition",
      });
      if (values[j]! < pivot) {
        if (i !== j) {
          b.bump("swaps");
          b.emit({
            frame: frameFor(values, placed, { lo, hi }, { pivot: hi, i, j, swap: [i, j] }),
            aux: auxFor(calls),
            codeLine: 8,
            narration: `${values[j]!} belongs on the small side, so it swaps into the boundary slot.`,
            phase: "partition",
          });
          const tmp = values[i]!;
          values[i] = values[j]!;
          values[j] = tmp;
        }
        i += 1;
      }
    }

    b.bump("swaps");
    b.emit({
      frame: frameFor(values, placed, { lo, hi }, { pivot: hi, i, swap: [i, hi] }),
      aux: auxFor(calls),
      codeLine: 10,
      narration: `The pivot ${pivot} swaps into the boundary, which is exactly where it belongs forever.`,
      phase: "partition",
      isMilestone: true,
    });
    const tmp = values[i]!;
    values[i] = values[hi]!;
    values[hi] = tmp;
    placed.add(i);

    call.choice = `left [${lo}..${i - 1}], then right [${i + 1}..${hi}]`;

    b.emit({
      frame: frameFor(values, placed, { lo, hi }, { pivot: i }),
      aux: auxFor(calls),
      codeLine: 11,
      narration: `Everything left of ${pivot} is smaller and everything right is bigger, so we sort each side on its own.`,
      phase: "recurse",
      isMilestone: true,
    });

    sortRange(lo, i - 1);
    sortRange(i + 1, hi);

    call.state = "return";
    call.choice = undefined;
    call.result = `[${lo}..${hi}] sorted`;
    b.emit({
      frame: frameFor(values, placed, { lo, hi }, null),
      aux: auxFor(calls),
      codeLine: 13,
      narration: `Both recursive branches are complete, so the sorted partition from ${lo} to ${hi} returns to its caller.`,
      phase: "return",
    });
    calls.pop();
  };

  sortRange(0, values.length - 1);

  for (let k = 0; k < values.length; k += 1) placed.add(k);
  b.emit({
    frame: frameFor(values, placed, null, null),
    aux: auxFor(calls),
    codeLine: 13,
    narration: "Every partition has been sorted, so the whole list is in order.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "quicksort",
    `[${original.join(", ")}] (${original.length} values)`,
    `Sorted to [${values.join(", ")}]`,
  );
}

export const quicksortModule: AlgorithmModule = {
  slug: "quicksort",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "7, 2, 1, 6, 8, 5, 3, 4",
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
        error: `Quicksort makes a lot of steps — please use ${MAX_ITEMS} numbers or fewer.`,
      };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Mixed eight", values: { values: "7, 2, 1, 6, 8, 5, 3, 4" } },
    { label: "Duplicates", values: { values: "4, 4, 2, 7, 2, 4, 9, 2" } },
    { label: "Worst case: already sorted", values: { values: "1, 2, 3, 4, 5, 6, 7, 8" } },
  ],
};

export default quicksortModule;
