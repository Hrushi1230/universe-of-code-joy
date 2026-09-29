import { parseLevelOrderTree } from "@/engine/algorithms/binaryTreeLevelOrder";
import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  AuxPanel,
  CellState,
  CodeLineMap,
  EdgeState,
  TreeFrame,
  ValidationResult,
} from "@/engine/types";

const TREE_WIDTH = 140;
const VIEW_BOX = { minX: -8, minY: -4, width: 156, height: 92 } as const;
const PSEUDOCODE = [
  "function maxDepth(root)",
  "  if root is null: return 0",
  "  depth <- 0; queue <- [root]",
  "  while queue is not empty",
  "    size <- queue.length",
  "    repeat size times",
  "      node <- dequeue",
  "      enqueue node.left when present",
  "      enqueue node.right when present",
  "    depth <- depth + 1",
  "  return depth",
] as const;
const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function maxDepth(root){",
    "  if(!root)return 0;",
    "  let depth=0;const q=[root];",
    "  while(q.length){",
    "    const size=q.length;",
    "    for(let i=0;i<size;i++){",
    "      const node=q.shift();",
    "      if(node.left)q.push(node.left);",
    "      if(node.right)q.push(node.right);",
    "    }",
    "    depth++;",
    "  } return depth;}",
  ],
  ts: [
    "function maxDepth(root:TreeNode|null):number{",
    "  if(!root)return 0;",
    "  let depth=0;const q:TreeNode[]=[root];",
    "  while(q.length){",
    "    const size=q.length;",
    "    for(let i=0;i<size;i++){",
    "      const node=q.shift()!;",
    "      if(node.left)q.push(node.left);",
    "      if(node.right)q.push(node.right);",
    "    }",
    "    depth++;",
    "  } return depth;}",
  ],
  py: [
    "def max_depth(root):",
    "    if not root:return 0",
    "    depth,q=0,deque([root])",
    "    while q:",
    "        for _ in range(len(q)):",
    "            node=q.popleft()",
    "            if node.left:q.append(node.left)",
    "            if node.right:q.append(node.right)",
    "        depth+=1",
    "    return depth",
  ],
};
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10],
};
type ParsedTree = Extract<ReturnType<typeof parseLevelOrderTree>, { ok: true }>["tree"];
type NodeRecord = ParsedTree["nodes"][number];

