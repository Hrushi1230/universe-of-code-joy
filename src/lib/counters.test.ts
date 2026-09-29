import { describe, expect, it } from "vitest";
import { paddedCounters } from "@/lib/counters";
import { getModule, listAllModules } from "@/engine/registry";
import type { Step } from "@/engine/types";

const step = (counters: Record<string, number>): Pick<Step, "counters"> => ({ counters });

describe("paddedCounters", () => {
  it("returns nothing when there is no run", () => {
    expect(paddedCounters(null, step({ comparisons: 3 }))).toEqual({});
  });

  it("fills counters the step has not reached yet with 0", () => {
    const run = { totalCounters: { "linear worst": 10, comparisons: 5 } };
    expect(paddedCounters(run, step({ "linear worst": 10 }))).toEqual({
      "linear worst": 10,
      comparisons: 0,
    });
  });

  it("keeps live values untouched", () => {
    const run = { totalCounters: { a: 9, b: 9 } };
    expect(paddedCounters(run, step({ a: 4, b: 7 }))).toEqual({ a: 4, b: 7 });
  });

  it("preserves the run's key order, so columns never reshuffle", () => {
    const run = { totalCounters: { first: 1, second: 2, third: 3 } };
    expect(Object.keys(paddedCounters(run, step({ third: 1 })))).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("still shows a counter that is missing from totalCounters", () => {
    const run = { totalCounters: { a: 1 } };
    expect(paddedCounters(run, step({ a: 1, stray: 6 }))).toEqual({ a: 1, stray: 6 });
  });

  it("pads to the full column set when the step is null", () => {
    const run = { totalCounters: { a: 3, b: 4 } };
    expect(paddedCounters(run, null)).toEqual({ a: 0, b: 0 });
  });
});

describe("paddedCounters over the real engine", () => {
  it("gives every step of every preset the same counter columns", () => {
    for (const mod of listAllModules()) {
      for (const preset of mod.presets) {
        const parsed = mod.validate(preset.values);
        if (!parsed.ok) continue;
        const run = mod.run(parsed.parsed);
        const expected = Object.keys(run.totalCounters).join("|");
        for (const s of run.steps) {
          expect(Object.keys(paddedCounters(run, s)).join("|"), `${mod.slug}/${preset.label}`).toBe(
            expected,
          );
        }
      }
    }
  });

  it("carries binary search's linear-worst benchmark on the very first step", () => {
    const mod = getModule("binary-search")!;
    const parsed = mod.validate(mod.presets[2]!.values);
    if (!parsed.ok) throw new Error(parsed.error);
    const run = mod.run(parsed.parsed);

    expect(paddedCounters(run, run.steps[0]!)).toEqual({ "linear worst": 12, comparisons: 0 });
    // 12 values ruled out in 4 comparisons is the whole argument for the algorithm.
    expect(run.totalCounters).toEqual({ "linear worst": 12, comparisons: 4 });
  });
});
