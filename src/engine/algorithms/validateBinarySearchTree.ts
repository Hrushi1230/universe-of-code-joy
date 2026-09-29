import { parseLevelOrderTree } from "@/engine/algorithms/binaryTreeLevelOrder";
import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  AuxPanel,
  CallStackPanel,
  CellState,
  CodeLineMap,
  EdgeState,
  RecursionState,
  TreeFrame,
  ValidationResult,
} from "@/engine/types";

const TREE_WIDTH = 140;
const VIEW_BOX = { minX: -8, minY: -4, width: 156, height: 92 } as const;
const PSEUDOCODE = [
  "function isValidBST(node, min, max)",
  "  if node is null: return true",
  "  if node.value <= min or >= max: return false",
  "  validate left subtree with upper bound node.value",
  "  validate right subtree with lower bound node.value",
  "  return true",
] as const;
const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function isValidBST(node,min=-Infinity,max=Infinity){",
    "  if(node===null)return true;",
    "  if(node.val<=min||node.val>=max)return false;",
    "  if(!isValidBST(node.left,min,node.val))return false;",
    "  if(!isValidBST(node.right,node.val,max))return false;",
    "  return true;",
    "}",
  ],
  ts: [
    "function isValidBST(node:TreeNode|null,min=-Infinity,max=Infinity){",
    "  if(node===null)return true;",
    "  if(node.val<=min||node.val>=max)return false;",
    "  if(!isValidBST(node.left,min,node.val))return false;",
    "  if(!isValidBST(node.right,node.val,max))return false;",
    "  return true;",
    "}",
  ],
  py: [
    "def is_valid_bst(node,low=-inf,high=inf):",
    "    if node is None:return True",
    "    if node.val<=low or node.val>=high:return False",
    "    if not is_valid_bst(node.left,low,node.val):return False",
    "    if not is_valid_bst(node.right,node.val,high):return False",
    "    return True",
  ],
};
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6],
  ts: [1, 2, 3, 4, 5, 6],
  py: [1, 2, 3, 4, 5, 6],
};

type ParsedTree = Extract<ReturnType<typeof parseLevelOrderTree>, { ok: true }>["tree"];
type NodeRecord = ParsedTree["nodes"][number];
type Bound = number | null;

function position(index: number) {
  const depth = Math.floor(Math.log2(index + 1));
  const offset = index - (2 ** depth - 1);
  return { x: ((offset * 2 + 1) * TREE_WIDTH) / 2 ** (depth + 1), y: 10 + depth * 22 };
}

function boundText(value: Bound, lower: boolean): string {
  if (value === null) return lower ? "-∞" : "+∞";
  return String(value);
}

function rangeText(min: Bound, max: Bound): string {
  return `(${boundText(min, true)}, ${boundText(max, false)})`;
}

function frameFor(
  tree: ParsedTree,
  states: Map<string, CellState>,
  edges: Map<string, EdgeState>,
): TreeFrame {
  return {
    kind: "tree",
    viewBox: { ...VIEW_BOX },
    nodes: tree.nodes.map((node) => ({
      id: node.id,
      label: node.value,
      ...position(node.index),
      state: states.get(node.id) ?? "idle",
      badge: `L${node.depth}`,
    })),
    edges: tree.nodes
      .filter((node) => node.parentId !== null)
      .map((node) => ({
        from: node.parentId!,
        to: node.id,
        state: edges.get(node.id) ?? "idle",
        label: node.side ?? undefined,
      })),
  };
}

