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

const PSEUDOCODE = [
  "function sortColors(nums)",
  "  low, mid <- 0",
  "  high <- length(nums) - 1",
  "  while mid <= high",
  "    if nums[mid] = 0",
  "      swap nums[low], nums[mid]",
  "      low <- low + 1; mid <- mid + 1",
  "    else if nums[mid] = 1",
  "      mid <- mid + 1",
  "    else",
  "      swap nums[mid], nums[high]",
  "      high <- high - 1",
  "  done",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function sortColors(nums) {",
    "  let low = 0, mid = 0;",
    "  let high = nums.length - 1;",
    "  while (mid <= high) {",
    "    if (nums[mid] === 0) {",
    "      [nums[low], nums[mid]] = [nums[mid], nums[low]];",
    "      low += 1; mid += 1;",
    "    } else if (nums[mid] === 1) {",
    "      mid += 1;",
    "    } else {",
    "      [nums[mid], nums[high]] = [nums[high], nums[mid]];",
    "      high -= 1;",
    "    }",
    "  }",
    "}",
  ],
  ts: [
    "function sortColors(nums: number[]): void {",
    "  let low = 0, mid = 0;",
    "  let high = nums.length - 1;",
    "  while (mid <= high) {",
    "    if (nums[mid] === 0) {",
    "      [nums[low], nums[mid]] = [nums[mid], nums[low]];",
    "      low += 1; mid += 1;",
    "    } else if (nums[mid] === 1) {",
    "      mid += 1;",
    "    } else {",
    "      [nums[mid], nums[high]] = [nums[high], nums[mid]];",
    "      high -= 1;",
    "    }",
    "  }",
    "}",
  ],
  py: [
    "def sort_colors(nums):",
    "    low = mid = 0",
    "    high = len(nums) - 1",
    "    while mid <= high:",
    "        if nums[mid] == 0:",
    "            nums[low], nums[mid] = nums[mid], nums[low]",
    "            low += 1; mid += 1",
    "        elif nums[mid] == 1:",
    "            mid += 1",
    "        else:",
    "            nums[mid], nums[high] = nums[high], nums[mid]",
    "            high -= 1",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12],
};

