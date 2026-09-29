import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { containerWithMostWaterModule } from "@/engine/algorithms/containerWithMostWater";
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
  const validation = containerWithMostWaterModule.validate({ height });
  if (!validation.ok) throw new Error(validation.error);
  return containerWithMostWaterModule.run(validation.parsed);
}

function pointer(frame: ArrayFrame, name: string): number {
  const value = frame.pointers.find((candidate) => candidate.name === name)?.index;
  if (value === undefined) throw new Error(`Missing ${name} pointer`);
  return value;
}

function bruteForce(height: number[]): number {
  let best = 0;
  for (let left = 0; left < height.length; left += 1) {
    for (let right = left + 1; right < height.length; right += 1) {
      best = Math.max(best, Math.min(height[left]!, height[right]!) * (right - left));
    }
  }
  return best;
}

describe("Container With Most Water question module", () => {
  it("registers only for the Container question", () => {
    expect(getModuleForProblem("container-with-most-water")).toBe(containerWithMostWaterModule);
    expect(resolveModule("container-with-most-water")).toBe(containerWithMostWaterModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("returns the brute-force maximum for every preset", () => {
    for (const preset of containerWithMostWaterModule.presets) {
      const execution = run(preset.values.height!);
      const height = preset.values.height!.split(",").map(Number);
      expect(execution.result, preset.label).toContain(`Maximum water is ${bruteForce(height)}`);
    }
    expect(run("1, 8, 6, 2, 5, 4, 8, 3, 7").result).toContain("Maximum water is 49");
  });

  it("moves only the shorter wall, or both equal walls", () => {
    const execution = run("2, 7, 3, 7, 4, 6");
    const comparisons = execution.steps.filter((step) => step.phase === "compare-area");
    expect(comparisons).toHaveLength(4);

    for (const comparison of comparisons) {
      const frame = comparison.frame as ArrayFrame;
      const next = execution.steps[comparison.i + 1]!;
      const nextFrame = next.frame as ArrayFrame;
      const left = pointer(frame, "left");
      const right = pointer(frame, "right");
      const leftHeight = Number(frame.values[left]);
      const rightHeight = Number(frame.values[right]);

      if (leftHeight < rightHeight) {
        expect(next.phase).toBe("move-left");
        expect(pointer(nextFrame, "left")).toBe(left + 1);
        expect(pointer(nextFrame, "right")).toBe(right);
      } else if (leftHeight > rightHeight) {
        expect(next.phase).toBe("move-right");
        expect(pointer(nextFrame, "left")).toBe(left);
        expect(pointer(nextFrame, "right")).toBe(right - 1);
      } else {
        expect(next.phase).toBe("move-both");
        expect(pointer(nextFrame, "left")).toBe(left + 1);
        expect(pointer(nextFrame, "right")).toBe(right - 1);
      }
    }
  });

  it("keeps best non-decreasing and marks the winning walls", () => {
    const execution = run("1, 8, 6, 2, 5, 4, 8, 3, 7");
    const bestValues = execution.steps.map((step) =>
      Number((step.frame as ArrayFrame).target?.value ?? 0),
    );
    for (let i = 1; i < bestValues.length; i += 1) {
      expect(bestValues[i]).toBeGreaterThanOrEqual(bestValues[i - 1]!);
    }
    const finalFrame = execution.steps.at(-1)!.frame as ArrayFrame;
    expect(finalFrame.states[1]).toBe("found");
    expect(finalFrame.states[8]).toBe("found");
    expect(finalFrame.target).toEqual({ label: "best area", value: 49 });
  });

  it("rejects negative, fractional, undersized, and over-limit inputs", () => {
    expect(containerWithMostWaterModule.validate({ height: "1" })).toEqual({
      ok: false,
      error: "A container needs at least two wall heights.",
    });
    expect(containerWithMostWaterModule.validate({ height: "1, -2" })).toEqual({
      ok: false,
      error: "Wall heights must be non-negative integers.",
    });
    expect(containerWithMostWaterModule.validate({ height: "1, 2.5" })).toEqual({
      ok: false,
      error: "Wall heights must be non-negative integers.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index).join(", ");
    const validation = containerWithMostWaterModule.validate({ height: tooLong });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives shorter-wall and equal-wall predictions from semantic state", () => {
    const defaultRun = run("1, 8, 6, 2, 5, 4, 8, 3, 7");
    const checkpoint = buildPredictionCheckpoints(defaultRun.steps)[0]!;
    expect(
      derivePrediction(defaultRun.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
    ).toBe("advance-left");

    const equalRun = run("4, 1, 4");
    const equalCheckpoint = buildPredictionCheckpoints(equalRun.steps)[0]!;
    expect(
      derivePrediction(equalRun.steps[equalCheckpoint.stepIndex], equalCheckpoint.id)
        ?.correctOptionId,
    ).toBe("advance-both");
  });

  it("explains the limiting-wall invariant and final result", () => {
    const execution = run("1, 8, 6, 2, 5, 4, 8, 3, 7");
    const comparison = deriveReasoning(execution.steps[1], execution.steps[0], 2);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(comparison?.why).toContain("shorter limiting wall");
    expect(comparison?.next).toContain("move left");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toContain("Return 49");
  });

  it("builds a question-specific trace covering left, right, and equal moves", () => {
    const exercise = getTraceExercise("two-pointers", "container-with-most-water")!;
    expect(exercise.moduleSlug).toBe("container-with-most-water");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(4);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "container-area")).toBe(
      true,
    );
    expect(session.checkpoints.map((checkpoint) => checkpoint.question.correctOptionId)).toEqual([
      "advance-left",
      "retreat-right",
      "retreat-right",
      "advance-both",
    ]);
    expect(session.summary.pathLabel).toBe("width");
    expect(session.summary.pathValues).toEqual([5, 4, 3, 2, 0]);
  });
});

describe("Container Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without replacing earlier slices", () => {
    expect(resolveQuestionImplementationSlug("container-with-most-water")).toBe(
      "container-with-most-water",
    );
    expect(resolveQuestionTransferSlug("container-with-most-water")).toBe("trapping-rain-water");
    expect(resolveQuestionImplementationSlug("two-sum")).toBe("two-sum");
    expect(resolveQuestionTransferSlug("two-sum")).toBe("container-with-most-water");
    const review = getReviewItemsByProblem("container-with-most-water");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
