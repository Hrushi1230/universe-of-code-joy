import * as React from "react";
import { RainWaterView } from "@/components/viz/RainWaterView";
import { cn } from "@/lib/utils";
import type { ArrayFrame, CellState } from "@/engine/types";
import { pointerLabel } from "@/lib/pointerLabels";
import { StateIcon } from "@/components/viz/StateIcon";
import { cellCenter, clampToRow, scaleXFor, windowExtentPx } from "@/lib/vizTransitions";
import { cellTreatment } from "@/lib/vizState";
import { assignPointerLanes } from "@/lib/pointerLanes";
import { decisionPreview } from "@/lib/decisionPreview";
import { ARRAY_VISIBLE_CELL_LIMIT, arrayViewportGeometry } from "@/lib/arrayViewport";

/**
 * DOM (not SVG) canvas for searching-style array frames: a `target = n` chip,
 * index labels above the row, large rounded value cells, travelling low / mid /
 * high markers and a search-range bracket that contracts with the window.
 *
 * Pure presentation — `(props: { frame }) => JSX`, no stores, no router.
 * Geometry is measured from the rendered row, never hardcoded, and the global
 * reduced-motion rules in `styles.css` collapse every transition to 0ms.
 */

/** Gap between cells; must stay in sync with the `gap-2` utility on the rows. */
const CELL_GAP = 8;
const MAX_CELL = 88;

const CELL_SURFACE: Record<CellState, string> = {
  idle: "border-hairline bg-card text-ink",
  active: "border-[1.5px] border-accent-strong bg-tint text-accent-strong",
  visited: "border-hairline bg-card text-slate-soft",
  frontier: "border-primary/45 bg-tint/70 text-ink",
  found: "border-[1.5px] border-accent-strong bg-tint text-accent-strong",
  excluded: "border-dashed border-hairline bg-paper text-slate-soft",
  compare: "border-[1.5px] border-accent-strong bg-tint text-accent-strong",
  sorted: "border-primary/35 bg-tint/55 text-ink",
};

/** The emphasised states read a touch heavier as they take over. */
const EMPHASIS: Partial<Record<CellState, string>> = {
  found: "font-semibold shadow-sm",
  compare: "font-semibold shadow-sm",
  active: "font-semibold shadow-sm",
};

function stateOf(frame: ArrayFrame, index: number): CellState {
  return frame.states[index] ?? "idle";
}

/** The window the bracket spans: the frame's own range, else its lo/hi pointers. */
function windowExtent(frame: ArrayFrame): { from: number; to: number } | null {
  const n = frame.values.length;
  const clamp = (v: number): number => Math.max(0, Math.min(v, n - 1));
  const range = frame.ranges[0];
  if (range) return { from: clamp(range.from), to: clamp(range.to) };
  const lo = frame.pointers.find((p) => p.name === "lo");
  const hi = frame.pointers.find((p) => p.name === "hi");
  if (!lo || !hi || lo.index > hi.index) return null;
  return { from: clamp(lo.index), to: clamp(hi.index) };
}

function describe(frame: ArrayFrame, revealDecision: boolean): string {
  const parts: string[] = [`Array of ${frame.values.length} values: ${frame.values.join(", ")}.`];
  if (frame.target) parts.push(`${frame.target.label} ${String(frame.target.value)}.`);
  for (const p of frame.pointers)
    parts.push(`Pointer ${pointerLabel(p.name)} at index ${p.index}.`);
  const win = windowExtent(frame);
  if (win) {
    const label = frame.ranges[0]?.label ?? "Current search range";
    parts.push(`${label} covers indexes ${win.from} to ${win.to}.`);
  }
  if (frame.comparison) {
    const { left, op, right, verdict } = frame.comparison;
    parts.push(
      `Comparing ${left} ${op} ${right}.${revealDecision && verdict ? ` ${verdict}.` : ""}`,
    );
  }
  if (frame.swapPair) {
    parts.push(`Swapping indexes ${frame.swapPair[0]} and ${frame.swapPair[1]}.`);
  }
  return parts.join(" ");
}

/** Measures the rendered row so overlays can track real cell geometry. */
function useMeasuredWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = (): void => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

