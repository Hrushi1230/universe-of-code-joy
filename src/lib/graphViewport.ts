/** Fixed-workspace teaching limits from the Phase 3 implementation matrix. */
export const GRAPH_VISIBLE_NODE_LIMIT = 10;
export const GRAPH_VISIBLE_EDGE_LIMIT = 16;

const BASE_CANVAS_WIDTH = 800;
const VIEWPORT_HEIGHT = 420;
const MIN_OVERFLOW_CANVAS_WIDTH = 900;
const MIN_OVERFLOW_CANVAS_HEIGHT = 520;

export interface GraphViewportGeometry {
  overflow: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  viewportHeight?: number;
}

/**
 * Dense graphs enlarge on a local canvas instead of shrinking their nodes or
 * widening the page. Node coordinates stay engine-owned and deterministic.
 */
export function graphViewportGeometry(nodeCount: number, edgeCount: number): GraphViewportGeometry {
  const safeNodes = Math.max(0, nodeCount);
  const safeEdges = Math.max(0, edgeCount);
  const overflow = safeNodes > GRAPH_VISIBLE_NODE_LIMIT || safeEdges > GRAPH_VISIBLE_EDGE_LIMIT;
  if (!overflow) return { overflow: false };

  const scale = Math.max(
    1,
    safeNodes / GRAPH_VISIBLE_NODE_LIMIT,
    safeEdges / GRAPH_VISIBLE_EDGE_LIMIT,
  );
  return {
    overflow: true,
    canvasWidth: Math.max(MIN_OVERFLOW_CANVAS_WIDTH, Math.ceil(BASE_CANVAS_WIDTH * scale)),
    canvasHeight: Math.max(MIN_OVERFLOW_CANVAS_HEIGHT, Math.ceil(VIEWPORT_HEIGHT * scale)),
    viewportHeight: VIEWPORT_HEIGHT,
  };
}
