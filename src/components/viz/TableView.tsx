import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { StateIcon } from "@/components/viz/StateIcon";
import { DURATION, EASE, FILL, INK } from "@/components/viz/tokens";
import type { CellState, TableFrame } from "@/engine/types";
import { cn } from "@/lib/utils";

export const DP_1D_VISIBLE_COLS = 12;
export const DP_2D_VISIBLE_ROWS = 8;
export const DP_2D_VISIBLE_COLS = 10;
export const DP_TABLE_VIEWPORT_HEIGHT = 288;
export const DP_VISIBLE_CANDIDATES = 4;

export interface TableViewProps {
  frame: TableFrame;
  className?: string;
}

type TableCell = TableFrame["cells"][number];

function cellName(frame: TableFrame, r: number, c: number): string {
  const row = frame.rowLabels[r] ?? r;
  const col = frame.colLabels[c] ?? c;
  return frame.layout === "1d" || frame.rowLabels.length <= 1
    ? `${String(row)}[${String(col)}]`
    : `row ${String(row)}, column ${String(col)}`;
}

function describe(frame: TableFrame): string {
  const layout = frame.layout ?? (frame.rowLabels.length <= 1 ? "1d" : "2d");
  const parts: string[] = [
    `${frame.title ?? "Dynamic programming table"}.`,
    `${layout === "1d" ? "One-dimensional" : "Two-dimensional"} table with ${frame.rowLabels.length} rows and ${frame.colLabels.length} columns.`,
  ];
  const computation = frame.computation;
  if (computation) {
    const target = cellName(frame, computation.target.r, computation.target.c);
    const dependencies = computation.dependencies
      .map((dependency) => `${dependency.label} at ${cellName(frame, dependency.r, dependency.c)}`)
      .join(" and ");
    parts.push(`${computation.phase} ${target} using ${computation.formula}.`);
    if (dependencies) parts.push(`Dependencies: ${dependencies}.`);
    if (computation.result !== null) parts.push(`Result ${String(computation.result)}.`);
  }
  return parts.join(" ");
}

function roleLabel(role: TableCell["role"]): string | null {
  switch (role) {
    case "base":
      return "base";
    case "dependency":
      return "dep";
    case "target":
      return "next";
    case "write":
      return "write";
    case "result":
      return "answer";
    default:
      return null;
  }
}

