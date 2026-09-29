import * as React from "react";
import type { Frame } from "@/engine/types";
import { ArrayView } from "@/components/viz/ArrayView";
import { RainWaterView } from "@/components/viz/RainWaterView";
import { TreeView } from "@/components/viz/TreeView";
import { HeapView } from "@/components/viz/HeapView";
import { LinkedListView } from "@/components/viz/LinkedListView";
import { GraphView } from "@/components/viz/GraphView";
import { GridView } from "@/components/viz/GridView";
import { TableView } from "@/components/viz/TableView";

export interface FrameViewProps {
  frame: Frame;
  className?: string;
}

export function FrameView({ frame, className }: FrameViewProps): React.ReactElement {
  switch (frame.kind) {
    case "array":
      return frame.rainWater ? (
        <RainWaterView frame={frame} className={className} />
      ) : (
        <ArrayView frame={frame} className={className} />
      );
    case "tree":
      return <TreeView frame={frame} className={className} />;
    case "heap":
      return <HeapView frame={frame} className={className} />;
    case "linked-list":
      return <LinkedListView frame={frame} className={className} />;
    case "graph":
      return <GraphView frame={frame} className={className} />;
    case "grid":
      return <GridView frame={frame} className={className} />;
    case "table":
      return <TableView frame={frame} className={className} />;
  }
}

export default FrameView;
