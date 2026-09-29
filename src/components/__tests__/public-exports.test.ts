import { describe, expect, it } from "vitest";
import * as learning from "@/components/learning";
import * as player from "@/components/player";
import * as prediction from "@/components/prediction";
import * as trace from "@/components/trace";
import * as viz from "@/components/viz";
import * as workspace from "@/components/workspace";

describe("universal learning public component boundaries", () => {
  it("exposes each proven package through one public barrel", () => {
    expect(workspace.GoldenWorkspace).toBeTypeOf("function");
    expect(workspace.AlgorithmWorldPanel).toBeTypeOf("function");
    expect(player.CodePane).toBeTypeOf("function");
    expect(player.ControlStrip).toBeTypeOf("function");
    expect(viz.FrameView).toBeTypeOf("function");
    expect(viz.VariableBoard).toBeTypeOf("function");
    expect(prediction.PredictionGate).toBeTypeOf("function");
    expect(trace.TraceWorkspace).toBeTypeOf("function");
    expect(learning.ChoiceGroup).toBeTypeOf("function");
    expect(learning.LearningFeedback).toBeTypeOf("object");
  });
});
