import { describe, it, expect } from "vitest";
import { binarySearchModule } from "@/engine/algorithms/binarySearch";
import { quicksortModule } from "@/engine/algorithms/quicksort";
import { resolveCodeLine } from "@/engine/builder";
import { deriveReasoning, type Reasoning } from "@/lib/reasoning";
import { deriveOperation } from "@/lib/variables";
import type { AlgorithmRun, ArrayFrame, Step } from "@/engine/types";

function runSearch(values: string, target: string): AlgorithmRun {
  const validated = binarySearchModule.validate({ values, target });
  if (!validated.ok) throw new Error(validated.error);
  return binarySearchModule.run(validated.parsed);
}

function reasoningAt(run: AlgorithmRun, index: number): Reasoning {
  const r = deriveReasoning(run.steps[index], index > 0 ? run.steps[index - 1] : null, index + 1);
  if (!r) throw new Error(`no reasoning at step ${index}`);
  return r;
}

function all(run: AlgorithmRun): Reasoning[] {
  return run.steps.map((_, i) => reasoningAt(run, i));
}

function frameOf(step: Step): ArrayFrame {
  if (step.frame.kind !== "array") throw new Error("expected an array frame");
  return step.frame;
}

function pointer(step: Step, name: string): number | null {
  const p = frameOf(step).pointers.find((q) => q.name === name);
  return p ? p.index : null;
}

/** First step index whose phase matches, optionally with a predicate. */
function indexOf(run: AlgorithmRun, phase: string, extra?: (s: Step) => boolean): number {
  const i = run.steps.findIndex((s) => s.phase === phase && (extra ? extra(s) : true));
  if (i === -1) throw new Error(`no ${phase} step`);
  return i;
}

const FOUND = runSearch("2, 5, 8, 12, 16, 23, 38, 56, 72, 91", "23");
const MISSING = runSearch("1, 2, 3, 4, 5, 6, 7, 8", "9");

describe("deriveReasoning — setup", () => {
  const r = reasoningAt(FOUND, 0);

  it("names the whole array as the search range", () => {
    expect(FOUND.steps[0]!.phase).toBe("setup");
    expect(r.happened).toContain("10 values");
  });

  it("states the invariant over the full range", () => {
    expect(r.invariant).toBe("If 23 exists, its index is between 0 and 9.");
    expect(r.invariantLabel).toBe("Invariant");
  });

  it("previews the midpoint calculation", () => {
    expect(r.next).toMatch(/midpoint/i);
  });
});

describe("deriveReasoning — midpoint", () => {
  const i = indexOf(FOUND, "probe");
  const r = reasoningAt(FOUND, i);

  it("interpolates the mid index and value from the frame", () => {
    const mid = pointer(FOUND.steps[i]!, "mid")!;
    const value = frameOf(FOUND.steps[i]!).values[mid];
    expect(r.happened).toBe(`Calculated the midpoint at index ${mid}.`);
    expect(r.next).toBe(`Compare arr[${mid}] = ${String(value)} with the target 23.`);
  });

  it("keeps the live range invariant", () => {
    expect(r.invariant).toBe("If 23 exists, its index is between 0 and 9.");
  });
});

