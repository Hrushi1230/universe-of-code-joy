import type { ArrayFrame, Step, TreeFrame } from "@/engine/types";

/**
 * Pure derivation of "predict before reveal" checkpoints for the Golden
 * Visualizer.
 *
 * Everything here comes from semantic engine state — `comparison`, `pointers`,
 * `ranges` and the *next* step's pointer diff. Authored English (`"Discard the
 * left half"`, `"lo moves to 5"`) is never parsed, and no algorithm slug is
 * inspected: a checkpoint exists because the run contains a branch comparison
 * followed by a boundary move, nothing else.
 *
 * Deterministic by construction — no randomness anywhere — so Replay, Previous,
 * seek, custom input and tests all agree about where checkpoints are.
 *
 * Architecture constraint: pure functions only. No React, DOM or stores, and no
 * engine schema additions.
 */

export type PredictionOptionId =
  | "move-low"
  | "move-high"
  | "return-mid"
  | "not-found"
  | "swap-low"
  | "advance-mid"
  | "swap-high"
  | "advance-left"
  | "retreat-right"
  | "advance-both"
  | "return-pair"
  | "process-left"
  | "process-right"
  | "return-water"
  | "skip-left"
  | "skip-right"
  | "return-false"
  | "copy-value"
  | "skip-zero"
  | "write-zero"
  | "copy-unique"
  | "skip-duplicate"
  | "advance-write"
  | "record-triplet"
  | "skip-anchor"
  | "enqueue-both"
  | "enqueue-left"
  | "enqueue-right"
  | "enqueue-none"
  | "record-rightmost"
  | "skip-current"
  | "continue-depth"
  | "return-depth"
  | "swap-links"
  | "keep-links"
  | "swap-values"
  | "accept-bst-node"
  | "reject-bst-node"
  | "check-parent-bound";

export interface PredictionOption {
  id: PredictionOptionId;
  /** Short, code-shaped label, e.g. `low = mid + 1`. */
  label: string;
}

export interface Prediction {
  /** Stable id: same run, same checkpoint, same id. */
  id: string;
  question: string;
  /** Evidence the learner may reason from — never the answer. */
  context: string[];
  options: PredictionOption[];
  correctOptionId: PredictionOptionId;
  /** Why the correct option follows from the comparison. */
  explanation: string;
  /** Per-option copy naming the misconception behind a wrong choice. */
  misconceptionFeedback: Record<string, string>;
  /** One sentence a screen reader hears when the gate opens. */
  accessiblePrompt: string;
}

export interface PredictionCheckpoint {
  id: string;
  /** Canonical player step index this checkpoint is attached to. */
  stepIndex: number;
}

/** Boundary pointer names an array algorithm may expose. */
const LOW_NAMES = ["lo", "low", "l", "left"] as const;
const HIGH_NAMES = ["hi", "high", "r", "right"] as const;

function asArrayFrame(step: Step | null | undefined): ArrayFrame | null {
  const frame = step?.frame;
  return frame && frame.kind === "array" ? frame : null;
}

function ptr(frame: ArrayFrame, names: readonly string[]): number | null {
  for (const name of names) {
    const p = frame.pointers.find((q) => q.name === name);
    if (p) return p.index;
  }
  return null;
}

function isEqualityOp(op: string): boolean {
  return op === "=" || op === "==" || op === "===";
}

/** True when `next` moves a low/high boundary relative to `frame`. */
function movesBoundary(frame: ArrayFrame, next: ArrayFrame | null): boolean {
  if (!next) return false;
  const loNow = ptr(frame, LOW_NAMES);
  const hiNow = ptr(frame, HIGH_NAMES);
  const loNext = ptr(next, LOW_NAMES);
  const hiNext = ptr(next, HIGH_NAMES);
  if (loNow !== null && loNext !== null && loNow !== loNext) return true;
  if (hiNow !== null && hiNext !== null && hiNow !== hiNext) return true;
  return false;
}

/**
 * Eligible prediction checkpoints for a canonical run.
 *
 * Phase 6 surfaces the FIRST meaningful branch comparison only: a step whose
 * frame asks a non-equality comparison and whose following step actually moves a
 * boundary. `limit` exists so more checkpoints can be surfaced later without a
 * second implementation.
 */
