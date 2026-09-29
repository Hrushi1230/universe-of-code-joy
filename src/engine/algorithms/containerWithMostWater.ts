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
  "function maxArea(height)",
  "  left <- 0; right <- length(height) - 1; best <- 0",
  "  while left < right",
  "    width <- right - left",
  "    area <- min(height[left], height[right]) * width",
  "    best <- max(best, area)",
  "    if height[left] < height[right]: left <- left + 1",
  "    else if height[left] > height[right]: right <- right - 1",
  "    else: left <- left + 1; right <- right - 1",
  "  return best",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function maxArea(height) {",
    "  let left = 0, right = height.length - 1, best = 0;",
    "  while (left < right) {",
    "    const width = right - left;",
    "    const area = Math.min(height[left], height[right]) * width;",
    "    best = Math.max(best, area);",
    "    if (height[left] < height[right]) left += 1;",
    "    else if (height[left] > height[right]) right -= 1;",
    "    else { left += 1; right -= 1; }",
    "  }",
    "  return best;",
    "}",
  ],
  ts: [
    "function maxArea(height: number[]): number {",
    "  let left = 0, right = height.length - 1, best = 0;",
    "  while (left < right) {",
    "    const width = right - left;",
    "    const area = Math.min(height[left], height[right]) * width;",
    "    best = Math.max(best, area);",
    "    if (height[left] < height[right]) left += 1;",
    "    else if (height[left] > height[right]) right -= 1;",
    "    else { left += 1; right -= 1; }",
    "  }",
    "  return best;",
    "}",
  ],
  py: [
    "def max_area(height):",
    "    left, right, best = 0, len(height) - 1, 0",
    "    while left < right:",
    "        width = right - left",
    "        area = min(height[left], height[right]) * width",
    "        best = max(best, area)",
    "        if height[left] < height[right]:",
    "            left += 1",
    "        elif height[left] > height[right]:",
    "            right -= 1",
    "        else: left, right = left + 1, right - 1",
    "    return best",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
  py: [1, 2, 3, 4, 5, 6, 7, 9, 11, 12],
};

interface FrameSpec {
  left: number;
  right: number;
  best: number;
  bestPair: [number, number] | null;
  active?: boolean;
  decision?: ArrayFrame["decision"];
}

function relation(leftHeight: number, rightHeight: number): string {
  return leftHeight === rightHeight ? "=" : leftHeight < rightHeight ? "<" : ">";
}

