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
  "function twoSum(numbers, target)",
  "  left <- 0; right <- length(numbers) - 1",
  "  while left < right",
  "    sum <- numbers[left] + numbers[right]",
  "    if sum = target",
  "      return [left + 1, right + 1]",
  "    if sum < target",
  "      left <- left + 1",
  "    else",
  "      right <- right - 1",
  "  return []",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function twoSum(numbers, target) {",
    "  let left = 0, right = numbers.length - 1;",
    "  while (left < right) {",
    "    const sum = numbers[left] + numbers[right];",
    "    if (sum === target) {",
    "      return [left + 1, right + 1];",
    "    }",
    "    if (sum < target) left += 1;",
    "    else right -= 1;",
    "  }",
    "  return [];",
    "}",
  ],
  ts: [
    "function twoSum(numbers: number[], target: number): number[] {",
    "  let left = 0, right = numbers.length - 1;",
    "  while (left < right) {",
    "    const sum = numbers[left] + numbers[right];",
    "    if (sum === target) {",
    "      return [left + 1, right + 1];",
    "    }",
    "    if (sum < target) left += 1;",
    "    else right -= 1;",
    "  }",
    "  return [];",
    "}",
  ],
  py: [
    "def two_sum(numbers, target):",
    "    left, right = 0, len(numbers) - 1",
    "    while left < right:",
    "        total = numbers[left] + numbers[right]",
    "        if total == target:",
    "            return [left + 1, right + 1]",
    "        if total < target:",
    "            left += 1",
    "        else:",
    "            right -= 1",
    "    return []",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 8, 8, 9, 9, 11],
  ts: [1, 2, 3, 4, 5, 6, 8, 8, 9, 9, 11],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

interface FrameSpec {
  left: number;
  right: number;
  target: number;
  active?: boolean;
  found?: boolean;
  decision?: ArrayFrame["decision"];
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { left, right, target, active = false, found = false, decision } = spec;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = i < left || i > right ? "excluded" : "idle";
  }
  if (active && left < right) {
    states[left] = "compare";
    states[right] = "compare";
  }
  if (found) {
    states[left] = "found";
    states[right] = "found";
  }

  const sum = left < values.length && right >= 0 ? values[left]! + values[right]! : null;
  const relation = sum === null ? "=" : sum < target ? "<" : sum > target ? ">" : "=";

  return {
    kind: "array",
    values: [...values],
    states,
    pointers: [
      { name: "left", index: left },
      { name: "right", index: right, color: "warning" },
    ],
    ranges:
      left < right ? [{ from: left, to: right, label: "Candidate pair span", tone: "tint" }] : [],
    rangeRows: 1,
    target: { label: "target sum", value: target },
    ...(active && sum !== null
      ? {
          comparison: {
            left: `${values[left]} + ${values[right]}`,
            op: relation,
            right: String(target),
            verdict:
              sum === target
                ? "pair found"
                : sum < target
                  ? "sum too small — move left"
                  : "sum too large — move right",
            tone: sum === target ? ("accent" as const) : ("warning" as const),
          },
        }
      : {}),
    ...(decision ? { decision } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const values = [...(parsed["values"] as number[])];
  const target = parsed["target"] as number;
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  let left = 0;
  let right = values.length - 1;

  b.emit({
    frame: frameFor(values, { left, right, target }),
    codeLine: 2,
    narration: "Left starts at the smallest value and right starts at the largest value.",
    detail:
      "Because the input is sorted, comparing this pair with the target tells us which endpoint can be discarded safely.",
    phase: "setup",
    timelineLabel: "Set pointers",
    isMilestone: true,
  });

  while (left < right) {
    const sum = values[left]! + values[right]!;
    b.emit({
      frame: frameFor(values, { left, right, target, active: true }),
      codeLine: 4,
      narration: `${values[left]} + ${values[right]} = ${sum}; compare that sum with ${target}.`,
      detail:
        sum === target
          ? "The two endpoints form the required pair, so return their 1-indexed positions."
          : sum < target
            ? "The current sum is too small. Moving right left would only make it smaller, so left must advance."
            : "The current sum is too large. Moving left right would only make it larger, so right must retreat.",
      phase: "compare-pair",
      timelineLabel: "Compare pair",
      isMilestone: true,
    });
    b.bump("comparisons");

    if (sum === target) {
      b.emit({
        frame: frameFor(values, {
          left,
          right,
          target,
          found: true,
          decision: {
            title: "Target pair found",
            detail: `return [${left + 1}, ${right + 1}]`,
            tone: "accent",
          },
        }),
        codeLine: 6,
        narration: `Return the 1-indexed positions ${left + 1} and ${right + 1}.`,
        detail: `${values[left]} + ${values[right]} equals the target ${target}.`,
        phase: "found",
        timelineLabel: "Found pair",
        isMilestone: true,
      });
      return b.finish(
        "two-sum",
        `[${values.join(", ")}], target ${target}`,
        `Pair found at 1-indexed positions [${left + 1}, ${right + 1}].`,
      );
    }

    const previousSpan = right - left + 1;
    if (sum < target) {
      left += 1;
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(values, {
          left,
          right,
          target,
          decision: {
            title: "Discard the smaller endpoint",
            detail: `left → ${left}; candidate span ${previousSpan} → ${right - left + 1}`,
            tone: "accent",
          },
        }),
        codeLine: 8,
        narration: `Advance left to ${left}; every pair using the old left value is too small.`,
        detail:
          "With right already at the largest remaining partner, the old left value cannot reach the target with any candidate.",
        phase: "move-left",
        timelineLabel: "Move left",
        isMilestone: true,
      });
    } else {
      right -= 1;
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(values, {
          left,
          right,
          target,
          decision: {
            title: "Discard the larger endpoint",
            detail: `right → ${right}; candidate span ${previousSpan} → ${right - left + 1}`,
            tone: "warning",
          },
        }),
        codeLine: 10,
        narration: `Retreat right to ${right}; every pair using the old right value is too large.`,
        detail:
          "With left already at the smallest remaining partner, the old right value exceeds the target with every candidate.",
        phase: "move-right",
        timelineLabel: "Move right",
        isMilestone: true,
      });
    }
  }

  b.emit({
    frame: frameFor(values, {
      left,
      right,
      target,
      decision: {
        title: "No candidate pair remains",
        detail: "left and right have met",
        tone: "error",
      },
    }),
    codeLine: 11,
    narration: "Left has met right, so no two distinct positions remain.",
    detail: `No pair in this sorted input adds to ${target}.`,
    phase: "not-found",
    timelineLabel: "No pair",
    isMilestone: true,
  });

  return b.finish(
    "two-sum",
    `[${values.join(", ")}], target ${target}`,
    `No pair adds to ${target}.`,
  );
}

