import { describe, expect, it } from "vitest";
import { getTraceExercise } from "@/content/trace-exercises";
import { maximumDepthBinaryTreeModule } from "@/engine/algorithms/maximumDepthBinaryTree";
import { getModuleForProblem } from "@/engine/registry";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";

function run(tree: string) {
  const valid = maximumDepthBinaryTreeModule.validate({ tree });
  if (!valid.ok) throw new Error(valid.error);
  return maximumDepthBinaryTreeModule.run(valid.parsed);
}

describe("maximum depth binary tree problem module", () => {
  it("is registered and returns canonical depths", () => {
    expect(getModuleForProblem("maximum-depth-of-binary-tree")).toBe(maximumDepthBinaryTreeModule);
    expect(run("[3,9,20,null,null,15,7]").result).toBe("Maximum depth: 3");
    expect(run("[]").result).toBe("Maximum depth: 0");
    expect(run("[1]").result).toBe("Maximum depth: 1");
    expect(run("[1,2,null,3]").result).toBe("Maximum depth: 3");
  });
  it("keeps stable wide coordinates at the maximum", () => {
    const result = run("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]");
    expect(result.result).toBe("Maximum depth: 4");
    expect(result.totalCounters).toEqual({ enqueues: 15, visits: 15, levels: 4 });
    const frames = result.steps.map((s) => s.frame).filter((f) => f.kind === "tree");
    expect(frames.at(-1)?.viewBox).toEqual({ minX: -8, minY: -4, width: 156, height: 92 });
    expect(result.steps).toHaveLength(25);
  });
  it("rejects invalid and over-limit trees", () => {
    expect(maximumDepthBinaryTreeModule.validate({ tree: "[1,2.5]" })).toMatchObject({ ok: false });
    expect(
      maximumDepthBinaryTreeModule.validate({ tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]" }),
    ).toMatchObject({ ok: false });
  });
  it("derives continue or return predictions at level boundaries", () => {
    const result = run("[1,2,3]");
    const checkpoints = buildPredictionCheckpoints(result.steps, 10);
    expect(checkpoints).toHaveLength(2);
    expect(
      checkpoints.map((c) => derivePrediction(result.steps[c.stepIndex], c.id)?.correctOptionId),
    ).toEqual(["continue-depth", "return-depth"]);
    expect(deriveReasoning(result.steps.at(-1))?.invariant).toBe("Return maximum depth 2.");
  });
  it("builds a distinct four-level trace", () => {
    const exercise = getTraceExercise("level-order", "maximum-depth-of-binary-tree");
    expect(exercise?.inputs.tree).toBe("[8,4,12,2,null,null,14,1]");
    const session = buildTraceSession(run(exercise!.inputs.tree!));
    expect(session.checkpoints).toHaveLength(4);
    expect(session.summary.pathLabel).toBe("levels complete");
    expect(session.summary.pathValues?.at(-1)).toBe(4);
  });
  it("maps Code to itself and Solve to Invert Binary Tree", () => {
    expect(resolveQuestionImplementationSlug("maximum-depth-of-binary-tree")).toBe(
      "maximum-depth-of-binary-tree",
    );
    expect(resolveQuestionTransferSlug("maximum-depth-of-binary-tree")).toBe("invert-binary-tree");
  });
});
