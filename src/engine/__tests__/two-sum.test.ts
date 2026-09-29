import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { twoSumModule } from "@/engine/algorithms/twoSum";
import { getModuleForProblem, resolveModule } from "@/engine/registry";
import type { AlgorithmRun, ArrayFrame } from "@/engine/types";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(values: string, target: string): AlgorithmRun {
  const validation = twoSumModule.validate({ values, target });
  if (!validation.ok) throw new Error(validation.error);
  return twoSumModule.run(validation.parsed);
}

function pointer(frame: ArrayFrame, name: string): number {
  const value = frame.pointers.find((candidate) => candidate.name === name)?.index;
  if (value === undefined) throw new Error(`Missing ${name} pointer`);
  return value;
}

describe("Two Sum II question module", () => {
  it("registers only for the Two Sum question", () => {
    expect(getModuleForProblem("two-sum")).toBe(twoSumModule);
    expect(resolveModule("two-sum")).toBe(twoSumModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("finds a valid 1-indexed pair for every solution preset", () => {
    for (const preset of twoSumModule.presets) {
      const execution = run(preset.values.values!, preset.values.target!);
      if (preset.label === "No solution") {
        expect(execution.result).toContain("No pair");
        continue;
      }
      const match = execution.result.match(/\[(\d+), (\d+)\]/);
      expect(match, preset.label).not.toBeNull();
      const left = Number(match![1]) - 1;
      const right = Number(match![2]) - 1;
      const values = preset.values.values!.split(",").map(Number);
      expect(left).toBeLessThan(right);
      expect(values[left]! + values[right]!).toBe(Number(preset.values.target));
    }
  });

  it("moves one pointer monotonically after every unequal comparison", () => {
    const execution = run("1, 2, 3, 4, 4, 9, 56, 90", "8");
    const comparisons = execution.steps.filter((step) => step.phase === "compare-pair");
    expect(comparisons.length).toBeGreaterThan(1);
    for (const comparison of comparisons) {
      const frame = comparison.frame as ArrayFrame;
      const next = execution.steps[comparison.i + 1]!;
      const nextFrame = next.frame as ArrayFrame;
      const left = pointer(frame, "left");
      const right = pointer(frame, "right");
      const sum = Number(frame.values[left]) + Number(frame.values[right]);
      if (sum === 8) {
        expect(next.phase).toBe("found");
      } else if (sum < 8) {
        expect(pointer(nextFrame, "left")).toBe(left + 1);
        expect(pointer(nextFrame, "right")).toBe(right);
      } else {
        expect(pointer(nextFrame, "left")).toBe(left);
        expect(pointer(nextFrame, "right")).toBe(right - 1);
      }
    }
  });

  it("supports a truthful no-solution state", () => {
    const execution = run("1, 3, 5, 7", "20");
    expect(execution.steps.at(-1)?.phase).toBe("not-found");
    expect(execution.result).toBe("No pair adds to 20.");
  });

  it("rejects unsorted, undersized, and over-limit inputs", () => {
    expect(twoSumModule.validate({ values: "3, 1, 2", target: "4" })).toEqual({
      ok: false,
      error: "Two Sum II requires numbers in non-decreasing order.",
    });
    expect(twoSumModule.validate({ values: "3", target: "6" })).toEqual({
      ok: false,
      error: "Two Sum needs at least two numbers.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index).join(", ");
    const validation = twoSumModule.validate({ values: tooLong, target: "12" });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives the pointer prediction from the semantic pair sum", () => {
    const execution = run("2, 7, 11, 15", "9");
    const checkpoints = buildPredictionCheckpoints(execution.steps);
    expect(checkpoints).toHaveLength(1);
    const checkpoint = checkpoints[0]!;
    const prediction = derivePrediction(execution.steps[checkpoint.stepIndex], checkpoint.id);
    expect(prediction?.correctOptionId).toBe("retreat-right");
    expect(prediction?.options.map((option) => option.id)).toEqual([
      "advance-left",
      "retreat-right",
      "return-pair",
    ]);
  });

  it("keeps the sorted-order invariant visible through setup and result", () => {
    const execution = run("2, 7, 11, 15", "9");
    const setup = deriveReasoning(execution.steps[0], null, 1);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(setup?.invariant).toContain("two distinct indices");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return [1, 2].");
  });

  it("builds a question-specific trace from a different canonical input", () => {
    const exercise = getTraceExercise("two-pointers", "two-sum")!;
    expect(exercise.moduleSlug).toBe("two-sum");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(5);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "pair-sum")).toBe(true);
    expect(session.summary.found).toBe(true);
    expect(session.summary.pathLabel).toBe("candidate span");
    expect(session.finalView.frame?.states[2]).toBe("found");
    expect(session.finalView.frame?.states[4]).toBe("found");
  });
});

describe("Two Sum Golden stage mappings", () => {
  it("keeps Two Sum and Sort Colors question mappings independent", () => {
    expect(resolveQuestionImplementationSlug("two-sum")).toBe("two-sum");
    expect(resolveQuestionTransferSlug("two-sum")).toBe("container-with-most-water");
    expect(resolveQuestionImplementationSlug("sort-colors")).toBe("sort-colors");
    expect(resolveQuestionTransferSlug("sort-colors")).toBe("move-zeroes");
    expect(getTraceExercise("two-pointers", "two-sum")?.moduleSlug).toBe("two-sum");
    const review = getReviewItemsByProblem("two-sum");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
