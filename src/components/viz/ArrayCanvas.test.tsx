import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArrayCanvas } from "@/components/viz/ArrayCanvas";
import type { ArrayFrame } from "@/engine/types";
import { ARRAY_VISIBLE_CELL_LIMIT, arrayViewportGeometry } from "@/lib/arrayViewport";

function render(frame: ArrayFrame, revealDecision = true): string {
  return renderToStaticMarkup(<ArrayCanvas frame={frame} revealDecision={revealDecision} />);
}

function frame(overrides: Partial<ArrayFrame> = {}): ArrayFrame {
  return {
    kind: "array",
    values: [2, 7, 11, 15],
    states: { 0: "compare", 3: "compare" },
    pointers: [
      { name: "left", index: 0 },
      { name: "right", index: 3 },
    ],
    ranges: [{ from: 0, to: 3, label: "candidate pair" }],
    comparison: { left: "2 + 15", op: ">", right: "9", verdict: "Move right left." },
    ...overrides,
  };
}

describe("array and two-pointer family contract", () => {
  it("renders arbitrary left/right pointer state without an algorithm-specific component", () => {
    const markup = render(frame());

    expect(markup).toContain("Pointer left at index 0");
    expect(markup).toContain("Pointer right at index 3");
    expect(markup).toContain("Comparing 2 + 15 &gt; 9");
    expect(markup).toContain('data-visible-cell-limit="12"');
    expect(markup).toContain('data-overflow="false"');
  });

  it("supports read/write and swap semantics with visible and accessible emphasis", () => {
    const markup = render(
      frame({
        pointers: [
          { name: "read", index: 3 },
          { name: "write", index: 1 },
        ],
        swapPair: [1, 3],
      }),
    );

    expect(markup).toContain("Pointer read at index 3");
    expect(markup).toContain("Pointer write at index 1");
    expect(markup).toContain("Swapping indexes 1 and 3");
    expect(markup.match(/ring-2 ring-primary/g)).toHaveLength(2);
  });

  it("supports three-pointer and indexed-string variants through the same frame", () => {
    const markup = render(
      frame({
        values: ["r", "a", "c", "e", "c", "a", "r"],
        states: { 0: "compare", 3: "active", 6: "compare" },
        pointers: [
          { name: "left", index: 0 },
          { name: "mid", index: 3 },
          { name: "right", index: 6 },
        ],
        ranges: [{ from: 0, to: 6, label: "unchecked characters" }],
        comparison: { left: "r", op: "=", right: "r", verdict: "Move both pointers." },
      }),
    );

    expect(markup).toContain("Array of 7 values: r, a, c, e, c, a, r");
    expect(markup).toContain("Pointer mid at index 3");
    expect(markup.match(/data-testid="array-cell"/g)).toHaveLength(7);
  });

  it("withholds comparison verdict copy while a prediction is unresolved", () => {
    const hidden = render(frame(), false);
    expect(hidden).toContain("Comparing 2 + 15 &gt; 9");
    expect(hidden).not.toContain("Move right left.");
    expect(render(frame(), true)).toContain("Move right left.");
  });

  it("marks inputs above twelve as over-limit without creating a scrollbar", () => {
    const values = Array.from({ length: 13 }, (_, index) => index + 1);
    const geometry = arrayViewportGeometry(values.length);
    const markup = render(
      frame({
        values,
        states: {},
        pointers: [
          { name: "left", index: 0 },
          { name: "right", index: 12 },
        ],
        ranges: [{ from: 0, to: 12, label: "candidate range" }],
      }),
    );

    expect(ARRAY_VISIBLE_CELL_LIMIT).toBe(12);
    expect(geometry).toEqual({ overflow: true, trackWidth: 1136, viewportWidth: 1048 });
    expect(markup).toContain('data-overflow="false"');
    expect(markup).toContain('data-over-limit="true"');
    expect(markup).not.toContain('role="region"');
    expect(markup).not.toContain('tabindex="0"');
    expect(markup).toContain("Input limit: 12 cells");
    expect(markup).toContain("overflow-hidden");
    expect(markup).toContain("width:1136px");
  });

  it("does not alter the geometry contract for the 10-cell Binary Search reference", () => {
    expect(arrayViewportGeometry(10)).toEqual({ overflow: false });
    expect(arrayViewportGeometry(12)).toEqual({ overflow: false });
  });
});
