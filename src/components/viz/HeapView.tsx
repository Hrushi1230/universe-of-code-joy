import * as React from "react";
import { cn } from "@/lib/utils";
import type { CellState, HeapFrame, TreeFrame } from "@/engine/types";
import { TreeView } from "@/components/viz/TreeView";
import { StateIcon } from "@/components/viz/StateIcon";
import { ARRAY_VISIBLE_CELL_LIMIT, arrayViewportGeometry } from "@/lib/arrayViewport";
import { TREE_VISIBLE_NODE_LIMIT } from "@/lib/treeViewport";

export interface HeapViewProps {
  frame: HeapFrame;
  className?: string;
}

const CELL_SURFACE: Record<CellState, string> = {
  idle: "border-hairline bg-card text-ink",
  active: "border-accent-strong bg-tint text-accent-strong",
  visited: "border-hairline bg-card text-slate-soft",
  frontier: "border-primary/45 bg-tint/70 text-ink",
  found: "border-accent-strong bg-tint text-accent-strong",
  excluded: "border-dashed border-hairline bg-paper text-slate-soft",
  compare: "border-accent-strong bg-tint text-accent-strong",
  sorted: "border-primary/35 bg-tint/55 text-ink",
};

const HEAP_CELL_WIDTH = 52;
const HEAP_CELL_GAP = 8;

function orderedSlots(frame: HeapFrame): HeapFrame["slots"] {
  return [...frame.slots].sort((a, b) => a.index - b.index);
}

function describe(frame: HeapFrame): string {
  const slots = orderedSlots(frame);
  const parts = [
    `${frame.heapType === "max" ? "Max" : "Min"} heap with ${slots.length} slots and active heap size ${frame.heapSize}.`,
    `Backing array: ${slots.map((slot) => String(slot.value)).join(", ")}.`,
  ];

  for (const slot of slots) {
    if (slot.state !== "idle") {
      parts.push(`Index ${slot.index}, value ${String(slot.value)}, is ${slot.state}.`);
    }
    if (slot.index > 0) {
      parts.push(`Index ${slot.index} has parent index ${Math.floor((slot.index - 1) / 2)}.`);
    }
  }
  if (frame.swapPair) {
    parts.push(`Swapping indices ${frame.swapPair[0]} and ${frame.swapPair[1]}.`);
  }
  return parts.join(" ");
}

function treeFrame(frame: HeapFrame): TreeFrame {
  const slots = orderedSlots(frame);
  return {
    kind: "tree",
    nodes: slots.map((slot) => ({
      id: `heap-${slot.index}`,
      label: slot.value,
      x: slot.x,
      y: slot.y,
      state: slot.state,
      badge: slot.badge ?? `#${slot.index}`,
    })),
    edges: slots.slice(1).map((slot) => ({
      from: `heap-${Math.floor((slot.index - 1) / 2)}`,
      to: `heap-${slot.index}`,
      state: frame.edgeStates?.[slot.index] ?? (slot.index < frame.heapSize ? "tree" : "idle"),
      label: frame.edgeStates?.[slot.index] === "active" ? "swap" : undefined,
    })),
  };
}

export function HeapView({ frame, className }: HeapViewProps): React.ReactElement {
  const slots = React.useMemo(() => orderedSlots(frame), [frame]);
  const tree = React.useMemo(() => treeFrame(frame), [frame]);
  const arrayViewport = arrayViewportGeometry(slots.length);
  const trackWidth = slots.length * HEAP_CELL_WIDTH + Math.max(0, slots.length - 1) * HEAP_CELL_GAP;
  const visibleWidth =
    ARRAY_VISIBLE_CELL_LIMIT * HEAP_CELL_WIDTH + (ARRAY_VISIBLE_CELL_LIMIT - 1) * HEAP_CELL_GAP;

  return (
    <div
      data-testid="heap-view"
      data-heap-type={frame.heapType}
      data-heap-size={frame.heapSize}
      data-slot-count={slots.length}
      className={cn("w-full min-w-0", className)}
    >
      <span className="sr-only" role="img" aria-label={describe(frame)} />

      <div
        data-testid="heap-tree"
        className="[&_[data-testid=tree-scroll-viewport]]:!max-h-[330px] [&_svg]:!max-h-[320px]"
      >
        <TreeView frame={tree} />
      </div>

      <div className="mt-2 border-t border-hairline pt-2">
        <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
            Backing array
          </span>
          <span className="font-mono text-[11px] tabular-nums text-slate">
            heap size {frame.heapSize}/{slots.length}
          </span>
        </div>
        <div
          data-testid="heap-array-scroll-viewport"
          data-overflow="false"
          data-over-limit={arrayViewport.overflow ? "true" : "false"}
          data-visible-cell-limit={ARRAY_VISIBLE_CELL_LIMIT}
          data-visible-node-limit={TREE_VISIBLE_NODE_LIMIT}
          className={cn("mx-auto w-full", arrayViewport.overflow && "overflow-hidden rounded-lg")}
          style={{ maxWidth: `min(100%, ${arrayViewport.overflow ? visibleWidth : trackWidth}px)` }}
        >
          <div
            className="grid gap-2"
            style={{
              width: `${trackWidth}px`,
              gridTemplateColumns: `repeat(${Math.max(1, slots.length)}, ${HEAP_CELL_WIDTH}px)`,
            }}
          >
            {slots.map((slot) => {
              const swapping = frame.swapPair?.includes(slot.index) ?? false;
              return (
                <div
                  key={slot.index}
                  data-testid="heap-array-cell"
                  data-index={slot.index}
                  data-state={slot.state}
                  data-in-heap={slot.index < frame.heapSize ? "true" : "false"}
                  className="min-w-0 text-center"
                >
                  <span className="font-mono text-[10px] tabular-nums text-slate">
                    {slot.index}
                  </span>
                  <div
                    className={cn(
                      "relative mt-1 flex h-11 items-center justify-center rounded-lg border font-mono text-[16px] tabular-nums transition-[background-color,border-color,color,box-shadow] duration-300 ease-out",
                      CELL_SURFACE[slot.state],
                      swapping && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                    )}
                  >
                    {String(slot.value)}
                    {slot.state !== "idle" ? (
                      <span className="pointer-events-none absolute right-0.5 top-0.5 opacity-80">
                        <StateIcon state={slot.state} size={9} />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {arrayViewport.overflow ? (
          <p className="mt-1 text-center font-mono text-[11px] text-slate">
            Input limit: {ARRAY_VISIBLE_CELL_LIMIT} heap slots
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default HeapView;
