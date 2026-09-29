import * as React from "react";
import * as fs from "node:fs";
import * as path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlaybackBand } from "@/components/workspace/PlaybackBand";
import { AlgorithmWorldPanel } from "@/components/workspace/AlgorithmWorldPanel";
import { AuxPanels } from "@/components/viz/AuxPanels";
import { FrameView } from "@/components/viz/FrameView";
import { resolveCodeLine } from "@/engine/builder";
import { listAllModules, resolveModule } from "@/engine/registry";
import type { AlgorithmRun, AuxPanel, Frame, Step } from "@/engine/types";
import { deriveReasoning } from "@/lib/reasoning";
import { buildTimelineNodes } from "@/lib/timeline";
import { deriveOperation, deriveVariables } from "@/lib/variables";
import { createPredictionStore, PredictionStoreProvider } from "@/stores/predictionStore";
import { createPlayerStore, PlayerStoreProvider } from "@/stores/playerStore";

function runPreset(moduleIndex: number, presetIndex: number): AlgorithmRun {
  const mod = listAllModules()[moduleIndex]!;
  const preset = mod.presets[presetIndex]!;
  const validation = mod.validate(preset.values);
  if (!validation.ok) throw new Error(`${mod.slug}/${preset.label}: ${validation.error}`);
  return mod.run(validation.parsed);
}

describe("universal learning data contract", () => {
  it("keeps every registered module deterministic for the same validated preset", () => {
    listAllModules().forEach((mod, moduleIndex) => {
      mod.presets.forEach((_, presetIndex) => {
        expect(runPreset(moduleIndex, presetIndex)).toEqual(runPreset(moduleIndex, presetIndex));
      });
    });
  });

  it("emits every required Step field across every registered preset", () => {
    listAllModules().forEach((mod, moduleIndex) => {
      mod.presets.forEach((preset, presetIndex) => {
        const run = runPreset(moduleIndex, presetIndex);
        run.steps.forEach((step, index) => {
          expect(step.i, `${mod.slug}/${preset.label} step index`).toBe(index);
          expect(["array", "tree", "heap", "linked-list", "graph", "grid", "table"]).toContain(
            step.frame.kind,
          );
          expect(Number.isInteger(step.codeLine)).toBe(true);
          expect(step.codeLine).toBeGreaterThanOrEqual(1);
          expect(step.codeLine).toBeLessThanOrEqual(run.pseudocode.length);
          expect(step.narration.trim().length).toBeGreaterThan(0);
          expect(step.phase.trim().length).toBeGreaterThan(0);
          expect(step.counters).toEqual(expect.any(Object));
        });
      });
    });
  });

  it("degrades safely when optional Step and array enhancement metadata is absent", () => {
    const step: Step = {
      i: 0,
      frame: { kind: "array", values: [2, 5, 8], states: {}, pointers: [], ranges: [] },
      codeLine: 1,
      narration: "Start with the available values.",
      phase: "setup",
      counters: {},
    };
    const run: AlgorithmRun = {
      slug: "legacy-fixture",
      steps: [step],
      pseudocode: ["inspect values"],
      codeByLang: { js: ["inspect(values)"], ts: ["inspect(values)"], py: ["inspect(values)"] },
      inputSummary: "[2, 5, 8]",
      result: "Ready",
      totalCounters: {},
    };

    expect(deriveVariables(step)).toEqual([]);
    expect(deriveOperation(step)).toBeNull();
    expect(deriveReasoning(step, null, 1)?.happened).toBe(step.narration);
    expect(buildTimelineNodes(run.steps)).toEqual([
      { label: "setup", from: 0, to: 0, milestone: false },
    ]);
    expect(resolveCodeLine(run, "js", step.codeLine)).toBe(1);
  });
});

describe("presentation family contract", () => {
  const frames: Frame[] = [
    { kind: "array", values: [1], states: {}, pointers: [], ranges: [] },
    { kind: "tree", nodes: [{ id: "root", label: 1, x: 50, y: 20, state: "idle" }], edges: [] },
    {
      kind: "heap",
      heapType: "max",
      heapSize: 1,
      slots: [{ index: 0, value: 1, x: 50, y: 20, state: "idle" }],
    },
    {
      kind: "linked-list",
      nodeSlots: 1,
      nodes: [{ id: "node-1", label: 1, x: 50, y: 32, state: "idle" }],
      links: [{ id: "next-1", from: "node-1", to: null, state: "idle" }],
      pointers: [{ name: "head", nodeId: "node-1" }],
    },
    {
      kind: "graph",
      directed: false,
      weighted: false,
      nodes: [{ id: "A", label: "A", x: 50, y: 50, state: "idle" }],
      edges: [],
    },
    { kind: "grid", rows: 1, cols: 1, cells: [{ r: 0, c: 0, state: "idle" }] },
    {
      kind: "table",
      rowLabels: [0],
      colLabels: [0],
      cells: [{ r: 0, c: 0, value: 1, state: "idle" }],
    },
  ];

  const aux: AuxPanel[] = [
    { kind: "stack", label: "Stack", items: [{ id: "1", label: "A" }] },
    { kind: "queue", label: "Queue", items: [{ id: "1", label: "A" }] },
    {
      kind: "callstack",
      label: "Recursive calls",
      frames: [
        {
          id: "call-1",
          call: "search",
          args: [{ name: "i", value: "0" }],
          state: "enter",
        },
      ],
    },
    { kind: "keyvalue", label: "State", rows: [{ k: "current", v: "A" }] },
    { kind: "log", label: "Log", lines: ["Visited A"] },
    {
      kind: "cost",
      label: "Cost",
      rows: [{ id: "1", item: "job 1", cost: "2" }],
      total: { label: "total", value: "2", budget: "3", ok: true },
    },
  ];

  it.each(frames)("renders the $kind frame through FrameView", (frame) => {
    expect(() => renderToStaticMarkup(<FrameView frame={frame} />)).not.toThrow();
  });

  it("renders every auxiliary family through AuxPanels", () => {
    const markup = renderToStaticMarkup(<AuxPanels aux={aux} />);
    for (const label of ["Stack", "Queue", "Recursive calls", "current", "Visited A", "Cost"]) {
      expect(markup).toContain(label);
    }
  });
});

