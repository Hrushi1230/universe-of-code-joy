import { parseLevelOrderTree } from "@/engine/algorithms/binaryTreeLevelOrder";
import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  AuxPanel,
  CellState,
  CodeLineMap,
  TreeFrame,
  ValidationResult,
} from "@/engine/types";

const W = 140,
  VIEW = { minX: -8, minY: -4, width: 156, height: 92 } as const;
const PSEUDOCODE = [
  "function invertTree(root)",
  "  if root is null: return null",
  "  queue <- [root]",
  "  while queue is not empty",
  "    node <- dequeue",
  "    swap node.left and node.right",
  "    enqueue node.left when present",
  "    enqueue node.right when present",
  "  return root",
] as const;
const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function invertTree(root){",
    "  if(!root)return null;",
    "  const q=[root];",
    "  while(q.length){",
    "    const node=q.shift();",
    "    [node.left,node.right]=[node.right,node.left];",
    "    if(node.left)q.push(node.left);",
    "    if(node.right)q.push(node.right);",
    "  }",
    "  return root;",
    "}",
  ],
  ts: [
    "function invertTree(root:TreeNode|null):TreeNode|null{",
    "  if(!root)return null;",
    "  const q:TreeNode[]=[root];",
    "  while(q.length){",
    "    const node=q.shift()!;",
    "    [node.left,node.right]=[node.right,node.left];",
    "    if(node.left)q.push(node.left);",
    "    if(node.right)q.push(node.right);",
    "  }",
    "  return root;",
    "}",
  ],
  py: [
    "def invert_tree(root):",
    "    if not root:return None",
    "    q=deque([root])",
    "    while q:",
    "        node=q.popleft()",
    "        node.left,node.right=node.right,node.left",
    "        if node.left:q.append(node.left)",
    "        if node.right:q.append(node.right)",
    "    return root",
  ],
};
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 10],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 10],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};
type Parsed = Extract<ReturnType<typeof parseLevelOrderTree>, { ok: true }>["tree"];
type Rec = Parsed["nodes"][number];
type Pair = { left: string | null; right: string | null };
function pos(index: number) {
  const d = Math.floor(Math.log2(index + 1)),
    o = index - (2 ** d - 1);
  return { x: ((o * 2 + 1) * W) / 2 ** (d + 1), y: 10 + d * 22 };
}
function layout(root: string, children: Map<string, Pair>) {
  const slots = new Map<number, string>();
  const walk = (id: string | null, index: number) => {
    if (!id || index > 14) return;
    slots.set(index, id);
    const c = children.get(id);
    if (c) {
      walk(c.left, index * 2 + 1);
      walk(c.right, index * 2 + 2);
    }
  };
  walk(root, 0);
  return slots;
}
function frameFor(
  root: string,
  records: Map<string, Rec>,
  children: Map<string, Pair>,
  states: Map<string, CellState>,
): TreeFrame {
  const slots = layout(root, children);
  const entries = [...slots.entries()].sort((a, b) => a[0] - b[0]);
  return {
    kind: "tree",
    viewBox: { ...VIEW },
    nodes: entries.map(([index, id]) => ({
      id: `s${index}`,
      label: records.get(id)!.value,
      ...pos(index),
      state: states.get(id) ?? "idle",
      badge: `L${Math.floor(Math.log2(index + 1))}`,
    })),
    edges: entries
      .filter(([index]) => index > 0)
      .map(([index, id]) => ({
        from: `s${Math.floor((index - 1) / 2)}`,
        to: `s${index}`,
        state: states.get(id) === "idle" ? "idle" : "tree",
      })),
  };
}
function auxFor(
  queue: Rec[],
  left: Rec | undefined,
  right: Rec | undefined,
  swaps: number,
): AuxPanel[] {
  return [
    {
      kind: "queue",
      label: "Queue (front first)",
      items: queue.map((n, i) => ({
        id: n.id,
        label: String(n.value),
        state: i === 0 ? "active" : "frontier",
      })),
    },
    {
      kind: "keyvalue",
      label: "Invert tree",
      rows: [
        {
          k: "left ↔ right",
          v: `${left ? left.value : "null"} ↔ ${right ? right.value : "null"}`,
        },
        { k: "swaps complete", v: String(swaps), highlight: true },
      ],
    },
  ];
}
function serialize(root: string, records: Map<string, Rec>, children: Map<string, Pair>) {
  const slots = layout(root, children),
    out: Array<number | null> = [];
  for (const [index, id] of slots) out[index] = records.get(id)!.value;
  for (let i = 0; i < out.length; i += 1) if (out[i] === undefined) out[i] = null;
  while (out.at(-1) === null) out.pop();
  return JSON.stringify(out);
}
function run(parsed: Record<string, unknown>): AlgorithmRun {
  const tree = parsed["tree"] as Parsed,
    b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP),
    states = new Map<string, CellState>(),
    records = new Map(tree.nodes.map((n) => [n.id, n])),
    children = new Map<string, Pair>();
  for (const n of tree.nodes)
    children.set(n.id, {
      left: tree.byIndex.get(n.index * 2 + 1)?.id ?? null,
      right: tree.byIndex.get(n.index * 2 + 2)?.id ?? null,
    });
  const root = tree.byIndex.get(0);
  if (!root) {
    b.emit({
      frame: { kind: "tree", viewBox: { ...VIEW }, nodes: [], edges: [] },
      aux: auxFor([], undefined, undefined, 0),
      codeLine: 2,
      narration: "The root is null, so the inverted tree is empty.",
      phase: "done",
      timelineLabel: "Return null",
      isMilestone: true,
    });
    return b.finish("invert-binary-tree", "empty tree", "Inverted: []");
  }
  const q: Rec[] = [root];
  states.set(root.id, "frontier");
  b.bump("enqueues");
  b.emit({
    frame: frameFor(root.id, records, children, states),
    aux: auxFor(
      q,
      records.get(children.get(root.id)!.left!),
      records.get(children.get(root.id)!.right!),
      0,
    ),
    codeLine: 3,
    narration: `Start with root ${root.value} in the queue.`,
    phase: "setup",
    timelineLabel: "Queue root",
    isMilestone: true,
  });
  let swaps = 0;
  while (q.length) {
    const node = q.shift()!,
      pair = children.get(node.id)!;
    states.set(node.id, "active");
    b.bump("visits");
    b.emit({
      frame: frameFor(root.id, records, children, states),
      aux: auxFor(q, records.get(pair.left!), records.get(pair.right!), swaps),
      codeLine: 5,
      narration: `Visit ${node.value}: left is ${pair.left ? records.get(pair.left)!.value : "null"}, right is ${pair.right ? records.get(pair.right)!.value : "null"}.`,
      phase: "inspect-invert-node",
      timelineLabel: "Inspect children",
      isMilestone: true,
    });
    [pair.left, pair.right] = [pair.right, pair.left];
    swaps += 1;
    b.bump("swaps");
    for (const id of [pair.left, pair.right])
      if (id) {
        const child = records.get(id)!;
        q.push(child);
        states.set(id, "frontier");
        b.bump("enqueues");
      }
    states.set(node.id, "found");
    b.emit({
      frame: frameFor(root.id, records, children, states),
      aux: auxFor(q, records.get(pair.left!), records.get(pair.right!), swaps),
      codeLine: 6,
      narration: `Swap ${node.value}'s child links; left is now ${pair.left ? records.get(pair.left)!.value : "null"}, right is now ${pair.right ? records.get(pair.right)!.value : "null"}.`,
      detail: "Whole child subtrees move with their links; node values are never exchanged.",
      phase: "swap-children",
      timelineLabel: "Swap links",
      isMilestone: true,
    });
    states.set(node.id, "visited");
  }
  const output = serialize(root.id, records, children);
  b.emit({
    frame: frameFor(root.id, records, children, states),
    aux: auxFor([], undefined, undefined, swaps),
    codeLine: 9,
    narration: `All ${swaps} ${swaps === 1 ? "node has" : "nodes have"} swapped child links.`,
    detail:
      "Every original left subtree is now on the right and every original right subtree is now on the left.",
    phase: "done",
    timelineLabel: "Return root",
    isMilestone: true,
  });
  return b.finish(
    "invert-binary-tree",
    `invert ${JSON.stringify(tree.slots)}`,
    `Inverted: ${output}`,
  );
}
export const invertBinaryTreeModule: AlgorithmModule = {
  slug: "invert-binary-tree",
  inputs: [{ name: "tree", label: "Level-order tree", kind: "text", default: "[4,2,7,1,3,6,9]" }],
  validate(raw: Record<string, string>): ValidationResult {
    const p = parseLevelOrderTree(raw["tree"] ?? "");
    return p.ok ? { ok: true, parsed: { tree: p.tree } } : p;
  },
  run,
  presets: [
    { label: "Classic", values: { tree: "[4,2,7,1,3,6,9]" } },
    { label: "Sparse", values: { tree: "[2,1,3,null,4]" } },
    { label: "Left chain", values: { tree: "[1,2,null,3]" } },
    { label: "Single node", values: { tree: "[1]" } },
    { label: "Empty", values: { tree: "[]" } },
    { label: "Maximum visible", values: { tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" } },
  ],
};
export default invertBinaryTreeModule;
