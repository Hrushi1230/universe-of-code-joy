import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  RECURSION_VISIBLE_FRAME_LIMIT,
  RecursionStackView,
} from "@/components/viz/RecursionStackView";
import type { CallStackPanel, RecursionState } from "@/engine/types";

function call(index: number, state: RecursionState = "active"): CallStackPanel["frames"][number] {
  return {
    id: `call-${index}`,
    call: "search",
    args: [
      { name: "start", value: String(index) },
      { name: "path", value: `A${index}` },
    ],
    state,
  };
}

function render(frames: CallStackPanel["frames"]): string {
  return renderToStaticMarkup(
    <RecursionStackView panel={{ kind: "callstack", label: "Search calls", frames }} />,
  );
}

describe("recursion and backtracking family contract", () => {
  it("renders structured arguments and the current recursive choice", () => {
    const root = call(0, "active");
    root.choice = "choose B";
    const markup = render([root, call(1, "enter")]);

    expect(markup).toContain("Search calls. Call stack depth 2");
    expect(markup).toContain("Depth 1: search(start=0, path=A0), explore. Choice: choose B");
    expect(markup).toContain('data-current-state="enter"');
    expect(markup).toContain('data-motion="push"');
    expect(markup).toContain("root call");
    expect(markup).toContain("current call");
  });

  it("shows a returned value while keeping the frame in its original depth slot", () => {
    const returned = call(1, "return");
    returned.result = "height=3";
    const markup = render([call(0), returned]);

    expect(markup).toContain('data-state="return" data-depth="2"');
    expect(markup).toContain("Result: height=3");
    expect(markup).toContain("→ height=3");
    expect(markup).toContain('data-motion="pop"');
  });

  it.each([
    ["success", "solution found"],
    ["failure", "dead end"],
    ["undo", "remove C"],
  ] as const)("represents the %s backtracking state", (state, result) => {
    const frame = call(0, state);
    frame.result = result;
    const markup = render([frame]);

    expect(markup).toContain(`data-state="${state}"`);
    expect(markup).toContain(result);
    expect(markup).toContain(`data-current-state="${state}"`);
    if (state === "undo") expect(markup).toContain('data-motion="undo"');
  });

  it("keeps the exact eight-frame teaching limit inside a fixed-height panel", () => {
    const markup = render(Array.from({ length: 8 }, (_, index) => call(index)));

    expect(RECURSION_VISIBLE_FRAME_LIMIT).toBe(8);
    expect(markup).toContain('data-entry-count="8"');
    expect(markup).toContain('data-visible-limit="8"');
    expect(markup).toContain('data-hidden-count="0"');
    expect(markup).toContain("h-[112px]");
    expect(markup.match(/data-depth=/g)).toHaveLength(8);
  });

  it("summarizes older calls while retaining the eight calls nearest the current frame", () => {
    const markup = render(Array.from({ length: 11 }, (_, index) => call(index)));

    expect(markup).toContain('data-entry-count="11"');
    expect(markup).toContain('data-hidden-count="3"');
    expect(markup).toContain("+3 older");
    expect(markup).not.toContain('title="start=0, path=A0"');
    expect(markup).toContain('title="start=10, path=A10"');
    expect(markup.match(/data-depth=/g)).toHaveLength(8);
  });

  it("reserves the same panel height when there are no active calls", () => {
    const markup = render([]);

    expect(markup).toContain('data-entry-count="0"');
    expect(markup).toContain('data-current-state="empty"');
    expect(markup).toContain("h-[112px]");
    expect(markup).toContain("no active calls");
  });
});