function auxFor(
  frames: CallStackPanel["frames"],
  min: Bound,
  max: Bound,
  value: number | null,
  checks: number,
  result?: string,
  passes?: boolean,
): AuxPanel[] {
  return [
    {
      kind: "keyvalue",
      label: "BST bounds",
      rows: [
        {
          k: "bounds",
          v: `${rangeText(min, max)} | ${
            value === null ? (result ?? "—") : `${value} ${passes === false ? "∉" : "∈"} range`
          } | ${checks} checked`,
          highlight: true,
        },
        { k: "recursion depth", v: String(frames.length) },
      ],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const tree = parsed["tree"] as ParsedTree;
  const builder = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  const states = new Map<string, CellState>();
  const edges = new Map<string, EdgeState>();
  const calls: CallStackPanel["frames"] = [];
  const root = tree.byIndex.get(0);

  if (!root) {
    builder.emit({
      frame: frameFor(tree, states, edges),
      aux: auxFor([], null, null, null, 0, "empty tree"),
      codeLine: 2,
      narration: "The root is null, so the empty tree satisfies the BST rule.",
      detail: "There is no value that can violate a strict lower or upper bound.",
      phase: "done",
      timelineLabel: "Return true",
      isMilestone: true,
    });
    return builder.finish("validate-binary-search-tree", "empty tree", "Valid BST: true");
  }

  builder.emit({
    frame: frameFor(tree, states, edges),
    aux: auxFor([], null, null, null, 0),
    codeLine: 1,
    narration: `Start validating from root ${root.value} with no finite bounds.`,
    detail:
      "Every left descendant must stay below its ancestors, and every right descendant must stay above them.",
    phase: "setup",
    timelineLabel: "Start bounds",
    isMilestone: true,
  });

  let checks = 0;
  let visits = 0;
  let failures = 0;
  let invalidNode: NodeRecord | undefined;

  const visit = (node: NodeRecord, min: Bound, max: Bound): boolean => {
    const left = tree.byIndex.get(node.index * 2 + 1);
    const right = tree.byIndex.get(node.index * 2 + 2);
    const call: CallStackPanel["frames"][number] = {
      id: `call-${node.id}-${calls.length}`,
      call: "isValidBST",
      args: [
        { name: "node", value: String(node.value) },
        { name: "min", value: boundText(min, true) },
        { name: "max", value: boundText(max, false) },
      ],
      state: "active" as RecursionState,
    };
    calls.push(call);
    states.set(node.id, "active");
    if (node.parentId) edges.set(node.id, "tree");
    visits += 1;
    builder.bump("visits");
    builder.emit({
      frame: frameFor(tree, states, edges),
      aux: auxFor(calls, min, max, node.value, checks),
      codeLine: 1,
      narration: `Enter ${node.value} with allowed range ${rangeText(min, max)}.`,
      detail: "The bound comes from every ancestor on the path, not only from the parent.",
      phase: "enter-bst-node",
      timelineLabel: "Enter node",
    });

    checks += 1;
    builder.bump("checks");
    const valid = (min === null || node.value > min) && (max === null || node.value < max);
    builder.emit({
      frame: frameFor(tree, states, edges),
      aux: auxFor(calls, min, max, node.value, checks, undefined, valid),
      codeLine: 3,
      narration: `Check ${node.value} against ${rangeText(min, max)}.`,
      detail: valid
        ? `${node.value} is strictly inside the inherited range.`
        : `${node.value} is outside the inherited range, so this tree is invalid.`,
      phase: "check-bst-node",
      timelineLabel: "Check bounds",
      isMilestone: true,
    });

    if (!valid) {
      failures += 1;
      builder.bump("failures");
      invalidNode = node;
      states.set(node.id, "excluded");
      if (node.parentId) edges.set(node.id, "rejected");
      call.state = "failure";
      call.result = "false";
      builder.emit({
        frame: frameFor(tree, states, edges),
        aux: auxFor(calls, min, max, node.value, checks, "reject node", false),
        codeLine: 3,
        narration: `Reject ${node.value}: it is not strictly inside ${rangeText(min, max)}.`,
        detail: "One bound violation is enough to reject the entire tree.",
        phase: "reject-bst-node",
        timelineLabel: "Reject node",
        isMilestone: true,
      });
      calls.pop();
      return false;
    }

    call.state = "success";
    call.result = "true";
    states.set(node.id, "visited");
    builder.emit({
      frame: frameFor(tree, states, edges),
      aux: auxFor(calls, min, max, node.value, checks, "bounds pass", true),
      codeLine: left ? 4 : right ? 5 : 6,
      narration: `${node.value} passes; its children inherit narrower bounds.`,
      detail:
        left || right
          ? "The left subtree gets an upper bound and the right subtree gets a lower bound."
          : "A leaf adds no further constraints.",
      phase: "accept-bst-node",
      timelineLabel: "Accept bounds",
      isMilestone: true,
    });

    if (left) {
      call.choice = `left < ${node.value}`;
      if (!visit(left, min, node.value)) {
        call.state = "failure";
        call.result = "false";
        builder.emit({
          frame: frameFor(tree, states, edges),
          aux: auxFor(calls, min, max, node.value, checks, "left subtree invalid"),
          codeLine: 4,
          narration: `The left subtree of ${node.value} is invalid, so return false.`,
          detail: "A failed recursive child propagates immediately to its caller.",
          phase: "propagate-bst-failure",
          timelineLabel: "Propagate false",
          isMilestone: true,
        });
        calls.pop();
        return false;
      }
    }
    if (right) {
      call.choice = `right > ${node.value}`;
      if (!visit(right, node.value, max)) {
        call.state = "failure";
        call.result = "false";
        builder.emit({
          frame: frameFor(tree, states, edges),
          aux: auxFor(calls, min, max, node.value, checks, "right subtree invalid"),
          codeLine: 5,
          narration: `The right subtree of ${node.value} is invalid, so return false.`,
          detail: "A failed recursive child propagates immediately to its caller.",
          phase: "propagate-bst-failure",
          timelineLabel: "Propagate false",
          isMilestone: true,
        });
        calls.pop();
        return false;
      }
    }

    call.state = "return";
    call.result = "true";
    builder.emit({
      frame: frameFor(tree, states, edges),
      aux: auxFor(calls, min, max, node.value, checks, "return true"),
      codeLine: 6,
      narration: `Return true from ${node.value}; both subtrees satisfy their bounds.`,
      phase: "return-bst-node",
      timelineLabel: "Return true",
    });
    calls.pop();
    return true;
  };

  const result = visit(root, null, null);
  const validText = result ? "true" : "false";
  builder.emit({
    frame: frameFor(tree, states, edges),
    aux: auxFor(
      [],
      null,
      null,
      null,
      checks,
      result ? "all bounds pass" : `violation at ${invalidNode?.value}`,
    ),
    codeLine: 6,
    narration: result
      ? `All ${visits} nodes satisfy strict BST bounds.`
      : `The tree is invalid because node ${invalidNode?.value ?? "?"} violates an ancestor bound.`,
    detail: result
      ? "Every recursive call returned true."
      : `${failures} bound violation was enough to reject the complete tree.`,
    phase: "done",
    timelineLabel: `Return ${validText}`,
    isMilestone: true,
  });
  return builder.finish(
    "validate-binary-search-tree",
    `validate BST [${tree.slots.map((value) => value ?? "null").join(", ")}]`,
    result ? "Valid BST: true" : `Valid BST: false at node ${invalidNode?.value ?? "?"}`,
  );
}

export const validateBinarySearchTreeModule: AlgorithmModule = {
  slug: "validate-binary-search-tree",
  inputs: [{ name: "tree", label: "Level-order tree", kind: "text", default: "[2,1,3]" }],
  validate(raw: Record<string, string>): ValidationResult {
    const parsed = parseLevelOrderTree(raw["tree"] ?? "");
    return parsed.ok ? { ok: true, parsed: { tree: parsed.tree } } : parsed;
  },
  run,
  presets: [
    { label: "Classic valid", values: { tree: "[2,1,3]" } },
    { label: "Classic invalid", values: { tree: "[5,1,4,null,null,3,6]" } },
    { label: "Balanced valid", values: { tree: "[8,4,12,2,6,10,14]" } },
    { label: "Deep bound violation", values: { tree: "[5,2,8,1,6]" } },
    { label: "Single node", values: { tree: "[1]" } },
    { label: "Empty", values: { tree: "[]" } },
    {
      label: "Maximum visible",
      values: { tree: "[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]" },
    },
  ],
};

export default validateBinarySearchTreeModule;
