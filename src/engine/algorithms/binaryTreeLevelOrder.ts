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

const MAX_NODES = 15;
const MAX_LEVELS = 4;
const TREE_WIDTH = 140;
const TREE_VIEW_BOX = { minX: -8, minY: -4, width: 156, height: 92 } as const;

const PSEUDOCODE = [
  "function levelOrder(root)",
  "  if root is null: return []",
  "  output <- []; queue <- [root]",
  "  while queue is not empty",
  "    level <- []; size <- queue.length",
  "    repeat size times",
  "      node <- dequeue; append node.value",
  "      enqueue node.left when present",
  "      enqueue node.right when present",
  "    append level to output; return output when done",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function levelOrder(root){",
    "  if(!root)return [];",
    "  const out=[],q=[root];",
    "  while(q.length){",
    "    const level=[],size=q.length;",
    "    for(let i=0;i<size;i++){",
    "      const node=q.shift();",
    "      level.push(node.val);",
    "      if(node.left)q.push(node.left);",
    "      if(node.right)q.push(node.right);",
    "    } out.push(level);",
    "  } return out;}",
  ],
  ts: [
    "function levelOrder(root:TreeNode|null):number[][]{",
    "  if(!root)return [];",
    "  const out:number[][]=[],q:TreeNode[]=[root];",
    "  while(q.length){",
    "    const level:number[]=[],size=q.length;",
    "    for(let i=0;i<size;i++){",
    "      const node=q.shift()!;",
    "      level.push(node.val);",
    "      if(node.left)q.push(node.left);",
    "      if(node.right)q.push(node.right);",
    "    } out.push(level);",
    "  } return out;}",
  ],
  py: [
    "def level_order(root):",
    "    if not root:return []",
    "    out,q=[],deque([root])",
    "    while q:",
    "        level=[]",
    "        for _ in range(len(q)):",
    "            node=q.popleft();level.append(node.val)",
    "            if node.left:q.append(node.left)",
    "            if node.right:q.append(node.right)",
    "        out.append(level)",
    "    return out",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11],
  ts: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

interface TreeNodeRecord {
  id: string;
  index: number;
  value: number;
  depth: number;
  parentId: string | null;
  side: "left" | "right" | null;
}

interface ParsedTree {
  slots: Array<number | null>;
  nodes: TreeNodeRecord[];
  byIndex: Map<number, TreeNodeRecord>;
}

export function parseLevelOrderTree(
  raw: string,
): { ok: true; tree: ParsedTree } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text)
    return { ok: false, error: 'Enter a level-order tree such as "[3,9,20,null,null,15,7]".' };

  let decoded: unknown;
  try {
    decoded = JSON.parse(text.startsWith("[") ? text : `[${text}]`);
  } catch {
    return {
      ok: false,
      error: "Use comma-separated integers and null placeholders inside brackets.",
    };
  }
  if (!Array.isArray(decoded)) return { ok: false, error: "The tree input must be an array." };
  const slots = decoded.map((value) => (value === null ? null : Number(value)));
  if (
    slots.some((value) => value !== null && (!Number.isFinite(value) || !Number.isInteger(value)))
  ) {
    return { ok: false, error: "Every tree value must be an integer or null." };
  }
  while (slots.at(-1) === null) slots.pop();
  if (slots.length === 0) return { ok: true, tree: { slots: [], nodes: [], byIndex: new Map() } };
  if (slots[0] === null)
    return { ok: false, error: "A non-empty tree needs a root value at index 0." };

  const nodeCount = slots.filter((value) => value !== null).length;
  if (nodeCount > MAX_NODES) {
    return { ok: false, error: `Use at most ${MAX_NODES} visible tree nodes.` };
  }
  let deepestIndex = 0;
  for (let index = 0; index < slots.length; index += 1) {
    if (slots[index] !== null) deepestIndex = index;
  }
  if (Math.floor(Math.log2(deepestIndex + 1)) + 1 > MAX_LEVELS) {
    return { ok: false, error: `Use at most ${MAX_LEVELS} visible tree levels.` };
  }

  const nodes: TreeNodeRecord[] = [];
  const byIndex = new Map<number, TreeNodeRecord>();
  for (let index = 0; index < slots.length; index += 1) {
    const value = slots[index];
    if (value === null || value === undefined) continue;
    const parentIndex = index === 0 ? -1 : Math.floor((index - 1) / 2);
    if (index > 0 && slots[parentIndex] == null) {
      return {
        ok: false,
        error: `Node ${value} has a null parent at level-order index ${parentIndex}.`,
      };
    }
    const node: TreeNodeRecord = {
      id: `n${index}`,
      index,
      value,
      depth: Math.floor(Math.log2(index + 1)),
      parentId: index === 0 ? null : `n${parentIndex}`,
      side: index === 0 ? null : index % 2 === 1 ? "left" : "right",
    };
    nodes.push(node);
    byIndex.set(index, node);
  }
  return { ok: true, tree: { slots, nodes, byIndex } };
}

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
  levels: Map<string, number>,
): TreeFrame {
  return {
    kind: "tree",
    viewBox: { ...TREE_VIEW_BOX },
    nodes: tree.nodes.map((node) => ({
      id: node.id,
      label: node.value,
      ...position(node.index),
      state: states.get(node.id) ?? "idle",
      ...(levels.has(node.id) ? { badge: `L${levels.get(node.id)}` } : {}),
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

function auxFor(queue: TreeNodeRecord[], output: number[][]): AuxPanel[] {
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
      kind: "log",
      label: "Completed levels",
      lines: output.length
        ? output.map((level, index) => `L${index}: [${level.join(", ")}]`)
        : ["none yet"],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const tree = parsed["tree"] as ParsedTree;
  const builder = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  const states = new Map<string, CellState>();
  const edgeStates = new Map<string, EdgeState>();
  const levels = new Map<string, number>();
  const output: number[][] = [];
  const root = tree.byIndex.get(0);

  if (!root) {
    builder.emit({
      frame: frameFor(tree, states, edgeStates, levels),
      aux: auxFor([], output),
      codeLine: 2,
      narration: "The root is null, so the traversal returns an empty list.",
      phase: "done",
      timelineLabel: "Empty tree",
      isMilestone: true,
    });
    return builder.finish("binary-tree-level-order", "empty tree", "Levels: []");
  }

  const queue: TreeNodeRecord[] = [root];
  states.set(root.id, "frontier");
  levels.set(root.id, 0);
  builder.bump("enqueues");
  builder.emit({
    frame: frameFor(tree, states, edgeStates, levels),
    aux: auxFor(queue, output),
    codeLine: 3,
    narration: `The queue starts with root ${root.value}.`,
    detail: "FIFO order keeps every node from one level ahead of nodes from later levels.",
    phase: "setup",
    timelineLabel: "Queue root",
    isMilestone: true,
  });

  let levelIndex = 0;
  while (queue.length) {
    const size = queue.length;
    const level: number[] = [];
    builder.emit({
      frame: frameFor(tree, states, edgeStates, levels),
      aux: auxFor(queue, output),
      codeLine: 5,
      narration: `Level ${levelIndex} contains the next ${size} queue ${size === 1 ? "node" : "nodes"}.`,
      detail:
        "Capturing the queue length now prevents children added during this pass from entering the same level.",
      phase: "start-level",
      timelineLabel: `Start L${levelIndex}`,
      isMilestone: true,
    });

    for (let count = 0; count < size; count += 1) {
      const node = queue.shift()!;
      states.set(node.id, "active");
      levels.set(node.id, levelIndex);
      level.push(node.value);
      builder.bump("visits");
      const left = tree.byIndex.get(node.index * 2 + 1);
      const right = tree.byIndex.get(node.index * 2 + 2);
      builder.emit({
        frame: frameFor(tree, states, edgeStates, levels),
        aux: auxFor(queue, output),
        codeLine: 7,
        narration: `Dequeue ${node.value} and append it to level ${levelIndex}.`,
        detail: `${left ? "Left child exists" : "No left child"}; ${right ? "right child exists" : "no right child"}.`,
        phase: "inspect-node",
        timelineLabel: "Visit node",
        isMilestone: true,
      });

      for (const [child, codeLine] of [
        [left, 8],
        [right, 9],
      ] as const) {
        if (!child) continue;
        queue.push(child);
        states.set(child.id, "frontier");
        edgeStates.set(child.id, "tree");
        levels.set(child.id, levelIndex + 1);
        builder.bump("enqueues");
        builder.emit({
          frame: frameFor(tree, states, edgeStates, levels),
          aux: auxFor(queue, output),
          codeLine,
          narration: `Enqueue ${child.value}, the ${child.side} child of ${node.value}.`,
          phase: "enqueue-child",
          timelineLabel: "Enqueue child",
        });
      }
      states.set(node.id, "visited");
    }

    output.push(level);
    builder.bump("levels");
    builder.emit({
      frame: frameFor(tree, states, edgeStates, levels),
      aux: auxFor(queue, output),
      codeLine: 10,
      narration: `Level ${levelIndex} is complete: [${level.join(", ")}].`,
      phase: "finish-level",
      timelineLabel: `Finish L${levelIndex}`,
      isMilestone: true,
    });
    levelIndex += 1;
  }

  builder.emit({
    frame: frameFor(tree, states, edgeStates, levels),
    aux: auxFor([], output),
    codeLine: 10,
    narration: `The queue is empty after ${output.length} ${output.length === 1 ? "level" : "levels"}.`,
    detail: "Every node was recorded exactly once in left-to-right FIFO order.",
    phase: "done",
    timelineLabel: "Return levels",
    isMilestone: true,
  });

  return builder.finish(
    "binary-tree-level-order",
    `level order [${tree.slots.map((value) => value ?? "null").join(", ")}]`,
    `Levels: ${JSON.stringify(output)}`,
  );
}

export const binaryTreeLevelOrderModule: AlgorithmModule = {
  slug: "binary-tree-level-order",
  inputs: [
    {
      name: "tree",
      label: "Level-order tree",
      kind: "text",
      default: "[3,9,20,null,null,15,7]",
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const parsed = parseLevelOrderTree(raw["tree"] ?? "");
    return parsed.ok ? { ok: true, parsed: { tree: parsed.tree } } : parsed;
  },
  run,
  presets: [
    { label: "Classic", values: { tree: "[3,9,20,null,null,15,7]" } },
    { label: "Complete", values: { tree: "[1,2,3,4,5,6,7]" } },
    { label: "Sparse", values: { tree: "[1,2,3,4,null,null,7]" } },
    { label: "Single node", values: { tree: "[1]" } },
    { label: "Empty", values: { tree: "[]" } },
    {
      label: "Maximum visible",
      values: { tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" },
    },
  ],
};

export default binaryTreeLevelOrderModule;