export function buildPredictionCheckpoints(
  steps: readonly Step[],
  limit: number = 1,
): PredictionCheckpoint[] {
  const out: PredictionCheckpoint[] = [];
  for (let i = 0; i < steps.length && out.length < limit; i += 1) {
    if (steps[i]?.phase === "inspect-invert-node" && steps[i]?.frame.kind === "tree") {
      out.push({ id: `invert-tree-${i}`, stepIndex: i });
      continue;
    }
    if (steps[i]?.phase === "finish-depth-level" && steps[i]?.frame.kind === "tree") {
      out.push({ id: `maximum-depth-${i}`, stepIndex: i });
      continue;
    }
    if (steps[i]?.phase === "inspect-view-node" && steps[i]?.frame.kind === "tree") {
      out.push({ id: `right-side-view-${i}`, stepIndex: i });
      continue;
    }
    if (steps[i]?.phase === "inspect-node" && steps[i]?.frame.kind === "tree") {
      out.push({ id: `level-order-${i}`, stepIndex: i });
      continue;
    }
    if (steps[i]?.phase === "check-bst-node" && steps[i]?.frame.kind === "tree") {
      out.push({ id: `validate-bst-${i}`, stepIndex: i });
      continue;
    }
    const frame = asArrayFrame(steps[i]);
    if (!frame) continue;
    const c = frame.comparison;
    const isThreeWayClassification =
      steps[i]?.phase === "classify" &&
      ptr(frame, ["low"]) !== null &&
      ptr(frame, ["mid"]) !== null &&
      ptr(frame, ["high"]) !== null;
    const isPairSumComparison =
      steps[i]?.phase === "compare-pair" &&
      frame.target?.label === "target sum" &&
      ptr(frame, ["left"]) !== null &&
      ptr(frame, ["right"]) !== null;
    const isContainerComparison =
      steps[i]?.phase === "compare-area" &&
      frame.target?.label === "best area" &&
      ptr(frame, ["left"]) !== null &&
      ptr(frame, ["right"]) !== null;
    const isRainComparison =
      steps[i]?.phase === "compare-boundaries" &&
      frame.target?.label === "trapped water" &&
      ptr(frame, ["left"]) !== null &&
      ptr(frame, ["right"]) !== null;
    const isPalindromeInspection =
      steps[i]?.phase === "inspect-characters" &&
      frame.target?.label === "palindrome" &&
      ptr(frame, ["left"]) !== null &&
      ptr(frame, ["right"]) !== null;
    const isMoveZeroesDecision =
      (steps[i]?.phase === "inspect-value" || steps[i]?.phase === "inspect-fill") &&
      frame.target?.label === "output" &&
      ptr(frame, ["write"]) !== null;
    const isRemoveDuplicatesDecision =
      steps[i]?.phase === "inspect-unique" &&
      frame.target?.label === "k" &&
      ptr(frame, ["read"]) !== null &&
      ptr(frame, ["write"]) !== null;
    const isThreeSumDecision =
      (steps[i]?.phase === "compare-triplet" || steps[i]?.phase === "inspect-duplicate-anchor") &&
      frame.target?.label === "triplets found" &&
      ptr(frame, ["anchor"]) !== null;
    if (isThreeSumDecision && c) {
      out.push({ id: `three-sum-${i}`, stepIndex: i });
      continue;
    }
    if (isRemoveDuplicatesDecision && c) {
      out.push({ id: `remove-duplicates-${i}`, stepIndex: i });
      continue;
    }
    if (isMoveZeroesDecision && c) {
      out.push({ id: `move-zeroes-${i}`, stepIndex: i });
      continue;
    }
    if (isPalindromeInspection && c) {
      out.push({ id: `palindrome-${i}`, stepIndex: i });
      continue;
    }
    if (isRainComparison && c) {
      out.push({ id: `rain-${i}`, stepIndex: i });
      continue;
    }
    if (isContainerComparison && c) {
      out.push({ id: `container-${i}`, stepIndex: i });
      continue;
    }
    if (isPairSumComparison && c) {
      out.push({ id: `pair-${i}`, stepIndex: i });
      continue;
    }
    if (isThreeWayClassification && c) {
      out.push({ id: `classify-${i}`, stepIndex: i });
      continue;
    }
    if (!c || isEqualityOp(c.op)) continue;
    if (ptr(frame, ["mid"]) === null) continue;
    if (!movesBoundary(frame, asArrayFrame(steps[i + 1]))) continue;
    out.push({ id: `compare-${i}`, stepIndex: i });
  }
  return out;
}

const OPTIONS: readonly PredictionOption[] = [
  { id: "move-low", label: "low = mid + 1" },
  { id: "move-high", label: "high = mid - 1" },
  { id: "return-mid", label: "return mid" },
  { id: "not-found", label: "stop — target not found" },
];

const THREE_WAY_OPTIONS: readonly PredictionOption[] = [
  { id: "swap-low", label: "swap(low, mid); low++; mid++" },
  { id: "advance-mid", label: "mid++" },
  { id: "swap-high", label: "swap(mid, high); high--" },
];

const PAIR_SUM_OPTIONS: readonly PredictionOption[] = [
  { id: "advance-left", label: "left++" },
  { id: "retreat-right", label: "right--" },
  { id: "return-pair", label: "return [left + 1, right + 1]" },
];

const CONTAINER_OPTIONS: readonly PredictionOption[] = [
  { id: "advance-left", label: "left++" },
  { id: "retreat-right", label: "right--" },
  { id: "advance-both", label: "left++; right--" },
];

const RAIN_OPTIONS: readonly PredictionOption[] = [
  { id: "process-left", label: "process left side" },
  { id: "process-right", label: "process right side" },
  { id: "return-water", label: "return water" },
];

const PALINDROME_OPTIONS: readonly PredictionOption[] = [
  { id: "skip-left", label: "left++ (skip symbol)" },
  { id: "skip-right", label: "right-- (skip symbol)" },
  { id: "advance-both", label: "left++; right--" },
  { id: "return-false", label: "return false" },
];

const MOVE_ZEROES_OPTIONS: readonly PredictionOption[] = [
  { id: "copy-value", label: "copy value; write++" },
  { id: "skip-zero", label: "read++ only" },
  { id: "write-zero", label: "nums[write] = 0; write++" },
];

const REMOVE_DUPLICATES_OPTIONS: readonly PredictionOption[] = [
  { id: "copy-unique", label: "nums[write] = nums[read]; write++; read++" },
  { id: "skip-duplicate", label: "read++ only" },
  { id: "advance-write", label: "write++ only" },
];

