import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuxPanels } from "@/components/viz/AuxPanels";
import { GraphView } from "@/components/viz/GraphView";
import type { GraphFrame } from "@/engine/types";
import {
  GRAPH_VISIBLE_EDGE_LIMIT,
  GRAPH_VISIBLE_NODE_LIMIT,
  graphViewportGeometry,
} from "@/lib/graphViewport";

function nodes(count: number): GraphFrame["nodes"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `n${index}`,
    label: String(index),
    x: 10 + (index % 5) * 20,
    y: 18 + Math.floor(index / 5) * 54,
    state: "idle" as const,
  }));
}

function edges(count: number, nodeCount: number): GraphFrame["edges"] {
  const pairs: Array<[number, number]> = [];
  for (let from = 0; from < nodeCount; from += 1) {
    for (let to = from + 1; to < nodeCount; to += 1) pairs.push([from, to]);
  }
  return pairs.slice(0, count).map(([from, to]) => ({
    from: `n${from}`,
    to: `n${to}`,
    state: "idle" as const,
  }));
}

function render(frame: GraphFrame): string {
  return renderToStaticMarkup(<GraphView frame={frame} />);
}

describe("graph family contract", () => {
  it("shows traversal state with reusable queue and stack companions", () => {
    const frame: GraphFrame = {
      kind: "graph",
      directed: false,
      weighted: false,
      nodes: [
        { id: "A", label: "A", x: 20, y: 50, state: "visited" },
        { id: "B", label: "B", x: 50, y: 25, state: "active", parent: "A" },
        { id: "C", label: "C", x: 80, y: 50, state: "frontier", parent: "A" },
      ],
      edges: [
        { from: "A", to: "B", state: "tree", label: "discover" },
        { from: "A", to: "C", state: "active" },
      ],
    };
    const markup = renderToStaticMarkup(
      <>
        <GraphView frame={frame} />
        <AuxPanels
          aux={[
            { kind: "queue", label: "BFS queue", items: [{ id: "C", label: "C" }] },
            { kind: "stack", label: "DFS stack", items: [{ id: "B", label: "B" }] },
          ]}
        />
      </>,
    );

    expect(markup).toContain("visited: A");
    expect(markup).toContain("active: B");
    expect(markup).toContain("frontier: C");
    expect(markup).toContain("Parents: B A, C A");
    expect(markup).toContain("tree edge from A to B labeled discover");
    expect(markup).toContain("BFS queue");
    expect(markup).toContain("DFS stack");
    expect(markup).toContain("head · tail");
    expect(markup).toContain("bottom · top");
  });

  it("renders weighted relaxation with distance, parent, and edge arithmetic", () => {
    const markup = render({
      kind: "graph",
      directed: false,
      weighted: true,
      nodes: [
        { id: "A", label: "A", x: 25, y: 50, state: "visited", dist: 0, parent: null },
        { id: "B", label: "B", x: 75, y: 50, state: "frontier", dist: 5, parent: "A" },
      ],
      edges: [{ from: "A", to: "B", weight: 5, state: "active", label: "0 + 5 < ∞" }],
    });

    expect(markup).toContain("Distances: A 0, B 5");
    expect(markup).toContain("Parents: A none, B A");
    expect(markup).toContain("d=5");
    expect(markup).toContain("p=A");
    expect(markup).toContain("5 · 0 + 5 &lt; ∞");
    expect(markup).toContain("active edge from A to B with weight 5 labeled 0 + 5 &lt; ∞");
  });

  it("renders directed arrows and explicit indegrees for topological teaching", () => {
    const markup = render({
      kind: "graph",
      directed: true,
      weighted: false,
      nodes: [
        { id: "A", label: "A", x: 25, y: 50, state: "visited", indegree: 0 },
        { id: "B", label: "B", x: 75, y: 50, state: "frontier", indegree: 1 },
      ],
      edges: [{ from: "A", to: "B", state: "tree", label: "release" }],
    });

    expect(markup).toContain("Directed graph with 2 nodes and 1 edges");
    expect(markup).toContain("Indegrees: A 0, B 1");
    expect(markup).toContain("in=1");
    expect(markup).toContain('marker-end="url(#arrow-tree-');
    expect(markup).toContain("tree edge from A to B labeled release");
  });

  it("changes discover/reject/component semantics without moving engine-owned nodes", () => {
    const stableNodes: GraphFrame["nodes"] = [
      { id: "A", label: "A", x: 20, y: 30, state: "visited", badge: "root A" },
      { id: "B", label: "B", x: 50, y: 60, state: "frontier", parent: "A" },
      { id: "C", label: "C", x: 80, y: 30, state: "idle", badge: "root C" },
    ];
    const before: GraphFrame = {
      kind: "graph",
      directed: false,
      weighted: false,
      nodes: stableNodes,
      edges: [
        { from: "A", to: "B", state: "active" },
        { from: "B", to: "C", state: "idle" },
      ],
    };
    const after: GraphFrame = {
      ...before,
      nodes: stableNodes.map((node) =>
        node.id === "B" ? { ...node, state: "visited" as const } : node,
      ),
      edges: [
        { from: "A", to: "B", state: "tree", label: "union" },
        { from: "B", to: "C", state: "rejected", label: "same root" },
      ],
    };
    const markup = render(after);

    expect(after.nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual(
      before.nodes.map(({ id, x, y }) => ({ id, x, y })),
    );
    expect(markup).toContain('data-node-id="B" data-node-x="50" data-node-y="60"');
    expect(markup).toContain("tree edge from A to B labeled union");
    expect(markup).toContain("rejected edge from B to C labeled same root");
    expect(markup).toContain("root A");
    expect(markup).toContain("root C");
  });

  it("keeps the exact 10-node and 16-edge teaching boundary non-scrolling", () => {
    const frame: GraphFrame = {
      kind: "graph",
      directed: false,
      weighted: false,
      nodes: nodes(10),
      edges: edges(16, 10),
    };
    const markup = render(frame);

    expect(GRAPH_VISIBLE_NODE_LIMIT).toBe(10);
    expect(GRAPH_VISIBLE_EDGE_LIMIT).toBe(16);
    expect(graphViewportGeometry(10, 16)).toEqual({ overflow: false });
    expect(markup).toContain('data-overflow="false"');
    expect(markup).toContain('data-visible-node-limit="10"');
    expect(markup).toContain('data-visible-edge-limit="16"');
    expect(markup).toContain("max-h-[420px]");
    expect(markup).not.toContain('role="region"');
  });

  it("marks node-heavy or edge-heavy graphs without exposing a scrollbar", () => {
    const nodeHeavy = graphViewportGeometry(11, 16);
    const edgeHeavy = graphViewportGeometry(10, 17);
    const markup = render({
      kind: "graph",
      directed: false,
      weighted: false,
      nodes: nodes(10),
      edges: edges(17, 10),
    });

    expect(nodeHeavy).toEqual({
      overflow: true,
      canvasWidth: 900,
      canvasHeight: 520,
      viewportHeight: 420,
    });
    expect(edgeHeavy).toEqual(nodeHeavy);
    expect(markup).toContain('data-overflow="false"');
    expect(markup).toContain('data-over-limit="true"');
    expect(markup).not.toContain('role="region"');
    expect(markup).not.toContain('tabindex="0"');
    expect(markup).toContain("width:900px");
    expect(markup).toContain("height:520px");
    expect(markup).toContain("max-width:none");
    expect(markup).toContain("Input limit: 10 nodes and 16 edges");
    expect(markup).toContain("overflow-hidden");
  });
});
