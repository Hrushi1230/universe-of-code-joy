import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { moveZeroesModule } from "@/engine/algorithms/moveZeroes";
import { getModuleForProblem, resolveModule } from "@/engine/registry";
import type { AlgorithmRun, ArrayFrame } from "@/engine/types";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(values: string): AlgorithmRun {
  const validation = moveZeroesModule.validate({ values });
  if (!validation.ok) throw new Error(validation.error);
  return moveZeroesModule.run(validation.parsed);
}

function oracle(values: number[]): number[] {
  const nonZero = values.filter((value) => value !== 0);
  return [...nonZero, ...Array.from({ length: values.length - nonZero.length }, () => 0)];
}

function resultValues(execution: AlgorithmRun): number[] {
  const frame = execution.steps.at(-1)!.frame as ArrayFrame;
  return frame.values.map(Number);
}

describe("Move Zeroes question module", () => {
  it("registers only for the Move Zeroes question", () => {
    expect(getModuleForProblem("move-zeroes")).toBe(moveZeroesModule);
    expect(resolveModule("move-zeroes")).toBe(moveZeroesModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("matches stable compaction for every preset", () => {
    for (const preset of moveZeroesModule.presets) {
      const values = preset.values.values!.split(",").map(Number);
      expect(resultValues(run(preset.values.values!)), preset.label).toEqual(oracle(values));
    }
  });

  it("preserves non-zero order and fills exactly the remaining suffix", () => {
    const execution = run("0, -2, 0, 5, -7");
    expect(resultValues(execution)).toEqual([-2, 5, -7, 0, 0]);
    expect(execution.steps.filter((step) => step.phase === "copy-nonzero")).toHaveLength(3);
    expect(execution.steps.filter((step) => step.phase === "skip-zero")).toHaveLength(2);
    expect(execution.steps.filter((step) => step.phase === "write-zero")).toHaveLength(2);
  });

  it("moves read and write markers on the same frame as each transition", () => {
    const execution = run("0, 4");
    const skip = execution.steps.find((step) => step.phase === "skip-zero")!;
    const copy = execution.steps.find((step) => step.phase === "copy-nonzero")!;
    const pointerAt = (step: (typeof execution.steps)[number], name: string): number =>
      (step.frame as ArrayFrame).pointers.find((pointer) => pointer.name === name)!.index;
    expect(pointerAt(skip, "read")).toBe(1);
    expect(pointerAt(skip, "write")).toBe(0);
    expect(pointerAt(copy, "read")).toBe(1);
    expect(pointerAt(copy, "write")).toBe(1);
    expect((execution.steps.at(-1)!.frame as ArrayFrame).pointers).toEqual([]);
  });

  it("rejects empty, fractional, and over-limit inputs", () => {
    expect(moveZeroesModule.validate({ values: "" }).ok).toBe(false);
    expect(moveZeroesModule.validate({ values: "1, 2.5" })).toEqual({
      ok: false,
      error: "Move Zeroes requires integer values.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index).join(", ");
    const validation = moveZeroesModule.validate({ values: tooLong });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives copy, skip, and suffix-fill predictions", () => {
    const execution = run("0, 4");
    const checkpoints = buildPredictionCheckpoints(execution.steps, 10);
    expect(
      checkpoints.map(
        (checkpoint) =>
          derivePrediction(execution.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
      ),
    ).toEqual(["skip-zero", "copy-value", "write-zero"]);
  });

  it("explains the packed-prefix invariant and terminal array", () => {
    const execution = run("0, 1, 0");
    const scan = deriveReasoning(execution.steps[1], execution.steps[0], 2);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(scan?.invariant).toContain("stable packed prefix");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return [1, 0, 0].");
  });

  it("builds a separate seven-checkpoint trace for scan and fill actions", () => {
    const exercise = getTraceExercise("two-pointers", "move-zeroes")!;
    expect(exercise.moduleSlug).toBe("move-zeroes");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(7);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "move-zeroes")).toBe(true);
    expect(session.checkpoints.map((checkpoint) => checkpoint.question.correctOptionId)).toEqual([
      "copy-value",
      "skip-zero",
      "copy-value",
      "skip-zero",
      "copy-value",
      "write-zero",
      "write-zero",
    ]);
    expect(session.summary.pathLabel).toBe("write boundary");
    expect(session.summary.pathValues).toEqual([0, 1, 1, 2, 2, 3, 4, 5]);
  });
});

describe("Move Zeroes Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without replacing earlier slices", () => {
    expect(resolveQuestionImplementationSlug("move-zeroes")).toBe("move-zeroes");
    expect(resolveQuestionTransferSlug("move-zeroes")).toBe("remove-duplicates-from-sorted-array");
    expect(resolveQuestionTransferSlug("valid-palindrome")).toBe("move-zeroes");
    const review = getReviewItemsByProblem("move-zeroes");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