const THREE_SUM_OPTIONS: readonly PredictionOption[] = [
  { id: "advance-left", label: "left++" },
  { id: "retreat-right", label: "right--" },
  { id: "record-triplet", label: "record triplet; move both; skip repeats" },
  { id: "skip-anchor", label: "continue to next anchor" },
];

const LEVEL_ORDER_OPTIONS: readonly PredictionOption[] = [
  { id: "enqueue-both", label: "enqueue left, then right" },
  { id: "enqueue-left", label: "enqueue left only" },
  { id: "enqueue-right", label: "enqueue right only" },
  { id: "enqueue-none", label: "enqueue no children" },
];

const RIGHT_SIDE_VIEW_OPTIONS: readonly PredictionOption[] = [
  { id: "record-rightmost", label: "append node to right view" },
  { id: "skip-current", label: "continue across this level" },
];

function deriveInvertTreePrediction(current: Step, id: string): Prediction | null {
  if (current.phase !== "inspect-invert-node" || current.frame.kind !== "tree") return null;
  const panel = current.aux?.find((p) => p.kind === "keyvalue" && p.label === "Invert tree");
  const active = current.frame.nodes.find((n) => n.state === "active");
  if (panel?.kind !== "keyvalue" || !active) return null;
  const childPair = panel.rows.find((r) => r.k === "left ↔ right")?.v;
  const [left = "null", right = "null"] = childPair?.split(" ↔ ") ?? [];
  const explanation = `Swap the child references: left becomes ${right} and right becomes ${left}; the values themselves stay attached to their nodes.`;
  return {
    id,
    question: "Which mutation mirrors this node?",
    context: [`current node = ${active.label}`, `left = ${left}, right = ${right}`],
    options: [
      { id: "swap-links", label: "swap left and right child links" },
      { id: "keep-links", label: "keep both links unchanged" },
      { id: "swap-values", label: "swap only the child values" },
    ],
    correctOptionId: "swap-links",
    explanation,
    misconceptionFeedback: {
      "swap-links": explanation,
      "keep-links": "Keeping the links leaves this subtree unchanged.",
      "swap-values": "Inversion moves whole subtrees by swapping references, not stored values.",
    },
    accessiblePrompt: `Prediction checkpoint. Node ${active.label} has left child ${left} and right child ${right}. Which mutation mirrors this node?`,
  };
}

function deriveValidateBstPrediction(current: Step, id: string): Prediction | null {
  if (current.phase !== "check-bst-node" || current.frame.kind !== "tree") return null;
  const panel = current.aux?.find((p) => p.kind === "keyvalue" && p.label === "BST bounds");
  if (panel?.kind !== "keyvalue") return null;
  const bounds = panel.rows.find((row) => row.k === "bounds")?.v;
  const [range, check] = bounds?.split(" | ") ?? [];
  const active = current.frame.nodes.find((node) => node.state === "active");
  if (!range || !check || !active) return null;
  const value = String(active.label);
  const valid = check.includes("∈");
  const correctOptionId: PredictionOptionId = valid ? "accept-bst-node" : "reject-bst-node";
  const explanation = valid
    ? `${value} is strictly inside ${range}, so this node satisfies every ancestor bound.`
    : `${value} is outside ${range}, so one ancestor constraint is violated and the tree is invalid.`;
  return {
    id,
    question: "Does this node satisfy its inherited BST bounds?",
    context: [`current value = ${value}`, `allowed range = ${range}`],
    options: [
      { id: "accept-bst-node", label: "accept node; validate its subtrees" },
      { id: "reject-bst-node", label: "reject tree at this node" },
      { id: "check-parent-bound", label: "compare only with the parent" },
    ],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "accept-bst-node": valid
        ? explanation
        : "A node outside any inherited bound rejects the whole tree.",
      "reject-bst-node": valid
        ? "This value is strictly inside its full ancestor range."
        : explanation,
      "check-parent-bound":
        "BST validity depends on every ancestor bound, not only the immediate parent.",
    },
    accessiblePrompt: `Prediction checkpoint. Current node ${value} must lie strictly inside ${range}. Does it satisfy the inherited bounds?`,
  };
}

function deriveMaximumDepthPrediction(current: Step, id: string): Prediction | null {
  if (current.phase !== "finish-depth-level" || current.frame.kind !== "tree") return null;
  const queue = current.aux?.find((panel) => panel.kind === "queue");
  const depthPanel = current.aux?.find(
    (panel) => panel.kind === "keyvalue" && panel.label === "Maximum depth",
  );
  const depth =
    depthPanel?.kind === "keyvalue"
      ? Number(depthPanel.rows.find((row) => row.k === "levels complete")?.v)
      : NaN;
  if (queue?.kind !== "queue" || !Number.isInteger(depth)) return null;
  const more = queue.items.length > 0;
  const correctOptionId: PredictionOptionId = more ? "continue-depth" : "return-depth";
  const explanation = more
    ? `${queue.items.length} ${queue.items.length === 1 ? "node remains" : "nodes remain"} queued, so another level exists after depth ${depth}.`
    : `The queue is empty after completing depth ${depth}, so ${depth} is the maximum depth.`;
  return {
    id,
    question: "Does another tree level remain?",
    context: [`levels complete = ${depth}`, `queued nodes = ${queue.items.length}`],
    options: [
      { id: "continue-depth", label: "continue to the next level" },
      { id: "return-depth", label: "return the current depth" },
    ],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "continue-depth": more ? explanation : "No queued node remains to form another level.",
      "return-depth": more ? "Queued nodes prove that a deeper level still exists." : explanation,
    },
    accessiblePrompt: `Prediction checkpoint. ${depth} levels are complete and ${queue.items.length} nodes are queued. Does another tree level remain?`,
  };
}

