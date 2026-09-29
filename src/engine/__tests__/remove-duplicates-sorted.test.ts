import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { removeDuplicatesSortedModule } from "@/engine/algorithms/removeDuplicatesSorted";
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
  const validation = removeDuplicatesSortedModule.validate({ values });
  if (!validation.ok) throw new Error(validation.error);
  return removeDuplicatesSortedModule.run(validation.parsed);
}

function finalFrame(execution: AlgorithmRun): ArrayFrame {
  return execution.steps.at(-1)!.frame as ArrayFrame;
}

describe("Remove Duplicates from Sorted Array question module", () => {
  it("registers only for its question", () => {
    expect(getModuleForProblem("remove-duplicates-from-sorted-array")).toBe(
      removeDuplicatesSortedModule,
    );
    expect(resolveModule("remove-duplicates-from-sorted-array")).toBe(removeDuplicatesSortedModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("returns the exact unique prefix for every preset", () => {
    for (const preset of removeDuplicatesSortedModule.presets) {
      const input = preset.values.values!.split(",").map(Number);
      const expected = [...new Set(input)];
      const frame = finalFrame(run(preset.values.values!));
      expect(frame.target?.value, preset.label).toBe(expected.length);
      expect(frame.values.slice(0, expected.length), preset.label).toEqual(expected);
    }
  });

  it("copies new values and skips duplicates without defining the suffix", () => {
    const execution = run("0, 0, 1, 1, 2");
    const frame = finalFrame(execution);
    expect(frame.target?.value).toBe(3);
    expect(frame.values.slice(0, 3)).toEqual([0, 1, 2]);
    expect(execution.steps.filter((step) => step.phase === "copy-unique")).toHaveLength(2);
    expect(execution.steps.filter((step) => step.phase === "skip-duplicate")).toHaveLength(2);
  });

  it("moves pointers on action frames and removes them at completion", () => {
    const execution = run("1, 1, 2");
    const skip = execution.steps.find((step) => step.phase === "skip-duplicate")!;
    const copy = execution.steps.find((step) => step.phase === "copy-unique")!;
    const pointerAt = (step: (typeof execution.steps)[number], name: string): number =>
      (step.frame as ArrayFrame).pointers.find((pointer) => pointer.name === name)!.index;
    expect(pointerAt(skip, "read")).toBe(2);
    expect(pointerAt(skip, "write")).toBe(1);
    expect(pointerAt(copy, "read")).toBe(2);
    expect(pointerAt(copy, "write")).toBe(2);
    expect(finalFrame(execution).pointers).toEqual([]);
  });

  it("rejects fractional, unsorted, empty, and over-limit inputs", () => {
    expect(removeDuplicatesSortedModule.validate({ values: "" }).ok).toBe(false);
    expect(removeDuplicatesSortedModule.validate({ values: "1, 1.5" })).toEqual({
      ok: false,
      error: "Remove Duplicates requires integer values.",
    });
    expect(removeDuplicatesSortedModule.validate({ values: "1, 3, 2" })).toEqual({
      ok: false,
      error: "Numbers must be sorted in non-decreasing order.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index).join(", ");
    const validation = removeDuplicatesSortedModule.validate({ values: tooLong });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives copy and skip predictions from semantic comparisons", () => {
    const execution = run("1, 1, 2");
    const checkpoints = buildPredictionCheckpoints(execution.steps, 10);
    expect(
      checkpoints.map(
        (checkpoint) =>
          derivePrediction(execution.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
      ),
    ).toEqual(["skip-duplicate", "copy-unique"]);
  });

  it("explains the unique-prefix invariant and final k", () => {
    const execution = run("1, 1, 2");
    const scan = deriveReasoning(execution.steps[1], execution.steps[0], 2);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(scan?.invariant).toContain("distinct scanned value exactly once");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return k = 2; nums starts with [1, 2].");
  });

  it("builds a separate six-checkpoint trace", () => {
    const exercise = getTraceExercise("two-pointers", "remove-duplicates-from-sorted-array")!;
    expect(exercise.moduleSlug).toBe("remove-duplicates-from-sorted-array");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(6);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "remove-duplicates")).toBe(
      true,
    );
    expect(session.checkpoints.map((checkpoint) => checkpoint.question.correctOptionId)).toEqual([
      "skip-duplicate",
      "copy-unique",
      "skip-duplicate",
      "copy-unique",
      "copy-unique",
      "skip-duplicate",
    ]);
    expect(session.summary.pathLabel).toBe("unique count k");
    expect(session.summary.pathValues).toEqual([1, 1, 2, 2, 3, 4, 4]);
  });
});

describe("Remove Duplicates Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without replacing earlier slices", () => {
    expect(resolveQuestionImplementationSlug("remove-duplicates-from-sorted-array")).toBe(
      "remove-duplicates-from-sorted-array",
    );
    expect(resolveQuestionTransferSlug("remove-duplicates-from-sorted-array")).toBe("three-sum");
    expect(resolveQuestionTransferSlug("move-zeroes")).toBe("remove-duplicates-from-sorted-array");
    const review = getReviewItemsByProblem("remove-duplicates-from-sorted-array");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
