import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { threeSumModule } from "@/engine/algorithms/threeSum";
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
  const validation = threeSumModule.validate({ values });
  if (!validation.ok) throw new Error(validation.error);
  return threeSumModule.run(validation.parsed);
}

function oracle(values: number[]): number[][] {
  const found = new Set<string>();
  for (let i = 0; i < values.length - 2; i += 1) {
    for (let j = i + 1; j < values.length - 1; j += 1) {
      for (let k = j + 1; k < values.length; k += 1) {
        if (values[i]! + values[j]! + values[k]! !== 0) continue;
        found.add(JSON.stringify([values[i]!, values[j]!, values[k]!].sort((a, b) => a - b)));
      }
    }
  }
  return [...found]
    .map((triplet) => JSON.parse(triplet) as number[])
    .sort((a, b) =>
      a[0] !== b[0] ? a[0]! - b[0]! : a[1] !== b[1] ? a[1]! - b[1]! : a[2]! - b[2]!,
    );
}

function resultTriplets(execution: AlgorithmRun): number[][] {
  const match = execution.result.match(/^Result: (.*)\.$/);
  if (!match) throw new Error(`Unexpected result: ${execution.result}`);
  return JSON.parse(match[1]!.replaceAll(" ", "")) as number[][];
}

describe("3Sum question module", () => {
  it("registers only for the 3Sum question", () => {
    expect(getModuleForProblem("three-sum")).toBe(threeSumModule);
    expect(resolveModule("three-sum")).toBe(threeSumModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("matches a brute-force unique-triplet oracle for every preset", () => {
    for (const preset of threeSumModule.presets) {
      const input = preset.values.values!.split(",").map(Number);
      expect(resultTriplets(run(preset.values.values!)), preset.label).toEqual(oracle(input));
    }
  });

  it("returns the canonical solutions once and skips duplicate anchors", () => {
    const execution = run("-1, 0, 1, 2, -1, -4");
    expect(resultTriplets(execution)).toEqual([
      [-1, -1, 2],
      [-1, 0, 1],
    ]);
    expect(execution.steps.some((step) => step.phase === "skip-anchor")).toBe(true);
    expect(execution.steps.filter((step) => step.phase === "record-triplet")).toHaveLength(2);
  });

  it("moves endpoints on action frames and removes pointers at completion", () => {
    const execution = run("-1, 0, 1");
    const record = execution.steps.find((step) => step.phase === "record-triplet")!;
    const frame = record.frame as ArrayFrame;
    expect(frame.pointers.find((pointer) => pointer.name === "left")?.index).toBe(2);
    expect(frame.pointers.find((pointer) => pointer.name === "right")?.index).toBe(1);
    expect((execution.steps.at(-1)!.frame as ArrayFrame).pointers).toEqual([]);
  });

  it("rejects empty, short, fractional, and over-limit inputs", () => {
    expect(threeSumModule.validate({ values: "" }).ok).toBe(false);
    expect(threeSumModule.validate({ values: "1, 2" })).toEqual({
      ok: false,
      error: "Enter at least three numbers.",
    });
    expect(threeSumModule.validate({ values: "-1, 0, 1.5" })).toEqual({
      ok: false,
      error: "3Sum requires integer values.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index).join(", ");
    const validation = threeSumModule.validate({ values: tooLong });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives pointer, record, and duplicate-anchor predictions", () => {
    const execution = run("-2, -2, 0, 0, 2, 2");
    const checkpoints = buildPredictionCheckpoints(execution.steps, 20);
    expect(
      checkpoints.map(
        (checkpoint) =>
          derivePrediction(execution.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
      ),
    ).toEqual([
      "advance-left",
      "record-triplet",
      "skip-anchor",
      "retreat-right",
      "retreat-right",
      "skip-anchor",
    ]);
  });

  it("explains sorted movement, uniqueness, and the terminal count", () => {
    const execution = run("-1, 0, 1");
    const compareIndex = execution.steps.findIndex((step) => step.phase === "compare-triplet");
    const compare = deriveReasoning(
      execution.steps[compareIndex],
      execution.steps[compareIndex - 1],
      compareIndex + 1,
    );
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(compare?.next).toContain("Record this triplet");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return 1 unique triplet.");
  });

  it("builds a separate six-checkpoint trace with duplicate handling", () => {
    const exercise = getTraceExercise("two-pointers", "three-sum")!;
    expect(exercise.moduleSlug).toBe("three-sum");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(6);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "three-sum")).toBe(true);
    expect(session.checkpoints.map((checkpoint) => checkpoint.question.correctOptionId)).toEqual([
      "advance-left",
      "record-triplet",
      "skip-anchor",
      "retreat-right",
      "retreat-right",
      "skip-anchor",
    ]);
    expect(session.summary.pathLabel).toBe("triplets found");
    expect(session.summary.pathValues).toEqual([0, 0, 1, 1, 1, 1, 1]);
  });
});

describe("3Sum Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without replacing earlier slices", () => {
    expect(resolveQuestionImplementationSlug("three-sum")).toBe("three-sum");
    expect(resolveQuestionTransferSlug("three-sum")).toBe("two-sum");
    expect(resolveQuestionTransferSlug("remove-duplicates-from-sorted-array")).toBe("three-sum");
    const review = getReviewItemsByProblem("three-sum");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
