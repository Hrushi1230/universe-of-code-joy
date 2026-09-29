import type { TreeFrame } from "@/engine/types";

/** Fixed-workspace teaching limits from the Phase 3 implementation matrix. */
export const TREE_VISIBLE_NODE_LIMIT = 15;
export const TREE_VISIBLE_LEVEL_LIMIT = 4;

const BASE_CANVAS_WIDTH = 800;
const MIN_OVERFLOW_CANVAS_WIDTH = 900;
const LEVEL_HEIGHT = 105;
const VIEWPORT_HEIGHT = 420;

export interface TreeViewportGeometry {
  levelCount: number;
  overflow: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  viewportHeight?: number;
}

/** Count engine-owned horizontal levels without assuming heap-style node ids. */
export function treeLevelCount(nodes: TreeFrame["nodes"]): number {
  return new Set(nodes.map((node) => Math.round(node.y * 10) / 10)).size;
}

/**
 * Large or deeply skewed trees enlarge on a local canvas instead of shrinking
 * every node or widening the page. The renderer owns only viewport geometry;
 * node coordinates remain deterministic engine data.
 */
export function treeViewportGeometry(nodes: TreeFrame["nodes"]): TreeViewportGeometry {
  const levelCount = treeLevelCount(nodes);
  const overflow = nodes.length > TREE_VISIBLE_NODE_LIMIT || levelCount > TREE_VISIBLE_LEVEL_LIMIT;
  if (!overflow) return { levelCount, overflow: false };

  const widthScale = Math.max(1, nodes.length / TREE_VISIBLE_NODE_LIMIT);
  return {
    levelCount,
    overflow: true,
    canvasWidth: Math.max(MIN_OVERFLOW_CANVAS_WIDTH, Math.ceil(BASE_CANVAS_WIDTH * widthScale)),
    canvasHeight: Math.max(VIEWPORT_HEIGHT + 1, levelCount * LEVEL_HEIGHT),
    viewportHeight: VIEWPORT_HEIGHT,
  };
}
