import { describe, expect, it } from "vitest";
import { getTraceExercise } from "@/content/trace-exercises";
import { invertBinaryTreeModule } from "@/engine/algorithms/invertBinaryTree";
import { getModuleForProblem } from "@/engine/registry";
import {
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
} from "@/lib/lesson-stages";
import { buildPredictionCheckpoints, derivePrediction } from "@/lib/prediction";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTraceSession } from "@/lib/trace";
function run(tree: string) {
  const v = invertBinaryTreeModule.validate({ tree });
  if (!v.ok) throw new Error(v.error);
  return invertBinaryTreeModule.run(v.parsed);
}
describe("invert binary tree problem module", () => {
  it("registers and mirrors complete, sparse, chain, single, and empty trees", () => {
    expect(getModuleForProblem("invert-binary-tree")).toBe(invertBinaryTreeModule);
    expect(run("[4,2,7,1,3,6,9]").result).toBe("Inverted: [4,7,2,9,6,3,1]");
    expect(run("[2,1,3,null,4]").result).toBe("Inverted: [2,3,1,null,null,4]");
    expect(run("[1,2,null,3]").result).toBe("Inverted: [1,null,2,null,null,null,3]");
    expect(run("[1]").result).toBe("Inverted: [1]");
    expect(run("[]").result).toBe("Inverted: []");
  });
  it("keeps the maximum tree readable and swaps every node", () => {
    const r = run("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]");
    expect(r.result).toBe("Inverted: [1,3,2,7,6,5,4,15,14,13,12,11,10,9,8]");
    expect(r.totalCounters).toEqual({ enqueues: 15, visits: 15, swaps: 15 });
    expect(r.steps).toHaveLength(32);
    expect(r.steps.at(-1)?.frame.kind).toBe("tree");
  });
  it("uses semantic swap-link predictions", () => {
    const r = run("[1,2,3]");
    const c = buildPredictionCheckpoints(r.steps, 10);
    expect(c).toHaveLength(3);
    expect(c.map((x) => derivePrediction(r.steps[x.stepIndex], x.id)?.correctOptionId)).toEqual([
      "swap-links",
      "swap-links",
      "swap-links",
    ]);
    expect(deriveReasoning(r.steps.at(-1))?.invariant).toBe("Return the fully mirrored root.");
  });
  it("builds a separate seven-node trace", () => {
    const e = getTraceExercise("level-order", "invert-binary-tree");
    expect(e?.inputs.tree).toBe("[8,4,12,2,6,10,14]");
    const s = buildTraceSession(run(e!.inputs.tree!));
    expect(s.checkpoints).toHaveLength(7);
    expect(s.summary.pathLabel).toBe("swaps complete");
  });
  it("maps Code to itself and Solve back to Level Order", () => {
    expect(resolveQuestionImplementationSlug("invert-binary-tree")).toBe("invert-binary-tree");
    expect(resolveQuestionTransferSlug("invert-binary-tree")).toBe("binary-tree-level-order");
  });
  it("rejects invalid and over-limit input", () => {
    expect(invertBinaryTreeModule.validate({ tree: "[1,2.5]" })).toMatchObject({ ok: false });
    expect(
      invertBinaryTreeModule.validate({ tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]" }),
    ).toMatchObject({ ok: false });
  });
});