function deriveRightSideViewPrediction(current: Step, id: string): Prediction | null {
  if (current.phase !== "inspect-view-node" || current.frame.kind !== "tree") return null;
  const active = current.frame.nodes.find((node) => node.state === "active");
  const panel = current.aux?.find((entry) => entry.kind === "keyvalue");
  const positionText =
    panel?.kind === "keyvalue"
      ? panel.rows.find((row) => row.k === "level position")?.v
      : undefined;
  const match = positionText?.match(/^(\d+) \/ (\d+)$/);
  if (!active || !match) return null;
  const position = Number(match[1]);
  const size = Number(match[2]);
  const isRightmost = position === size;
  const correctOptionId: PredictionOptionId = isRightmost ? "record-rightmost" : "skip-current";
  const explanation = isRightmost
    ? `${active.label} is node ${position} of ${size}, so it is the final left-to-right node in this level and belongs in the right-side view.`
    : `${active.label} is node ${position} of ${size}; a later node in the same level hides it from the right.`;
  return {
    id,
    question: "Should this node enter the right-side view?",
    context: [`current node = ${active.label}`, `level position = ${position} of ${size}`],
    options: [...RIGHT_SIDE_VIEW_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "record-rightmost": isRightmost
        ? explanation
        : "Only the final left-to-right node at this frozen level boundary is visible from the right.",
      "skip-current": isRightmost
        ? "No later node exists in this level, so skipping would lose its visible value."
        : explanation,
    },
    accessiblePrompt: `Prediction checkpoint. Node ${active.label} is position ${position} of ${size} in this level. Should it enter the right-side view?`,
  };
}

function deriveLevelOrderPrediction(
  frame: TreeFrame,
  current: Step,
  id: string,
): Prediction | null {
  if (current.phase !== "inspect-node") return null;
  const active = frame.nodes.find((node) => node.state === "active");
  if (!active) return null;
  const children = frame.edges
    .filter((edge) => edge.from === active.id)
    .map((edge) => ({ edge, node: frame.nodes.find((node) => node.id === edge.to) }))
    .filter(
      (entry): entry is { edge: TreeFrame["edges"][number]; node: TreeFrame["nodes"][number] } =>
        Boolean(entry.node),
    );
  const left = children.find(({ edge }) => edge.label === "left")?.node;
  const right = children.find(({ edge }) => edge.label === "right")?.node;
  const correctOptionId: PredictionOptionId =
    left && right
      ? "enqueue-both"
      : left
        ? "enqueue-left"
        : right
          ? "enqueue-right"
          : "enqueue-none";
  const explanation =
    left && right
      ? `Node ${active.label} has both children, so enqueue ${left.label} before ${right.label} to preserve left-to-right order.`
      : left
        ? `Node ${active.label} has only left child ${left.label}, so enqueue that child.`
        : right
          ? `Node ${active.label} has only right child ${right.label}, so enqueue that child.`
          : `Node ${active.label} is a leaf, so the queue receives no children.`;
  return {
    id,
    question: "Which children should enter the queue next?",
    context: [
      `current node = ${active.label}`,
      `left child = ${left?.label ?? "null"}`,
      `right child = ${right?.label ?? "null"}`,
    ],
    options: [...LEVEL_ORDER_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "enqueue-both":
        correctOptionId === "enqueue-both"
          ? explanation
          : "Only children that actually exist may enter the queue.",
      "enqueue-left":
        correctOptionId === "enqueue-left"
          ? explanation
          : right
            ? "The right child also exists and must not be skipped."
            : "There is no left child to enqueue.",
      "enqueue-right":
        correctOptionId === "enqueue-right"
          ? explanation
          : left
            ? "The left child must be enqueued before the right child."
            : "There is no right child to enqueue.",
      "enqueue-none":
        correctOptionId === "enqueue-none"
          ? explanation
          : "At least one child exists, so stopping here would omit part of the tree.",
    },
    accessiblePrompt: `Prediction checkpoint. Current node is ${active.label}; left child is ${left?.label ?? "null"}; right child is ${right?.label ?? "null"}. Which children should enter the queue next?`,
  };
}

