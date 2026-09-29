import * as React from "react";
import * as fs from "node:fs";
import * as path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TraceMove } from "@/components/trace/TraceMove";
import { getTraceExercise } from "@/content/trace-exercises";
import { getModule } from "@/engine/registry";
import { buildTraceSession } from "@/lib/trace";
import {
  createTraceStore,
  EMPTY_TRACE_ENTRY,
  TraceStoreProvider,
  type TraceEntry,
} from "@/stores/traceStore";

const exercise = getTraceExercise("binary-search")!;
const mod = getModule(exercise.algorithmSlug)!;
const parsed = mod.validate(exercise.inputs);
if (!parsed.ok) throw new Error(parsed.error);
const checkpoint = buildTraceSession(mod.run(parsed.parsed)).checkpoints[0]!;

function renderMove(entry: TraceEntry, position = 1, total = 2): string {
  const store = createTraceStore();
  return renderToStaticMarkup(
    <TraceStoreProvider store={store}>
      <TraceMove checkpoint={checkpoint} entry={entry} position={position} total={total} />
    </TraceStoreProvider>,
  );
}

describe("TraceMove shared interaction contract", () => {
  it("uses the shared accessible choice group while unanswered", () => {
    const markup = renderMove(EMPTY_TRACE_ENTRY);
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain(`name="trace-${checkpoint.id}"`);
    expect(markup).toContain("Check answer");
  });

  it("keeps incorrect feedback visible with explicit retry and reveal actions", () => {
    const wrong = checkpoint.question.options.find(
      (option) => option.id !== checkpoint.question.correctOptionId,
    )!;
    const markup = renderMove({
      status: "incorrect",
      selectedOptionId: wrong.id,
      attempts: 1,
      hintLevel: 0,
      continued: false,
    });

    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain("Not quite.");
    expect(markup).toContain("Try again");
    expect(markup).toContain("Show answer");
  });

  it("requires an explicit next action after correct feedback", () => {
    const markup = renderMove({
      status: "correct",
      selectedOptionId: checkpoint.question.correctOptionId,
      attempts: 1,
      hintLevel: 0,
      outcome: "correct-first-try",
      continued: false,
    });

    expect(markup).toContain(checkpoint.question.explanation);
    expect(markup).toContain("Next step");
    expect(markup).not.toContain('role="radiogroup"');
  });

  it("uses an explicit completion action on the final checkpoint", () => {
    const markup = renderMove(
      {
        status: "revealed",
        selectedOptionId: checkpoint.question.correctOptionId,
        attempts: 1,
        hintLevel: 3,
        outcome: "revealed",
        continued: false,
      },
      2,
      2,
    );

    expect(markup).toContain("Answer revealed");
    expect(markup).toContain("Complete trace");
  });

  it("keeps Trace state and session derivation independent from player state", () => {
    const traceStore = fs.readFileSync(
      path.resolve(process.cwd(), "src/stores/traceStore.ts"),
      "utf-8",
    );
    const traceSession = fs.readFileSync(
      path.resolve(process.cwd(), "src/hooks/useTraceSession.ts"),
      "utf-8",
    );

    expect(traceStore).not.toContain('from "@/stores/playerStore"');
    expect(traceSession).not.toContain('from "@/stores/playerStore"');
  });
});
