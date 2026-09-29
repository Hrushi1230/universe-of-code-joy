import * as fs from "node:fs";
import * as path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoldenWorkspace } from "@/components/workspace/GoldenWorkspace";
import { getAlgorithm } from "@/content/algorithms";
import { getModule } from "@/engine/registry";
import { createPlayerStore, PlayerStoreProvider } from "@/stores/playerStore";

const componentSource = (name: string): string =>
  fs.readFileSync(path.resolve(process.cwd(), `src/components/${name}.tsx`), "utf-8");

function renderLoadedWorkspace(): string {
  const store = createPlayerStore();
  store.getState().load("binary-search");
  const loaded = store.getState();
  store.getInitialState = () => loaded;

  return renderToStaticMarkup(
    <PlayerStoreProvider store={store}>
      <GoldenWorkspace
        algo={getAlgorithm("binary-search")!}
        module={getModule("binary-search")!}
        slug="binary-search"
      />
    </PlayerStoreProvider>,
  );
}

describe("reusable learning-workspace contract", () => {
  it("composes the three semantic workspace regions from one canonical run", () => {
    const markup = renderLoadedWorkspace();

    expect(markup).toContain('aria-label="Algorithm world"');
    expect(markup).toContain('aria-label="Code and settings"');
    expect(markup).toContain("Reasoning");
    expect(markup).toContain('aria-label="Playback"');
  });

  it("keeps the desktop boxes and full-width playback row geometrically fixed", () => {
    const workspace = componentSource("workspace/GoldenWorkspace");
    const playback = componentSource("workspace/PlaybackBand");
    const world = componentSource("workspace/AlgorithmWorldPanel");
    const explain = componentSource("player/ExplainPane");

    expect(workspace).toContain("lg:grid-rows-[minmax(0,1fr)_58px]");
    expect(workspace).toContain("lg:grid-cols-[58fr_42fr]");
    expect(workspace).toContain("lg:h-full lg:min-h-0");
    expect(playback).toContain("lg:h-[58px] lg:min-h-[58px]");
    expect(world).toContain("overflow-hidden");
    expect(world).not.toContain("overflow-y-auto");
    expect(explain).toContain("min-h-0 flex-1 space-y-2.5 overflow-hidden");
  });

  it("keeps mobile transport immediately accessible before its wrapping timeline", () => {
    const workspace = componentSource("workspace/GoldenWorkspace");
    const controls = componentSource("player/ControlStrip");

    expect(workspace).toContain('className="order-1 min-h-[430px]');
    expect(workspace).toContain('"order-3 min-w-0 lg:order-none');
    expect(workspace).toContain('className="order-2 lg:order-none"');

    const previous = controls.indexOf('aria-label="Previous step');
    const play = controls.indexOf('aria-label={`${isPlaying ? "Pause"');
    const next = controls.indexOf('aria-label={isBlocking ? "Answer the prediction');
    const restart = controls.indexOf('aria-label="Restart from the first step');
    const timeline = controls.indexOf('className="order-3 flex min-w-0 basis-full');

    expect(previous).toBeGreaterThan(-1);
    expect(previous).toBeLessThan(play);
    expect(play).toBeLessThan(next);
    expect(next).toBeLessThan(restart);
    expect(restart).toBeLessThan(timeline);
    expect(controls).toContain('className="hidden items-center gap-2 sm:flex"');
  });

  it("uses a fixed timeline window without any scrolling", () => {
    const timeline = componentSource("player/StepTimeline");

    expect(timeline).toContain("TIMELINE_VISIBLE_PHASES = 5");
    expect(timeline).toContain("overflow-hidden");
    expect(timeline).not.toContain("scrollLeft");
    expect(timeline).not.toContain("scrollIntoView(");
  });

  it("contains no scrollable visualizer panel or programmatic scroll movement", () => {
    const sources = [
      componentSource("workspace/AlgorithmWorldPanel"),
      componentSource("workspace/GoldenWorkspace"),
      componentSource("player/CodePane"),
      componentSource("player/ExplainPane"),
      componentSource("player/StepTimeline"),
      componentSource("viz/ArrayCanvas"),
      componentSource("viz/TableView"),
      componentSource("viz/TreeView"),
      componentSource("viz/GraphView"),
      componentSource("viz/HeapView"),
      componentSource("viz/LinkedListView"),
    ];

    for (const source of sources) {
      expect(source).not.toMatch(/overflow-(?:auto|scroll|x-auto|y-auto)/);
      expect(source).not.toMatch(/scroll(?:To|Top|Left|IntoView)/);
    }
  });
});