describe("deriveReasoning — comparisons", () => {
  it("explains left elimination when mid is smaller", () => {
    const i = indexOf(FOUND, "compare", (s) => frameOf(s).comparison?.op === "<");
    const mid = pointer(FOUND.steps[i]!, "mid")!;
    const r = reasoningAt(FOUND, i);
    expect(r.happened).toMatch(/is smaller than the target 23/);
    expect(r.why).toContain(`at or left of index ${mid}`);
    expect(r.why).toContain("too small");
    expect(r.invariant).toBe(`Any occurrence of 23 must be to the right of index ${mid}.`);
    expect(r.next).toMatch(/^Discard indices \d+ through \d+\.$/);
  });

  it("explains right elimination when mid is larger", () => {
    const run = runSearch("1, 2, 3, 4, 5, 6, 7, 8", "9");
    const low = runSearch("10, 20, 30, 40, 50, 60", "9");
    expect(run.steps.length).toBeGreaterThan(0);
    const i = indexOf(low, "compare", (s) => frameOf(s).comparison?.op === ">");
    const mid = pointer(low.steps[i]!, "mid")!;
    const r = reasoningAt(low, i);
    expect(r.happened).toMatch(/is larger than the target 9/);
    expect(r.why).toContain(`at or right of index ${mid}`);
    expect(r.why).toContain("too large");
    expect(r.invariant).toBe(`Any occurrence of 9 must be to the left of index ${mid}.`);
  });

  it("names the misconception on the first elimination only", () => {
    const compares = FOUND.steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.phase === "compare" && frameOf(s).comparison?.op !== "=");
    for (const { s, i } of compares) {
      const full = pointer(s, "lo") === 0 && pointer(s, "hi") === frameOf(s).values.length - 1;
      const r = reasoningAt(FOUND, i);
      expect(r.why?.includes("We are not guessing")).toBe(full || s.isMilestone === true);
    }
    const first = indexOf(FOUND, "compare");
    expect(reasoningAt(FOUND, first).why).toContain("We are not guessing");
  });
});

describe("deriveReasoning — boundary movement", () => {
  it("uses the updated low, never the stale range", () => {
    const i = indexOf(FOUND, "narrow-right");
    const step = FOUND.steps[i]!;
    const from = pointer(FOUND.steps[i - 1]!, "lo")!;
    const to = pointer(step, "lo")!;
    const hi = pointer(step, "hi")!;
    const r = reasoningAt(FOUND, i);
    expect(to).toBeGreaterThan(from);
    expect(r.happened).toBe(`Moved low from index ${from} to index ${to}.`);
    expect(r.invariant).toBe(`If 23 exists, its index is between ${to} and ${hi}.`);
    expect(r.invariant).not.toContain(`between ${from} and`);
    expect(r.next).toMatch(/smaller search range/);
  });

  it("uses the updated high when high moves", () => {
    const run = runSearch("2, 5, 8, 12, 16, 23, 38, 56, 72, 91", "2");
    const i = indexOf(run, "narrow-left");
    const step = run.steps[i]!;
    const was = pointer(run.steps[i - 1]!, "hi")!;
    const now = pointer(step, "hi")!;
    const lo = pointer(step, "lo")!;
    const r = reasoningAt(run, i);
    expect(now).toBeLessThan(was);
    expect(r.happened).toBe(`Moved high from index ${was} to index ${now}.`);
    expect(r.invariant).toBe(`If 2 exists, its index is between ${lo} and ${now}.`);
  });
});

describe("deriveReasoning — terminal states", () => {
  it("reports the found index with no Next", () => {
    const i = indexOf(FOUND, "found");
    const r = reasoningAt(FOUND, i);
    expect(r.happened).toBe("Found the target 23 at index 5.");
    expect(r.invariantLabel).toBe("Result");
    expect(r.invariant).toBe("arr[5] = 23.");
    expect(r.next).toBeUndefined();
  });

  it("reports the empty range with no stale invariant and no Next", () => {
    const i = MISSING.steps.length - 1;
    const r = reasoningAt(MISSING, i);
    expect(r.happened).toBe("The search range became empty.");
    expect(r.invariantLabel).toBe("Result");
    expect(r.invariant).toBe("No candidate index remains, so 9 is not present in the array.");
    expect(r.invariant).not.toMatch(/between/);
    expect(r.next).toBeUndefined();
  });

  it("never shows a live-range invariant once low has passed high", () => {
    for (const [i, step] of MISSING.steps.entries()) {
      const lo = pointer(step, "lo");
      const hi = pointer(step, "hi");
      if (lo === null || hi === null || lo <= hi) continue;
      expect(reasoningAt(MISSING, i).invariant).not.toMatch(/index is between/);
    }
  });
});

