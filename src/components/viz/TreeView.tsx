import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TreeFrame } from "@/engine/types";
import {
  DURATION,
  EASE,
  EDGE_STROKE,
  EDGE_WIDTH,
  FILL,
  INK,
  NODE_R,
  VIEW_BOX,
} from "@/components/viz/tokens";
import { StateIcon } from "@/components/viz/StateIcon";
import {
  TREE_VISIBLE_LEVEL_LIMIT,
  TREE_VISIBLE_NODE_LIMIT,
  treeViewportGeometry,
} from "@/lib/treeViewport";

export interface TreeViewProps {
  frame: TreeFrame;
  className?: string;
}

function describe(frame: TreeFrame): string {
  const parts: string[] = [
    `Tree with ${frame.nodes.length} nodes and ${frame.edges.length} edges.`,
  ];
  const byState: Record<string, string[]> = {};
  for (const n of frame.nodes) {
    if (n.state === "idle") continue;
    (byState[n.state] ??= []).push(String(n.label));
  }
  for (const [s, list] of Object.entries(byState)) parts.push(`${s}: ${list.join(", ")}.`);
  for (const node of frame.nodes) {
    if (node.badge) parts.push(`Node ${String(node.label)} annotation: ${node.badge}.`);
  }
  for (const edge of frame.edges) {
    if (edge.state === "idle" && !edge.label) continue;
    const label = edge.label ? ` labeled ${edge.label}` : "";
    parts.push(`${edge.state} edge from ${edge.from} to ${edge.to}${label}.`);
  }
  const treeEdges = frame.edges.filter((e) => e.state === "tree").length;
  if (treeEdges > 0) parts.push(`${treeEdges} edges included in the traversal.`);
  return parts.join(" ");
}

export function TreeView({ frame, className }: TreeViewProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : { duration: DURATION, ease: EASE };
  const viewport = treeViewportGeometry(frame.nodes);
  const canvasViewBox = frame.viewBox
    ? `${frame.viewBox.minX} ${frame.viewBox.minY} ${frame.viewBox.width} ${frame.viewBox.height}`
    : VIEW_BOX;
  const pos = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of frame.nodes) map.set(n.id, { x: n.x, y: n.y });
    return map;
  }, [frame.nodes]);

  return (
    <div className={cn("w-full", className)}>
      <div
        data-testid="tree-scroll-viewport"
        data-overflow="false"
        data-over-limit={viewport.overflow ? "true" : "false"}
        data-visible-node-limit={TREE_VISIBLE_NODE_LIMIT}
        data-visible-level-limit={TREE_VISIBLE_LEVEL_LIMIT}
        className={cn("w-full", viewport.overflow && "overflow-hidden rounded-lg")}
        style={
          viewport.overflow && viewport.viewportHeight
            ? { maxHeight: `${viewport.viewportHeight}px` }
            : undefined
        }
      >
        <svg
          role="img"
          aria-label={describe(frame)}
          viewBox={canvasViewBox}
          preserveAspectRatio="xMidYMid meet"
          className={cn("h-auto w-full", !viewport.overflow && "max-h-[420px]")}
          style={
            viewport.overflow
              ? {
                  minWidth: `${viewport.canvasWidth}px`,
                  minHeight: `${viewport.canvasHeight}px`,
                }
              : undefined
          }
        >
          <g>
            {frame.edges.map((e) => {
              const a = pos.get(e.from);
              const b = pos.get(e.to);
              if (!a || !b) return null;
              return (
                <motion.line
                  key={`${e.from}-${e.to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={EDGE_STROKE[e.state]}
                  strokeWidth={EDGE_WIDTH[e.state]}
                  strokeLinecap="round"
                  animate={{ stroke: EDGE_STROKE[e.state] }}
                  transition={transition}
                />
              );
            })}
          </g>
          <g>
            {frame.edges.map((e) => {
              if (!e.label) return null;
              const a = pos.get(e.from);
              const b = pos.get(e.to);
              if (!a || !b) return null;
              return (
                <text
                  key={`l-${e.from}-${e.to}`}
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 1}
                  textAnchor="middle"
                  fontSize={3}
                  fill="var(--viz-idle-ink)"
                  style={{ fontFamily: "var(--font-mono, monospace)" }}
                >
                  {e.label}
                </text>
              );
            })}
          </g>
          <g>
            {frame.nodes.map((n) => (
              <g key={n.id}>
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={NODE_R}
                  fill={FILL[n.state]}
                  stroke="var(--viz-edge)"
                  strokeWidth={0.5}
                  animate={{ fill: FILL[n.state] }}
                  transition={transition}
                />
                <text
                  x={n.x}
                  y={n.y + 1.4}
                  textAnchor="middle"
                  fontSize={4}
                  fill={INK[n.state]}
                  style={{ fontFamily: "var(--font-mono, monospace)" }}
                >
                  {n.label}
                </text>
                {n.state !== "idle" ? (
                  <g transform={`translate(${n.x - NODE_R - 2}, ${n.y - NODE_R - 2})`}>
                    <circle
                      cx={1.8}
                      cy={1.8}
                      r={2.2}
                      fill="var(--color-card)"
                      stroke="var(--viz-edge)"
                      strokeWidth={0.3}
                    />
                    <g transform="translate(0.3, 0.3)">
                      <StateIcon state={n.state} size={3} color={INK[n.state]} />
                    </g>
                  </g>
                ) : null}
                {n.badge ? (
                  <g>
                    <rect
                      x={n.x + 2.4}
                      y={n.y - NODE_R - 3.4}
                      width={Math.max(4.6, String(n.badge).length * 2.2 + 2)}
                      height={4.4}
                      rx={2.2}
                      fill="var(--viz-frontier)"
                      stroke="var(--viz-edge)"
                      strokeWidth={0.3}
                    />
                    <text
                      x={n.x + 2.4 + Math.max(4.6, String(n.badge).length * 2.2 + 2) / 2}
                      y={n.y - NODE_R - 0.2}
                      textAnchor="middle"
                      fontSize={2.8}
                      fill="var(--viz-frontier-ink)"
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                    >
                      {n.badge}
                    </text>
                  </g>
                ) : null}
              </g>
            ))}
          </g>
        </svg>
      </div>
      {viewport.overflow ? (
        <p className="mt-1.5 text-center font-mono text-[11px] text-slate">
          Input limit: {TREE_VISIBLE_NODE_LIMIT} nodes and {TREE_VISIBLE_LEVEL_LIMIT} levels
        </p>
      ) : null}
    </div>
  );
}

export default TreeView;
