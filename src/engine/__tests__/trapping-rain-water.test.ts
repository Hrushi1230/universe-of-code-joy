import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { trappingRainWaterModule } from "@/engine/algorithms/trappingRainWater";
import { resolveCodeLine } from "@/engine/builder";
import { getModuleForProblem, resolveModule } from "@/engine/registry";
import type { AlgorithmRun, ArrayFrame } from "@/engine/types";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(height: string): AlgorithmRun {
  const validation = trappingRainWaterModule.validate({ height });
  if (!validation.ok) throw new Error(validation.error);
  return trappingRainWaterModule.run(validation.parsed);
}

function pointer(frame: ArrayFrame, name: string): number {
  const value = frame.pointers.find((candidate) => candidate.name === name)?.index;
  if (value === undefined) throw new Error(`Missing ${name} pointer`);
  return value;
}

function oracle(height: number[]): number {
  let water = 0;
  for (let index = 0; index < height.length; index += 1) {
    const leftMax = Math.max(...height.slice(0, index + 1));
    const rightMax = Math.max(...height.slice(index));
    water += Math.max(0, Math.min(leftMax, rightMax) - height[index]!);
  }
  return water;
}

describe("Trapping Rain Water question module", () => {
  it("registers only for the Trapping Rain Water question", () => {
    expect(getModuleForProblem("trapping-rain-water")).toBe(trappingRainWaterModule);
    expect(resolveModule("trapping-rain-water")).toBe(trappingRainWaterModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("matches a prefix/suffix oracle for every preset", () => {
    for (const preset of trappingRainWaterModule.presets) {
      const height = preset.values.height!.split(",").map(Number);
      expect(run(preset.values.height!).result, preset.label).toBe(
        `Total trapped water is ${oracle(height)}.`,
      );
    }
    expect(run("0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1").result).toBe("Total trapped water is 6.");
  });

  it("processes exactly the side with the smaller boundary maximum", () => {
    const execution = run("4, 1, 3, 1, 4, 2");
    const comparisons = execution.steps.filter((step) => step.phase === "compare-boundaries");
    expect(comparisons).toHaveLength(5);

    for (const comparison of comparisons) {
      const frame = comparison.frame as ArrayFrame;
      const next = execution.steps[comparison.i + 1]!;
      const nextFrame = next.frame as ArrayFrame;
      const left = pointer(frame, "left");
      const right = pointer(frame, "right");
      const heights = frame.values.map(Number);
      const leftMax = Math.max(...heights.slice(0, left + 1));
      const rightMax = Math.max(...heights.slice(right));

      if (leftMax <= rightMax) {
        expect(next.phase).toBe("process-left");
        expect(pointer(nextFrame, "left")).toBe(left + 1);
        expect(pointer(nextFrame, "right")).toBe(right);
      } else {
        expect(next.phase).toBe("process-right");
        expect(pointer(nextFrame, "left")).toBe(left);
        expect(pointer(nextFrame, "right")).toBe(right - 1);
      }
    }
  });

  it("keeps accumulated water non-decreasing and resolves every final bar", () => {
    const execution = run("3, 0, 2, 0, 4");
    const totals = execution.steps.map((step) =>
      Number((step.frame as ArrayFrame).target?.value ?? 0),
    );
    for (let index = 1; index < totals.length; index += 1) {
      expect(totals[index]).toBeGreaterThanOrEqual(totals[index - 1]!);
    }
    const finalFrame = execution.steps.at(-1)!.frame as ArrayFrame;
    expect(Object.values(finalFrame.states).every((state) => state === "sorted")).toBe(true);
    expect(finalFrame.target).toEqual({ label: "trapped water", value: 7 });
  });

  it("records only finalized water in each seekable terrain frame", () => {
    const execution = run("3, 0, 2, 0, 4");
    const frames = execution.steps.map((step) => (step.frame as ArrayFrame).rainWater!);
    expect(frames[0]!.depths).toEqual([0, 0, 0, 0, 0]);
    expect(frames.at(-1)!.depths).toEqual([0, 3, 1, 3, 0]);
    expect(frames.at(-1)!.depths.reduce((sum, value) => sum + value, 0)).toBe(7);
    for (let index = 1; index < frames.length; index += 1) {
      for (let bar = 0; bar < 5; bar += 1) {
        expect(frames[index]!.depths[bar]).toBeGreaterThanOrEqual(frames[index - 1]!.depths[bar]!);
      }
    }
    expect(run("2, 2, 2").steps.at(-1)!.frame).toMatchObject({
      rainWater: { depths: [0, 0, 0] },
    });
  });

  it("highlights the matching water update in each desktop language", () => {
    const execution = run("4, 1, 3, 1, 4, 2");
    const left = execution.steps.find((step) => step.phase === "process-left")!;
    const right = execution.steps.find((step) => step.phase === "process-right")!;
    const done = execution.steps.at(-1)!;
    for (const language of ["js", "ts", "py"] as const) {
      const lines = execution.codeByLang[language];
      expect(lines[resolveCodeLine(execution, language, left.codeLine)! - 1]).toContain("water +=");
      expect(lines[resolveCodeLine(execution, language, right.codeLine)! - 1]).toContain(
        "water +=",
      );
      expect(lines[resolveCodeLine(execution, language, done.codeLine)! - 1]).toContain(
        "return water",
      );
    }
  });

  it("rejects negative, fractional, empty, and over-limit inputs", () => {
    expect(trappingRainWaterModule.validate({ height: "" }).ok).toBe(false);
    expect(trappingRainWaterModule.validate({ height: "1, -2" })).toEqual({
      ok: false,
      error: "Elevation heights must be non-negative integers.",
    });
    expect(trappingRainWaterModule.validate({ height: "1, 2.5" })).toEqual({
      ok: false,
      error: "Elevation heights must be non-negative integers.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index).join(", ");
    const validation = trappingRainWaterModule.validate({ height: tooLong });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives left, right, and deterministic tie predictions", () => {
    const leftRun = run("0, 2, 0, 3");
    const leftCheckpoint = buildPredictionCheckpoints(leftRun.steps)[0]!;
    expect(
      derivePrediction(leftRun.steps[leftCheckpoint.stepIndex], leftCheckpoint.id)?.correctOptionId,
    ).toBe("process-left");

    const rightRun = run("4, 1, 3, 1, 4, 2");
    const rightCheckpoint = buildPredictionCheckpoints(rightRun.steps)[0]!;
    expect(
      derivePrediction(rightRun.steps[rightCheckpoint.stepIndex], rightCheckpoint.id)
        ?.correctOptionId,
    ).toBe("process-right");

    const tieRun = run("4, 1, 4");
    const tieCheckpoint = buildPredictionCheckpoints(tieRun.steps)[0]!;
    expect(
      derivePrediction(tieRun.steps[tieCheckpoint.stepIndex], tieCheckpoint.id)?.correctOptionId,
    ).toBe("process-left");
  });

  it("explains the bounded-side invariant and terminal result", () => {
    const execution = run("3, 0, 2, 0, 4");
    const comparison = deriveReasoning(execution.steps[1], execution.steps[0], 2);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(comparison?.why).toContain("guarantees");
    expect(comparison?.next).toContain("Move left");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return 7.");
  });

  it("builds a separate five-checkpoint trace with both side choices", () => {
    const exercise = getTraceExercise("two-pointers", "trapping-rain-water")!;
    expect(exercise.moduleSlug).toBe("trapping-rain-water");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(5);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "trapped-water")).toBe(
      true,
    );
    expect(session.checkpoints.map((checkpoint) => checkpoint.question.correctOptionId)).toEqual([
      "process-right",
      "process-left",
      "process-left",
      "process-left",
      "process-left",
    ]);
    expect(session.summary.pathLabel).toBe("unresolved bars");
    expect(session.summary.pathValues).toEqual([6, 5, 4, 3, 2, 0]);
  });
});

describe("Trapping Rain Water Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without replacing earlier slices", () => {
    expect(resolveQuestionImplementationSlug("trapping-rain-water")).toBe("trapping-rain-water");
    expect(resolveQuestionTransferSlug("trapping-rain-water")).toBe("valid-palindrome");
    expect(resolveQuestionTransferSlug("container-with-most-water")).toBe("trapping-rain-water");
    const review = getReviewItemsByProblem("trapping-rain-water");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
