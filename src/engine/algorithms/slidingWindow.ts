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

/** Pseudocode -> listing line. The braced listings close the priming loop first. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 16],
  ts: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 16],
};

const PSEUDOCODE: string[] = [
  "function maxWindowSum(a, k)",
  "  sum <- 0",
  "  for i from 0 to k - 1",
  "    sum <- sum + a[i]",
  "  best <- sum",
  "  bestStart <- 0",
  "  for right from k to length(a) - 1",
  "    sum <- sum + a[right]",
  "    sum <- sum - a[right - k]",
  "    if sum > best",
  "      best <- sum",
  "      bestStart <- right - k + 1",
  "  return best",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function maxWindowSum(a, k) {",
    "  let sum = 0;",
    "  for (let i = 0; i < k; i++) {",
    "    sum += a[i];",
    "  }",
    "  let best = sum;",
    "  let bestStart = 0;",
    "  for (let right = k; right < a.length; right++) {",
    "    sum += a[right];",
    "    sum -= a[right - k];",
    "    if (sum > best) {",
    "      best = sum;",
    "      bestStart = right - k + 1;",
    "    }",
    "  }",
    "  return best;",
    "}",
  ],
  ts: [
    "function maxWindowSum(a: number[], k: number): number {",
    "  let sum = 0;",
    "  for (let i = 0; i < k; i++) {",
    "    sum += a[i]!;",
    "  }",
    "  let best = sum;",
    "  let bestStart = 0;",
    "  for (let right = k; right < a.length; right++) {",
    "    sum += a[right]!;",
    "    sum -= a[right - k]!;",
    "    if (sum > best) {",
    "      best = sum;",
    "      bestStart = right - k + 1;",
    "    }",
    "  }",
    "  return best;",
    "}",
  ],
  py: [
    "def max_window_sum(a, k):",
    "    total = 0",
    "    for i in range(k):",
    "        total += a[i]",
    "    best = total",
    "    best_start = 0",
    "    for right in range(k, len(a)):",
    "        total += a[right]",
    "        total -= a[right - k]",
    "        if total > best:",
    "            best = total",
    "            best_start = right - k + 1",
    "    return best",
  ],
};

function frameFor(
  values: number[],
  window: { from: number; to: number },
  marks?: { entering?: number; leaving?: number; best?: { from: number; to: number } } | null,
): ArrayFrame {
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = i >= window.from && i <= window.to ? "active" : "idle";
  }
  if (marks?.entering !== undefined) states[marks.entering] = "compare";
  if (marks?.leaving !== undefined) states[marks.leaving] = "excluded";
  if (marks?.best) {
    for (let i = marks.best.from; i <= marks.best.to; i += 1) states[i] = "found";
  }

  const pointers: ArrayFrame["pointers"] = [
    { name: "left", index: window.from },
    { name: "right", index: window.to, color: "accent" },
  ];

  const ranges: ArrayFrame["ranges"] = [
    { from: window.from, to: window.to, label: "window", tone: "tint" },
  ];
  if (marks?.best && (marks.best.from !== window.from || marks.best.to !== window.to)) {
    ranges.push({
      from: marks.best.from,
      to: marks.best.to,
      label: "best so far",
      tone: "warning",
    });
  }

  // "best so far" comes and goes; reserving both rows keeps the canvas one
  // height for the whole run instead of jumping as the second bracket appears.
  return { kind: "array", values: [...values], states, pointers, ranges, rangeRows: 2 };
}

function auxFor(sum: number, max: number, best: number, bestStart: number, k: number): AuxPanel[] {
  return [
    {
      kind: "keyvalue",
      label: "Window facts",
      rows: [
        { k: "window size", v: String(k) },
        { k: "window sum", v: String(sum), highlight: true },
        { k: "window max", v: String(max) },
        { k: "best sum", v: String(best) },
        { k: "best window", v: `indices ${bestStart}..${bestStart + k - 1}` },
      ],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const values = parsed["values"] as number[];
  const k = parsed["k"] as number;
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  let sum = 0;
  for (let i = 0; i < k; i += 1) {
    sum += values[i]!;
    b.bump("additions");
    b.emit({
      frame: frameFor(values, { from: 0, to: i }),
      aux: auxFor(sum, Math.max(...values.slice(0, i + 1)), sum, 0, k),
      codeLine: 4,
      narration: `We add ${values[i]!} to build the very first window of ${k} values.`,
      phase: "build-window",
      isMilestone: i === 0,
    });
  }

  let best = sum;
  let bestStart = 0;

  b.emit({
    frame: frameFor(values, { from: 0, to: k - 1 }, { best: { from: 0, to: k - 1 } }),
    aux: auxFor(sum, Math.max(...values.slice(0, k)), best, bestStart, k),
    codeLine: 5,
    narration: `The first window adds up to ${sum}, so that is our best result so far.`,
    detail:
      "Instead of re-adding every value, the window slides: one value joins and one value leaves.",
    phase: "window-ready",
    isMilestone: true,
  });

  for (let right = k; right < values.length; right += 1) {
    const leaving = right - k;
    b.bump("additions");
    sum += values[right]!;
    b.emit({
      frame: frameFor(
        values,
        { from: leaving, to: right },
        {
          entering: right,
          best: { from: bestStart, to: bestStart + k - 1 },
        },
      ),
      aux: auxFor(sum, Math.max(...values.slice(leaving, right + 1)), best, bestStart, k),
      codeLine: 8,
      narration: `${values[right]!} slides into the window on the right, so we add it to the running total.`,
      phase: "slide",
    });

    b.bump("subtractions");
    sum -= values[leaving]!;
    b.emit({
      frame: frameFor(
        values,
        { from: leaving + 1, to: right },
        {
          leaving,
          best: { from: bestStart, to: bestStart + k - 1 },
        },
      ),
      aux: auxFor(sum, Math.max(...values.slice(leaving + 1, right + 1)), best, bestStart, k),
      codeLine: 9,
      narration: `${values[leaving]!} drops off the left, so we subtract it and the window is the right size again.`,
      phase: "slide",
      isMilestone: true,
    });

    b.bump("comparisons");
    if (sum > best) {
      best = sum;
      bestStart = leaving + 1;
      b.emit({
        frame: frameFor(
          values,
          { from: bestStart, to: right },
          { best: { from: bestStart, to: right } },
        ),
        aux: auxFor(sum, Math.max(...values.slice(bestStart, right + 1)), best, bestStart, k),
        codeLine: 11,
        narration: `This window adds up to ${sum}, which is the biggest total we have seen.`,
        phase: "new-best",
        isMilestone: true,
      });
    } else {
      b.emit({
        frame: frameFor(
          values,
          { from: leaving + 1, to: right },
          {
            best: { from: bestStart, to: bestStart + k - 1 },
          },
        ),
        aux: auxFor(sum, Math.max(...values.slice(leaving + 1, right + 1)), best, bestStart, k),
        codeLine: 10,
        narration: `This window totals ${sum}, which does not beat the best of ${best}, so we keep sliding.`,
        phase: "compare",
      });
    }
  }

  b.emit({
    frame: frameFor(
      values,
      { from: bestStart, to: bestStart + k - 1 },
      {
        best: { from: bestStart, to: bestStart + k - 1 },
      },
    ),
    aux: auxFor(best, Math.max(...values.slice(bestStart, bestStart + k)), best, bestStart, k),
    codeLine: 13,
    narration: `The window has reached the end, so the best block of ${k} values sums to ${best}.`,
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "sliding-window",
    `[${values.join(", ")}] with window size ${k}`,
    `Best window sum ${best} at indices ${bestStart}..${bestStart + k - 1}`,
  );
}

export const slidingWindowModule: AlgorithmModule = {
  slug: "sliding-window",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "2, 1, 5, 1, 3, 2, 8, 1",
      help: `Up to ${MAX_ITEMS} numbers, separated by commas.`,
      max: MAX_ITEMS,
    },
    { name: "k", label: "Window size", kind: "number", default: 3, min: 1, max: MAX_ITEMS },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const kRaw = (raw["k"] ?? "").trim();
    if (kRaw.length === 0)
      return { ok: false, error: "Enter how many values the window should cover." };
    const k = Number(kRaw);
    if (!Number.isInteger(k) || k < 1) {
      return {
        ok: false,
        error: `"${kRaw}" is not a whole window size. Use a whole number like 3.`,
      };
    }
    if (k > list.values.length) {
      return {
        ok: false,
        error: `A window of ${k} cannot fit in a list of ${list.values.length} numbers — shrink the window.`,
      };
    }
    return { ok: true, parsed: { values: list.values, k } };
  },
  run,
  presets: [
    { label: "Best block of three", values: { values: "2, 1, 5, 1, 3, 2, 8, 1", k: "3" } },
    { label: "Negatives in the mix", values: { values: "4, -2, -7, 8, 3, -1, 5", k: "2" } },
    {
      label: "Worst case: best window is last",
      values: { values: "1, 1, 1, 1, 1, 1, 1, 1, 9, 9, 9", k: "3" },
    },
  ],
};

export default slidingWindowModule;
