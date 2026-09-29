import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TreeView } from "@/components/viz/TreeView";
import type { TreeFrame } from "@/engine/types";
import {
  TREE_VISIBLE_LEVEL_LIMIT,
  TREE_VISIBLE_NODE_LIMIT,
  treeViewportGeometry,
} from "@/lib/treeViewport";

function render(frame: TreeFrame): string {
  return renderToStaticMarkup(<TreeView frame={frame} />);
}

const LEVEL_ORDER: TreeFrame = {
  kind: "tree",
  nodes: [
    { id: "root", label: 8, x: 50, y: 18, state: "visited", badge: "L0" },
    { id: "left", label: 4, x: 28, y: 48, state: "frontier", badge: "next" },
    { id: "right", label: 12, x: 72, y: 48, state: "frontier", badge: "next" },
  ],
  edges: [
    { from: "root", to: "left", state: "tree", label: "left" },
    { from: "root", to: "right", state: "tree", label: "right" },
  ],
};

describe("tree and BST family contract", () => {
  it("renders traversal state, stable path edges, queue/level badges, and accessible detail", () => {
    const markup = render(LEVEL_ORDER);

    expect(markup).toContain("Tree with 3 nodes and 2 edges");
    expect(markup).toContain("visited: 8");
    expect(markup).toContain("frontier: 4, 12");
    expect(markup).toContain("Node 8 annotation: L0");
    expect(markup).toContain("tree edge from root to left labeled left");
    expect(markup).toContain('data-visible-node-limit="15"');
    expect(markup).toContain('data-overflow="false"');
    expect(markup).toContain("max-h-[420px]");
  });

  it("honours an engine-owned wide canvas without changing node size", () => {
    const markup = render({
      ...LEVEL_ORDER,
      viewBox: { minX: -8, minY: -4, width: 156, height: 92 },
    });

    expect(markup).toContain('viewBox="-8 -4 156 92"');
    expect(markup).toContain('r="5"');
  });

  it("uses generic node badges and edge states for BST bounds, returned depth, and LCA", () => {
    const markup = render({
      kind: "tree",
      nodes: [
        { id: "n8", label: 8, x: 50, y: 18, state: "active", badge: "(-∞, 10)" },
        { id: "n4", label: 4, x: 28, y: 48, state: "visited", badge: "h=2" },
        { id: "n12", label: 12, x: 72, y: 48, state: "found", badge: "LCA" },
      ],
      edges: [
        { from: "n8", to: "n4", state: "tree", label: "valid" },
        { from: "n8", to: "n12", state: "active", label: "search path" },
      ],
    });

    expect(markup).toContain("Node 8 annotation: (-∞, 10)");
    expect(markup).toContain("Node 4 annotation: h=2");
    expect(markup).toContain("Node 12 annotation: LCA");
    expect(markup).toContain("active edge from n8 to n12 labeled search path");
  });

  it("shows inversion as a link change while preserving every node position", () => {
    const before: TreeFrame = LEVEL_ORDER;
    const after: TreeFrame = {
      ...LEVEL_ORDER,
      edges: [
        { from: "root", to: "right", state: "active", label: "left" },
        { from: "root", to: "left", state: "active", label: "right" },
      ],
    };
    const markup = render(after);

    expect(after.nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual(
      before.nodes.map(({ id, x, y }) => ({ id, x, y })),
    );
    expect(markup).toContain("active edge from root to right labeled left");
    expect(markup).toContain("active edge from root to left labeled right");
  });

  it("keeps the 15-node, four-level teaching boundary non-scrolling", () => {
    const nodes: TreeFrame["nodes"] = Array.from({ length: 15 }, (_, index) => ({
      id: `n${index}`,
      label: index,
      x: index * 6,
      y: [15, 35, 60, 85][Math.floor(Math.log2(index + 1))]!,
      state: "idle" as const,
    }));

    expect(TREE_VISIBLE_NODE_LIMIT).toBe(15);
    expect(TREE_VISIBLE_LEVEL_LIMIT).toBe(4);
    expect(treeViewportGeometry(nodes)).toEqual({ levelCount: 4, overflow: false });
  });

  it("marks oversized trees without exposing a local scrollbar", () => {
    const nodes: TreeFrame["nodes"] = Array.from({ length: 16 }, (_, index) => ({
      id: `n${index}`,
      label: index,
      x: 8 + (index % 8) * 12,
      y: [10, 30, 50, 70, 90][Math.min(4, Math.floor(Math.log2(index + 1)))]!,
      state: "idle" as const,
    }));
    const geometry = treeViewportGeometry(nodes);
    const markup = render({ kind: "tree", nodes, edges: [] });

    expect(geometry).toEqual({
      levelCount: 5,
      overflow: true,
      canvasWidth: 900,
      canvasHeight: 525,
      viewportHeight: 420,
    });
    expect(markup).toContain('data-overflow="false"');
    expect(markup).toContain('data-over-limit="true"');
    expect(markup).not.toContain('role="region"');
    expect(markup).not.toContain('tabindex="0"');
    expect(markup).toContain("min-width:900px");
    expect(markup).toContain("min-height:525px");
    expect(markup).toContain("Input limit: 15 nodes and 4 levels");
    expect(markup).toContain("overflow-hidden");

    const skewed = nodes.slice(0, 8).map((node, index) => ({ ...node, y: index * 12 }));
    expect(treeViewportGeometry(skewed)).toMatchObject({
      levelCount: 8,
      overflow: true,
      canvasHeight: 840,
    });
  });
});