export function TableView({ frame, className }: TableViewProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : { duration: DURATION, ease: EASE };
  const layout = frame.layout ?? (frame.rowLabels.length <= 1 ? "1d" : "2d");
  const overLimitX =
    frame.colLabels.length > (layout === "1d" ? DP_1D_VISIBLE_COLS : DP_2D_VISIBLE_COLS);
  const overLimitY = layout === "2d" && frame.rowLabels.length > DP_2D_VISIBLE_ROWS;
  const visibleRows = frame.rowLabels.slice(0, layout === "2d" ? DP_2D_VISIBLE_ROWS : 1);
  const visibleCols = frame.colLabels.slice(
    0,
    layout === "1d" ? DP_1D_VISIBLE_COLS : DP_2D_VISIBLE_COLS,
  );
  const cellWidth = layout === "1d" ? 52 : 64;

  const cellMap = React.useMemo(() => {
    const map = new Map<string, TableCell>();
    for (const cell of frame.cells) map.set(`${cell.r}:${cell.c}`, cell);
    return map;
  }, [frame.cells]);

  const candidates = frame.computation?.candidates ?? [];
  const visibleCandidates = candidates.slice(0, DP_VISIBLE_CANDIDATES);
  const hiddenCandidates = Math.max(0, candidates.length - visibleCandidates.length);

  return (
    <section
      aria-label={describe(frame)}
      data-testid="dp-table-view"
      data-layout={layout}
      data-rows={frame.rowLabels.length}
      data-cols={frame.colLabels.length}
      className={cn("flex h-[396px] w-full min-w-0 flex-col", className)}
    >
      <div className="mb-2 flex h-5 shrink-0 items-center justify-between gap-3 px-1">
        <p className="truncate font-mono text-[11px] uppercase tracking-wide text-slate">
          {frame.title ?? "DP table"}
        </p>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-soft">
          {overLimitX || overLimitY
            ? `input limited to ${layout === "1d" ? DP_1D_VISIBLE_COLS : `${DP_2D_VISIBLE_ROWS} × ${DP_2D_VISIBLE_COLS}`}`
            : layout === "1d"
              ? "1-D state"
              : "2-D state"}
        </span>
      </div>

      <div className="relative shrink-0">
        <div
          data-testid="dp-table-viewport"
          data-overflow-x="false"
          data-overflow-y="false"
          data-over-limit-x={overLimitX}
          data-over-limit-y={overLimitY}
          data-rendered-rows={visibleRows.length}
          data-rendered-cols={visibleCols.length}
          data-visible-row-limit={layout === "2d" ? DP_2D_VISIBLE_ROWS : 1}
          data-visible-col-limit={layout === "1d" ? DP_1D_VISIBLE_COLS : DP_2D_VISIBLE_COLS}
          className="h-[288px] overflow-hidden rounded-xl border border-hairline bg-card"
        >
          <div className="flex min-h-full min-w-full items-center justify-center">
            <table
              data-testid="dp-table"
              className="w-max border-separate border-spacing-0 font-mono text-xs"
            >
              <caption className="sr-only">{describe(frame)}</caption>
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 h-8 min-w-16 border-b border-r border-hairline bg-card px-2 text-slate" />
                  {visibleCols.map((column, c) => (
                    <th
                      key={`column-${c}`}
                      scope="col"
                      className="sticky top-0 z-20 h-8 border-b border-hairline bg-card px-1 text-center font-normal text-slate"
                      style={{ minWidth: cellWidth, width: cellWidth }}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, r) => (
                  <tr key={`row-${r}`}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 h-8 min-w-16 border-r border-hairline bg-card px-2 text-right font-normal text-slate"
                    >
                      {row}
                    </th>
                    {visibleCols.map((_, c) => {
                      const cell = cellMap.get(`${r}:${c}`);
                      const state: CellState = cell?.state ?? "idle";
                      const teachingRole = roleLabel(cell?.role);
                      return (
                        <td key={`${r}-${c}`} className="h-8 p-0.5">
                          <motion.div
                            data-testid={`dp-cell-${r}-${c}`}
                            data-state={state}
                            data-role={cell?.role ?? "none"}
                            aria-label={`${cellName(frame, r, c)}: ${cell?.value ?? "empty"}${cell?.role ? `, ${cell.role}` : ""}${cell?.annotation ? `, ${cell.annotation}` : ""}`}
                            title={cell?.annotation}
                            className="relative flex h-7 items-center justify-center overflow-hidden rounded-md"
                            style={{
                              minWidth: cellWidth - 4,
                              width: cellWidth - 4,
                              backgroundColor: FILL[state],
                              color: INK[state],
                            }}
                            animate={{
                              backgroundColor: FILL[state],
                              scale: state === "active" && !reduced ? 1.04 : 1,
                            }}
                            transition={transition}
                          >
                            <span className="flex min-w-0 items-center justify-center gap-1 px-1">
                              <StateIcon state={state} size={11} className="shrink-0 opacity-80" />
                              <span className="truncate">{cell?.value ?? "—"}</span>
                            </span>
                            {teachingRole ? (
                              <span
                                aria-hidden
                                className="absolute right-0.5 top-0 font-mono text-[7px] uppercase leading-none opacity-75"
                              >
                                {teachingRole}
                              </span>
                            ) : null}
                          </motion.div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        data-testid="dp-computation"
        data-phase={frame.computation?.phase ?? "idle"}
        className="mt-2 flex h-[72px] shrink-0 items-center rounded-xl border border-hairline bg-paper px-3 py-2"
      >
        {frame.computation ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 rounded-full border border-primary/25 bg-tint px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
              {frame.computation.phase}
            </span>
            <div className="min-w-0 flex-1">
              <p
                title={frame.computation.formula}
                className="truncate font-mono text-[11px] text-ink"
              >
                {frame.computation.formula}
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden">
                {visibleCandidates.map((candidate) => (
                  <span
                    key={candidate.label}
                    className={cn(
                      "truncate rounded-md border px-1.5 py-0.5 font-mono text-[9px]",
                      candidate.selected
                        ? "border-primary/30 bg-tint text-primary"
                        : "border-hairline bg-card text-slate",
                    )}
                  >
                    {candidate.label} = {candidate.value}
                  </span>
                ))}
                {hiddenCandidates > 0 ? (
                  <span className="shrink-0 font-mono text-[9px] text-slate-soft">
                    +{hiddenCandidates} more
                  </span>
                ) : null}
              </div>
            </div>
            <span className="w-20 shrink-0 text-right font-mono text-[11px] text-ink">
              {frame.computation.result === null ? "pending" : `= ${frame.computation.result}`}
            </span>
          </div>
        ) : (
          <p className="w-full text-center font-mono text-[10px] uppercase tracking-[0.12em] text-slate-soft">
            no active transition
          </p>
        )}
      </div>
    </section>
  );
}

export default TableView;
