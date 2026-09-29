import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeapView } from "@/components/viz/HeapView";
import type { HeapFrame } from "@/engine/types";

function position(index: number, total: number): { x: number; y: number } {
  const depth = Math.floor(Math.log2(index + 1));
  const maxDepth = Math.max(0, Math.floor(Math.log2(Math.max(1, total))));
  const offset = index - (2 ** depth - 1);
  return {
    x: ((offset + 0.5) / 2 ** depth) * 100,
    y: maxDepth === 0 ? 20 : 12 + (76 * depth) / maxDepth,
  };
}

function frameFor(values: number[], heapSize = values.length): HeapFrame {
  return {
    kind: "heap",
    heapType: "max",
    heapSize,
    slots: values.map((value, index) => ({
      index,
      value,
      ...position(index, values.length),
      state: index < heapSize ? "idle" : "sorted",
    })),
  };
}

function render(frame: HeapFrame): string {
  return renderToStaticMarkup(<HeapView frame={frame} />);
}

describe("heap family contract", () => {
  it("derives the complete tree and indexed backing array from the same canonical slots", () => {
    const markup = render(frameFor([10, 5, 8, 2, 1, 3]));

    expect(markup).toContain("Max heap with 6 slots and active heap size 6");
    expect(markup).toContain("Backing array: 10, 5, 8, 2, 1, 3");
    expect(markup).toContain("Index 5 has parent index 2");
    expect(markup).toContain('data-heap-type="max"');
    expect(markup).toContain('data-slot-count="6"');
    expect(markup.match(/data-testid="heap-array-cell"/g)).toHaveLength(6);
    expect(markup).toContain("Node 10 annotation: #0");
    expect(markup).toContain("Node 3 annotation: #5");
  });

  it("shows a parent-child swap in both representations and on their connecting edge", () => {
    const frame = frameFor([4, 10, 3, 5, 1, 8]);
    frame.slots[0]!.state = "compare";
    frame.slots[1]!.state = "active";
    frame.swapPair = [0, 1];
    frame.edgeStates = { 1: "active" };
    const markup = render(frame);

    expect(markup).toContain("Swapping indices 0 and 1");
    expect(markup).toContain("active edge from heap-0 to heap-1 labeled swap");
    expect(markup.match(/ring-2 ring-primary/g)).toHaveLength(2);
    expect(markup).toContain('data-index="0" data-state="compare"');
    expect(markup).toContain('data-index="1" data-state="active"');
  });

  it("keeps slot coordinates fixed while values swap between indices", () => {
    const before = frameFor([4, 10, 3, 5, 1, 8]);
    const after = frameFor([10, 4, 3, 5, 1, 8]);

    expect(after.slots.map(({ index, x, y }) => ({ index, x, y }))).toEqual(
      before.slots.map(({ index, x, y }) => ({ index, x, y })),
    );
    expect(after.slots.map((slot) => slot.value)).toEqual([10, 4, 3, 5, 1, 8]);
  });

  it("marks the extracted suffix outside the shrinking heap boundary", () => {
    const markup = render(frameFor([1, 3, 4, 5, 8, 10], 3));

    expect(markup).toContain('data-heap-size="3"');
    expect(markup).toContain("heap size 3/6");
    expect(markup.match(/data-in-heap="false"/g)).toHaveLength(3);
    expect(markup.match(/data-state="sorted"/g)).toHaveLength(3);
  });

  it("keeps twelve synchronized slots visible without scrolling", () => {
    const markup = render(frameFor(Array.from({ length: 12 }, (_, index) => 12 - index)));

    expect(markup).toContain('data-slot-count="12"');
    expect(markup).toContain('data-visible-node-limit="15"');
    expect(markup).toContain('data-testid="tree-scroll-viewport" data-overflow="false"');
    expect(markup).toContain('data-testid="heap-array-scroll-viewport" data-overflow="false"');
    expect(markup).not.toContain('tabindex="0"');
  });

  it("marks heap inputs beyond the limit without adding scroll regions", () => {
    const frame = frameFor(Array.from({ length: 16 }, (_, index) => index));
    frame.heapType = "min";
    const markup = render(frame);

    expect(markup).toContain("Min heap with 16 slots");
    expect(markup).toContain('data-testid="tree-scroll-viewport" data-overflow="false"');
    expect(markup).toContain('data-testid="heap-array-scroll-viewport" data-overflow="false"');
    expect(markup.match(/data-over-limit="true"/g)).toHaveLength(2);
    expect(markup).toContain("Input limit: 12 heap slots");
    expect(markup).not.toContain('role="region"');
  });
});
