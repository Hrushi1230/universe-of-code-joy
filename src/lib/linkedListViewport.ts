/** Maximum linked-list nodes shown at teaching size in the fixed workspace. */
export const LINKED_LIST_VISIBLE_NODE_LIMIT = 8;

// Leave enough coordinate-space after a rightmost node for its arrow and
// explicit `null` endpoint. The CSS teaching width remains 720px.
const BASE_VIEWBOX_WIDTH = 120;
const BASE_CANVAS_WIDTH = 720;

export interface LinkedListViewportGeometry {
  capacity: number;
  overflow: boolean;
  scale: number;
  viewBoxWidth: number;
  canvasWidth?: number;
  viewportWidth?: number;
}

/** Pure geometry; node coordinates remain deterministic engine data. */
export function linkedListViewportGeometry(
  nodeCount: number,
  nodeSlots: number,
): LinkedListViewportGeometry {
  const capacity = Math.max(0, nodeCount, nodeSlots);
  const overflow = capacity > LINKED_LIST_VISIBLE_NODE_LIMIT;
  const scale = Math.max(1, capacity / LINKED_LIST_VISIBLE_NODE_LIMIT);

  return {
    capacity,
    overflow,
    scale,
    viewBoxWidth: BASE_VIEWBOX_WIDTH * scale,
    ...(overflow
      ? {
          canvasWidth: Math.ceil(BASE_CANVAS_WIDTH * scale),
          viewportWidth: BASE_CANVAS_WIDTH,
        }
      : {}),
  };
}
