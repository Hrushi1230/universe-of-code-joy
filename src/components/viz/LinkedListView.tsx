import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { StateIcon } from "@/components/viz/StateIcon";
import { DURATION, EASE, EDGE_STROKE, EDGE_WIDTH, FILL, INK } from "@/components/viz/tokens";
import type { LinkedListFrame } from "@/engine/types";
import {
  LINKED_LIST_VISIBLE_NODE_LIMIT,
  linkedListViewportGeometry,
} from "@/lib/linkedListViewport";
import { cn } from "@/lib/utils";

const VIEWBOX_HEIGHT = 64;
const NODE_WIDTH = 14;
const NODE_HEIGHT = 10;

export interface LinkedListViewProps {
  frame: LinkedListFrame;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface LinkGeometry {
  path: string;
  labelX: number;
  labelY: number;
  nullPoint?: Point;
}

function describe(frame: LinkedListFrame): string {
  const parts = [
    `Linked list with ${frame.nodes.length} nodes, ${frame.links.length} links, and ${frame.pointers.length} pointers.`,
  ];
  const pointers = frame.pointers.map(
    (pointer) => `${pointer.name} at ${pointer.nodeId ?? "null"}`,
  );
  if (pointers.length > 0) parts.push(`Pointers: ${pointers.join(", ")}.`);
  for (const link of frame.links) {
    parts.push(
      `${link.detached ? "Detached" : link.state} link ${link.id} from ${link.from} to ${link.to ?? "null"}${link.label ? ` labeled ${link.label}` : ""}.`,
    );
  }
  return parts.join(" ");
}

function pointerColor(color: LinkedListFrame["pointers"][number]["color"]): string {
  switch (color) {
    case "warning":
      return "var(--viz-frontier-ink)";
    case "error":
      return "var(--viz-compare)";
    default:
      return "var(--viz-edge-active)";
  }
}

function geometryForLink(from: Point, to: Point | null): LinkGeometry {
  if (!to) {
    const nullPoint = { x: from.x + 15, y: from.y };
    return {
      path: `M ${from.x + NODE_WIDTH / 2} ${from.y} L ${nullPoint.x - 3} ${nullPoint.y}`,
      labelX: from.x + 10,
      labelY: from.y - 2,
      nullPoint,
    };
  }

  const goesRight = to.x >= from.x;
  const startX = from.x + (goesRight ? NODE_WIDTH / 2 : -NODE_WIDTH / 2);
  const endX = to.x + (goesRight ? -NODE_WIDTH / 2 : NODE_WIDTH / 2);
  const sameRow = Math.abs(to.y - from.y) < 0.5;
  if (sameRow && goesRight) {
    return {
      path: `M ${startX} ${from.y} L ${endX} ${to.y}`,
      labelX: (startX + endX) / 2,
      labelY: from.y - 2,
    };
  }

  if (sameRow) {
    const bendY = Math.min(VIEWBOX_HEIGHT - 4, from.y + 11 + Math.abs(to.x - from.x) * 0.08);
    return {
      path: `M ${startX} ${from.y} C ${startX} ${bendY}, ${endX} ${bendY}, ${endX} ${to.y}`,
      labelX: (startX + endX) / 2,
      labelY: bendY + 2.5,
    };
  }

  const middleX = (startX + endX) / 2;
  return {
    path: `M ${startX} ${from.y} C ${middleX} ${from.y}, ${middleX} ${to.y}, ${endX} ${to.y}`,
    labelX: middleX,
    labelY: (from.y + to.y) / 2 - 2,
  };
}

export function LinkedListView({ frame, className }: LinkedListViewProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false;
  const transition = reduced ? { duration: 0 } : { duration: DURATION, ease: EASE };
  const viewport = linkedListViewportGeometry(frame.nodes.length, frame.nodeSlots);
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const positions = React.useMemo(() => {
    const map = new Map<string, Point>();
    for (const node of frame.nodes) {
      map.set(node.id, { x: node.x * viewport.scale, y: node.y });
    }
    return map;
  }, [frame.nodes, viewport.scale]);
  const pointerLanes = React.useMemo(() => {
    const grouped = new Map<string, number>();
    return frame.pointers.map((pointer) => {
      if (pointer.nodeId === null) return 0;
      const lane = grouped.get(pointer.nodeId) ?? 0;
      grouped.set(pointer.nodeId, lane + 1);
      return lane;
    });
  }, [frame.pointers]);

  return (
    <div className={cn("w-full", className)}>
      <div
        data-testid="linked-list-scroll-viewport"
        data-overflow="false"
        data-over-limit={viewport.overflow ? "true" : "false"}
        data-visible-node-limit={LINKED_LIST_VISIBLE_NODE_LIMIT}
        data-node-slots={viewport.capacity}
        className={cn("w-full", viewport.overflow && "overflow-hidden rounded-lg")}
        style={
          viewport.overflow && viewport.viewportWidth
            ? { maxWidth: `${viewport.viewportWidth}px` }
            : undefined
        }
      >
        <svg
          role="img"
          aria-label={describe(frame)}
          viewBox={`0 0 ${viewport.viewBoxWidth} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto max-h-[320px] w-full"
          style={
            viewport.overflow && viewport.canvasWidth
              ? { minWidth: `${viewport.canvasWidth}px` }
              : undefined
          }
        >
          <defs>
            {(["idle", "active", "tree", "rejected"] as const).map((state) => (
              <marker
                key={state}
                id={`linked-arrow-${state}-${uid}`}
                viewBox="0 0 10 10"
                refX={9}
                refY={5}
                markerWidth={4}
                markerHeight={4}
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_STROKE[state]} />
              </marker>
            ))}
          </defs>

          <g>
            {frame.links.map((link) => {
              const from = positions.get(link.from);
              if (!from) return null;
              const to = link.to === null ? null : positions.get(link.to);
              if (link.to !== null && !to) return null;
              const geometry = geometryForLink(from, to ?? null);
              return (
                <g key={link.id} data-link-id={link.id} data-detached={link.detached || undefined}>
                  <motion.path
                    d={geometry.path}
                    fill="none"
                    stroke={EDGE_STROKE[link.state]}
                    strokeWidth={EDGE_WIDTH[link.state]}
                    strokeLinecap="round"
                    strokeDasharray={link.detached ? "2 1.5" : undefined}
                    markerEnd={`url(#linked-arrow-${link.state}-${uid})`}
                    opacity={link.detached ? 0.62 : 1}
                    animate={{ stroke: EDGE_STROKE[link.state] }}
                    transition={transition}
                  />
                  {link.detached ? (
                    <text
                      x={geometry.labelX}
                      y={geometry.labelY}
                      textAnchor="middle"
                      fontSize={4}
                      fill="var(--viz-compare)"
                      aria-hidden="true"
                    >
                      ×
                    </text>
                  ) : null}
                  {link.label ? (
                    <text
                      x={geometry.labelX}
                      y={geometry.labelY - (link.detached ? 3 : 0)}
                      textAnchor="middle"
                      fontSize={2.7}
                      fill="var(--viz-idle-ink)"
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                    >
                      {link.label}
                    </text>
                  ) : null}
                  {geometry.nullPoint ? (
                    <text
                      x={geometry.nullPoint.x}
                      y={geometry.nullPoint.y + 1.2}
                      textAnchor="middle"
                      fontSize={3}
                      fill="var(--viz-idle-ink)"
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                    >
                      null
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>

          <g>
            {frame.nodes.map((node) => {
              const point = positions.get(node.id)!;
              return (
                <g key={node.id} data-node-id={node.id} data-node-x={node.x} data-node-y={node.y}>
                  <motion.rect
                    x={point.x - NODE_WIDTH / 2}
                    y={point.y - NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={3}
                    fill={FILL[node.state]}
                    stroke="var(--viz-edge)"
                    strokeWidth={0.5}
                    animate={{ fill: FILL[node.state] }}
                    transition={transition}
                  />
                  <text
                    x={point.x}
                    y={point.y + 1.4}
                    textAnchor="middle"
                    fontSize={4}
                    fill={INK[node.state]}
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                  >
                    {node.label}
                  </text>
                  {node.state !== "idle" ? (
                    <g
                      transform={`translate(${point.x - NODE_WIDTH / 2 - 2}, ${point.y - NODE_HEIGHT / 2 - 2})`}
                    >
                      <circle
                        cx={1.8}
                        cy={1.8}
                        r={2.2}
                        fill="var(--color-card)"
                        stroke="var(--viz-edge)"
                        strokeWidth={0.3}
                      />
                      <g transform="translate(0.3, 0.3)">
                        <StateIcon state={node.state} size={3} color={INK[node.state]} />
                      </g>
                    </g>
                  ) : null}
                  {node.badge ? (
                    <text
                      x={point.x}
                      y={point.y + NODE_HEIGHT / 2 + 4}
                      textAnchor="middle"
                      fontSize={2.7}
                      fill="var(--viz-idle-ink)"
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                    >
                      {node.badge}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>

          <g>
            {frame.pointers.map((pointer, index) => {
              if (pointer.nodeId === null) {
                return (
                  <text
                    key={`${pointer.name}-${index}`}
                    x={7 + index * 14}
                    y={61}
                    fontSize={2.8}
                    fill={pointerColor(pointer.color)}
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                  >
                    {pointer.name} → null
                  </text>
                );
              }
              const point = positions.get(pointer.nodeId);
              if (!point) return null;
              const lane = pointerLanes[index] ?? 0;
              const labelY = point.y - NODE_HEIGHT / 2 - 5 - lane * 5.2;
              const width = Math.max(8, pointer.name.length * 2.1 + 4);
              const color = pointerColor(pointer.color);
              return (
                <g key={`${pointer.name}-${index}`} data-pointer={pointer.name}>
                  <line
                    x1={point.x}
                    y1={labelY + 2.4}
                    x2={point.x}
                    y2={point.y - NODE_HEIGHT / 2 - 0.6}
                    stroke={color}
                    strokeWidth={0.45}
                    strokeLinecap="round"
                  />
                  <rect
                    x={point.x - width / 2}
                    y={labelY - 2.2}
                    width={width}
                    height={4.6}
                    rx={2.3}
                    fill="var(--color-card)"
                    stroke={color}
                    strokeWidth={0.35}
                  />
                  <text
                    x={point.x}
                    y={labelY + 1}
                    textAnchor="middle"
                    fontSize={2.7}
                    fill={color}
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                  >
                    {pointer.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {viewport.overflow ? (
        <p className="mt-1.5 text-center font-mono text-[11px] text-slate">
          Input limit: {LINKED_LIST_VISIBLE_NODE_LIMIT} nodes
        </p>
      ) : null}
    </div>
  );
}

export default LinkedListView;
