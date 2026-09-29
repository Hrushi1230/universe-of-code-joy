import { describe, expect, it } from "vitest";
import { getReviewItemsByProblem } from "@/content/review-items";
import { getTraceExercise } from "@/content/trace-exercises";
import { validPalindromeModule } from "@/engine/algorithms/validPalindrome";
import { getModuleForProblem, resolveModule } from "@/engine/registry";
import type { AlgorithmRun, ArrayFrame } from "@/engine/types";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(text: string): AlgorithmRun {
  const validation = validPalindromeModule.validate({ text });
  if (!validation.ok) throw new Error(validation.error);
  return validPalindromeModule.run(validation.parsed);
}

function oracle(text: string): boolean {
  const normalized = [...text]
    .filter((character) => /^[a-z0-9]$/i.test(character))
    .join("")
    .toLowerCase();
  return normalized === [...normalized].reverse().join("");
}

describe("Valid Palindrome question module", () => {
  it("registers only for the Valid Palindrome question", () => {
    expect(getModuleForProblem("valid-palindrome")).toBe(validPalindromeModule);
    expect(resolveModule("valid-palindrome")).toBe(validPalindromeModule);
    expect(resolveModule("two-pointers")).toBeUndefined();
  });

  it("matches a normalized-string oracle for every preset", () => {
    for (const preset of validPalindromeModule.presets) {
      const text = preset.values.text!;
      expect(run(text).result, preset.label).toBe(
        oracle(text) ? "The text is a valid palindrome." : "The text is not a valid palindrome.",
      );
    }
  });

  it("skips punctuation, compares case-insensitively, and stops at a mismatch", () => {
    expect(run("Nurses, run").steps.filter((step) => step.phase === "skip-right")).toHaveLength(2);
    expect(run("Race Car").result).toBe("The text is a valid palindrome.");
    const mismatch = run("race a car");
    expect(mismatch.result).toBe("The text is not a valid palindrome.");
    expect(mismatch.steps.at(-1)?.phase).toBe("mismatch");
    expect((mismatch.steps.at(-1)?.frame as ArrayFrame).target).toEqual({
      label: "palindrome",
      value: "false",
    });
  });

  it("moves pointer markers on the same frame that explains each transition", () => {
    const execution = run(",Aa,");
    const skipLeft = execution.steps.find((step) => step.phase === "skip-left")!;
    const match = execution.steps.find((step) => step.phase === "move-both")!;
    const skipRight = execution.steps.find((step) => step.phase === "skip-right")!;
    const pointerAt = (step: (typeof execution.steps)[number], name: string): number =>
      (step.frame as ArrayFrame).pointers.find((pointer) => pointer.name === name)!.index;
    expect(pointerAt(skipLeft, "left")).toBe(1);
    expect(pointerAt(skipRight, "right")).toBe(2);
    expect(pointerAt(match, "left")).toBe(2);
    expect(pointerAt(match, "right")).toBe(1);
  });

  it("rejects empty and over-limit strings while accepting punctuation-only input", () => {
    expect(validPalindromeModule.validate({ text: "" })).toEqual({
      ok: false,
      error: "Enter at least one character.",
    });
    expect(validPalindromeModule.validate({ text: "abcdefghijklmn" })).toEqual({
      ok: false,
      error: "Use 12 or fewer visible characters so the fixed visualizer stays readable.",
    });
    expect(run("!!!").result).toBe("The text is a valid palindrome.");
  });

  it("derives all four pointer-action predictions", () => {
    const cases = [
      [",aa", "skip-left"],
      ["aa,", "skip-right"],
      ["Aa", "advance-both"],
      ["ab", "return-false"],
    ] as const;
    for (const [text, expected] of cases) {
      const execution = run(text);
      const checkpoint = buildPredictionCheckpoints(execution.steps)[0]!;
      expect(
        derivePrediction(execution.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
      ).toBe(expected);
    }
  });

  it("explains the normalization invariant and terminal result", () => {
    const execution = run("Race Car");
    const inspection = deriveReasoning(execution.steps[1], execution.steps[0], 2);
    const done = deriveReasoning(
      execution.steps.at(-1),
      execution.steps.at(-2),
      execution.steps.length,
    );
    expect(inspection?.invariant).toContain("matched or intentionally ignored");
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return true.");
  });

  it("builds a separate four-checkpoint trace covering skips and matches", () => {
    const exercise = getTraceExercise("two-pointers", "valid-palindrome")!;
    expect(exercise.moduleSlug).toBe("valid-palindrome");
    const mod = resolveModule(exercise.moduleSlug!);
    const validation = mod!.validate(exercise.inputs);
    if (!validation.ok) throw new Error(validation.error);
    const session = buildTraceSession(mod!.run(validation.parsed));
    expect(session.checkpoints).toHaveLength(4);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "palindrome-action")).toBe(
      true,
    );
    expect(session.checkpoints.map((checkpoint) => checkpoint.question.correctOptionId)).toEqual([
      "skip-right",
      "advance-both",
      "skip-left",
      "advance-both",
    ]);
    expect(session.summary.pathLabel).toBe("unchecked characters");
    expect(session.summary.pathValues).toEqual([7, 6, 4, 3, 0]);
  });
});

describe("Valid Palindrome Golden stage mappings", () => {
  it("maps Code, Solve, Trace, and Review without replacing earlier slices", () => {
    expect(resolveQuestionImplementationSlug("valid-palindrome")).toBe("valid-palindrome");
    expect(resolveQuestionTransferSlug("valid-palindrome")).toBe("move-zeroes");
    expect(resolveQuestionTransferSlug("trapping-rain-water")).toBe("valid-palindrome");
    const review = getReviewItemsByProblem("valid-palindrome");
    expect(review).toHaveLength(6);
    expect(new Set(review.map((item) => item.kind))).toEqual(
      new Set(["concept", "invariant", "classification", "boundary", "code", "pattern"]),
    );
  });
});