/** Memoized so playback re-renders only the cells whose state actually moved. */
const ValueCell = React.memo(function ValueCell({
  value,
  state,
  swapping,
}: {
  value: string | number;
  state: CellState;
  swapping: boolean;
}): React.ReactElement {
  const treatment = cellTreatment(state);
  return (
    <div
      data-testid="array-cell"
      data-state={state}
      className={cn(
        "relative flex h-[60px] items-center justify-center rounded-xl border font-mono text-[21px] tabular-nums xl:h-[62px]",
        "transition-[background-color,border-color,color,box-shadow,opacity] duration-300 ease-out",
        CELL_SURFACE[state],
        EMPHASIS[state],
        treatment.dim && "opacity-55",
        swapping && "ring-2 ring-primary ring-offset-2 ring-offset-card",
      )}
    >
      <span key={String(value)} className={cn(swapping && "viz-swap")}>
        {String(value)}
      </span>
      {treatment.mark ? (
        <span className="pointer-events-none absolute right-1 top-1 opacity-80">
          <StateIcon state={state} size={11} />
        </span>
      ) : null}
    </div>
  );
});

export interface ArrayCanvasProps {
  frame: ArrayFrame;
  /** Pointer names whose index moved on this step — only those get emphasis. */
  movedPointers?: readonly string[];
  /**
   * False while a prediction checkpoint is unresolved: the surviving-side
   * preview is withheld so the canvas cannot answer the question for the
   * learner. Everything else (values, range, pointers) stays.
   */
  revealDecision?: boolean;
  className?: string;
}

export function ArrayCanvas(props: ArrayCanvasProps): React.ReactElement {
  return props.frame.rainWater ? <RainWaterView {...props} /> : <StandardArrayCanvas {...props} />;
}