function deriveThreeSumPrediction(frame: ArrayFrame, current: Step, id: string): Prediction | null {
  if (
    (current.phase !== "compare-triplet" && current.phase !== "inspect-duplicate-anchor") ||
    frame.target?.label !== "triplets found"
  ) {
    return null;
  }
  const comparison = frame.comparison;
  const anchor = ptr(frame, ["anchor"]);
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  if (!comparison || anchor === null || left === null || right === null) return null;
  const duplicateAnchor = current.phase === "inspect-duplicate-anchor";
  const sum = Number(comparison.left);
  if (!duplicateAnchor && !Number.isFinite(sum)) return null;
  const correctOptionId: PredictionOptionId = duplicateAnchor
    ? "skip-anchor"
    : sum === 0
      ? "record-triplet"
      : sum < 0
        ? "advance-left"
        : "retreat-right";
  const explanation = duplicateAnchor
    ? "This anchor equals the previous anchor, so sweeping it again would regenerate triplets already considered."
    : sum === 0
      ? "The three values sum to zero, so record the triplet, move both endpoints, and skip repeated endpoint values."
      : sum < 0
        ? `The sum is ${sum}, so sorted order requires advancing left to make it larger.`
        : `The sum is ${sum}, so sorted order requires retreating right to make it smaller.`;
  return {
    id,
    question: duplicateAnchor
      ? "How should this duplicate anchor be handled?"
      : "What should the two endpoints do next?",
    context: duplicateAnchor
      ? [`anchor = ${anchor}`, `${comparison.left} ${comparison.op} ${comparison.right}`]
      : [
          `anchor = ${anchor}, left = ${left}, right = ${right}`,
          `sum ${comparison.op} 0`,
          `triplets found = ${frame.target.value}`,
        ],
    options: [...THREE_SUM_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "advance-left":
        correctOptionId === "advance-left"
          ? explanation
          : duplicateAnchor
            ? "A duplicate anchor must be skipped before starting another endpoint sweep."
            : sum === 0
              ? "The current triplet is a solution; moving left alone would fail to record it and could repeat an endpoint value."
              : "The sum is too large, so advancing left cannot decrease it.",
      "retreat-right":
        correctOptionId === "retreat-right"
          ? explanation
          : duplicateAnchor
            ? "A duplicate anchor must be skipped before starting another endpoint sweep."
            : sum === 0
              ? "The current triplet is a solution; moving right alone would fail to record it and could repeat an endpoint value."
              : "The sum is too small, so retreating right cannot increase it.",
      "record-triplet":
        correctOptionId === "record-triplet"
          ? explanation
          : duplicateAnchor
            ? "No endpoint pair has been tested for this anchor; the anchor itself is a duplicate."
            : `The current sum is ${sum}, not zero.`,
      "skip-anchor":
        correctOptionId === "skip-anchor"
          ? explanation
          : "This anchor is distinct, so its endpoint search must be completed before moving on.",
    },
    accessiblePrompt: duplicateAnchor
      ? `Prediction checkpoint. Anchor ${anchor} repeats the previous value. How should it be handled?`
      : `Prediction checkpoint. Anchor is ${anchor}, left is ${left}, right is ${right}, and the sum is ${sum}. What should the endpoints do next?`,
  };
}

function deriveRemoveDuplicatesPrediction(
  frame: ArrayFrame,
  current: Step,
  id: string,
): Prediction | null {
  if (current.phase !== "inspect-unique" || frame.target?.label !== "k") return null;
  const comparison = frame.comparison;
  const read = ptr(frame, ["read"]);
  const write = ptr(frame, ["write"]);
  if (!comparison || read === null || write === null) return null;
  const k = Number(frame.target.value);
  if (!Number.isInteger(k)) return null;
  const correctOptionId: PredictionOptionId =
    comparison.op === "=" ? "skip-duplicate" : "copy-unique";
  const explanation =
    correctOptionId === "copy-unique"
      ? `The scanned value differs from nums[k - 1], so copy it into index ${k} and advance both pointers.`
      : `The scanned value equals nums[k - 1], so it is a duplicate; advance read while k stays ${k}.`;
  return {
    id,
    question: "What should happen to the unique prefix next?",
    context: [
      `read = ${read}, write = ${k}`,
      `${comparison.left} ${comparison.op} ${comparison.right}`,
    ],
    options: [...REMOVE_DUPLICATES_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "copy-unique":
        correctOptionId === "copy-unique"
          ? explanation
          : "Copying an equal value would place a duplicate inside the unique prefix.",
      "skip-duplicate":
        correctOptionId === "skip-duplicate"
          ? explanation
          : "The value is new, so skipping it would omit a distinct sorted value from the prefix.",
      "advance-write":
        "write advances only after a new unique value is copied; read must advance after every comparison.",
    },
    accessiblePrompt: `Prediction checkpoint. Read is ${read}, write is ${k}, and the comparison is ${comparison.left} ${comparison.op} ${comparison.right}. What should happen to the unique prefix next?`,
  };
}

function deriveMoveZeroesPrediction(
  frame: ArrayFrame,
  current: Step,
  id: string,
): Prediction | null {
  if (
    (current.phase !== "inspect-value" && current.phase !== "inspect-fill") ||
    frame.target?.label !== "output"
  ) {
    return null;
  }
  const comparison = frame.comparison;
  const write = frame.ranges[0]?.from ?? frame.values.length;
  const read = ptr(frame, ["read"]);
  if (!comparison || read === null) return null;
  const correctOptionId: PredictionOptionId =
    current.phase === "inspect-fill"
      ? "write-zero"
      : comparison.op === "="
        ? "skip-zero"
        : "copy-value";
  const explanation =
    correctOptionId === "copy-value"
      ? `${comparison.left} is non-zero, so copy it into output slot ${write} and advance write.`
      : correctOptionId === "skip-zero"
        ? `${comparison.left} is zero, so leave write at ${write} and advance read only.`
        : `The non-zero scan is complete, so output slot ${write} belongs to the trailing zero suffix.`;
  return {
    id,
    question: "What should happen to the output next?",
    context: [
      `read = ${current.phase === "inspect-fill" ? frame.values.length : read}`,
      `write = ${write}`,
      `${comparison.left} ${comparison.op} ${comparison.right}`,
    ],
    options: [...MOVE_ZEROES_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "copy-value":
        correctOptionId === "copy-value"
          ? explanation
          : "Only a non-zero value is appended to the stable packed prefix.",
      "skip-zero":
        correctOptionId === "skip-zero"
          ? explanation
          : "Skipping is correct only while the read pointer is scanning an input zero.",
      "write-zero":
        correctOptionId === "write-zero"
          ? explanation
          : "Trailing zeroes are written only after every input value has been scanned.",
    },
    accessiblePrompt: `Prediction checkpoint. Read is ${current.phase === "inspect-fill" ? frame.values.length : read}, write is ${write}, and the operation is ${comparison.left} ${comparison.op} ${comparison.right}. What should happen to the output next?`,
  };
}

