import { describe, expect, it } from "vitest";
import { bfsModule } from "@/engine/algorithms/bfs";
import { binarySearchModule } from "@/engine/algorithms/binarySearch";
import { bubbleSortModule } from "@/engine/algorithms/bubbleSort";
import type { AlgorithmModule, AlgorithmRun, ArrayFrame } from "@/engine/types";

function runOk(mod: AlgorithmModule, raw: Record<string, string>): AlgorithmRun {
  const validation = mod.validate(raw);
  if (!validation.ok) throw new Error(`validate failed: ${validation.error}`);
  return mod.run(validation.parsed);
}

const cases: Array<{ mod: AlgorithmModule; raw: Record<string, string> }> = [
  {
    mod: binarySearchModule,
    raw: { values: Array.from({ length: 12 }, (_, i) => i + 1).join(", "), target: "11" },
  },
  { mod: bubbleSortModule, raw: { values: "5, 1, 4, 2, 8" } },
  { mod: bfsModule, raw: { graph: "A-B,A-C,B-D,C-D", start: "A" } },
];

describe("binarySearch", () => {
  const run = runOk(cases[0]!.mod, cases[0]!.raw);

  it("finds the target 11", () => {
    expect(run.result).toMatch(/Found 11/);
  });

  it("keeps every codeLine within 1..pseudocode.length", () => {
    for (const step of run.steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(run.pseudocode.length);
    }
  });
});

describe("bubbleSort", () => {
  const run = runOk(cases[1]!.mod, cases[1]!.raw);
  const finalFrame = run.steps[run.steps.length - 1]!.frame as ArrayFrame;

  it("ends sorted ascending", () => {
    const values = finalFrame.values.map(Number);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
    }
  });

  it("counts at least one swap", () => {
    const swaps = run.steps[run.steps.length - 1]!.counters["swaps"] ?? 0;
    expect(swaps).toBeGreaterThan(0);
  });
});

describe("bfs", () => {
  const run = runOk(cases[2]!.mod, cases[2]!.raw);

  it("visits A, B, C, D in order", () => {
    const order = run.result.replace(/^[^:]*:\s*/, "").split(/\s*(?:→|->|,)\s*/);
    expect(order).toEqual(["A", "B", "C", "D"]);
  });
});

describe.each(cases)("shared contract: $mod.slug", ({ mod, raw }) => {
  const run = runOk(mod, raw);

  it("emits more than three steps", () => {
    expect(run.steps.length).toBeGreaterThan(3);
  });

  it("gives every step a non-empty narration", () => {
    for (const step of run.steps) {
      expect(step.narration.trim().length).toBeGreaterThan(0);
    }
  });

  it("never decreases a counter between consecutive steps", () => {
    for (let i = 1; i < run.steps.length; i += 1) {
      const prev = run.steps[i - 1]!.counters;
      const curr = run.steps[i]!.counters;
      for (const key of Object.keys(prev)) {
        expect(curr[key] ?? 0).toBeGreaterThanOrEqual(prev[key] ?? 0);
      }
    }
  });

  it("isolates frames between steps", () => {
    const before = JSON.stringify(run.steps[1]!.frame);
    const frame = run.steps[0]!.frame as unknown as Record<string, unknown>;
    (frame as { kind: string }).kind = "mutated" as never;
    if (Array.isArray(frame["values"])) (frame["values"] as unknown[])[0] = 99999;
    if (Array.isArray(frame["nodes"])) (frame["nodes"] as unknown[]).length = 0;
    expect(JSON.stringify(run.steps[1]!.frame)).toBe(before);
  });
});

describe("validate", () => {
  it("returns ok:false instead of throwing for invalid input", () => {
    const results = [
      binarySearchModule.validate({ values: "abc", target: "3" }),
      bubbleSortModule.validate({ values: "" }),
      bfsModule.validate({ graph: "A-B", start: "Z" }),
    ];
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(typeof r.error).toBe("string");
      if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    }
  });
});