function StandardArrayCanvas({
  frame,
  movedPointers,
  revealDecision = true,
  className,
}: ArrayCanvasProps): React.ReactElement {
  const n = Math.max(1, frame.values.length);
  const viewport = arrayViewportGeometry(frame.values.length);
  const win = windowExtent(frame);
  const [rowRef, rowWidth] = useMeasuredWidth<HTMLDivElement>();
  const cols: React.CSSProperties = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  const moved = React.useMemo(() => new Set(movedPointers ?? []), [movedPointers]);

  /* Every pointer the run has shown so far keeps a mounted marker, so a marker
     travels to its new cell instead of unmounting and reappearing. */
  const [names, setNames] = React.useState<string[]>(() => frame.pointers.map((p) => p.name));
  React.useEffect(() => {
    setNames((prev) => {
      const next = [...prev];
      for (const p of frame.pointers) if (!next.includes(p.name)) next.push(p.name);
      return next.length === prev.length ? prev : next;
    });
  }, [frame.pointers]);

  /* Last known index per marker: a marker the current frame omits fades out in
     place rather than snapping to index 0. The label keeps the pointer's real
     index (it can run one past the row when the window empties) while the
     position clamps into the row. */
  const lastIndexRef = React.useRef<Record<string, number>>({});
  const baseMarkers = names.map((name) => {
    const live = frame.pointers.find((p) => p.name === name);
    if (live) lastIndexRef.current[name] = live.index;
    const index = lastIndexRef.current[name] ?? 0;
    const slot = Math.max(0, Math.min(index, n - 1));
    return { name, index, slot, active: Boolean(live) };
  });

  /* Markers that land on the same cell share the slot side by side instead of
     stacking on top of each other (low = mid = high on the final frame). The
     lane maths is a pure, tested helper so the layout is deterministic. */
  const laneOf = new Map(
    assignPointerLanes(
      baseMarkers.filter((m) => m.active).map((m) => ({ name: m.name, slot: m.slot })),
    ).map((r) => [r.name, r.lane]),
  );
  const markers = baseMarkers.map((m) => ({ ...m, lane: laneOf.get(m.name) ?? 0 }));

  const extent = win
    ? windowExtentPx(win.from, win.to, rowWidth, n, CELL_GAP)
    : { offset: 0, width: rowWidth, center: rowWidth / 2 };

  /* A decision in progress: the surviving side is highlighted but the official
     range has NOT moved yet. Only shown when the frame proves it, and never
     while a prediction checkpoint is still open. */
  const preview = revealDecision ? decisionPreview(frame) : null;

  return (
    <div data-testid="array-canvas" className={cn("flex w-full flex-col", className)}>
      <span className="sr-only" role="img" aria-label={describe(frame, revealDecision)} />

      {/* target — a stationary mono chip; only its value cross-fades */}
      {frame.target ? (
        <span className="inline-flex h-8 w-fit items-center rounded-lg border border-primary/25 bg-tint px-3 font-mono text-[13px] text-accent-strong">
          {frame.target.label.toLowerCase()} ={" "}
          <span
            key={String(frame.target.value)}
            className="viz-swap ml-1 font-semibold tabular-nums"
          >
            {String(frame.target.value)}
          </span>
        </span>
      ) : null}

      <div
        data-testid="array-scroll-viewport"
        data-overflow="false"
        data-over-limit={viewport.overflow ? "true" : "false"}
        data-visible-cell-limit={ARRAY_VISIBLE_CELL_LIMIT}
        className={cn(
          "w-full self-center",
          frame.target ? "mt-5" : "mt-0",
          viewport.overflow && "mx-auto overflow-hidden rounded-lg px-1",
        )}
        style={
          viewport.overflow && viewport.viewportWidth
            ? { maxWidth: `min(100%, ${viewport.viewportWidth}px)` }
            : undefined
        }
      >
        <div
          className="px-1"
          style={
            viewport.overflow && viewport.trackWidth
              ? { width: `${viewport.trackWidth}px` }
              : { maxWidth: `${n * MAX_CELL}px`, marginInline: "auto" }
          }
        >
          {/* index labels */}
          <div aria-hidden="true" className="grid w-full gap-2" style={cols}>
            {frame.values.map((_, i) => (
              <span
                key={`idx-${i}`}
                className="text-center font-mono text-[13px] tabular-nums text-slate"
              >
                {i}
              </span>
            ))}
          </div>

          {/* value cells */}
          <div ref={rowRef} className="mt-2 grid w-full gap-2" style={cols}>
            {frame.values.map((value, i) => (
              <ValueCell
                key={`cell-${i}`}
                value={value}
                state={stateOf(frame, i)}
                swapping={frame.swapPair?.includes(i) ?? false}
              />
            ))}
          </div>

          {/* low / mid / high markers — persistent, they travel */}
          <div className="relative mt-2.5 h-[52px] w-full">
            {markers.map((m) => (
              <span
                key={m.name}
                className="absolute left-0 top-0 flex flex-col items-center gap-0.5 leading-none transition-[transform,opacity] duration-300 ease-out will-change-transform"
                style={{
                  opacity: m.active ? 1 : 0,
                  transform: `translateX(${clampToRow(cellCenter(m.slot, rowWidth, n, CELL_GAP), rowWidth, 22 + Math.abs(m.lane)) + m.lane}px) translateX(-50%)`,
                }}
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="16"
                  viewBox="0 0 14 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent-strong"
                >
                  <path d="M7 15V2" />
                  <path d="M2.5 6.5 7 2l4.5 4.5" />
                </svg>
                <span
                  className={cn(
                    "mt-1 font-sans text-[13px] transition-colors duration-300 ease-out",
                    moved.has(m.name)
                      ? "font-semibold text-accent-strong"
                      : "font-semibold text-ink",
                  )}
                >
                  {pointerLabel(m.name)}
                </span>
                <span className="font-mono text-[12px] tabular-nums text-slate">({m.index})</span>
              </span>
            ))}
          </div>

          {/* search-range bracket — one element that contracts */}
          <div className="relative mt-1 h-[10px] w-full overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-[10px] w-full origin-left rounded-b-[3px] border-x border-t border-slate-soft/70 transition-[transform,opacity] duration-300 ease-out will-change-transform"
              style={{
                opacity: win ? 1 : 0,
                transform: `translateX(${extent.offset}px) scaleX(${scaleXFor(extent.width, rowWidth)})`,
              }}
            />
          </div>
          <div className="relative mt-2 h-[18px] w-full">
            <span
              className="absolute left-0 top-0 whitespace-nowrap font-mono text-[13px] text-accent-strong transition-[transform,opacity] duration-300 ease-out will-change-transform"
              style={{
                opacity: win ? 1 : 0,
                transform: `translateX(${clampToRow(extent.center, rowWidth, 90)}px) translateX(-50%)`,
              }}
            >
              {frame.ranges[0]?.label ?? "Current search range"}{" "}
              <span key={win ? `${win.from}-${win.to}` : "none"} className="viz-swap">
                [{win?.from ?? 0}..{win?.to ?? 0}]
              </span>
            </span>
          </div>

          {/* Decision preview: the side that would survive this comparison. The
              row keeps its height so the canvas never reflows, but the sentence
              itself is absent unless a preview is allowed — at an open prediction
              checkpoint it would otherwise still be readable to a screen reader.
              The wording is explicit that the range above has not changed yet. */}
          <div className="mt-1.5 flex h-[16px] w-full items-start justify-center">
            {preview ? (
              <span className="viz-swap whitespace-nowrap font-mono text-[12px] text-slate">
                Preview: [{preview.from}..{preview.to}] would survive — range not changed yet
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {viewport.overflow ? (
        <p className="mt-1.5 text-center font-mono text-[11px] text-slate">
          Input limit: {ARRAY_VISIBLE_CELL_LIMIT} cells
        </p>
      ) : null}
    </div>
  );
}

export default ArrayCanvas;
