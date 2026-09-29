import { describe, expect, it } from "vitest";
import {
  candidateTrail,
  candidatesLeft,
  fullCandidateTrail,
  isShrinkingTrail,
  rangeSummary,
} from "./candidates";
import { getModule } from "@/engine/registry";
import type { ArrayFrame, Frame, Step } from "@/engine/types";

function arrayFrame(states: Record<number, ArrayFrame["states"][number]>): ArrayFrame {
  return {
    kind: "array",
    values: Object.keys(states).map((k) => Number(k)),
    states,
    pointers: [],
    ranges: [],
  };
}

function stepsOf(frames: Frame[]): Step[] {
  return frames.map((frame, i) => ({
    i,
    frame,
    codeLine: 1,
    narration: "",
    phase: "test",
    counters: {},
  }));
}

/** Runs a module preset the way the player does, so trails come from real data. */
function runPreset(slug: string, presetIndex: number): Step[] {
  const mod = getModule(slug);
  if (!mod) throw new Error(`no module for ${slug}`);
  const preset = mod.presets[presetIndex];
  if (!preset) throw new Error(`no preset ${presetIndex} for ${slug}`);
  const parsed = mod.validate(preset.values);
  if (!parsed.ok) throw new Error(parsed.error);
  return mod.run(parsed.parsed).steps;
}

describe("candidatesLeft", () => {
  it("counts every cell that has not been ruled out", () => {
    expect(candidatesLeft(arrayFrame({ 0: "idle", 1: "compare", 2: "excluded" }))).toBe(2);
  });

  it("treats a missing state as still in play", () => {
    const frame: ArrayFrame = {
      kind: "array",
      values: [1, 2, 3],
      states: { 0: "excluded" },
      pointers: [],
      ranges: [],
    };
    expect(candidatesLeft(frame)).toBe(2);
  });

  it("distinguishes zero candidates from no answer", () => {
    expect(candidatesLeft(arrayFrame({ 0: "excluded", 1: "excluded" }))).toBe(0);
    expect(
      candidatesLeft({ kind: "graph", directed: false, weighted: false, nodes: [], edges: [] }),
    ).toBeNull();
  });
});

describe("candidateTrail", () => {
  it("collapses consecutive repeats", () => {
    const steps = stepsOf([
      arrayFrame({ 0: "idle", 1: "idle" }),
      arrayFrame({ 0: "idle", 1: "idle" }),
      arrayFrame({ 0: "idle", 1: "excluded" }),
    ]);
    expect(candidateTrail(steps, 2)).toEqual([2, 1]);
  });

  it("only reports the steps played so far", () => {
    const steps = stepsOf([
      arrayFrame({ 0: "idle", 1: "idle" }),
      arrayFrame({ 0: "idle", 1: "excluded" }),
    ]);
    expect(candidateTrail(steps, 0)).toEqual([2]);
  });

  it("clamps an index past the end instead of throwing", () => {
    const steps = stepsOf([arrayFrame({ 0: "idle" })]);
    expect(candidateTrail(steps, 99)).toEqual([1]);
  });

  it("is empty for frame kinds that have no candidates", () => {
    const steps = stepsOf([
      { kind: "graph", directed: false, weighted: false, nodes: [], edges: [] },
    ]);
    expect(candidateTrail(steps, 0)).toEqual([]);
  });
});

describe("isShrinkingTrail", () => {
  it("needs at least two entries to say anything", () => {
    expect(isShrinkingTrail([])).toBe(false);
    expect(isShrinkingTrail([10])).toBe(false);
  });

  it("accepts a monotonically decreasing run", () => {
    expect(isShrinkingTrail([16, 8, 4, 2, 1, 0])).toBe(true);
  });

  it("rejects a trail that grows back", () => {
    expect(isShrinkingTrail([8, 4, 8, 6, 8])).toBe(false);
  });
});

describe("rangeSummary", () => {
  it("appends the size to a plain label", () => {
    expect(rangeSummary({ label: "left half", from: 0, to: 3 })).toBe("left half: 4");
    expect(rangeSummary({ label: "current partition", from: 2, to: 2 })).toBe(
      "current partition: 1",
    );
  });

  it("leaves a label that already states its own numbers alone", () => {
    // Otherwise binary search reads "search window · 5 candidates: 5".
    expect(rangeSummary({ label: "search window · 5 candidates", from: 0, to: 4 })).toBe(
      "search window · 5 candidates",
    );
  });

  it("falls back to a generic word when there is no label", () => {
    expect(rangeSummary({ from: 1, to: 3 })).toBe("range: 3");
  });

  it("never reports a negative size for a crossed range", () => {
    expect(rangeSummary({ label: "window", from: 4, to: 2 })).toBe("window: 0");
  });
});

describe("against real engine runs", () => {
  it("produces the halving trail for binary search", () => {
    expect(fullCandidateTrail(runPreset("binary-search", 2))).toEqual([12, 6, 3, 1, 0]);
    expect(fullCandidateTrail(runPreset("binary-search", 0))).toEqual([10, 5, 2, 1]);
  });

  it("shows every binary-search preset as a shrinking search space", () => {
    for (const presetIndex of [0, 1, 2]) {
      expect(isShrinkingTrail(fullCandidateTrail(runPreset("binary-search", presetIndex)))).toBe(
        true,
      );
    }
  });

  it("refuses quicksort and sliding-window, whose excluded set grows back", () => {
    // Their `excluded` means "outside the current partition/window", not "ruled
    // out for good" — rendering it as a halving trail would be a lie.
    expect(isShrinkingTrail(fullCandidateTrail(runPreset("quicksort", 0)))).toBe(false);
    expect(isShrinkingTrail(fullCandidateTrail(runPreset("sliding-window", 1)))).toBe(false);
  });

  it("refuses the sorts, which never exclude anything", () => {
    expect(isShrinkingTrail(fullCandidateTrail(runPreset("bubble-sort", 0)))).toBe(false);
    expect(isShrinkingTrail(fullCandidateTrail(runPreset("merge-sort", 0)))).toBe(false);
  });
});
