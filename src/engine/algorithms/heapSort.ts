import { StepBuilder } from "@/engine/builder";
import { parseNumberList } from "@/engine/algorithms/binarySearch";
import type {
  AlgorithmModule,
  AlgorithmRun,
  CellState,
  CodeLineMap,
  HeapFrame,
  ValidationResult,
} from "@/engine/types";

const MAX_ITEMS = 12;

/**
 * Pseudocode -> listing line. Both listings split siftDown into its own
 * function, so the second half of the pseudocode maps past the heapSort body.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 6, 7, 8, 10, 12, 13, 15, 16, 17, 18, 19],
  ts: [1, 2, 3, 4, 6, 7, 8, 10, 12, 13, 15, 16, 17, 18, 19],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16],
};

const PSEUDOCODE: string[] = [
  "function heapSort(a)",
  "  n <- length(a)",
  "  for i from floor(n / 2) - 1 down to 0",
  "    siftDown(a, i, n)",
  "  for end from n - 1 down to 1",
  "    swap a[0] and a[end]",
  "    siftDown(a, 0, end)",
  "  return a",
  "function siftDown(a, i, size)",
  "  largest <- i",
  "  if left child is bigger, largest <- left",
  "  if right child is bigger, largest <- right",
  "  if largest != i",
  "    swap a[i] and a[largest]",
  "    siftDown(a, largest, size)",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function heapSort(a) {",
    "  const n = a.length;",
    "  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {",
    "    siftDown(a, i, n);",
    "  }",
    "  for (let end = n - 1; end > 0; end--) {",
    "    [a[0], a[end]] = [a[end], a[0]];",
    "    siftDown(a, 0, end);",
    "  }",
    "  return a;",
    "}",
    "function siftDown(a, i, size) {",
    "  let largest = i;",
    "  const l = 2 * i + 1, r = 2 * i + 2;",
    "  if (l < size && a[l] > a[largest]) largest = l;",
    "  if (r < size && a[r] > a[largest]) largest = r;",
    "  if (largest !== i) {",
    "    [a[i], a[largest]] = [a[largest], a[i]];",
    "    siftDown(a, largest, size);",
    "  }",
    "}",
  ],
  ts: [
    "function heapSort(a: number[]): number[] {",
    "  const n = a.length;",
    "  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {",
    "    siftDown(a, i, n);",
    "  }",
    "  for (let end = n - 1; end > 0; end--) {",
    "    [a[0], a[end]] = [a[end]!, a[0]!];",
    "    siftDown(a, 0, end);",
    "  }",
    "  return a;",
    "}",
    "function siftDown(a: number[], i: number, size: number): void {",
    "  let largest = i;",
    "  const l = 2 * i + 1, r = 2 * i + 2;",
    "  if (l < size && a[l]! > a[largest]!) largest = l;",
    "  if (r < size && a[r]! > a[largest]!) largest = r;",
    "  if (largest !== i) {",
    "    [a[i], a[largest]] = [a[largest]!, a[i]!];",
    "    siftDown(a, largest, size);",
    "  }",
    "}",
  ],
  py: [
    "def heap_sort(a):",
    "    n = len(a)",
    "    for i in range(n // 2 - 1, -1, -1):",
    "        sift_down(a, i, n)",
    "    for end in range(n - 1, 0, -1):",
    "        a[0], a[end] = a[end], a[0]",
    "        sift_down(a, 0, end)",
    "    return a",
    "def sift_down(a, i, size):",
    "    largest = i",
    "    l, r = 2 * i + 1, 2 * i + 2",
    "    if l < size and a[l] > a[largest]: largest = l",
    "    if r < size and a[r] > a[largest]: largest = r",
    "    if largest != i:",
    "        a[i], a[largest] = a[largest], a[i]",
    "        sift_down(a, largest, size)",
  ],
};

function nodePosition(index: number, total: number): { x: number; y: number } {
  const depth = Math.floor(Math.log2(index + 1));
  const maxDepth = Math.max(0, Math.floor(Math.log2(Math.max(1, total))));
  const offset = index - (2 ** depth - 1);
  const slots = 2 ** depth;
  const x = Math.round(((offset + 0.5) / slots) * 10000) / 100;
  const y = maxDepth === 0 ? 20 : Math.round((12 + (76 * depth) / maxDepth) * 100) / 100;
  return { x: Math.min(96, Math.max(4, x)), y };
}

function frameFor(
  values: number[],
  heapSize: number,
  marks: {
    active?: number;
    compare?: number[];
    sortedFrom?: number;
    swapPair?: [number, number];
  } | null,
): HeapFrame {
  const total = values.length;
  const slots: HeapFrame["slots"] = values.map((value, index) => {
    let state: CellState = "idle";
    if (marks?.sortedFrom !== undefined && index >= marks.sortedFrom) state = "sorted";
    else if (index >= heapSize) state = "sorted";
    if (marks?.compare?.includes(index)) state = "compare";
    if (marks?.active === index) state = "active";
    const pos = nodePosition(index, total);
    return { index, value, x: pos.x, y: pos.y, state };
  });

  const edgeStates: NonNullable<HeapFrame["edgeStates"]> = {};
  for (let i = 1; i < total; i += 1) {
    const parent = Math.floor((i - 1) / 2);
    const swappingAcrossEdge =
      marks?.swapPair?.includes(parent) === true && marks.swapPair.includes(i);
    edgeStates[i] = swappingAcrossEdge ? "active" : i < heapSize ? "tree" : "idle";
  }
  return {
    kind: "heap",
    heapType: "max",
    heapSize,
    slots,
    edgeStates,
    swapPair: marks?.swapPair,
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = parsed["values"] as number[];
  const values = [...original];
  const n = values.length;
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  b.emit({
    frame: frameFor(values, n, null),
    codeLine: 2,
    narration: "We read the list as a binary tree, where each value sits above its two children.",
    detail:
      "Heap sort first turns the list into a max-heap, then repeatedly pulls the largest value off the top.",
    phase: "setup",
    isMilestone: true,
  });

  const siftDown = (start: number, size: number, phase: string): void => {
    let i = start;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let largest = i;
      const compare: number[] = [];
      if (l < size) {
        compare.push(l);
        b.bump("comparisons");
        if (values[l]! > values[largest]!) largest = l;
      }
      if (r < size) {
        compare.push(r);
        b.bump("comparisons");
        if (values[r]! > values[largest]!) largest = r;
      }

      b.emit({
        frame: frameFor(values, size, { active: i, compare }),
        codeLine: 11,
        narration:
          compare.length === 0
            ? `${values[i]!} has no children, so it cannot sink any further.`
            : `We compare ${values[i]!} with its children to see if a bigger value should sit above it.`,
        phase,
      });

      if (largest === i) return;

      b.bump("swaps");
      b.emit({
        frame: frameFor(values, size, {
          active: largest,
          compare: [i],
          swapPair: [i, largest],
        }),
        codeLine: 14,
        narration: `${values[largest]!} is bigger than its parent ${values[i]!}, so the two swap places.`,
        phase,
      });
      const tmp = values[i]!;
      values[i] = values[largest]!;
      values[largest] = tmp;
      i = largest;
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
    b.bump("siftDowns");
    b.emit({
      frame: frameFor(values, n, { active: i }),
      codeLine: 4,
      narration: `We fix the little sub-tree rooted at ${values[i]!} so its parent is the biggest of the three.`,
      phase: "build-heap",
      isMilestone: true,
    });
    siftDown(i, n, "build-heap");
  }

  b.emit({
    frame: frameFor(values, n, null),
    codeLine: 5,
    narration: `The tree is now a max-heap, so the biggest value ${values[0]!} sits right at the top.`,
    phase: "heap-ready",
    isMilestone: true,
  });

  for (let end = n - 1; end > 0; end -= 1) {
    b.bump("swaps");
    b.emit({
      frame: frameFor(values, end + 1, {
        active: 0,
        compare: [end],
        swapPair: [0, end],
      }),
      codeLine: 6,
      narration: `The largest value ${values[0]!} swaps down to the end of the list, where it is finished.`,
      phase: "extract-max",
      isMilestone: true,
    });
    const tmp = values[0]!;
    values[0] = values[end]!;
    values[end] = tmp;

    b.bump("siftDowns");
    siftDown(0, end, "restore-heap");
  }

  b.emit({
    frame: frameFor(values, 0, { sortedFrom: 0 }),
    codeLine: 8,
    narration: "Every value has been pulled off the heap in order, so the list is sorted.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "heap-sort",
    `[${original.join(", ")}] (${n} values)`,
    `Sorted to [${values.join(", ")}]`,
  );
}

export const heapSortModule: AlgorithmModule = {
  slug: "heap-sort",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "4, 10, 3, 5, 1, 8",
      help: `Up to ${MAX_ITEMS} numbers so the heap tree stays readable.`,
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length > MAX_ITEMS) {
      return {
        ok: false,
        error: `That is ${list.values.length} numbers — the heap tree only stays readable up to ${MAX_ITEMS}.`,
      };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Textbook six", values: { values: "4, 10, 3, 5, 1, 8" } },
    { label: "Already sorted", values: { values: "1, 2, 3, 4, 5, 6, 7" } },
    { label: "Worst case: reversed", values: { values: "9, 8, 7, 6, 5, 4, 3, 2" } },
  ],
};

export default heapSortModule;
