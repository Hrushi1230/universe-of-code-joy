import { describe, expect, it } from "vitest";
import { getAlgorithm } from "@/content/algorithms";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { sortColorsModule } from "@/engine/algorithms/sortColors";
import { getModuleForProblem, resolveModule } from "@/engine/registry";
import type { AlgorithmRun, ArrayFrame } from "@/engine/types";
import { resolveImplementationSlug, resolveTransferSlug } from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(values: string): AlgorithmRun {
  const validation = sortColorsModule.validate({ values });
  if (!validation.ok) throw new Error(validation.error);
  return sortColorsModule.run(validation.parsed);
}

function pointer(frame: ArrayFrame, name: string): number {
  const value = frame.pointers.find((candidate) => candidate.name === name)?.index;
  if (value === undefined) throw new Error(`Missing ${name} pointer`);
  return value;
}

describe("Sort Colors question module", () => {
  it("registers only for the Sort Colors question", () => {
    expect(getModuleForProblem("sort-colors")).toBe(sortColorsModule);
    expect(resolveModule("sort-colors")).toBe(sortColorsModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("sorts every preset while preserving the input multiset", () => {
    for (const preset of sortColorsModule.presets) {
      const execution = run(preset.values.values!);
      const final = execution.steps.at(-1)!.frame as ArrayFrame;
      expect(final.values).toEqual([...final.values].sort((a, b) => Number(a) - Number(b)));
      const input = preset.values.values!.split(",").map(Number);
      expect([...final.values].sort()).toEqual([...input].sort());
      expect(execution.result).toContain(`[${final.values.join(", ")}]`);
    }
  });

  it("preserves the four-region invariant at every step", () => {
    const execution = run("2, 0, 2, 1, 1, 0");
    for (const step of execution.steps) {
      const frame = step.frame as ArrayFrame;
      const low = pointer(frame, "low");
      const mid = pointer(frame, "mid");
      const high = pointer(frame, "high");
      expect(frame.values.slice(0, low).every((value) => value === 0)).toBe(true);
      expect(frame.values.slice(low, mid).every((value) => value === 1)).toBe(true);
      expect(frame.values.slice(high + 1).every((value) => value === 2)).toBe(true);
      expect(frame.values).toHaveLength(6);
    }
  });

  it("rejects invalid colors and a thirteenth cell", () => {
    expect(sortColorsModule.validate({ values: "2, 0, 3" })).toEqual({
      ok: false,
      error: "Sort Colors accepts only 0, 1, and 2 — found 3.",
    });
    const tooLong = Array.from({ length: 13 }, (_, index) => index % 3).join(", ");
    const validation = sortColorsModule.validate({ values: tooLong });
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.error).toContain("12 or fewer");
  });

  it("derives the Dutch-flag prediction from semantic pointer state", () => {
    const execution = run("2, 0, 1");
    const checkpoints = buildPredictionCheckpoints(execution.steps);
    expect(checkpoints).toHaveLength(1);
    const checkpoint = checkpoints[0]!;
    const prediction = derivePrediction(execution.steps[checkpoint.stepIndex], checkpoint.id);
    expect(prediction?.correctOptionId).toBe("swap-high");
    expect(prediction?.options.map((option) => option.id)).toEqual([
      "swap-low",
      "advance-mid",
      "swap-high",
    ]);
  });

  it("keeps the partition invariant visible through setup and completion", () => {
    const execution = run("2, 0, 1");
    const setup = deriveReasoning(execution.steps[0], null, 1);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(setup?.invariant).toContain("From mid to high: unclassified");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Every value is classified: 0s, then 1s, then 2s.");
  });

  it("builds a question-specific trace from a different canonical run", () => {
    const exercise = getTraceExercise("two-pointers", "sort-colors")!;
    expect(exercise.moduleSlug).toBe("sort-colors");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints.length).toBeGreaterThan(0);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "partition")).toBe(true);
    expect(session.summary.pathLabel).toBe("unclassified");
    expect(session.summary.pathValues?.at(-1)).toBe(0);
    expect(session.finalView.frame?.values).toEqual([0, 0, 1, 1, 1, 2, 2]);
  });
});

describe("Sort Colors Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without changing other questions", () => {
    const algorithm = getAlgorithm("two-pointers")!;
    expect(resolveImplementationSlug("two-pointers", algorithm)).toBe("sort-colors");
    expect(resolveTransferSlug("two-pointers", "sort-colors")).toBe("move-zeroes");
    expect(getTraceExercise("two-pointers", "sort-colors")?.moduleSlug).toBe("sort-colors");
    const review = getReviewItemsByProblem("sort-colors");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