function derivePalindromePrediction(
  frame: ArrayFrame,
  current: Step,
  id: string,
): Prediction | null {
  if (current.phase !== "inspect-characters" || frame.target?.label !== "palindrome") {
    return null;
  }
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  const comparison = frame.comparison;
  if (left === null || right === null || left >= right || !comparison) return null;

  const correctOptionId: PredictionOptionId =
    comparison.right === "skip left"
      ? "skip-left"
      : comparison.right === "skip right"
        ? "skip-right"
        : comparison.op === "="
          ? "advance-both"
          : "return-false";
  const explanation =
    correctOptionId === "skip-left"
      ? "The left character is not alphanumeric, so it is ignored and left advances."
      : correctOptionId === "skip-right"
        ? "The right character is not alphanumeric, so it is ignored and right retreats."
        : correctOptionId === "advance-both"
          ? `The normalized endpoint characters both equal ${comparison.left}, so both pointers move inward.`
          : `${comparison.left} and ${comparison.right} are different normalized characters, so the text cannot be a palindrome.`;

  return {
    id,
    question: "What should the two pointers do next?",
    context: [
      `left = ${left}, right = ${right}`,
      `${comparison.left} ${comparison.op} ${comparison.right}`,
      `palindrome = ${frame.target.value}`,
    ],
    options: [...PALINDROME_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "skip-left":
        correctOptionId === "skip-left"
          ? explanation
          : "The left endpoint is alphanumeric, so skipping it could hide a required comparison.",
      "skip-right":
        correctOptionId === "skip-right"
          ? explanation
          : "The right endpoint is alphanumeric, so skipping it could hide a required comparison.",
      "advance-both":
        correctOptionId === "advance-both"
          ? explanation
          : "Both pointers move only after two normalized alphanumeric characters match.",
      "return-false":
        correctOptionId === "return-false"
          ? explanation
          : "A skipped symbol or matching pair does not disprove the palindrome.",
    },
    accessiblePrompt: `Prediction checkpoint. Left is ${left}, right is ${right}, and the comparison is ${comparison.left} ${comparison.op} ${comparison.right}. What should the pointers do next?`,
  };
}

function deriveRainPrediction(frame: ArrayFrame, current: Step, id: string): Prediction | null {
  if (current.phase !== "compare-boundaries" || frame.target?.label !== "trapped water") {
    return null;
  }
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  const comparison = frame.comparison;
  if (left === null || right === null || left >= right || !comparison) return null;
  const leftMax = Number(comparison.left);
  const rightMax = Number(comparison.right);
  if (![leftMax, rightMax].every(Number.isFinite)) return null;
  const processLeft = leftMax <= rightMax;
  const correctOptionId: PredictionOptionId = processLeft ? "process-left" : "process-right";
  const explanation = processLeft
    ? `leftMax ${leftMax} is no larger than rightMax ${rightMax}. The opposite boundary is high enough, so the next left bar can be finalized.`
    : `rightMax ${rightMax} is smaller than leftMax ${leftMax}. The opposite boundary is high enough, so the next right bar can be finalized.`;

  return {
    id,
    question: "Which side can be processed next?",
    context: [
      `left = ${left}, right = ${right}`,
      `leftMax = ${leftMax}, rightMax = ${rightMax}`,
      `water = ${frame.target.value}`,
    ],
    options: [...RAIN_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "process-left":
        correctOptionId === "process-left"
          ? explanation
          : "leftMax is taller. Processing left would use a right boundary that is still the limiting side.",
      "process-right":
        correctOptionId === "process-right"
          ? explanation
          : leftMax === rightMax
            ? "The maxima tie, and this deterministic run resolves ties from the left."
            : "rightMax is taller. Processing right would ignore the smaller guaranteed left boundary.",
      "return-water": "The pointers have not met, so unresolved bars still remain between them.",
    },
    accessiblePrompt: `Prediction checkpoint. Left maximum is ${leftMax}, right maximum is ${rightMax}, and the pointers are ${left} and ${right}. Which side can be processed next?`,
  };
}

