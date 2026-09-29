import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GraphView } from "@/components/viz/GraphView";
import { LinearStructureView } from "@/components/viz/LinearStructureView";
import {
  LINEAR_STRUCTURE_VISIBLE_LIMIT,
  linearStructureWindow,
  type LinearStructurePanel,
} from "@/lib/linearStructure";

function items(count: number): LinearStructurePanel["items"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    label: `V${index}`,
    state: index === count - 1 ? ("active" as const) : ("frontier" as const),
  }));
}

describe("LinearStructureView family contract", () => {
  it("renders an eight-entry stack from bottom to top with a visible active top", () => {
    const panel: LinearStructurePanel = { kind: "stack", label: "Call stack", items: items(8) };
    const markup = renderToStaticMarkup(<LinearStructureView panel={panel} />);

    expect(LINEAR_STRUCTURE_VISIBLE_LIMIT).toBe(8);
    expect(markup).toContain('data-kind="stack"');
    expect(markup).toContain('data-entry-count="8"');
    expect(markup).toContain('data-hidden-count="0"');
    expect(markup).toContain('data-motion="push-pop"');
    expect(markup).toContain("min-h-[96px]");
    expect(markup).toContain("bottom");
    expect(markup).toContain("top");
    expect(markup).toContain('data-state="active"');
  });

  it("keeps the eight entries nearest the stack top and summarizes lower entries", () => {
    const panel: LinearStructurePanel = { kind: "stack", label: "Stack", items: items(11) };
    const window = linearStructureWindow(panel);
    const markup = renderToStaticMarkup(<LinearStructureView panel={panel} />);

    expect(window.hiddenCount).toBe(3);
    expect(window.entries.filter((entry) => entry.kind === "item")).toHaveLength(8);
    expect(markup).toContain("+3 below");
    expect(markup).not.toContain(">V0<");
    expect(markup).toContain(">V10<");
  });

  it("keeps both queue endpoints visible and summarizes only middle entries", () => {
    const panel: LinearStructurePanel = { kind: "queue", label: "Ready queue", items: items(11) };
    const window = linearStructureWindow(panel);
    const markup = renderToStaticMarkup(<LinearStructureView panel={panel} />);

    expect(
      window.entries.map((entry) => (entry.kind === "item" ? entry.sourceIndex : "more")),
    ).toEqual([0, 1, 2, 3, "more", 7, 8, 9, 10]);
    expect(markup).toContain('data-motion="enqueue-dequeue"');
    expect(markup).toContain("+3 between");
    expect(markup).toContain("head");
    expect(markup).toContain("tail");
    expect(markup).not.toContain(">V5<");
  });

  it("labels a single queue entry as both head and tail", () => {
    const panel: LinearStructurePanel = {
      kind: "queue",
      label: "Queue",
      items: [{ id: "only", label: "A", state: "active" }],
    };
    const markup = renderToStaticMarkup(<LinearStructureView panel={panel} />);

    expect(markup).toContain("head · tail");
    expect(markup).toContain("Head is A; tail is A");
  });

  it("announces an empty structure without inventing an endpoint", () => {
    const panel: LinearStructurePanel = { kind: "stack", label: "Stack", items: [] };
    const markup = renderToStaticMarkup(<LinearStructureView panel={panel} />);

    expect(markup).toContain('data-entry-count="0"');
    expect(markup).toContain("Top is empty");
    expect(markup).toContain(">empty<");
  });

  it("caps a companion graph so the structure remains visible in the fixed world", () => {
    const markup = renderToStaticMarkup(
      <GraphView
        frame={{
          kind: "graph",
          directed: false,
          weighted: false,
          nodes: [{ id: "A", label: "A", x: 50, y: 50, state: "active" }],
          edges: [],
        }}
      />,
    );

    expect(markup).toContain("max-h-[420px]");
  });
});
