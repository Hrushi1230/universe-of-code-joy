import { parseNumberList } from "@/engine/algorithms/binarySearch";
import { StepBuilder } from "@/engine/builder";
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
  "function trap(height)",
  "  left <- 0; right <- length(height) - 1; leftMax <- height[left]; rightMax <- height[right]; water <- 0",
  "  while left < right",
  "    if leftMax <= rightMax",
  "      left <- left + 1; leftMax <- max(leftMax, height[left])",
  "      water <- water + leftMax - height[left]",
  "    else",
  "      right <- right - 1; rightMax <- max(rightMax, height[right])",
  "      water <- water + rightMax - height[right]",
  "  return water",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function trap(height) {",
    "  let l = 0, r = height.length - 1, water = 0;",
    "  let lMax = height[l], rMax = height[r];",
    "  while (l < r) {",
    "    if (lMax <= rMax) {",
    "      l++;",
    "      lMax = Math.max(lMax, height[l]);",
    "      water += lMax - height[l];",
    "    } else {",
    "      r--;",
    "      rMax = Math.max(rMax, height[r]);",
    "      water += rMax - height[r];",
    "    }",
    "  }",
    "  return water;",
    "}",
  ],
  ts: [
    "function trap(height: number[]): number {",
    "  let l = 0, r = height.length - 1, water = 0;",
    "  let lMax = height[l], rMax = height[r];",
    "  while (l < r) {",
    "    if (lMax <= rMax) {",
    "      l++;",
    "      lMax = Math.max(lMax, height[l]);",
    "      water += lMax - height[l];",
    "    } else {",
    "      r--;",
    "      rMax = Math.max(rMax, height[r]);",
    "      water += rMax - height[r];",
    "    }",
    "  }",
    "  return water;",
    "}",
  ],
  py: [
    "def trap(height):",
    "    left, right, water = 0, len(height) - 1, 0",
    "    left_max, right_max = height[left], height[right]",
    "    while left < right:",
    "        if left_max <= right_max:",
    "            left += 1",
    "            left_max = max(left_max, height[left])",
    "            water += left_max - height[left]",
    "        else:",
    "            right -= 1",
    "            right_max = max(right_max, height[right])",
    "            water += right_max - height[right]",
    "    return water",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 3, 4, 5, 7, 8, 9, 11, 12, 15],
  ts: [1, 3, 4, 5, 7, 8, 9, 11, 12, 15],
  py: [1, 3, 4, 5, 7, 8, 9, 11, 12, 13],
};

interface FrameSpec {
  left: number;
  right: number;
  leftMax: number;
  rightMax: number;
  water: number;
  depths: number[];
  compare?: boolean;
  processedIndex?: number;
  added?: number;
  done?: boolean;
  decision?: ArrayFrame["decision"];
}

