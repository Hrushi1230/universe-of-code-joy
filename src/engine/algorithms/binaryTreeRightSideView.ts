import { StepBuilder } from "@/engine/builder";
import { parseLevelOrderTree } from "@/engine/algorithms/binaryTreeLevelOrder";
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
const TREE_VIEW_BOX = { minX: -8, minY: -4, width: 156, height: 92 } as const;

const PSEUDOCODE = [
  "function rightSideView(root)",
  "  if root is null: return []",
  "  output <- []; queue <- [root]",
  "  while queue is not empty",
  "    size <- queue.length",
  "    repeat size times with index i",
  "      node <- dequeue",
  "      enqueue node.left when present",
  "      enqueue node.right when present",
  "      if i = size - 1: append node.value",
  "  return output",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function rightSideView(root){",
    "  if(!root)return [];",
    "  const out=[],q=[root];",
    "  while(q.length){",
    "    const size=q.length;",
    "    for(let i=0;i<size;i++){",
    "      const node=q.shift();",
    "      if(node.left)q.push(node.left);",
    "      if(node.right)q.push(node.right);",
    "      if(i===size-1)out.push(node.val);",
    "    }",
    "  } return out;}",
  ],
  ts: [
    "function rightSideView(root:TreeNode|null):number[]{",
    "  if(!root)return [];",
    "  const out:number[]=[],q:TreeNode[]=[root];",
    "  while(q.length){",
    "    const size=q.length;",
    "    for(let i=0;i<size;i++){",
    "      const node=q.shift()!;",
    "      if(node.left)q.push(node.left);",
    "      if(node.right)q.push(node.right);",
    "      if(i===size-1)out.push(node.val);",
    "    }",
    "  } return out;}",
  ],
  py: [
    "def right_side_view(root):",
    "    if not root:return []",
    "    out,q=[],deque([root])",
    "    while q:",
    "        size=len(q)",
    "        for i in range(size):",
    "            node=q.popleft()",
    "            if node.left:q.append(node.left)",
    "            if node.right:q.append(node.right)",
    "            if i==size-1:out.append(node.val)",
    "    return out",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

type ParsedTree = Extract<ReturnType<typeof parseLevelOrderTree>, { ok: true }>["tree"];
type TreeNodeRecord = ParsedTree["nodes"][number];

function position(index: number): { x: number; y: number } {
  const depth = Math.floor(Math.log2(index + 1));
  const first = 2 ** depth - 1;
  const offset = index - first;
  return {
    x: ((offset * 2 + 1) * TREE_WIDTH) / 2 ** (depth + 1),
    y: 10 + depth * 22,
  };
}

function frameFor(
  tree: ParsedTree,
  states: Map<string, CellState>,
  edgeStates: Map<string, EdgeState>,
  selected: Map<string, number>,
): TreeFrame {
  return {
    kind: "tree",
    viewBox: { ...TREE_VIEW_BOX },
    nodes: tree.nodes.map((node) => ({
      id: node.id,
      label: node.value,
      ...position(node.index),
      state: states.get(node.id) ?? "idle",
      ...(selected.has(node.id) ? { badge: `view ${selected.get(node.id)}` } : {}),
    })),
    edges: tree.nodes
      .filter((node) => node.parentId !== null)
      .map((node) => ({
        from: node.parentId!,
        to: node.id,
        state: edgeStates.get(node.id) ?? "idle",
        label: states.get(node.parentId!) === "active" ? (node.side ?? undefined) : undefined,
      })),
  };
}

function auxFor(
  queue: TreeNodeRecord[],
  output: number[],
  positionInLevel: number | null,
  levelSize: number | null,
): AuxPanel[] {
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
      label: "Right-side view",
      rows: [
        { k: "visible", v: output.length ? `[${output.join(", ")}]` : "[]" },
        {
          k: "level position",
          v:
            positionInLevel === null || levelSize === null
              ? "—"
              : `${positionInLevel + 1} / ${levelSize}`,
          highlight: positionInLevel !== null && positionInLevel === levelSize! - 1,
        },
      ],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const tree = parsed["tree"] as ParsedTree;
  const builder = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  const states = new Map<string, CellState>();
  const edgeStates = new Map<string, EdgeState>();
  const selected = new Map<string, number>();
  const output: number[] = [];
  const root = tree.byIndex.get(0);

  if (!root) {
    builder.emit({
      frame: frameFor(tree, states, edgeStates, selected),
      aux: auxFor([], output, null, null),
      codeLine: 2,
      narration: "The root is null, so the right-side view is empty.",
      phase: "done",
      timelineLabel: "Empty tree",
      isMilestone: true,
    });
    return builder.finish("binary-tree-right-side-view", "empty tree", "Right view: []");
  }

  const queue: TreeNodeRecord[] = [root];
  states.set(root.id, "frontier");
  builder.bump("enqueues");
  builder.emit({
    frame: frameFor(tree, states, edgeStates, selected),
    aux: auxFor(queue, output, null, null),
    codeLine: 3,
    narration: `The queue starts with root ${root.value}.`,
    detail: "A frozen queue length will identify the final node encountered at each level.",
    phase: "setup",
    timelineLabel: "Queue root",
    isMilestone: true,
  });

  let level = 0;
  while (queue.length) {
    const size = queue.length;
    builder.emit({
      frame: frameFor(tree, states, edgeStates, selected),
      aux: auxFor(queue, output, null, size),
      codeLine: 5,
      narration: `Level ${level} contains the next ${size} queue ${size === 1 ? "node" : "nodes"}.`,
      detail: "The node at position size - 1 is the rightmost node visible from this level.",
      phase: "start-level",
      timelineLabel: `Start L${level}`,
      isMilestone: true,
    });

    for (let index = 0; index < size; index += 1) {
      const node = queue.shift()!;
      states.set(node.id, "active");
      builder.bump("visits");
      builder.emit({
        frame: frameFor(tree, states, edgeStates, selected),
        aux: auxFor(queue, output, index, size),
        codeLine: 7,
        narration: `Dequeue ${node.value} at position ${index + 1} of ${size} in level ${level}.`,
        detail:
          index === size - 1
            ? "This is the final node in the frozen level, so it is visible from the right."
            : "A later node still exists in this level, so the current node is hidden from the right.",
        phase: "inspect-view-node",
        timelineLabel: "Check visibility",
        isMilestone: true,
      });

      const left = tree.byIndex.get(node.index * 2 + 1);
      const right = tree.byIndex.get(node.index * 2 + 2);
      for (const [child, codeLine] of [
        [left, 8],
        [right, 9],
      ] as const) {
        if (!child) continue;
        queue.push(child);
        states.set(child.id, "frontier");
        edgeStates.set(child.id, "tree");
        builder.bump("enqueues");
        builder.emit({
          frame: frameFor(tree, states, edgeStates, selected),
          aux: auxFor(queue, output, index, size),
          codeLine,
          narration: `Enqueue ${child.value}, the ${child.side} child of ${node.value}.`,
          phase: "enqueue-child",
          timelineLabel: "Enqueue child",
        });
      }

      if (index === size - 1) {
        output.push(node.value);
        selected.set(node.id, level);
        states.set(node.id, "found");
        builder.bump("visibleNodes");
        builder.emit({
          frame: frameFor(tree, states, edgeStates, selected),
          aux: auxFor(queue, output, index, size),
          codeLine: 10,
          narration: `Record ${node.value} as the rightmost value for level ${level}.`,
          detail: `The visible result is now [${output.join(", ")}].`,
          phase: "record-rightmost",
          timelineLabel: `Record L${level}`,
          isMilestone: true,
        });
      } else {
        states.set(node.id, "visited");
      }
    }
    level += 1;
  }

  builder.emit({
    frame: frameFor(tree, states, edgeStates, selected),
    aux: auxFor([], output, null, null),
    codeLine: 11,
    narration: `The queue is empty after ${output.length} ${output.length === 1 ? "level" : "levels"}.`,
    detail: "Exactly the final left-to-right node from each level was recorded.",
    phase: "done",
    timelineLabel: "Return view",
    isMilestone: true,
  });

  return builder.finish(
    "binary-tree-right-side-view",
    `right view [${tree.slots.map((value) => value ?? "null").join(", ")}]`,
    `Right view: ${JSON.stringify(output)}`,
  );
}

export const binaryTreeRightSideViewModule: AlgorithmModule = {
  slug: "binary-tree-right-side-view",
  inputs: [
    {
      name: "tree",
      label: "Level-order tree",
      kind: "text",
      default: "[1,2,3,null,5,null,4]",
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const parsed = parseLevelOrderTree(raw["tree"] ?? "");
    return parsed.ok ? { ok: true, parsed: { tree: parsed.tree } } : parsed;
  },
  run,
  presets: [
    { label: "Classic", values: { tree: "[1,2,3,null,5,null,4]" } },
    { label: "Left chain", values: { tree: "[1,2,null,3]" } },
    { label: "Balanced", values: { tree: "[1,2,3,4,5,6,7]" } },
    { label: "Single node", values: { tree: "[1]" } },
    { label: "Empty", values: { tree: "[]" } },
    {
      label: "Maximum visible",
      values: { tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" },
    },
  ],
};

export default binaryTreeRightSideViewModule;