function deriveContainerPrediction(
  frame: ArrayFrame,
  current: Step,
  id: string,
): Prediction | null {
  if (current.phase !== "compare-area" || frame.target?.label !== "best area") return null;
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  if (left === null || right === null || left >= right) return null;
  const leftHeight = Number(frame.values[left]);
  const rightHeight = Number(frame.values[right]);
  if (![leftHeight, rightHeight].every(Number.isFinite)) return null;
  const width = right - left;
  const area = Math.min(leftHeight, rightHeight) * width;
  const correctOptionId: PredictionOptionId =
    leftHeight === rightHeight
      ? "advance-both"
      : leftHeight < rightHeight
        ? "advance-left"
        : "retreat-right";
  const explanation =
    leftHeight === rightHeight
      ? `Both walls have limiting height ${leftHeight}. Any container retaining either wall has smaller width and cannot beat area ${area}, so move both.`
      : leftHeight < rightHeight
        ? `The left wall at height ${leftHeight} limits area ${area}. Keeping it while width shrinks cannot improve the result, so move left.`
        : `The right wall at height ${rightHeight} limits area ${area}. Keeping it while width shrinks cannot improve the result, so move right.`;

  return {
    id,
    question: "Which wall can be ruled out next?",
    context: [
      `left = ${left} (height ${leftHeight})`,
      `right = ${right} (height ${rightHeight})`,
      `area = ${Math.min(leftHeight, rightHeight)} × ${width} = ${area}`,
    ],
    options: [...CONTAINER_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "advance-left":
        correctOptionId === "advance-left"
          ? explanation
          : leftHeight === rightHeight
            ? "The equal right wall is also ruled out. Moving only left is safe, but it does not match this run's explicit discard-both transition."
            : "The right wall is shorter. Moving the taller left wall keeps the same limiting wall while reducing width.",
      "retreat-right":
        correctOptionId === "retreat-right"
          ? explanation
          : leftHeight === rightHeight
            ? "The equal left wall is also ruled out. Moving only right is safe, but it does not match this run's explicit discard-both transition."
            : "The left wall is shorter. Moving the taller right wall keeps the same limiting wall while reducing width.",
      "advance-both":
        correctOptionId === "advance-both"
          ? explanation
          : "Only the shorter wall is proved unable to improve the area. Moving both could discard a useful taller wall.",
    },
    accessiblePrompt: `Prediction checkpoint. Left height is ${leftHeight}, right height is ${rightHeight}, width is ${width}, and area is ${area}. Which wall can be ruled out next?`,
  };
}

function derivePairSumPrediction(frame: ArrayFrame, current: Step, id: string): Prediction | null {
  if (current.phase !== "compare-pair" || frame.target?.label !== "target sum") return null;
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  if (left === null || right === null) return null;
  const leftValue = Number(frame.values[left]);
  const rightValue = Number(frame.values[right]);
  const target = Number(frame.target.value);
  if (![leftValue, rightValue, target].every(Number.isFinite)) return null;
  const sum = leftValue + rightValue;
  const correctOptionId: PredictionOptionId =
    sum === target ? "return-pair" : sum < target ? "advance-left" : "retreat-right";
  const explanation =
    sum === target
      ? `${leftValue} + ${rightValue} equals ${target}, so return the two 1-indexed positions.`
      : sum < target
        ? `${sum} is below ${target}. Right is already the largest remaining partner, so left must advance to increase the sum.`
        : `${sum} is above ${target}. Left is already the smallest remaining partner, so right must retreat to decrease the sum.`;

  return {
    id,
    question: "What should the two pointers do next?",
    context: [
      `left = ${left}, right = ${right}`,
      `${leftValue} + ${rightValue} = ${sum}; target = ${target}`,
    ],
    options: [...PAIR_SUM_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "advance-left":
        correctOptionId === "advance-left"
          ? explanation
          : sum === target
            ? "The pair already equals the target, so moving a pointer would discard the answer."
            : "The sum is too large. Advancing left can only keep it the same or make it larger.",
      "retreat-right":
        correctOptionId === "retreat-right"
          ? explanation
          : sum === target
            ? "The pair already equals the target, so moving a pointer would discard the answer."
            : "The sum is too small. Retreating right can only keep it the same or make it smaller.",
      "return-pair":
        correctOptionId === "return-pair"
          ? explanation
          : `The current sum is ${sum}, not ${target}, so these positions are not the answer.`,
    },
    accessiblePrompt: `Prediction checkpoint. Left is index ${left} with value ${leftValue}; right is index ${right} with value ${rightValue}. Their sum is ${sum} and the target is ${target}. What should the pointers do next?`,
  };
}