function frameFor(height: number[], spec: FrameSpec): ArrayFrame {
  const {
    left,
    right,
    leftMax,
    rightMax,
    water,
    compare = false,
    processedIndex,
    added = 0,
    done = false,
    decision,
  } = spec;
  const states: Record<number, CellState> = {};
  for (let index = 0; index < height.length; index += 1) {
    states[index] = done || index < left || index > right ? "sorted" : "idle";
  }
  if (compare && left < right) {
    states[left] = "compare";
    states[right] = "compare";
  }
  if (processedIndex !== undefined) {
    states[processedIndex] = added > 0 ? "found" : "active";
  }

  return {
    kind: "array",
    rainWater: {
      depths: [...spec.depths],
      leftMax,
      rightMax,
      activeIndex: processedIndex,
      added,
      done,
    },
    values: [...height],
    states,
    pointers: [
      { name: "left", index: left, note: `max ${leftMax}` },
      { name: "right", index: right, color: "warning", note: `max ${rightMax}` },
    ],
    pointerNotes: true,
    ranges: left < right ? [{ from: left, to: right, label: "Unresolved bars", tone: "tint" }] : [],
    rangeRows: 1,
    target: { label: "trapped water", value: water },
    ...(compare
      ? {
          comparison: {
            left: String(leftMax),
            op: leftMax <= rightMax ? "≤" : ">",
            right: String(rightMax),
            verdict: leftMax <= rightMax ? "process left side" : "process right side",
            tone: "accent" as const,
          },
        }
      : {}),
    ...(decision ? { decision } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const height = [...(parsed["height"] as number[])];
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  let left = 0;
  let right = height.length - 1;
  let leftMax = height[left]!;
  let rightMax = height[right]!;
  let water = 0;
  const depths = height.map(() => 0);

  b.emit({
    frame: frameFor(height, { left, right, leftMax, rightMax, water, depths }),
    codeLine: 2,
    narration: "Start at both ends and record the strongest boundary seen from each side.",
    detail:
      "The smaller boundary maximum determines a side whose trapped water can already be finalized.",
    phase: "setup",
    timelineLabel: "Set boundaries",
    isMilestone: true,
  });

  while (left < right) {
    const processLeft = leftMax <= rightMax;
    b.emit({
      frame: frameFor(height, {
        left,
        right,
        leftMax,
        rightMax,
        water,
        compare: true,
        depths,
      }),
      codeLine: 4,
      narration: `Compare boundary maxima ${leftMax} and ${rightMax}; process the ${processLeft ? "left" : "right"} side.`,
      detail: processLeft
        ? "The right boundary is at least as tall as leftMax, so the next left bar's water depends only on leftMax."
        : "The left boundary is taller than rightMax, so the next right bar's water depends only on rightMax.",
      phase: "compare-boundaries",
      timelineLabel: "Choose side",
      isMilestone: true,
    });
    b.bump("comparisons");

    if (processLeft) {
      left += 1;
      const previousMax = leftMax;
      leftMax = Math.max(leftMax, height[left]!);
      const added = leftMax - height[left]!;
      water += added;
      depths[left] = added;
      b.emit({
        frame: frameFor(height, {
          left,
          right,
          leftMax,
          rightMax,
          water,
          processedIndex: left,
          depths,
          added,
          decision: {
            title: added > 0 ? `Add ${added} water` : "No water above this bar",
            detail: `${leftMax} - ${height[left]} = ${added}; total ${water}`,
            tone: "accent",
          },
        }),
        codeLine: 6,
        narration: `Move left to ${left}; boundary ${previousMax} becomes ${leftMax}, so this bar adds ${added} water.`,
        detail: `The finalized amount is max(0, ${leftMax} - ${height[left]}) = ${added}.`,
        phase: "process-left",
        timelineLabel: "Process left",
        isMilestone: true,
      });
      b.bump("pointerMoves");
      b.bump("waterChecks");
      b.bump("waterUnits", added);
    } else {
      right -= 1;
      const previousMax = rightMax;
      rightMax = Math.max(rightMax, height[right]!);
      const added = rightMax - height[right]!;
      water += added;
      depths[right] = added;
      b.emit({
        frame: frameFor(height, {
          left,
          right,
          leftMax,
          rightMax,
          water,
          processedIndex: right,
          depths,
          added,
          decision: {
            title: added > 0 ? `Add ${added} water` : "No water above this bar",
            detail: `${rightMax} - ${height[right]} = ${added}; total ${water}`,
            tone: "accent",
          },
        }),
        codeLine: 9,
        narration: `Move right to ${right}; boundary ${previousMax} becomes ${rightMax}, so this bar adds ${added} water.`,
        detail: `The finalized amount is max(0, ${rightMax} - ${height[right]}) = ${added}.`,
        phase: "process-right",
        timelineLabel: "Process right",
        isMilestone: true,
      });
      b.bump("pointerMoves");
      b.bump("waterChecks");
      b.bump("waterUnits", added);
    }
  }

  b.emit({
    frame: frameFor(height, {
      left,
      right,
      leftMax,
      rightMax,
      water,
      done: true,
      depths,
      decision: {
        title: "All trapped water counted",
        detail: `return ${water}`,
        tone: "accent",
      },
    }),
    codeLine: 10,
    narration: `The pointers have met; return ${water} trapped water units.`,
    detail: "Every bar was finalized against a guaranteed boundary on the opposite side.",
    phase: "done",
    timelineLabel: "Water counted",
    isMilestone: true,
  });

  return b.finish(
    "trapping-rain-water",
    `[${height.join(", ")}]`,
    `Total trapped water is ${water}.`,
  );
}

export const trappingRainWaterModule: AlgorithmModule = {
  slug: "trapping-rain-water",
  inputs: [
    {
      name: "height",
      label: "Elevation heights",
      kind: "numbers",
      default: "0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1",
      help: "Use 1–12 non-negative integer heights.",
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["height"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length < 1) {
      return { ok: false, error: "Enter at least one elevation height." };
    }
    if (list.values.some((value) => !Number.isInteger(value) || value < 0)) {
      return { ok: false, error: "Elevation heights must be non-negative integers." };
    }
    return { ok: true, parsed: { height: list.values } };
  },
  run,
  presets: [
    { label: "Classic", values: { height: "0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1" } },
    { label: "Deep bowl", values: { height: "3, 0, 2, 0, 4" } },
    { label: "Flat", values: { height: "2, 2, 2, 2" } },
    { label: "Rising", values: { height: "0, 1, 2, 3, 4" } },
    { label: "Falling", values: { height: "4, 3, 2, 1, 0" } },
    { label: "Single bar", values: { height: "5" } },
    {
      label: "Maximum visible",
      values: { height: "5, 0, 1, 0, 2, 0, 3, 0, 4, 0, 1, 5" },
    },
  ],
};

export default trappingRainWaterModule;