describe("deriveReasoning — custom input", () => {
  const cases: Array<[string, string]> = [
    ["2, 5, 8, 12, 16, 23, 38, 56, 72, 91", "23"],
    ["1, 2, 3, 4, 5, 6, 7, 8", "9"],
    ["7", "7"],
    ["4, 9", "4"],
    ["10, 20, 30, 40, 50", "50"],
    ["10, 20, 30, 40, 50", "5"],
  ];

  it("interpolates only values from the run, never the reference example", () => {
    for (const [values, target] of cases) {
      const run = runSearch(values, target);
      for (const r of all(run)) {
        expect(r.happened.length).toBeGreaterThan(0);
        expect(r.accessibleSummary).toMatch(/^Step \d+\. /);
        const numbers = [r.happened, r.why ?? "", r.invariant ?? "", r.next ?? ""].join(" ");
        if (target !== "23") expect(numbers).not.toContain("target 23");
      }
    }
  });

  it("produces reasoning for a single-element array", () => {
    const run = runSearch("7", "7");
    const r = reasoningAt(run, 0);
    expect(r.invariant).toBe("If 7 exists, its index is between 0 and 0.");
    const found = reasoningAt(run, indexOf(run, "found"));
    expect(found.invariant).toBe("arr[0] = 7.");
  });
});

describe("deriveReasoning — non-search arrays", () => {
  it("keeps Quick Sort's own teaching copy instead of inventing binary-search reasoning", () => {
    const validated = quicksortModule.validate({ values: "1, 2, 3, 4" });
    if (!validated.ok) throw new Error(validated.error);
    const run = quicksortModule.run(validated.parsed);
    const step = run.steps[0]!;
    const reasoning = reasoningAt(run, 0);

    expect(reasoning.happened).toBe(step.narration);
    expect(reasoning.why).toBe(step.detail);
    expect(reasoning.happened).not.toMatch(/binary search|target|midpoint/i);
    expect(reasoning.accessibleSummary).toBe(`Step 1. ${step.narration}`);
  });
});

describe("deriveReasoning — non-array frames", () => {
  it("uses a table module's canonical narration and detail", () => {
    const step: Step = {
      i: 0,
      frame: {
        kind: "table",
        layout: "1d",
        rowLabels: ["dp"],
        colLabels: [0],
        cells: [{ r: 0, c: 0, value: 1, state: "active", role: "write" }],
      },
      codeLine: 1,
      narration: "Write the base case.",
      detail: "Later cells can now depend on it.",
      phase: "base",
      counters: {},
    };
    const reasoning = deriveReasoning(step, null, 1);
    expect(reasoning?.happened).toBe(step.narration);
    expect(reasoning?.why).toBe(step.detail);
    expect(reasoning?.accessibleSummary).toBe("Step 1. Write the base case.");
  });
});

describe("reasoning stays synchronized with the rest of the workspace", () => {
  it("is derived from the same canonical step as frame, pointers, operation and code", () => {
    for (const [index, step] of FOUND.steps.entries()) {
      const prev = index > 0 ? FOUND.steps[index - 1]! : null;
      const r = reasoningAt(FOUND, index);
      const frame = frameOf(step);
      const mid = pointer(step, "mid");
      const operation = deriveOperation(step, prev);

      /* No separate reasoning index: the summary counts the same step the code
         pane highlights and the operation panel describes. */
      expect(r.accessibleSummary.startsWith(`Step ${index + 1}.`)).toBe(true);
      expect(resolveCodeLine(FOUND, "py", step.codeLine)).toBe(step.codeLine);

      if (operation?.kind === "midpoint" && mid !== null) {
        expect(r.next).toContain(`arr[${mid}]`);
      }
      if (frame.comparison && frame.comparison.op !== "=") {
        expect(r.happened).toContain(frame.comparison.left);
        expect(r.happened).toContain(frame.comparison.right);
      }
    }
  });
});
