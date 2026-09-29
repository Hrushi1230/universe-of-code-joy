import { describe, expect, it } from "vitest";

import { getTraceExercise } from "@/content/trace-exercises";
import { getModuleForProblem } from "@/engine/registry";
import { validateBinarySearchTreeModule } from "@/engine/algorithms/validateBinarySearchTree";
import type { TreeFrame } from "@/engine/types";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(tree: string) {
  const valid = validateBinarySearchTreeModule.validate({ tree });
  if (!valid.ok) throw new Error(valid.error);
  return validateBinarySearchTreeModule.run(valid.parsed);
}

describe("validate binary search tree problem module", () => {
  it("is registered and validates classic, deep-bound, empty, and duplicate cases", () => {
    expect(getModuleForProblem("validate-binary-search-tree")).toBe(validateBinarySearchTreeModule);
    expect(run("[2,1,3]").result).toBe("Valid BST: true");
    expect(run("[5,1,4,null,null,3,6]").result).toBe("Valid BST: false at node 4");
    expect(run("[5,2,8,1,6]").result).toBe("Valid BST: false at node 6");
    expect(run("[2,2,3]").result).toBe("Valid BST: false at node 2");
    expect(run("[]").result).toBe("Valid BST: true");
  });

  it("keeps the maximum tree readable and counts every recursive check", () => {
    const result = run("[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]");
    expect(result.result).toBe("Valid BST: true");
    expect(result.totalCounters).toEqual({ visits: 15, checks: 15 });
    const finalFrame = result.steps.at(-1)?.frame as TreeFrame;
    expect(finalFrame.kind).toBe("tree");
    expect(finalFrame.viewBox).toEqual({
      minX: -8,
      minY: -4,
      width: 156,
      height: 92,
    });
    expect(result.steps).toHaveLength(62);
    expect(
      result.steps.every((step) =>
        step.aux?.some((panel) => panel.kind === "keyvalue" && panel.label === "BST bounds"),
      ),
    ).toBe(true);
  });

  it("derives accept and reject predictions from semantic bounds", () => {
    const valid = run("[2,1,3]");
    const validCheckpoints = buildPredictionCheckpoints(valid.steps, 10);
    expect(validCheckpoints).toHaveLength(3);
    expect(
      validCheckpoints.map(
        (checkpoint) =>
          derivePrediction(valid.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
      ),
    ).toEqual(["accept-bst-node", "accept-bst-node", "accept-bst-node"]);

    const invalid = run("[5,1,4,null,null,3,6]");
    const invalidStep = invalid.steps.find(
      (step) =>
        step.phase === "check-bst-node" &&
        step.frame.kind === "tree" &&
        step.frame.nodes.some((node) => node.state === "active" && node.label === 4),
    );
    expect(invalidStep).toBeDefined();
    expect(derivePrediction(invalidStep, "invalid-check")?.correctOptionId).toBe("reject-bst-node");
  });

  it("builds a distinct seven-node trace and truthful final reasoning", () => {
    const exercise = getTraceExercise("bst-traversals", "validate-binary-search-tree");
    expect(exercise?.inputs.tree).toBe("[8,4,12,2,6,10,14]");
    const session = buildTraceSession(run(exercise!.inputs.tree!));
    expect(session.checkpoints).toHaveLength(7);
    expect(session.checkpoints.every((checkpoint) => checkpoint.kind === "bst-validation")).toBe(
      true,
    );
    expect(session.summary.pathLabel).toBe("nodes checked");
    expect(session.summary.pathValues?.at(-1)).toBe(7);
    expect(deriveReasoning(run("[2,1,3]").steps.at(-1))?.invariant).toContain("Return true");
  });

  it("maps Code to itself and Solve to the recursive diameter transfer", () => {
    expect(resolveQuestionImplementationSlug("validate-binary-search-tree")).toBe(
      "validate-binary-search-tree",
    );
    expect(resolveQuestionTransferSlug("validate-binary-search-tree")).toBe(
      "diameter-of-binary-tree",
    );
  });

  it("rejects malformed and over-limit trees", () => {
    expect(validateBinarySearchTreeModule.validate({ tree: "[2,1.5,3]" })).toMatchObject({
      ok: false,
    });
    expect(
      validateBinarySearchTreeModule.validate({
        tree: "[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15,16]",
      }),
    ).toMatchObject({ ok: false });
  });
});
