import { describe, expect, it } from "vitest";

import { binaryTreeLevelOrderModule } from "@/engine/algorithms/binaryTreeLevelOrder";
import { getModuleForProblem } from "@/engine/registry";
import { getTraceExercise } from "@/content/trace-exercises";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(tree: string) {
  const validated = binaryTreeLevelOrderModule.validate({ tree });
  if (!validated.ok) throw new Error(validated.error);
  return binaryTreeLevelOrderModule.run(validated.parsed);
}

describe("binary tree level order problem module", () => {
  it("is registered by question slug", () => {
    expect(getModuleForProblem("binary-tree-level-order")).toBe(binaryTreeLevelOrderModule);
  });

  it("returns the canonical left-to-right levels", () => {
    const result = run("[3,9,20,null,null,15,7]");
    expect(result.result).toBe("Levels: [[3],[9,20],[15,7]]");
    expect(result.steps.at(-1)?.frame.kind).toBe("tree");
    expect(result.totalCounters).toEqual({ enqueues: 5, visits: 5, levels: 3 });
  });

  it("keeps coordinates stable while queue and traversal state change", () => {
    const result = run("[1,2,3,4,5,6,7]");
    const trees = result.steps.map((step) => step.frame).filter((frame) => frame.kind === "tree");
    const positions = trees[0]!.nodes.map(({ id, x, y }) => ({ id, x, y }));
    for (const frame of trees) {
      expect(frame.nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual(positions);
    }
    expect(result.steps.filter((step) => step.phase === "inspect-node")).toHaveLength(7);
    expect(result.steps.filter((step) => step.phase === "finish-level")).toHaveLength(3);
  });

  it("handles empty, single-node, sparse, and maximum visible trees", () => {
    expect(run("[]").result).toBe("Levels: []");
    expect(run("[8]").result).toBe("Levels: [[8]]");
    expect(run("[1,2,3,4,null,null,7]").result).toBe("Levels: [[1],[2,3],[4,7]]");
    const maximum = run("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]");
    const final = maximum.steps.at(-1)!.frame;
    expect(final.kind).toBe("tree");
    if (final.kind === "tree") {
      expect(final.nodes).toHaveLength(15);
      expect(new Set(final.nodes.map((node) => node.y))).toHaveLength(4);
      expect(final.viewBox).toEqual({ minX: -8, minY: -4, width: 156, height: 92 });
      const bottom = final.nodes
        .filter((node) => node.y === 76)
        .map((node) => node.x)
        .sort((a, b) => a - b);
      expect(bottom).toHaveLength(8);
      expect(Math.min(...bottom.slice(1).map((x, index) => x - bottom[index]!))).toBe(17.5);
    }
    expect(maximum.result).toBe("Levels: [[1],[2,3],[4,5,6,7],[8,9,10,11,12,13,14,15]]");
  });

  it("rejects invalid values, orphan nodes, and trees beyond the frozen limits", () => {
    expect(binaryTreeLevelOrderModule.validate({ tree: "[1,2.5]" })).toMatchObject({ ok: false });
    expect(binaryTreeLevelOrderModule.validate({ tree: "[1,null,3,4]" })).toMatchObject({
      ok: false,
    });
    expect(
      binaryTreeLevelOrderModule.validate({
        tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]",
      }),
    ).toMatchObject({ ok: false });
  });

  it("keeps every displayed language listing within twelve lines", () => {
    const result = run("[1,2,3]");
    expect(result.pseudocode).toHaveLength(10);
    expect(result.codeByLang.js).toHaveLength(12);
    expect(result.codeByLang.ts).toHaveLength(12);
    expect(result.codeByLang.py).toHaveLength(11);
  });

  it("derives child-enqueue predictions from tree structure", () => {
    const result = run("[1,2,3,null,5]");
    const checkpoints = buildPredictionCheckpoints(result.steps, 10);
    expect(checkpoints).toHaveLength(4);
    const answers = checkpoints.map(
      (checkpoint) =>
        derivePrediction(result.steps[checkpoint.stepIndex], checkpoint.id)?.correctOptionId,
    );
    expect(answers).toEqual(["enqueue-both", "enqueue-right", "enqueue-none", "enqueue-none"]);
  });

  it("explains the queue invariant and terminal level result", () => {
    const result = run("[1,2,3]");
    const inspectIndex = result.steps.findIndex((step) => step.phase === "inspect-node");
    const inspect = deriveReasoning(
      result.steps[inspectIndex],
      result.steps[inspectIndex - 1],
      inspectIndex + 1,
    );
    expect(inspect?.invariant).toContain("breadth-first, left-to-right order");
    expect(inspect?.next).toBe("Enqueue 2 then 3 before visiting the next queued node.");
    const done = deriveReasoning(result.steps.at(-1), result.steps.at(-2), result.steps.length);
    expect(done?.invariantLabel).toBe("Result");
    expect(done?.invariant).toBe("Return 2 completed levels.");
  });

  it("builds a question-specific tree trace from a different input", () => {
    const exercise = getTraceExercise("level-order", "binary-tree-level-order");
    expect(exercise?.inputs.tree).toBe("[8,4,12,2,6,10,14]");
    const traceRun = run(exercise!.inputs.tree!);
    const session = buildTraceSession(traceRun);
    expect(session.checkpoints).toHaveLength(7);
    expect(session.checkpoints[0]?.kind).toBe("level-order");
    expect(session.checkpoints[0]?.view.treeFrame?.kind).toBe("tree");
    expect(session.checkpoints[0]?.question.correctOptionId).toBe("enqueue-both");
    expect(session.summary.pathLabel).toBe("levels complete");
    expect(session.summary.pathValues?.at(-1)).toBe(3);
  });

  it("maps Code to itself and Solve to Right Side View", () => {
    expect(resolveQuestionImplementationSlug("binary-tree-level-order")).toBe(
      "binary-tree-level-order",
    );
    expect(resolveQuestionTransferSlug("binary-tree-level-order")).toBe(
      "binary-tree-right-side-view",
    );
  });
});
