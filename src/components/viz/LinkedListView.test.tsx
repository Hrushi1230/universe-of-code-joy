import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LinkedListView } from "@/components/viz/LinkedListView";
import type { LinkedListFrame } from "@/engine/types";
import {
  LINKED_LIST_VISIBLE_NODE_LIMIT,
  linkedListViewportGeometry,
} from "@/lib/linkedListViewport";

function row(count: number, y = 32): LinkedListFrame["nodes"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `n${index}`,
    label: index + 1,
    x: 12 + index * (88 / Math.max(1, count - 1)),
    y,
    state: "idle" as const,
  }));
}

describe("LinkedListView family contract", () => {
  it("shows a reversed link while keeping engine-owned node positions stable", () => {
    const nodes = row(3);
    const frame: LinkedListFrame = {
      kind: "linked-list",
      nodeSlots: 3,
      nodes,
      links: [
        { id: "old-next", from: "n1", to: "n2", state: "rejected", detached: true },
        { id: "reversed-next", from: "n1", to: "n0", state: "active", label: "next" },
        { id: "tail-null", from: "n0", to: null, state: "tree" },
      ],
      pointers: [
        { name: "prev", nodeId: "n0" },
        { name: "current", nodeId: "n1", color: "warning" },
        { name: "head", nodeId: "n2" },
      ],
    };
    const markup = renderToStaticMarkup(<LinkedListView frame={frame} />);

    expect(markup).toContain('data-node-id="n1"');
    expect(markup).toContain(`data-node-x="${nodes[1]!.x}"`);
    expect(markup).toContain('data-link-id="old-next"');
    expect(markup).toContain('data-detached="true"');
    expect(markup).toContain("Detached link old-next from n1 to n2");
    expect(markup).toContain("null");
  });

  it("stacks head, current, slow, and fast markers without changing node coordinates", () => {
    const frame: LinkedListFrame = {
      kind: "linked-list",
      nodeSlots: 4,
      nodes: row(4),
      links: [],
      pointers: [
        { name: "head", nodeId: "n0" },
        { name: "current", nodeId: "n0", color: "warning" },
        { name: "slow", nodeId: "n1" },
        { name: "fast", nodeId: "n3", color: "error" },
      ],
    };
    const markup = renderToStaticMarkup(<LinkedListView frame={frame} />);

    for (const pointer of ["head", "current", "slow", "fast"]) {
      expect(markup).toContain(`data-pointer="${pointer}"`);
    }
    expect(markup).toContain("Pointers: head at n0, current at n0, slow at n1, fast at n3");
  });

  it("renders two list rows and an output-tail relink for merge teaching", () => {
    const first = row(3, 21).map((node) => ({ ...node, id: `a-${node.id}` }));
    const second = row(3, 43).map((node) => ({ ...node, id: `b-${node.id}` }));
    const frame: LinkedListFrame = {
      kind: "linked-list",
      nodeSlots: 6,
      nodes: [...first, ...second],
      links: [{ id: "take-a", from: "a-n0", to: "b-n0", state: "active", label: "tail.next" }],
      pointers: [
        { name: "list1", nodeId: "a-n0" },
        { name: "list2", nodeId: "b-n0" },
        { name: "tail", nodeId: "a-n0", color: "warning" },
      ],
    };
    const markup = renderToStaticMarkup(<LinkedListView frame={frame} />);

    expect(markup).toContain('data-node-y="21"');
    expect(markup).toContain('data-node-y="43"');
    expect(markup).toContain("tail.next");
    expect(markup).toContain("active link take-a from a-n0 to b-n0");
  });

  it("renders a backward cycle link and a detached removal link distinctly", () => {
    const frame: LinkedListFrame = {
      kind: "linked-list",
      nodeSlots: 5,
      nodes: row(5).map((node, index) => ({
        ...node,
        state: index === 2 ? ("excluded" as const) : ("idle" as const),
      })),
      links: [
        { id: "cycle", from: "n4", to: "n1", state: "active", label: "cycle" },
        { id: "removed", from: "n1", to: "n2", state: "rejected", detached: true },
        { id: "bypass", from: "n1", to: "n3", state: "tree", label: "next" },
      ],
      pointers: [
        { name: "slow", nodeId: "n1" },
        { name: "fast", nodeId: "n4" },
      ],
    };
    const markup = renderToStaticMarkup(<LinkedListView frame={frame} />);

    expect(markup).toContain("active link cycle from n4 to n1 labeled cycle");
    expect(markup).toContain("Detached link removed from n1 to n2");
    expect(markup).toContain('data-link-id="bypass"');
    expect(markup).toContain("var(--viz-excluded)");
  });

  it("keeps eight nodes non-scrolling and marks larger layouts as over-limit", () => {
    const eight = linkedListViewportGeometry(8, 8);
    const nine = linkedListViewportGeometry(8, 9);
    const frame: LinkedListFrame = {
      kind: "linked-list",
      nodeSlots: 9,
      nodes: row(8),
      links: [],
      pointers: [{ name: "head", nodeId: "n0" }],
    };
    const markup = renderToStaticMarkup(<LinkedListView frame={frame} />);

    expect(LINKED_LIST_VISIBLE_NODE_LIMIT).toBe(8);
    expect(eight).toEqual({ capacity: 8, overflow: false, scale: 1, viewBoxWidth: 120 });
    expect(nine).toEqual({
      capacity: 9,
      overflow: true,
      scale: 1.125,
      viewBoxWidth: 135,
      canvasWidth: 810,
      viewportWidth: 720,
    });
    expect(markup).toContain('data-overflow="false"');
    expect(markup).toContain('data-over-limit="true"');
    expect(markup).not.toContain('tabindex="0"');
    expect(markup).toContain("min-width:810px");
    expect(markup).toContain("Input limit: 8 nodes");
    expect(markup).toContain("overflow-hidden");
  });

  it("represents an empty list with head and tail explicitly at null", () => {
    const frame: LinkedListFrame = {
      kind: "linked-list",
      nodeSlots: 0,
      nodes: [],
      links: [],
      pointers: [
        { name: "head", nodeId: null },
        { name: "tail", nodeId: null },
      ],
    };
    const markup = renderToStaticMarkup(<LinkedListView frame={frame} />);

    expect(markup).toContain("head → null");
    expect(markup).toContain("tail → null");
    expect(markup).toContain("Pointers: head at null, tail at null");
  });
});