export const twoSumModule: AlgorithmModule = {
  slug: "two-sum",
  inputs: [
    {
      name: "values",
      label: "Sorted numbers",
      kind: "numbers",
      default: "2, 7, 11, 15",
      help: "Use 2–12 numbers in non-decreasing order.",
      max: MAX_ITEMS,
    },
    {
      name: "target",
      label: "Target sum",
      kind: "number",
      default: 9,
      min: -9999,
      max: 9999,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length < 2) {
      return { ok: false, error: "Two Sum needs at least two numbers." };
    }
    if (list.values.some((value, index) => index > 0 && value < list.values[index - 1]!)) {
      return { ok: false, error: "Two Sum II requires numbers in non-decreasing order." };
    }
    const targetText = (raw["target"] ?? "").trim();
    const target = Number(targetText);
    if (targetText.length === 0 || !Number.isFinite(target)) {
      return { ok: false, error: "Enter one finite target sum." };
    }
    return { ok: true, parsed: { values: list.values, target } };
  },
  run,
  presets: [
    { label: "Classic pair", values: { values: "2, 7, 11, 15", target: "9" } },
    { label: "Outer pair", values: { values: "2, 3, 4", target: "6" } },
    { label: "Negative values", values: { values: "-5, -2, 0, 3, 8", target: "1" } },
    {
      label: "Duplicate values",
      values: { values: "1, 2, 3, 4, 4, 9, 56, 90", target: "8" },
    },
    { label: "No solution", values: { values: "1, 3, 5, 7", target: "20" } },
    {
      label: "Maximum visible",
      values: { values: "-9, -6, -3, -1, 0, 2, 4, 7, 9, 12, 15, 20", target: "13" },
    },
  ],
};

export default twoSumModule;