function deriveThreeWayPrediction(frame: ArrayFrame, current: Step, id: string): Prediction | null {
  if (current.phase !== "classify") return null;
  const low = ptr(frame, ["low"]);
  const mid = ptr(frame, ["mid"]);
  const high = ptr(frame, ["high"]);
  if (low === null || mid === null || high === null) return null;
  const value = Number(frame.values[mid]);
  if (![0, 1, 2].includes(value)) return null;

  const correctOptionId: PredictionOptionId =
    value === 0 ? "swap-low" : value === 1 ? "advance-mid" : "swap-high";
  const explanation =
    value === 0
      ? `nums[mid] is 0, so it swaps into the left partition; low and mid both advance.`
      : value === 1
        ? `nums[mid] is 1, so it already belongs in the middle partition and only mid advances.`
        : `nums[mid] is 2, so it swaps into the right partition and high moves left. Mid stays to classify the incoming value.`;

  return {
    id,
    question: "Which pointer transition preserves all three partitions?",
    context: [`low = ${low}, mid = ${mid}, high = ${high}`, `nums[${mid}] = ${value}`],
    options: [...THREE_WAY_OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback: {
      "swap-low":
        value === 0
          ? explanation
          : value === 1
            ? "A 1 already belongs between low and mid, so swapping it into the 0 partition breaks the invariant."
            : "A 2 belongs after high, not before low.",
      "advance-mid":
        value === 1
          ? explanation
          : `Advancing mid would leave this ${value} in the middle partition, where only 1s belong.`,
      "swap-high":
        value === 2
          ? explanation
          : value === 1
            ? "A 1 is already correctly classified, so swapping with high performs unnecessary work and introduces an unknown value at mid."
            : "A 0 belongs before low, not after high.",
    },
    accessiblePrompt: `Prediction checkpoint. low is ${low}, mid is ${mid}, high is ${high}, and nums at mid is ${value}. Which pointer transition preserves all three partitions?`,
  };
}

/**
 * The question for a checkpoint step.
 *
 * The correct option is decided from the numeric comparison the frame carries
 * (middle value versus target), so one component and one copy system handle the
 * target-larger, target-smaller and equality cases identically. Returns null
 * when the frame does not carry enough semantic evidence.
 */
export function derivePrediction(
  current: Step | null | undefined,
  id: string = "prediction",
): Prediction | null {
  if (current?.frame.kind === "tree") {
    const invertTree = deriveInvertTreePrediction(current, id);
    if (invertTree) return invertTree;
    const validateBst = deriveValidateBstPrediction(current, id);
    if (validateBst) return validateBst;
    const maximumDepth = deriveMaximumDepthPrediction(current, id);
    if (maximumDepth) return maximumDepth;
    const rightSideView = deriveRightSideViewPrediction(current, id);
    if (rightSideView) return rightSideView;
    return deriveLevelOrderPrediction(current.frame, current, id);
  }
  const frame = asArrayFrame(current);
  if (!frame) return null;
  if (!current) return null;
  const threeSum = deriveThreeSumPrediction(frame, current, id);
  if (threeSum) return threeSum;
  const removeDuplicates = deriveRemoveDuplicatesPrediction(frame, current, id);
  if (removeDuplicates) return removeDuplicates;
  const moveZeroes = deriveMoveZeroesPrediction(frame, current, id);
  if (moveZeroes) return moveZeroes;
  const palindrome = derivePalindromePrediction(frame, current, id);
  if (palindrome) return palindrome;
  const rain = deriveRainPrediction(frame, current, id);
  if (rain) return rain;
  const container = deriveContainerPrediction(frame, current, id);
  if (container) return container;
  const pairSum = derivePairSumPrediction(frame, current, id);
  if (pairSum) return pairSum;
  const threeWay = deriveThreeWayPrediction(frame, current, id);
  if (threeWay) return threeWay;
  const c = frame.comparison;
  if (!c) return null;
  const mid = ptr(frame, ["mid"]);
  if (mid === null) return null;

  const midValue = Number(c.left);
  const target = Number(c.right);
  if (!Number.isFinite(midValue) || !Number.isFinite(target)) return null;

  const lo = ptr(frame, LOW_NAMES);
  const hi = ptr(frame, HIGH_NAMES);
  const range = frame.ranges[0];

  const correctOptionId: PredictionOptionId =
    midValue === target ? "return-mid" : midValue < target ? "move-low" : "move-high";

  const relation =
    midValue === target ? "equals" : midValue < target ? "is smaller than" : "is larger than";

  const context: string[] = [`arr[${mid}] = ${c.left}`, `${c.left} ${c.op} ${c.right}`];
  if (lo !== null && hi !== null) context.unshift(`low = ${lo}, mid = ${mid}, high = ${hi}`);
  if (range) context.unshift(`search range [${range.from}..${range.to}]`);

  const question =
    correctOptionId === "return-mid"
      ? "What should happen next?"
      : "Which boundary should move next?";

  const explanation =
    correctOptionId === "return-mid"
      ? `The middle value equals the target, so index ${mid} is the answer and the search stops.`
      : correctOptionId === "move-low"
        ? `Since ${c.left} ${relation} ${c.right}, the target can only sit to the right of index ${mid}, so low moves to mid + 1.`
        : `Since ${c.left} ${relation} ${c.right}, the target can only sit to the left of index ${mid}, so high moves to mid - 1.`;

  const misconceptionFeedback: Record<string, string> = {
    "move-low":
      correctOptionId === "move-low"
        ? explanation
        : `Moving low right would keep the larger values, but ${c.left} ${relation} ${c.right}, so the target must be searched on the smaller-value side.`,
    "move-high":
      correctOptionId === "move-high"
        ? explanation
        : `Moving high left would keep the smaller values, but ${c.left} ${relation} ${c.right}, so the target must be searched on the larger-value side.`,
    "return-mid":
      correctOptionId === "return-mid"
        ? explanation
        : `Returning mid claims a match, but ${c.left} ${relation} ${c.right} — the middle value is not the target.`,
    "not-found":
      correctOptionId === "return-mid"
        ? `The middle value already matches the target, so there is nothing left to rule out.`
        : `Stopping now gives up too early: the candidates to the ${
            correctOptionId === "move-low" ? "right" : "left"
          } of index ${mid} have not been ruled out.`,
  };

  return {
    id,
    question,
    context,
    options: [...OPTIONS],
    correctOptionId,
    explanation,
    misconceptionFeedback,
    accessiblePrompt: `Prediction checkpoint. ${c.left} ${relation} ${c.right}. ${question}`,
  };
}
