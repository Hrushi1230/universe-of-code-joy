import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GraphFrame } from "@/engine/types";
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
  GRAPH_VISIBLE_EDGE_LIMIT,
  GRAPH_VISIBLE_NODE_LIMIT,
  graphViewportGeometry,
} from "@/lib/graphViewport";

export interface GraphViewProps {
  frame: GraphFrame;
  className?: string;
}

function distLabel(dist: number | null | undefined): string {
  if (dist === null || dist === undefined) return "∞";
  if (!Number.isFinite(dist)) return "∞";
  return String(dist);
}

function nodeDetails(node: GraphFrame["nodes"][number]): string[] {
  const parts: string[] = [];
  if (node.dist !== undefined) parts.push(`d=${distLabel(node.dist)}`);
  if (node.parent !== undefined) parts.push(`p=${node.parent ?? "—"}`);
  if (node.indegree !== undefined) parts.push(`in=${node.indegree}`);
  return parts;
}

function edgeLabel(frame: GraphFrame, edge: GraphFrame["edges"][number]): string | null {
  const parts: string[] = [];
  if (frame.weighted && edge.weight !== undefined) parts.push(String(edge.weight));
  if (edge.label) parts.push(edge.label);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function describe(frame: GraphFrame): string {
  const parts: string[] = [
    `${frame.directed ? "Directed" : "Undirected"}${frame.weighted ? " weighted" : ""} graph with ${frame.nodes.length} nodes and ${frame.edges.length} edges.`,
  ];
  const byState: Record<string, string[]> = {};
  for (const n of frame.nodes) {
    if (n.state === "idle") continue;
    (byState[n.state] ??= []).push(n.label);
  }
  for (const [s, list] of Object.entries(byState)) parts.push(`${s}: ${list.join(", ")}.`);
  const withDist = frame.nodes.filter((n) => n.dist !== undefined);
  if (withDist.length > 0) {
    parts.push(`Distances: ${withDist.map((n) => `${n.label} ${distLabel(n.dist)}`).join(", ")}.`);
  }
  const withParent = frame.nodes.filter((n) => n.parent !== undefined);
  if (withParent.length > 0) {
    parts.push(`Parents: ${withParent.map((n) => `${n.label} ${n.parent ?? "none"}`).join(", ")}.`);
  }
  const withIndegree = frame.nodes.filter((n) => n.indegree !== undefined);
  if (withIndegree.length > 0) {
    parts.push(`Indegrees: ${withIndegree.map((n) => `${n.label} ${n.indegree}`).join(", ")}.`);
  }
  for (const edge of frame.edges) {
    if (edge.state === "idle" && edge.weight === undefined && !edge.label) continue;
    const weight = edge.weight === undefined ? "" : ` with weight ${edge.weight}`;
    const label = edge.label ? ` labeled ${edge.label}` : "";
    parts.push(`${edge.state} edge from ${edge.from} to ${edge.to}${weight}${label}.`);
  }
  return parts.join(" ");
}

export function GraphView({ frame, className }: GraphViewProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : { duration: DURATION, ease: EASE };
  const viewport = graphViewportGeometry(frame.nodes.length, frame.edges.length);
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  const pos = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of frame.nodes) map.set(n.id, { x: n.x, y: n.y });
    return map;
  }, [frame.nodes]);

  const markerStates = ["idle", "active", "tree", "rejected"] as const;

  return (
    <div className={cn("w-full", className)}>
      <div
        data-testid="graph-scroll-viewport"
        data-overflow="false"
        data-over-limit={viewport.overflow ? "true" : "false"}
        data-visible-node-limit={GRAPH_VISIBLE_NODE_LIMIT}
        data-visible-edge-limit={GRAPH_VISIBLE_EDGE_LIMIT}
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
          viewBox={VIEW_BOX}
          preserveAspectRatio="xMidYMid meet"
          className={cn("w-full", !viewport.overflow && "h-auto max-h-[420px]")}
          style={
            viewport.overflow
              ? {
                  width: `${viewport.canvasWidth}px`,
                  height: `${viewport.canvasHeight}px`,
                  maxWidth: "none",
                }
              : undefined
          }
        >
          {frame.directed ? (
            <defs>
              {markerStates.map((s) => (
                <marker
                  key={s}
                  id={`arrow-${s}-${uid}`}
                  viewBox="0 0 10 10"
                  refX={9}
                  refY={5}
                  markerWidth={4}
                  markerHeight={4}
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_STROKE[s]} />
                </marker>
              ))}
            </defs>
          ) : null}

          <g>
            {frame.edges.map((e) => {
              const a = pos.get(e.from);
              const b = pos.get(e.to);
              if (!a || !b) return null;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const pad = NODE_R + (frame.directed ? 1.6 : 0.4);
              const x1 = a.x + ux * (NODE_R + 0.4);
              const y1 = a.y + uy * (NODE_R + 0.4);
              const x2 = b.x - ux * pad;
              const y2 = b.y - uy * pad;
              return (
                <motion.line
                  key={`${e.from}-${e.to}`}
                  data-edge-from={e.from}
                  data-edge-to={e.to}
                  data-edge-state={e.state}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={EDGE_STROKE[e.state]}
                  strokeWidth={EDGE_WIDTH[e.state]}
                  strokeLinecap="round"
                  markerEnd={frame.directed ? `url(#arrow-${e.state}-${uid})` : undefined}
                  animate={{ stroke: EDGE_STROKE[e.state] }}
                  transition={transition}
                />
              );
            })}
          </g>

          <g>
            {frame.edges.map((e) => {
              const label = edgeLabel(frame, e);
              if (!label) return null;
              const a = pos.get(e.from);
              const b = pos.get(e.to);
              if (!a || !b) return null;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const w = Math.max(4.4, label.length * 2.15 + 2.4);
              return (
                <g key={`label-${e.from}-${e.to}`}>
                  <rect
                    x={mx - w / 2}
                    y={my - 2.4}
                    width={w}
                    height={4.8}
                    rx={1.6}
                    fill="var(--color-card)"
                    stroke="var(--viz-edge)"
                    strokeWidth={0.3}
                  />
                  <text
                    x={mx}
                    y={my + 1.3}
                    textAnchor="middle"
                    fontSize={3.2}
                    fill="var(--viz-idle-ink)"
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {frame.nodes.map((n) => (
              <g key={n.id} data-node-id={n.id} data-node-x={n.x} data-node-y={n.y}>
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
                {nodeDetails(n).length > 0 ? (
                  <text
                    x={n.x}
                    y={n.y + NODE_R + 4}
                    textAnchor="middle"
                    fontSize={2.6}
                    fill="var(--viz-idle-ink)"
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                  >
                    {nodeDetails(n).map((detail, index) => (
                      <tspan key={detail} x={n.x} dy={index === 0 ? 0 : 3.2}>
                        {detail}
                      </tspan>
                    ))}
                  </text>
                ) : null}
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
          Input limit: {GRAPH_VISIBLE_NODE_LIMIT} nodes and {GRAPH_VISIBLE_EDGE_LIMIT} edges
        </p>
      ) : null}
    </div>
  );
}

export default GraphView;
