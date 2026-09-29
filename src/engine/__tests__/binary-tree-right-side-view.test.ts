import { describe, expect, it } from "vitest";

import { getTraceExercise } from "@/content/trace-exercises";
import { binaryTreeRightSideViewModule } from "@/engine/algorithms/binaryTreeRightSideView";
import { getModuleForProblem } from "@/engine/registry";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(tree: string) {
  const validated = binaryTreeRightSideViewModule.validate({ tree });
  if (!validated.ok) throw new Error(validated.error);
  return binaryTreeRightSideViewModule.run(validated.parsed);
}

describe("binary tree right side view problem module", () => {
  it("is registered by question slug", () => {
    expect(getModuleForProblem("binary-tree-right-side-view")).toBe(binaryTreeRightSideViewModule);
  });

  it("returns the final left-to-right node from each level", () => {
    const result = run("[1,2,3,null,5,null,4]");
    expect(result.result).toBe("Right view: [1,3,4]");
    expect(result.totalCounters).toEqual({ enqueues: 5, visits: 5, visibleNodes: 3 });
    expect(result.steps.filter((step) => step.phase === "record-rightmost")).toHaveLength(3);
  });

  it("keeps stable coordinates and the wide fixed canvas", () => {
    const result = run("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]");
    const trees = result.steps.map((step) => step.frame).filter((frame) => frame.kind === "tree");
    const positions = trees[0]!.nodes.map(({ id, x, y }) => ({ id, x, y }));
    for (const frame of trees) {
      expect(frame.nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual(positions);
    }
    const final = trees.at(-1)!;
    expect(final.viewBox).toEqual({ minX: -8, minY: -4, width: 156, height: 92 });
    expect(final.nodes.filter((node) => String(node.badge).startsWith("view "))).toHaveLength(4);
    expect(result.result).toBe("Right view: [1,3,7,15]");
  });

  it("handles empty, single-node, left-chain, and sparse trees", () => {
    expect(run("[]").result).toBe("Right view: []");
    expect(run("[8]").result).toBe("Right view: [8]");
    expect(run("[1,2,null,3]").result).toBe("Right view: [1,2,3]");
    expect(run("[1,2,3,4,null,null,7]").result).toBe("Right view: [1,3,7]");
  });

  it("inherits the frozen tree input limits", () => {
    expect(binaryTreeRightSideViewModule.validate({ tree: "[1,2.5]" })).toMatchObject({
      ok: false,
    });
    expect(
      binaryTreeRightSideViewModule.validate({
        tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]",
      }),
    ).toMatchObject({ ok: false });
  });

  it("keeps every displayed language listing within twelve lines", () => {
    const result = run("[1,2,3]");
    expect(result.pseudocode).toHaveLength(11);
    expect(result.codeByLang.js).toHaveLength(12);
    expect(result.codeByLang.ts).toHaveLength(12);
    expect(result.codeByLang.py).toHaveLength(11);
  });

  it("derives visibility predictions from the frozen level position", () => {
    const result = run("[1,2,3,null,5]");
    const checkpoints = buildPredictionCheckpoints(result.steps, 10);
    expect(checkpoints).toHaveLength(4);
    expect(
      checkpoints.map(
        (checkpoint) =>
          derivePrediction(result.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
      ),
    ).toEqual(["record-rightmost", "skip-current", "record-rightmost", "record-rightmost"]);
  });

  it("explains hidden and visible nodes plus the final result", () => {
    const result = run("[1,2,3]");
    const inspections = result.steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.phase === "inspect-view-node");
    const hidden = deriveReasoning(
      inspections[1]!.step,
      result.steps[inspections[1]!.index - 1],
      inspections[1]!.index + 1,
    );
    expect(hidden?.next).toContain("later node");
    const visible = deriveReasoning(
      inspections[2]!.step,
      result.steps[inspections[2]!.index - 1],
      inspections[2]!.index + 1,
    );
    expect(visible?.next).toBe("Record 3 as the visible node for this level.");
    expect(deriveReasoning(result.steps.at(-1))?.invariant).toBe("Return [1, 3].");
  });

  it("builds a question-specific tree trace from a different input", () => {
    const exercise = getTraceExercise("level-order", "binary-tree-right-side-view");
    expect(exercise?.inputs.tree).toBe("[9,4,13,2,6,null,15]");
    const session = buildTraceSession(run(exercise!.inputs.tree!));
    expect(session.checkpoints).toHaveLength(6);
    expect(session.checkpoints[0]?.view.treeFrame?.kind).toBe("tree");
    expect(session.checkpoints[0]?.question.correctOptionId).toBe("record-rightmost");
    expect(session.summary.pathLabel).toBe("visible nodes");
    expect(session.summary.pathValues?.at(-1)).toBe(3);
  });

  it("maps Code to itself and Solve to Maximum Depth", () => {
    expect(resolveQuestionImplementationSlug("binary-tree-right-side-view")).toBe(
      "binary-tree-right-side-view",
    );
    expect(resolveQuestionTransferSlug("binary-tree-right-side-view")).toBe(
      "maximum-depth-of-binary-tree",
    );
  });
});