function position(index: number) {
  const depth = Math.floor(Math.log2(index + 1));
  const offset = index - (2 ** depth - 1);
  return { x: ((offset * 2 + 1) * TREE_WIDTH) / 2 ** (depth + 1), y: 10 + depth * 22 };
}
function frameFor(
  tree: ParsedTree,
  states: Map<string, CellState>,
  edges: Map<string, EdgeState>,
  levels: Map<string, number>,
): TreeFrame {
  return {
    kind: "tree",
    viewBox: { ...VIEW_BOX },
    nodes: tree.nodes.map((node) => ({
      id: node.id,
      label: node.value,
      ...position(node.index),
      state: states.get(node.id) ?? "idle",
      ...(levels.has(node.id) ? { badge: `L${levels.get(node.id)}` } : {}),
    })),
    edges: tree.nodes
      .filter((node) => node.parentId)
      .map((node) => ({ from: node.parentId!, to: node.id, state: edges.get(node.id) ?? "idle" })),
  };
}
function auxFor(queue: NodeRecord[], depth: number): AuxPanel[] {
  return [
    {
      kind: "queue",
      label: "Queue (front first)",
      items: queue.map((node, index) => ({
        id: node.id,
        label: String(node.value),
        state: index === 0 ? "active" : "frontier",
      })),
    },
    {
      kind: "keyvalue",
      label: "Maximum depth",
      rows: [
        { k: "levels complete", v: String(depth), highlight: true },
        { k: "next level nodes", v: String(queue.length) },
      ],
    },
  ];
}
function run(parsed: Record<string, unknown>): AlgorithmRun {
  const tree = parsed["tree"] as ParsedTree;
  const builder = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  const states = new Map<string, CellState>(),
    edges = new Map<string, EdgeState>(),
    levels = new Map<string, number>();
  const root = tree.byIndex.get(0);
  if (!root) {
    builder.emit({
      frame: frameFor(tree, states, edges, levels),
      aux: auxFor([], 0),
      codeLine: 2,
      narration: "The root is null, so the maximum depth is 0.",
      phase: "done",
      timelineLabel: "Return 0",
      isMilestone: true,
    });
    return builder.finish("maximum-depth-of-binary-tree", "empty tree", "Maximum depth: 0");
  }
  const queue: NodeRecord[] = [root];
  states.set(root.id, "frontier");
  levels.set(root.id, 0);
  builder.bump("enqueues");
  builder.emit({
    frame: frameFor(tree, states, edges, levels),
    aux: auxFor(queue, 0),
    codeLine: 3,
    narration: `The queue starts with root ${root.value}; no level is complete yet.`,
    phase: "setup",
    timelineLabel: "Queue root",
    isMilestone: true,
  });
  let depth = 0;
  while (queue.length) {
    const size = queue.length;
    builder.emit({
      frame: frameFor(tree, states, edges, levels),
      aux: auxFor(queue, depth),
      codeLine: 5,
      narration: `The next ${size} queue ${size === 1 ? "node" : "nodes"} form level ${depth}.`,
      detail: "Capturing size keeps children in the next level.",
      phase: "start-level",
      timelineLabel: `Start L${depth}`,
      isMilestone: true,
    });
    for (let i = 0; i < size; i += 1) {
      const node = queue.shift()!;
      states.set(node.id, "active");
      builder.bump("visits");
      for (const child of [
        tree.byIndex.get(node.index * 2 + 1),
        tree.byIndex.get(node.index * 2 + 2),
      ])
        if (child) {
          queue.push(child);
          states.set(child.id, "frontier");
          edges.set(child.id, "tree");
          levels.set(child.id, depth + 1);
          builder.bump("enqueues");
        }
      builder.emit({
        frame: frameFor(tree, states, edges, levels),
        aux: auxFor(queue, depth),
        codeLine: 7,
        narration: `Visit ${node.value} in level ${depth} and enqueue its existing children.`,
        phase: "inspect-depth-node",
        timelineLabel: "Visit node",
      });
      states.set(node.id, "visited");
    }
    depth += 1;
    builder.bump("levels");
    builder.emit({
      frame: frameFor(tree, states, edges, levels),
      aux: auxFor(queue, depth),
      codeLine: 10,
      narration: `Level ${depth - 1} is complete, so depth becomes ${depth}.`,
      detail: queue.length
        ? `${queue.length} ${queue.length === 1 ? "node waits" : "nodes wait"} in the next level.`
        : "No queued node remains, so this depth is final.",
      phase: "finish-depth-level",
      timelineLabel: `Depth ${depth}`,
      isMilestone: true,
    });
  }
  builder.emit({
    frame: frameFor(tree, states, edges, levels),
    aux: auxFor([], depth),
    codeLine: 11,
    narration: `The queue is empty after ${depth} ${depth === 1 ? "level" : "levels"}.`,
    detail: "Each completed breadth-first layer contributes exactly one to maximum depth.",
    phase: "done",
    timelineLabel: "Return depth",
    isMilestone: true,
  });
  return builder.finish(
    "maximum-depth-of-binary-tree",
    `maximum depth [${tree.slots.map((v) => v ?? "null").join(", ")}]`,
    `Maximum depth: ${depth}`,
  );
}
export const maximumDepthBinaryTreeModule: AlgorithmModule = {
  slug: "maximum-depth-of-binary-tree",
  inputs: [
    { name: "tree", label: "Level-order tree", kind: "text", default: "[3,9,20,null,null,15,7]" },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const parsed = parseLevelOrderTree(raw["tree"] ?? "");
    return parsed.ok ? { ok: true, parsed: { tree: parsed.tree } } : parsed;
  },
  run,
  presets: [
    { label: "Classic", values: { tree: "[3,9,20,null,null,15,7]" } },
    { label: "Skewed", values: { tree: "[1,2,null,3]" } },
    { label: "Balanced", values: { tree: "[1,2,3,4,5,6,7]" } },
    { label: "Single node", values: { tree: "[1]" } },
    { label: "Empty", values: { tree: "[]" } },
    { label: "Maximum visible", values: { tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" } },
  ],
};
export default maximumDepthBinaryTreeModule;
