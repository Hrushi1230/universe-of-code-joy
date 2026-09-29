/** Maximum array cells shown at once inside the fixed teaching workspace. */
export const ARRAY_VISIBLE_CELL_LIMIT = 12;

const ARRAY_CELL_GAP = 8;
const OVERFLOW_CELL_WIDTH = 80;

export interface ArrayViewportGeometry {
  overflow: boolean;
  trackWidth?: number;
  viewportWidth?: number;
}

/** Pure geometry used by the renderer and the independent family contract test. */
export function arrayViewportGeometry(valueCount: number): ArrayViewportGeometry {
  const count = Math.max(0, valueCount);
  if (count <= ARRAY_VISIBLE_CELL_LIMIT) return { overflow: false };

  return {
    overflow: true,
    trackWidth: count * OVERFLOW_CELL_WIDTH + Math.max(0, count - 1) * ARRAY_CELL_GAP,
    viewportWidth:
      ARRAY_VISIBLE_CELL_LIMIT * OVERFLOW_CELL_WIDTH +
      (ARRAY_VISIBLE_CELL_LIMIT - 1) * ARRAY_CELL_GAP,
  };
}
