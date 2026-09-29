import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DP_1D_VISIBLE_COLS,
  DP_2D_VISIBLE_COLS,
  DP_2D_VISIBLE_ROWS,
  DP_TABLE_VIEWPORT_HEIGHT,
  TableView,
} from "@/components/viz/TableView";
import type { TableFrame } from "@/engine/types";

function tableFrame(layout: "1d" | "2d", rows: number, cols: number): TableFrame {
  return {
    kind: "table",
    layout,
    title: layout === "1d" ? "Linear DP" : "Matrix DP",
    rowLabels: Array.from({ length: rows }, (_, r) => (layout === "1d" ? "dp" : `r${r}`)),
    colLabels: Array.from({ length: cols }, (_, c) => c),
    cells: Array.from({ length: rows * cols }, (_, index) => ({
      r: Math.floor(index / cols),
      c: index % cols,
      value: index,
      state: "visited" as const,
    })),
  };
}

describe("TableView", () => {
  it("renders dependencies, formula, candidates, result, and non-colour teaching roles", () => {
    const frame = tableFrame("2d", 3, 4);
    frame.cells.find((cell) => cell.r === 1 && cell.c === 2)!.role = "dependency";
    frame.cells.find((cell) => cell.r === 2 && cell.c === 1)!.role = "dependency";
    frame.cells.find((cell) => cell.r === 2 && cell.c === 2)!.role = "target";
    frame.computation = {
      phase: "compute",
      target: { r: 2, c: 2 },
      dependencies: [
        { r: 1, c: 2, label: "top" },
        { r: 2, c: 1, label: "left" },
      ],
      formula: "dp[2][2] = top + left",
      candidates: [
        { label: "top", value: 4 },
        { label: "left", value: 6 },
      ],
      result: 10,
    };

    const markup = renderToStaticMarkup(<TableView frame={frame} />);
    expect(markup).toContain("dp[2][2] = top + left");
    expect(markup).toContain("top = 4");
    expect(markup).toContain("left = 6");
    expect(markup).toContain("= 10");
    expect(markup).toContain('data-role="dependency"');
    expect(markup).toContain('data-role="target"');
    expect(markup).toContain("Dependencies: top at row r1, column 2 and left at row r2, column 1");
  });

  it.each(["read", "compute", "write"] as const)("exposes the %s transition phase", (phase) => {
    const frame = tableFrame("1d", 1, 4);
    frame.computation = {
      phase,
      target: { r: 0, c: 3 },
      dependencies: [{ r: 0, c: 2, label: "previous" }],
      formula: "dp[3] = dp[2] + 1",
      candidates: [{ label: "previous", value: 2 }],
      result: phase === "read" ? null : 3,
    };
    expect(renderToStaticMarkup(<TableView frame={frame} />)).toContain(`data-phase="${phase}"`);
  });

  it("keeps exactly twelve 1-D cells and rejects scrollable overflow", () => {
    const exact = renderToStaticMarkup(
      <TableView frame={tableFrame("1d", 1, DP_1D_VISIBLE_COLS)} />,
    );
    const overflow = renderToStaticMarkup(
      <TableView frame={tableFrame("1d", 1, DP_1D_VISIBLE_COLS + 1)} />,
    );
    expect(exact).toContain('data-overflow-x="false"');
    expect(overflow).toContain('data-overflow-x="false"');
    expect(overflow).toContain('data-over-limit-x="true"');
    expect(overflow).toContain('data-rendered-cols="12"');
    expect(overflow).toContain("overflow-hidden");
    expect(overflow).not.toContain("Scrollable dynamic programming table");
  });

  it("keeps an eight-by-ten 2-D table non-overflowing", () => {
    const markup = renderToStaticMarkup(
      <TableView frame={tableFrame("2d", DP_2D_VISIBLE_ROWS, DP_2D_VISIBLE_COLS)} />,
    );
    expect(markup).toContain('data-overflow-x="false"');
    expect(markup).toContain('data-overflow-y="false"');
    expect(markup).toContain(`data-visible-row-limit="${DP_2D_VISIBLE_ROWS}"`);
    expect(markup).toContain(`data-visible-col-limit="${DP_2D_VISIBLE_COLS}"`);
  });

  it("caps larger 2-D tables without adding either scroll axis", () => {
    const markup = renderToStaticMarkup(
      <TableView frame={tableFrame("2d", DP_2D_VISIBLE_ROWS + 1, DP_2D_VISIBLE_COLS + 1)} />,
    );
    expect(markup).toContain('data-overflow-x="false"');
    expect(markup).toContain('data-overflow-y="false"');
    expect(markup).toContain('data-over-limit-x="true"');
    expect(markup).toContain('data-over-limit-y="true"');
    expect(markup).toContain('data-rendered-rows="8"');
    expect(markup).toContain('data-rendered-cols="10"');
    expect(markup).not.toContain('tabindex="0"');
  });

  it("reserves the same table and computation heights before and during a transition", () => {
    const setup = tableFrame("1d", 1, 5);
    const active = tableFrame("1d", 1, 5);
    active.computation = {
      phase: "write",
      target: { r: 0, c: 4 },
      dependencies: [],
      formula: "dp[4] = 5",
      candidates: [],
      result: 5,
    };
    for (const markup of [
      renderToStaticMarkup(<TableView frame={setup} />),
      renderToStaticMarkup(<TableView frame={active} />),
    ]) {
      expect(markup).toContain("h-[396px]");
      expect(markup).toContain(`h-[${DP_TABLE_VIEWPORT_HEIGHT}px]`);
      expect(markup).toContain("h-[72px]");
    }
  });

  it("summarizes computation candidates beyond the four-chip limit", () => {
    const frame = tableFrame("1d", 1, 6);
    frame.computation = {
      phase: "compute",
      target: { r: 0, c: 5 },
      dependencies: [],
      formula: "choose the best predecessor",
      candidates: Array.from({ length: 6 }, (_, index) => ({
        label: `candidate ${index}`,
        value: index,
      })),
      result: 5,
    };
    const markup = renderToStaticMarkup(<TableView frame={frame} />);
    expect(markup).toContain("candidate 3 = 3");
    expect(markup).not.toContain("candidate 4 = 4");
    expect(markup).toContain("+2 more");
  });
});
