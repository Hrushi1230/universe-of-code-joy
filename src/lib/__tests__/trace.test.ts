import { describe, expect, it } from "vitest";
import { getModule } from "@/engine/registry";
import { getTraceExercise, traceExercises } from "@/content/trace-exercises";
import { buildTraceSession, traceFrame, viewAt, type TraceSession } from "@/lib/trace";
import { createTraceStore, isTraceResolved, resolvedCount, traceRunKey } from "@/stores/traceStore";

function sessionFor(inputs: Record<string, string>): TraceSession {
  const mod = getModule("binary-search");
  expect(mod).toBeDefined();
  const validation = mod!.validate(inputs);
  expect(validation.ok).toBe(true);
  if (!validation.ok) throw new Error(validation.error);
  return buildTraceSession(mod!.run(validation.parsed));
}

const exercise = getTraceExercise("binary-search")!;

describe("trace exercise content", () => {
  it("uses a different input from the guided preset", () => {
    const mod = getModule("binary-search")!;
    const preset = mod.presets[0]!.values;
    expect(exercise.inputs).not.toEqual(preset);
    expect(exercise.inputs["values"]).not.toBe(preset["values"]);
  });

  it("has one exercise per algorithm/question slice", () => {
    const keys = traceExercises.map(
      (exercise) => `${exercise.algorithmSlug}:${exercise.problemSlug ?? "*"}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("buildTraceSession", () => {
  const session = sessionFor(exercise.inputs);

  it("derives three questions per probe plus a result", () => {
    const kinds = session.checkpoints.map((c) => c.kind);
    expect(kinds[kinds.length - 1]).toBe("result");
    const body = kinds.slice(0, -1);
    expect(body.length % 3).toBe(0);
    for (let i = 0; i < body.length; i += 3) {
      expect(body.slice(i, i + 3)).toEqual(["choose-mid", "compare", "action"]);
    }
  });

  it("expects midpoints the engine itself computed", () => {
    const mids = session.checkpoints
      .filter((c) => c.kind === "choose-mid")
      .map((c) => c.question.correctOptionId);
    /* [4,9,15,21,34,47,58,63,79] target 58: mid 4, then 6. */
    expect(mids).toEqual(["index-4", "index-6"]);
  });

  it("expects comparisons and boundary moves that follow the values", () => {
    const compare = session.checkpoints.filter((c) => c.kind === "compare");
    expect(compare.map((c) => c.question.correctOptionId)).toEqual(["lt", "eq"]);
    const actions = session.checkpoints.filter((c) => c.kind === "action");
    expect(actions.map((c) => c.question.correctOptionId)).toEqual(["move-low", "return-mid"]);
  });

  it("reports the found index and the halving path", () => {
    expect(session.summary.found).toBe(true);
    expect(session.summary.foundIndex).toBe(6);
    expect(session.summary.candidateCounts).toEqual([9, 4]);
  });

  it("handles a missing target with a not-found result", () => {
    const missing = sessionFor({ values: "4, 9, 15, 21, 34", target: "10" });
    const last = missing.checkpoints[missing.checkpoints.length - 1]!;
    expect(last.kind).toBe("result");
    expect(last.question.correctOptionId).toBe("absent");
    expect(missing.summary.found).toBe(false);
    expect(missing.finalView.exhausted).toBe(true);
  });

  it("keeps every option list non-empty with a correct answer inside it", () => {
    for (const c of session.checkpoints) {
      expect(c.question.options.length).toBeGreaterThan(1);
      expect(c.question.options.some((o) => o.id === c.question.correctOptionId)).toBe(true);
      expect(c.question.hints.length).toBe(3);
    }
  });
});

describe("answer leakage", () => {
  const session = sessionFor(exercise.inputs);

  it("never shows a mid on a choose-mid view", () => {
    for (const c of session.checkpoints.filter((x) => x.kind === "choose-mid")) {
      expect(c.view.mid).toBeNull();
      expect(c.view.comparison).toBeNull();
    }
  });

  it("never shows a comparison on a compare view", () => {
    for (const c of session.checkpoints.filter((x) => x.kind === "compare")) {
      expect(c.view.mid).not.toBeNull();
      expect(c.view.comparison).toBeNull();
    }
  });

  it("keeps boundaries unchanged until the boundary question is answered", () => {
    const compare = session.checkpoints.find((c) => c.kind === "compare")!;
    const action = session.checkpoints.find((c) => c.kind === "action")!;
    expect(action.view.low).toBe(compare.view.low);
    expect(action.view.high).toBe(compare.view.high);
    /* The next view is where the move becomes visible. */
    expect(viewAt(session, 3).low).toBe(5);
  });

  it("keeps hints free of the literal answer for the first two levels", () => {
    const mid = session.checkpoints[0]!.question;
    expect(mid.hints[0]).not.toContain("= 4");
    expect(mid.answerReveal).toContain("4");
  });

  it("does not preview the surviving side in the trace frame", () => {
    const frame = traceFrame(session, session.checkpoints[1]!.view);
    expect(Object.values(frame.states)).not.toContain("frontier");
    expect(frame.decision).toBeUndefined();
  });
});

describe("traceFrame", () => {
  const session = sessionFor(exercise.inputs);

  it("marks out-of-range cells excluded and the chosen mid compared", () => {
    const frame = traceFrame(session, { ...viewAt(session, 3), mid: 6, comparison: null });
    expect(frame.states[0]).toBe("excluded");
    expect(frame.states[6]).toBe("compare");
    expect(frame.pointers.map((p) => p.name)).toEqual(["lo", "hi", "mid"]);
  });

  it("marks the found cell on the final view", () => {
    const frame = traceFrame(session, session.finalView);
    expect(frame.states[6]).toBe("found");
  });
});

describe("trace store", () => {
  it("resolves only on a correct or revealed answer", () => {
    const store = createTraceStore();
    store.getState().syncRun("k");
    store.getState().select("q1", "index-3");
    store.getState().check("q1", "index-4");
    expect(store.getState().entries["q1"]!.status).toBe("incorrect");
    expect(isTraceResolved(store.getState().entries["q1"])).toBe(false);

    store.getState().retry("q1");
    store.getState().select("q1", "index-4");
    store.getState().check("q1", "index-4");
    expect(store.getState().entries["q1"]!.status).toBe("correct");
    expect(store.getState().entries["q1"]!.outcome).toBe("correct-after-retry");
    expect(store.getState().entries["q1"]!.attempts).toBe(2);
    expect(resolvedCount(["q1"], store.getState().entries)).toBe(0);
    store.getState().continueFrom("q1");
    expect(resolvedCount(["q1"], store.getState().entries)).toBe(1);
  });

  it("records a first-try win and ignores checks after resolution", () => {
    const store = createTraceStore();
    store.getState().select("q", "a");
    store.getState().check("q", "a");
    store.getState().select("q", "b");
    store.getState().check("q", "b");
    expect(store.getState().entries["q"]!.outcome).toBe("correct-first-try");
    expect(store.getState().entries["q"]!.attempts).toBe(1);
  });

  it("caps hints at three and reveals the answer", () => {
    const store = createTraceStore();
    for (let i = 0; i < 5; i += 1) store.getState().nextHint("q");
    expect(store.getState().entries["q"]!.hintLevel).toBe(3);
    store.getState().reveal("q", "correct");
    expect(store.getState().entries["q"]!.status).toBe("revealed");
    expect(store.getState().entries["q"]!.selectedOptionId).toBe("correct");
  });

  it("restart clears answers and a new run resets state", () => {
    const store = createTraceStore();
    store.getState().syncRun("a");
    store.getState().select("q", "x");
    store.getState().restart();
    expect(store.getState().entries).toEqual({});
    store.getState().select("q", "x");
    store.getState().syncRun("b");
    expect(store.getState().entries).toEqual({});
  });

  it("counts resolved checkpoints from the front only", () => {
    const store = createTraceStore();
    const ids = ["a", "b", "c"];
    store.getState().select("a", "1");
    store.getState().check("a", "1");
    store.getState().continueFrom("a");
    store.getState().select("c", "1");
    store.getState().check("c", "1");
    store.getState().continueFrom("c");
    expect(resolvedCount(ids, store.getState().entries)).toBe(1);
  });

  it("does not continue an unresolved checkpoint", () => {
    const store = createTraceStore();
    store.getState().continueFrom("q");
    expect(store.getState().entries["q"]).toBeUndefined();
  });

  it("keys runs by slug and inputs, order independent", () => {
    expect(traceRunKey("s", { b: "2", a: "1" })).toBe(traceRunKey("s", { a: "1", b: "2" }));
    expect(traceRunKey("s", { a: "1" })).not.toBe(traceRunKey("s", { a: "2" }));
    expect(traceRunKey(null, {})).toBeNull();
  });
});