describe("registered module proof through the extracted workspace", () => {
  const representatives = [
    { slug: "binary-search", frame: "array", aux: [] },
    { slug: "heap-sort", frame: "heap", aux: [] },
    { slug: "bfs", frame: "graph", aux: ["queue", "log"] },
    { slug: "quicksort", frame: "array", aux: ["callstack"] },
    { slug: "merge-sort", frame: "array", aux: ["log"] },
    { slug: "koko-eating-bananas", frame: "array", aux: ["cost"] },
    { slug: "climbing-stairs", frame: "table", aux: [] },
    { slug: "unique-paths", frame: "table", aux: [] },
  ] as const;

  function renderRepresentative(slug: string, requiredAux: readonly string[]): string {
    const mod = resolveModule(slug)!;
    const player = createPlayerStore();
    player.getState().load(slug);
    const run = player.getState().run!;
    const index = requiredAux.length
      ? run.steps.findIndex((step) =>
          requiredAux.every((kind) => step.aux?.some((panel) => panel.kind === kind)),
        )
      : 0;
    expect(index, `${slug} representative step`).toBeGreaterThanOrEqual(0);
    player.getState().seek(index);
    const loaded = player.getState();
    player.getInitialState = () => loaded;

    const prediction = createPredictionStore();
    return renderToStaticMarkup(
      <PlayerStoreProvider store={player}>
        <PredictionStoreProvider store={prediction}>
          <AlgorithmWorldPanel module={mod} algoName={slug} />
          <PlaybackBand />
        </PredictionStoreProvider>
      </PlayerStoreProvider>,
    );
  }

  it.each(representatives)(
    "renders $slug ($frame) plus its demonstrated auxiliary families",
    ({ slug, frame, aux }) => {
      const mod = resolveModule(slug)!;
      const validation = mod.validate(mod.presets[0]!.values);
      if (!validation.ok) throw new Error(validation.error);
      const run = mod.run(validation.parsed);
      const kinds = new Set(run.steps.map((step) => step.frame.kind));
      const auxKinds = new Set(
        run.steps.flatMap((step) => (step.aux ?? []).map((panel) => panel.kind)),
      );

      expect(kinds).toContain(frame);
      for (const kind of aux) expect(auxKinds).toContain(kind);

      const markup = renderRepresentative(slug, aux);
      expect(markup).toContain('aria-label="Algorithm world"');
      expect(markup).toContain('aria-label="Playback"');
      expect(markup).toContain('aria-label="Previous step');
      expect(markup).toContain('aria-label="Next step');
      expect(markup).toContain("Step timeline");
    },
  );

  it("keeps grid fixture-only while table and tree have truthful registered consumers", () => {
    const registeredKinds = new Set(
      listAllModules().flatMap((mod) => {
        const validation = mod.validate(mod.presets[0]!.values);
        if (!validation.ok) throw new Error(validation.error);
        return mod.run(validation.parsed).steps.map((step) => step.frame.kind);
      }),
    );

    expect([...registeredKinds].sort()).toEqual(["array", "graph", "heap", "table", "tree"]);
    expect(registeredKinds.has("grid")).toBe(false);
    expect(registeredKinds.has("table")).toBe(true);
    expect(registeredKinds.has("tree")).toBe(true);
  });

  it("keeps shared workspace, playback, and learning React free of Binary Search branching", () => {
    const sharedFiles = [
      "src/components/workspace/GoldenWorkspace.tsx",
      "src/components/workspace/AlgorithmWorldPanel.tsx",
      "src/components/workspace/PlaybackBand.tsx",
      "src/components/player/ControlStrip.tsx",
      "src/components/player/StepTimeline.tsx",
      "src/components/learning/ChoiceGroup.tsx",
      "src/components/learning/LearningFeedback.tsx",
    ];

    for (const file of sharedFiles) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
      expect(source.toLowerCase(), file).not.toContain("binary-search");
    }
  });
});