function frameFor(height: number[], spec: FrameSpec): ArrayFrame {
  const { left, right, best, bestPair, active = false, decision } = spec;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < height.length; i += 1) {
    states[i] = i < left || i > right ? "excluded" : "idle";
  }
  if (bestPair) {
    states[bestPair[0]] = "found";
    states[bestPair[1]] = "found";
  }
  if (active && left < right) {
    states[left] = "compare";
    states[right] = "compare";
  }

  const leftHeight = height[left];
  const rightHeight = height[right];
  const width = Math.max(0, right - left);
  const area =
    left < right && leftHeight !== undefined && rightHeight !== undefined
      ? Math.min(leftHeight, rightHeight) * width
      : 0;

  return {
    kind: "array",
    values: [...height],
    states,
    pointers: [
      { name: "left", index: left },
      { name: "right", index: right, color: "warning" },
    ],
    ranges:
      left < right
        ? [{ from: left, to: right, label: `Container width ${width}`, tone: "tint" }]
        : [],
    rangeRows: 1,
    target: { label: "best area", value: best },
    ...(active && leftHeight !== undefined && rightHeight !== undefined
      ? {
          comparison: {
            left: `${leftHeight} (left)`,
            op: relation(leftHeight, rightHeight),
            right: `${rightHeight} (right)`,
            verdict: `area ${area}; move ${
              leftHeight === rightHeight
                ? "both walls"
                : leftHeight < rightHeight
                  ? "left"
                  : "right"
            }`,
            tone: area >= best ? ("accent" as const) : ("warning" as const),
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
  let best = 0;
  let bestPair: [number, number] | null = null;

  b.emit({
    frame: frameFor(height, { left, right, best, bestPair }),
    codeLine: 2,
    narration: "Start with the widest possible container, using the first and last walls.",
    detail:
      "Width can only shrink from here, so each comparison must rule out a wall that cannot improve the best area.",
    phase: "setup",
    timelineLabel: "Set walls",
    isMilestone: true,
  });

  while (left < right) {
    const leftHeight = height[left]!;
    const rightHeight = height[right]!;
    const width = right - left;
    const area = Math.min(leftHeight, rightHeight) * width;
    if (area > best) {
      best = area;
      bestPair = [left, right];
    }

    b.emit({
      frame: frameFor(height, { left, right, best, bestPair, active: true }),
      codeLine: 6,
      narration: `Width ${width} × limiting height ${Math.min(leftHeight, rightHeight)} gives area ${area}; the best area is ${best}.`,
      detail:
        leftHeight === rightHeight
          ? "Both walls have the same limiting height. Keeping either one while width shrinks cannot improve this area, so both are safe to discard."
          : leftHeight < rightHeight
            ? "The left wall limits the area. Keeping it while width shrinks cannot improve the result, so move left."
            : "The right wall limits the area. Keeping it while width shrinks cannot improve the result, so move right.",
      phase: "compare-area",
      timelineLabel: "Check area",
      isMilestone: true,
    });
    b.bump("areaChecks");
    b.bump("comparisons");

    if (leftHeight < rightHeight) {
      const oldLeft = left;
      left += 1;
      b.emit({
        frame: frameFor(height, {
          left,
          right,
          best,
          bestPair,
          decision: {
            title: "Move the shorter wall",
            detail: `left moves from ${oldLeft} to ${left}`,
            tone: "accent",
          },
        }),
        codeLine: 7,
        narration: `Left moves from ${oldLeft} to ${left}.`,
        detail:
          "Every container that keeps the old shorter wall has less width and no greater limiting height.",
        phase: "move-left",
        timelineLabel: "Move left",
        isMilestone: true,
      });
      b.bump("pointerMoves");
    } else if (leftHeight > rightHeight) {
      const oldRight = right;
      right -= 1;
      b.emit({
        frame: frameFor(height, {
          left,
          right,
          best,
          bestPair,
          decision: {
            title: "Move the shorter wall",
            detail: `right moves from ${oldRight} to ${right}`,
            tone: "accent",
          },
        }),
        codeLine: 8,
        narration: `Right moves from ${oldRight} to ${right}.`,
        detail:
          "Every container that keeps the old shorter wall has less width and no greater limiting height.",
        phase: "move-right",
        timelineLabel: "Move right",
        isMilestone: true,
      });
      b.bump("pointerMoves");
    } else {
      const oldLeft = left;
      const oldRight = right;
      left += 1;
      right -= 1;
      b.emit({
        frame: frameFor(height, {
          left,
          right,
          best,
          bestPair,
          decision: {
            title: "Move both equal walls",
            detail: `left ${oldLeft} → ${left}; right ${oldRight} → ${right}`,
            tone: "accent",
          },
        }),
        codeLine: 9,
        narration: `Equal walls are both ruled out; left moves to ${left} and right moves to ${right}.`,
        detail:
          "Any container retaining either equal-height wall has smaller width and cannot exceed the area already checked.",
        phase: "move-both",
        timelineLabel: "Move both",
        isMilestone: true,
      });
      b.bump("pointerMoves", 2);
    }
  }

  const winningPair = bestPair ?? [0, Math.max(1, height.length - 1)];
  b.emit({
    frame: frameFor(height, {
      left,
      right,
      best,
      bestPair: winningPair,
      decision: {
        title: "Maximum area found",
        detail: `area ${best} from indices ${winningPair[0]} and ${winningPair[1]}`,
        tone: "accent",
      },
    }),
    codeLine: 10,
    narration: `Return the maximum water area ${best}.`,
    detail: `The best container uses the walls at zero-based indices ${winningPair[0]} and ${winningPair[1]}.`,
    phase: "done",
    timelineLabel: "Maximum found",
    isMilestone: true,
  });

  return b.finish(
    "container-with-most-water",
    `[${height.join(", ")}]`,
    `Maximum water is ${best} using zero-based indices [${winningPair[0]}, ${winningPair[1]}].`,
  );
}

export const containerWithMostWaterModule: AlgorithmModule = {
  slug: "container-with-most-water",
  inputs: [
    {
      name: "height",
      label: "Wall heights",
      kind: "numbers",
      default: "1, 8, 6, 2, 5, 4, 8, 3, 7",
      help: "Use 2–12 non-negative integer heights.",
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["height"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length < 2) {
      return { ok: false, error: "A container needs at least two wall heights." };
    }
    if (list.values.some((value) => !Number.isInteger(value) || value < 0)) {
      return { ok: false, error: "Wall heights must be non-negative integers." };
    }
    return { ok: true, parsed: { height: list.values } };
  },
  run,
  presets: [
    { label: "Classic", values: { height: "1, 8, 6, 2, 5, 4, 8, 3, 7" } },
    { label: "Two equal walls", values: { height: "1, 1" } },
    { label: "Rising walls", values: { height: "1, 2, 3, 4, 5, 6" } },
    { label: "Falling walls", values: { height: "6, 5, 4, 3, 2, 1" } },
    { label: "Equal plateau", values: { height: "4, 4, 4, 4, 4" } },
    {
      label: "Maximum visible",
      values: { height: "1, 3, 2, 5, 25, 24, 5, 4, 8, 3, 7, 2" },
    },
  ],
};

export default containerWithMostWaterModule;