interface FrameSpec {
  low: number;
  mid: number;
  high: number;
  active?: boolean;
  swapPair?: [number, number];
  decision?: ArrayFrame["decision"];
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { low, mid, high, active = false, swapPair, decision } = spec;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    if (i < low || i > high) states[i] = "sorted";
    else if (i < mid) states[i] = "visited";
    else states[i] = "idle";
  }
  if (active && mid <= high) states[mid] = "compare";

  const value = mid <= high ? values[mid] : undefined;
  return {
    kind: "array",
    values: [...values],
    states,
    pointers: [
      { name: "low", index: low },
      { name: "mid", index: mid, color: "accent" },
      { name: "high", index: high, color: "warning" },
    ],
    ranges: mid <= high ? [{ from: mid, to: high, label: "Unclassified" }] : [],
    rangeRows: 1,
    ...(active && value !== undefined
      ? {
          comparison: {
            left: `nums[${mid}]`,
            op: "=",
            right: String(value),
            verdict:
              value === 0
                ? "move to the 0 region"
                : value === 1
                  ? "already in the middle region"
                  : "move to the 2 region",
            tone: value === 1 ? ("accent" as const) : ("warning" as const),
          },
        }
      : {}),
    ...(swapPair ? { swapPair } : {}),
    ...(decision ? { decision } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const values = [...(parsed["values"] as number[])];
  const original = [...values];
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  let low = 0;
  let mid = 0;
  let high = values.length - 1;

  b.emit({
    frame: frameFor(values, { low, mid, high }),
    codeLine: 3,
    narration: "low and mid start at the front, while high starts at the back.",
    detail:
      "Everything before low will be 0, everything from low to mid will be 1, and everything after high will be 2. The range from mid through high is still unclassified.",
    phase: "setup",
    timelineLabel: "Set bounds",
    isMilestone: true,
  });

  while (mid <= high) {
    const value = values[mid]!;
    b.emit({
      frame: frameFor(values, { low, mid, high, active: true }),
      codeLine: value === 0 ? 5 : value === 1 ? 8 : 10,
      narration: `nums[${mid}] is ${value}, so classify it before moving any pointer.`,
      detail:
        value === 0
          ? "A 0 belongs before low. Swap it into the left partition, then both low and mid advance."
          : value === 1
            ? "A 1 already belongs in the middle partition. Only mid advances."
            : "A 2 belongs after high. Swap it into the right partition and move high left; mid stays because the incoming value is still unknown.",
      phase: "classify",
      timelineLabel: "Classify",
      isMilestone: true,
    });
    b.bump("classified");
    b.bump("comparisons");

    if (value === 0) {
      const from = mid;
      const to = low;
      [values[low], values[mid]] = [values[mid]!, values[low]!];
      b.bump("swaps");
      low += 1;
      mid += 1;
      b.emit({
        frame: frameFor(values, {
          low,
          mid,
          high,
          swapPair: [from, to],
          decision: {
            title: `0 joins the left partition`,
            detail: `swap indexes ${from} and ${to}; low → ${low}, mid → ${mid}`,
            tone: "accent",
          },
        }),
        codeLine: 7,
        narration: `Move this 0 to index ${to}; low becomes ${low} and mid becomes ${mid}.`,
        detail:
          "Both pointers advance because the swapped-in value came from the already-classified middle partition.",
        phase: "place-zero",
        timelineLabel: "Place 0",
        isMilestone: true,
      });
      continue;
    }

    if (value === 1) {
      mid += 1;
      b.emit({
        frame: frameFor(values, {
          low,
          mid,
          high,
          decision: {
            title: "1 is already in its partition",
            detail: `mid → ${mid}`,
            tone: "accent",
          },
        }),
        codeLine: 9,
        narration: `Keep the 1 where it is and advance mid to ${mid}.`,
        detail: "low does not move because the left partition of 0s did not grow.",
        phase: "keep-one",
        timelineLabel: "Keep 1",
        isMilestone: true,
      });
      continue;
    }

    const from = mid;
    const to = high;
    [values[mid], values[high]] = [values[high]!, values[mid]!];
    b.bump("swaps");
    high -= 1;
    b.emit({
      frame: frameFor(values, {
        low,
        mid,
        high,
        swapPair: [from, to],
        decision: {
          title: "2 joins the right partition",
          detail: `swap indexes ${from} and ${to}; high → ${high}; mid stays ${mid}`,
          tone: "warning",
        },
      }),
      codeLine: 12,
      narration: `Move this 2 to index ${to} and bring high left to ${high}.`,
      detail: "mid stays put because the value swapped in from high has not been classified yet.",
      phase: "place-two",
      timelineLabel: "Place 2",
      isMilestone: true,
    });
  }

  b.emit({
    frame: frameFor(values, { low, mid, high }),
    codeLine: 13,
    narration: "mid has crossed high, so no unclassified values remain.",
    detail: `The three partitions now cover the whole array: [${values.join(", ")}].`,
    phase: "done",
    timelineLabel: "Sorted",
    isMilestone: true,
  });

  return b.finish(
    "sort-colors",
    `[${original.join(", ")}]`,
    `Sorted colors: [${values.join(", ")}]`,
  );
}

export const sortColorsModule: AlgorithmModule = {
  slug: "sort-colors",
  inputs: [
    {
      name: "values",
      label: "Colors (0, 1, 2)",
      kind: "numbers",
      default: "2, 0, 2, 1, 1, 0",
      help: "Use 1–12 values. Each value must be 0, 1, or 2.",
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const invalid = list.values.find((value) => !Number.isInteger(value) || value < 0 || value > 2);
    if (invalid !== undefined) {
      return { ok: false, error: `Sort Colors accepts only 0, 1, and 2 — found ${invalid}.` };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Mixed colors", values: { values: "2, 0, 2, 1, 1, 0" } },
    { label: "Small crossing", values: { values: "2, 0, 1" } },
    { label: "Already grouped", values: { values: "0, 0, 1, 1, 2, 2" } },
    { label: "All one color", values: { values: "1, 1, 1, 1" } },
    {
      label: "Maximum visible",
      values: { values: "2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0" },
    },
  ],
};

export default sortColorsModule;
