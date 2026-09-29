import type { AuxPanel } from "@/engine/types";

export const LINEAR_STRUCTURE_VISIBLE_LIMIT = 8;

export type LinearStructurePanel = Extract<AuxPanel, { kind: "stack" | "queue" }>;
export type LinearStructureItem = LinearStructurePanel["items"][number];

export type LinearStructureEntry =
  | { kind: "item"; item: LinearStructureItem; sourceIndex: number }
  | { kind: "summary"; hiddenCount: number; label: string };

export interface LinearStructureWindow {
  entries: LinearStructureEntry[];
  hiddenCount: number;
  totalCount: number;
}

/**
 * Keep the teaching structure readable without scrolling or shrinking entries.
 * Stacks retain the eight items nearest the top. Queues retain both endpoints,
 * because the next dequeue and the next enqueue must remain visible together.
 */
export function linearStructureWindow(panel: LinearStructurePanel): LinearStructureWindow {
  const totalCount = panel.items.length;
  if (totalCount <= LINEAR_STRUCTURE_VISIBLE_LIMIT) {
    return {
      entries: panel.items.map((item, sourceIndex) => ({ kind: "item", item, sourceIndex })),
      hiddenCount: 0,
      totalCount,
    };
  }

  const hiddenCount = totalCount - LINEAR_STRUCTURE_VISIBLE_LIMIT;
  if (panel.kind === "stack") {
    const firstVisibleIndex = hiddenCount;
    return {
      entries: [
        { kind: "summary", hiddenCount, label: `+${hiddenCount} below` },
        ...panel.items.slice(firstVisibleIndex).map((item, index) => ({
          kind: "item" as const,
          item,
          sourceIndex: firstVisibleIndex + index,
        })),
      ],
      hiddenCount,
      totalCount,
    };
  }

  const endpointCount = LINEAR_STRUCTURE_VISIBLE_LIMIT / 2;
  return {
    entries: [
      ...panel.items.slice(0, endpointCount).map((item, sourceIndex) => ({
        kind: "item" as const,
        item,
        sourceIndex,
      })),
      { kind: "summary", hiddenCount, label: `+${hiddenCount} between` },
      ...panel.items.slice(-endpointCount).map((item, index) => ({
        kind: "item" as const,
        item,
        sourceIndex: totalCount - endpointCount + index,
      })),
    ],
    hiddenCount,
    totalCount,
  };
}
