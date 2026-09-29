import type { ArrayFrame, Step, TreeFrame } from "@/engine/types";
import { pointerLabel } from "@/lib/pointerLabels";
import { activeWindow } from "@/lib/variableBoard";

/**
 * Pure reasoning derivation for the Golden Visualizer.
 *
 * Answers four questions about the step the player is paused on: what just
 * happened, why that operation is valid, what remains guaranteed and what comes
 * next. Binary-search reasoning is read from semantic frame state — `phase`,
 * `pointers`, `ranges`, `comparison`, `values`, `target` — never from decision
 * prose and never from a phase name alone when a real pointer diff can confirm
 * the same fact. Other array algorithms retain their module-authored teaching
 * copy instead of being mislabeled as binary search.
 *
 * `invariantFor` in variableBoard.ts stays focused on live search-range
 * invariants; terminal (found / empty range) result wording lives here.
 *
 * Architecture constraint: pure functions only. No React, no DOM, no stores, no
 * engine schema additions.
 */

export interface Reasoning {
  /** The immediate execution event, kept short. */
  happened: string;
  /** Why the operation is logically valid. The most important field. */
  why?: string;
  /** True for the *current* displayed state, never a stale range. */
  invariant?: string;
  /** `Result` on terminal steps, `Invariant` while the search is live. */
  invariantLabel: "Invariant" | "Result";
  /** Orientation only — omitted once the search has terminated. */
  next?: string;
  /** The single sentence a screen reader should hear for this step. */
  accessibleSummary: string;
}

function asArrayFrame(step: Step | null | undefined): ArrayFrame | null {
  const frame = step?.frame;
  return frame && frame.kind === "array" ? frame : null;
}

function ptr(frame: ArrayFrame, name: string): number | null {
  const p = frame.pointers.find((q) => q.name === name);
  return p ? p.index : null;
}

function targetText(frame: ArrayFrame): string {
  return frame.target ? String(frame.target.value) : "the target";
}

function foundIndex(frame: ArrayFrame): number | null {
  for (const [key, state] of Object.entries(frame.states)) {
    if (state === "found") return Number(key);
  }
  return null;
}

function threeWayPartitionInvariant(frame: ArrayFrame): string | null {
  const low = ptr(frame, "low");
  const mid = ptr(frame, "mid");
  const high = ptr(frame, "high");
  if (low === null || mid === null || high === null) return null;
  if (!frame.values.every((value) => value === 0 || value === 1 || value === 2)) return null;
  if (mid > high) return "Every value is classified: 0s, then 1s, then 2s.";
  return `Before low: 0s. From low to mid - 1: 1s. From mid to high: unclassified. After high: 2s.`;
}

function pairSumReasoning(current: Step, frame: ArrayFrame, stepNumber?: number): Reasoning | null {
  if (frame.target?.label !== "target sum") return null;
  const left = ptr(frame, "left");
  const right = ptr(frame, "right");
  if (left === null || right === null) return null;
  const target = Number(frame.target.value);
  const leftValue = Number(frame.values[left]);
  const rightValue = Number(frame.values[right]);
  const sum = leftValue + rightValue;
  const liveInvariant =
    left < right
      ? `Any valid pair still uses two distinct indices from ${left} through ${right}; every discarded endpoint is impossible.`
      : `No two distinct candidate indices remain.`;

  if (current.phase === "found") {
    const happened = `Found ${leftValue} + ${rightValue} = ${target}.`;
    return {
      happened,
      why: "The current endpoint values equal the target sum, so their 1-indexed positions are the answer.",
      invariant: `Return [${left + 1}, ${right + 1}].`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [
        happened,
        `Return positions ${left + 1} and ${right + 1}.`,
      ]),
    };
  }

  if (current.phase === "not-found") {
    const happened = "Left met right without finding the target sum.";
    return {
      happened,
      why: "Every earlier endpoint was ruled out by sorted order, and one position cannot form a pair with itself.",
      invariant: `No pair adds to ${target}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened, `No pair adds to ${target}.`]),
    };
  }

  if (current.phase === "compare-pair") {
    const smaller = sum < target;
    const equal = sum === target;
    const happened = `${leftValue} + ${rightValue} = ${sum}, which ${equal ? "equals" : smaller ? "is smaller than" : "is larger than"} ${target}.`;
    const why = equal
      ? "The current pair is the answer."
      : smaller
        ? "Right is already the largest remaining partner, so the old left value cannot reach the target with any candidate."
        : "Left is already the smallest remaining partner, so the old right value exceeds the target with every candidate.";
    const next = equal
      ? "Return the two 1-indexed positions."
      : smaller
        ? "Advance left to increase the sum."
        : "Retreat right to decrease the sum.";
    return {
      happened,
      why,
      invariant: liveInvariant,
      invariantLabel: "Invariant",
      next,
      accessibleSummary: summarize(stepNumber, [happened, next]),
    };
  }

  const happened = current.narration;
  return {
    happened,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    next: `Compare numbers[${left}] + numbers[${right}] with ${target}.`,
    accessibleSummary: summarize(stepNumber, [happened, liveInvariant]),
  };
}

function containerReasoning(
  current: Step,
  frame: ArrayFrame,
  stepNumber?: number,
): Reasoning | null {
  if (frame.target?.label !== "best area") return null;
  const left = ptr(frame, "left");
  const right = ptr(frame, "right");
  if (left === null || right === null) return null;
  const best = Number(frame.target.value);
  const leftHeight = Number(frame.values[left]);
  const rightHeight = Number(frame.values[right]);
  const width = Math.max(0, right - left);
  const area = left < right ? Math.min(leftHeight, rightHeight) * width : 0;
  const liveInvariant =
    left < right
      ? `Any unchecked container that can beat ${best} uses two walls from indices ${left} through ${right}; discarded limiting walls cannot improve after width shrinks.`
      : `No unchecked pair remains; the stored best area is ${best}.`;

  if (current.phase === "done") {
    const bestWalls = Object.entries(frame.states)
      .filter(([, state]) => state === "found")
      .map(([index]) => Number(index));
    const happened = `All useful wall pairs are ruled out; the maximum area is ${best}.`;
    return {
      happened,
      why: "Every discarded shorter or equal wall was proved unable to improve once the width became smaller.",
      invariant: `Return ${best}${bestWalls.length === 2 ? ` from indices [${bestWalls[0]}, ${bestWalls[1]}]` : ""}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }

  if (current.phase === "compare-area") {
    const happened = `Width ${width} × limiting height ${Math.min(leftHeight, rightHeight)} gives area ${area}; best is ${best}.`;
    const next =
      leftHeight === rightHeight
        ? "Both equal walls are ruled out, so move both inward."
        : leftHeight < rightHeight
          ? "The left wall is shorter, so move left inward."
          : "The right wall is shorter, so move right inward.";
    return {
      happened,
      why:
        leftHeight === rightHeight
          ? "Keeping either equal limiting wall while width shrinks cannot improve this area."
          : "Keeping the shorter limiting wall while width shrinks cannot improve the area.",
      invariant: liveInvariant,
      invariantLabel: "Invariant",
      next,
      accessibleSummary: summarize(stepNumber, [happened, next]),
    };
  }

  const happened = current.narration;
  return {
    happened,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    ...(left < right ? { next: `Check the container between indices ${left} and ${right}.` } : {}),
    accessibleSummary: summarize(stepNumber, [happened, liveInvariant]),
  };
}

function moveZeroesReasoning(
  current: Step,
  frame: ArrayFrame,
  stepNumber?: number,
): Reasoning | null {
  if (frame.target?.label !== "output") return null;
  const write = frame.ranges[0]?.from ?? frame.values.length;
  const packed = frame.values.slice(0, write).join(", ");
  const liveInvariant =
    write === frame.values.length
      ? "Every output slot is final: non-zero values remain stable and all trailing slots are zero."
      : `Indices before ${write} hold the stable packed prefix${packed ? ` [${packed}]` : ""}; the suffix is unfinished.`;

  if (current.phase === "done") {
    const happened =
      "Stable compaction is complete and the same array now has every zero at the end.";
    return {
      happened,
      why: "Non-zero values were copied in encounter order, then only the remaining suffix was filled with zeroes.",
      invariant: `Return ${frame.target.value}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened, `Return ${frame.target.value}.`]),
    };
  }

  const next =
    current.phase === "inspect-fill" || current.phase === "write-zero"
      ? write < frame.values.length
        ? `Write zero at output index ${write}.`
        : "Return the completed array."
      : "Inspect the next read value; copy it if non-zero or advance read only if it is zero.";
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    next,
    accessibleSummary: summarize(stepNumber, [current.narration, liveInvariant]),
  };
}

function removeDuplicatesReasoning(
  current: Step,
  frame: ArrayFrame,
  stepNumber?: number,
): Reasoning | null {
  if (frame.target?.label !== "k") return null;
  const k = Number(frame.target.value);
  if (!Number.isInteger(k) || k < 1 || k > frame.values.length) return null;
  const prefix = frame.values.slice(0, k).join(", ");
  const liveInvariant = `The first ${k} slots contain every distinct scanned value exactly once in sorted order: [${prefix}].`;

  if (current.phase === "done") {
    const happened = `The scan is complete with ${k} unique values in the first ${k} slots.`;
    return {
      happened,
      why: "Sorted order made every duplicate adjacent to the last accepted value, so no set or extra array was needed.",
      invariant: `Return k = ${k}; nums starts with [${prefix}].`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [
        happened,
        `Return k equals ${k}; nums starts with ${prefix}.`,
      ]),
    };
  }

  const next =
    current.phase === "skip-duplicate"
      ? "Compare the next read value with nums[k - 1]."
      : current.phase === "copy-unique"
        ? "Continue scanning after the expanded unique prefix."
        : "Copy a different value into nums[k], or advance read only when it is a duplicate.";
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    next,
    accessibleSummary: summarize(stepNumber, [current.narration, liveInvariant]),
  };
}

function threeSumReasoning(
  current: Step,
  frame: ArrayFrame,
  stepNumber?: number,
): Reasoning | null {
  if (frame.target?.label !== "triplets found") return null;
  const count = Number(frame.target.value);
  if (!Number.isInteger(count) || count < 0) return null;
  const anchor = ptr(frame, "anchor");
  const left = ptr(frame, "left");
  const right = ptr(frame, "right");
  const liveInvariant =
    anchor === null || left === null || right === null
      ? `${count} unique zero-sum triplet${count === 1 ? " is" : "s are"} recorded.`
      : `All earlier anchors and endpoint pairs are exhausted without duplicates; ${count} unique triplet${count === 1 ? " is" : "s are"} recorded.`;

  if (current.phase === "done") {
    const happened = `Every distinct anchor and feasible endpoint pair has been exhausted; ${count} unique zero-sum triplet${count === 1 ? " was" : "s were"} found.`;
    return {
      happened,
      why: "Sorted pointer movement ruled out impossible sums, while duplicate anchors and repeated endpoints were skipped before they could repeat an answer.",
      invariant: `Return ${count} unique triplet${count === 1 ? "" : "s"}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }

  if (current.phase === "compare-triplet" && frame.comparison) {
    const sum = Number(frame.comparison.left);
    const next =
      sum === 0
        ? "Record this triplet, move both endpoints, and skip repeated endpoint values."
        : sum < 0
          ? "Advance left to increase the sum."
          : "Retreat right to decrease the sum.";
    return {
      happened: current.narration,
      why: current.detail,
      invariant: liveInvariant,
      invariantLabel: "Invariant",
      next,
      accessibleSummary: summarize(stepNumber, [current.narration, next]),
    };
  }

  const next =
    current.phase === "inspect-duplicate-anchor"
      ? "Skip this anchor so its triplets cannot repeat."
      : current.phase === "record-triplet"
        ? "Continue the same anchor sweep with the next distinct endpoint values."
        : "Compare the anchored three-value sum with zero.";
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    next,
    accessibleSummary: summarize(stepNumber, [current.narration, next]),
  };
}

function palindromeReasoning(
  current: Step,
  frame: ArrayFrame,
  stepNumber?: number,
): Reasoning | null {
  if (frame.target?.label !== "palindrome") return null;
  const left = ptr(frame, "left");
  const right = ptr(frame, "right");
  if (left === null || right === null) return null;
  const outcome = String(frame.target.value);
  const liveInvariant =
    outcome === "false"
      ? "A mismatched normalized pair proves the text is not a palindrome."
      : left < right
        ? `Characters outside indices ${left} through ${right} are matched or intentionally ignored.`
        : "Every required mirrored character pair matches after normalization.";

  if (current.phase === "done" || current.phase === "mismatch") {
    const valid = outcome === "true";
    const happened = valid
      ? "The pointers met or crossed without finding a mismatched pair."
      : "Two normalized alphanumeric endpoint characters did not match.";
    return {
      happened,
      why: valid
        ? "Spaces and punctuation were ignored, and every required mirrored pair matched case-insensitively."
        : "A palindrome requires every mirrored alphanumeric pair to be equal after case normalization.",
      invariant: `Return ${valid}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened, `Return ${valid}.`]),
    };
  }

  const next =
    current.phase === "skip-left"
      ? "Inspect the new left endpoint against the same right endpoint."
      : current.phase === "skip-right"
        ? "Inspect the same left endpoint against the new right endpoint."
        : current.phase === "move-both"
          ? "Inspect the next mirrored pair."
          : "Skip a non-alphanumeric endpoint, move both after a match, or return false on a mismatch.";
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    next,
    accessibleSummary: summarize(stepNumber, [current.narration, next]),
  };
}

function rainReasoning(current: Step, frame: ArrayFrame, stepNumber?: number): Reasoning | null {
  if (frame.target?.label !== "trapped water") return null;
  const left = ptr(frame, "left");
  const right = ptr(frame, "right");
  if (left === null || right === null) return null;
  const heights = frame.values.map(Number);
  if (!heights.every(Number.isFinite)) return null;
  const leftMax = Math.max(...heights.slice(0, left + 1));
  const rightMax = Math.max(...heights.slice(right));
  const water = Number(frame.target.value);
  const liveInvariant =
    left < right
      ? `Bars outside indices ${left} through ${right} are finalized; ${water} water units are counted exactly once.`
      : `Every bar is finalized and the total trapped water is ${water}.`;

  if (current.phase === "done") {
    const happened = `The pointers met after every bar was finalized; total trapped water is ${water}.`;
    return {
      happened,
      why: "Each processed bar used the smaller guaranteed boundary maximum, so no unseen interior bar could change its water level.",
      invariant: `Return ${water}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }

  if (current.phase === "compare-boundaries") {
    const processLeft = leftMax <= rightMax;
    const happened = `leftMax is ${leftMax} and rightMax is ${rightMax}; the ${processLeft ? "left" : "right"} side is bounded.`;
    const next = processLeft
      ? "Move left inward and add max(0, leftMax - height[left])."
      : "Move right inward and add max(0, rightMax - height[right]).";
    return {
      happened,
      why: processLeft
        ? "A right boundary at least as tall as leftMax guarantees that leftMax determines the next left bar's water."
        : "A left boundary taller than rightMax guarantees that rightMax determines the next right bar's water.",
      invariant: liveInvariant,
      invariantLabel: "Invariant",
      next,
      accessibleSummary: summarize(stepNumber, [happened, next]),
    };
  }

  if (current.phase === "process-left" || current.phase === "process-right") {
    const processedLeft = current.phase === "process-left";
    const index = processedLeft ? left : right;
    const boundary = processedLeft ? leftMax : rightMax;
    const added = Math.max(0, boundary - heights[index]!);
    const happened = `Resolved index ${index}: boundary ${boundary} - bar ${heights[index]} adds ${added} water.`;
    return {
      happened,
      why: "The opposite side already supplies a boundary at least this high, so this local amount cannot change later.",
      invariant: liveInvariant,
      invariantLabel: "Invariant",
      ...(left < right ? { next: "Compare the two boundary maxima again." } : {}),
      accessibleSummary: summarize(stepNumber, [happened, liveInvariant]),
    };
  }

  const happened = current.narration;
  return {
    happened,
    ...(current.detail ? { why: current.detail } : {}),
    invariant: liveInvariant,
    invariantLabel: "Invariant",
    ...(left < right ? { next: "Compare leftMax with rightMax." } : {}),
    accessibleSummary: summarize(stepNumber, [happened, liveInvariant]),
  };
}

/** The invariant sentence for the range the canvas is drawing right now. */
function rangeInvariant(frame: ArrayFrame): string | null {
  const win = activeWindow(frame);
  if (!win) return null;
  return `If ${targetText(frame)} exists, its index is between ${win.from} and ${win.to}.`;
}

/**
 * Which boundary actually moved, confirmed by diffing pointer indices rather
 * than trusting a `narrow-left` / `narrow-right` phase name.
 */
function movedBoundary(
  frame: ArrayFrame,
  prev: ArrayFrame | null,
): { name: string; from: number; to: number } | null {
  if (!prev) return null;
  for (const name of ["lo", "hi", "l", "r", "low", "high"]) {
    const now = ptr(frame, name);
    const was = ptr(prev, name);
    if (now === null || was === null || now === was) continue;
    return { name, from: was, to: now };
  }
  return null;
}

function summarize(stepNumber: number | undefined, parts: (string | undefined)[]): string {
  const body = parts.filter((p): p is string => Boolean(p)).join(" ");
  return stepNumber === undefined ? body : `Step ${stepNumber}. ${body}`;
}

function levelOrderReasoning(
  current: Step,
  frame: TreeFrame,
  previous: Step | null | undefined,
  stepNumber?: number,
): Reasoning {
  const queue = current.aux?.find((panel) => panel.kind === "queue");
  const queueSize = queue?.kind === "queue" ? queue.items.length : 0;
  const completed = current.aux?.find((panel) => panel.kind === "log");
  const completedLevels =
    completed?.kind === "log" && completed.lines[0] !== "none yet" ? completed.lines.length : 0;
  const active = frame.nodes.find((node) => node.state === "active");
  const invariant = `The queue contains exactly the unvisited nodes in breadth-first, left-to-right order; ${completedLevels} ${completedLevels === 1 ? "level is" : "levels are"} complete.`;

  if (current.phase === "done") {
    const happened = current.narration;
    return {
      happened,
      why: current.detail ?? "Every node was removed from the FIFO queue exactly once.",
      invariant: completedLevels
        ? `Return ${completedLevels} completed ${completedLevels === 1 ? "level" : "levels"}.`
        : "Return [].",
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }

  if (current.phase === "inspect-node" && active) {
    const children = frame.edges.filter((edge) => edge.from === active.id);
    const childLabels = children
      .map((edge) => frame.nodes.find((node) => node.id === edge.to)?.label)
      .filter((label): label is string | number => label !== undefined);
    const happened = `Dequeued ${active.label} and recorded it in the current level.`;
    const next = childLabels.length
      ? `Enqueue ${childLabels.join(" then ")} before visiting the next queued node.`
      : "No child is added; visit the next queued node.";
    return {
      happened,
      why: "Only the nodes that were already in the queue when this level began belong to the current output row.",
      invariant,
      invariantLabel: "Invariant",
      next,
      accessibleSummary: summarize(stepNumber, [happened, next]),
    };
  }

  if (current.phase === "enqueue-child") {
    const previousTree = previous?.frame.kind === "tree" ? previous.frame : null;
    const previousStates = new Map(previousTree?.edges.map((edge) => [edge.to, edge.state]));
    const addedEdge = frame.edges.find(
      (edge) => edge.state === "tree" && previousStates.get(edge.to) !== "tree",
    );
    const child = addedEdge ? frame.nodes.find((node) => node.id === addedEdge.to) : undefined;
    const happened = child
      ? `Enqueued ${child.label} as the ${addedEdge?.label ?? "next"} child.`
      : current.narration;
    return {
      happened,
      why: "Appending children at the back preserves FIFO level order.",
      invariant,
      invariantLabel: "Invariant",
      next: `Continue the captured level before processing the ${queueSize} queued ${queueSize === 1 ? "node" : "nodes"}.`,
      accessibleSummary: summarize(stepNumber, [happened, invariant]),
    };
  }

  const happened = current.narration;
  return {
    happened,
    ...(current.detail ? { why: current.detail } : {}),
    invariant,
    invariantLabel: "Invariant",
    next:
      current.phase === "start-level"
        ? `Process exactly ${queueSize} ${queueSize === 1 ? "node" : "nodes"} for this level.`
        : "Continue with the front of the queue.",
    accessibleSummary: summarize(stepNumber, [happened, invariant]),
  };
}

function invertTreeReasoning(current: Step, stepNumber?: number): Reasoning {
  const panel = current.aux?.find((p) => p.kind === "keyvalue" && p.label === "Invert tree");
  const swaps =
    panel?.kind === "keyvalue" ? (panel.rows.find((r) => r.k === "swaps complete")?.v ?? "0") : "0";
  const invariant = `${swaps} visited ${swaps === "1" ? "node has" : "nodes have"} mirrored child references; queued nodes still need the same local swap.`;
  if (current.phase === "done")
    return {
      happened: current.narration,
      why: current.detail,
      invariant: "Return the fully mirrored root.",
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [current.narration]),
    };
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant,
    invariantLabel: "Invariant",
    next:
      current.phase === "inspect-invert-node"
        ? "Swap the left and right child links, then enqueue the resulting children."
        : "Continue with the next queued node.",
    accessibleSummary: summarize(stepNumber, [current.narration, invariant]),
  };
}

function validateBstReasoning(current: Step, stepNumber?: number): Reasoning {
  const panel = current.aux?.find(
    (entry) => entry.kind === "keyvalue" && entry.label === "BST bounds",
  );
  const bounds =
    panel?.kind === "keyvalue"
      ? (panel.rows.find((row) => row.k === "bounds")?.v ?? "(-∞, +∞) | — | 0 checked")
      : "(-∞, +∞) | — | 0 checked";
  const [range, check] = bounds.split(" | ");
  const checks = String(current.counters.checks ?? 0);
  const invariant = `${checks} node ${checks === "1" ? "has" : "values have"} been checked against the full ancestor range; every accepted subtree keeps its own strict bounds.`;
  if (current.phase === "done") {
    return {
      happened: current.narration,
      why: current.detail,
      invariant: current.narration.startsWith("All")
        ? "Return true: every node satisfied its inherited bounds."
        : current.narration,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [current.narration]),
    };
  }
  if (current.phase === "check-bst-node") {
    const passes = check.includes("∈");
    return {
      happened: current.narration,
      why: passes
        ? `${check} is strictly inside the inherited range.`
        : `${check} is outside the inherited range, so the tree fails.`,
      invariant,
      invariantLabel: "Invariant",
      next: passes
        ? "Accept this node, then validate its left and right subtrees with narrower bounds."
        : "Reject the tree immediately; one bound violation is enough.",
      accessibleSummary: summarize(stepNumber, [current.narration, `Allowed range ${range}.`]),
    };
  }
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant,
    invariantLabel: "Invariant",
    next:
      current.phase === "accept-bst-node"
        ? "Recurse left with a smaller upper bound, then right with a larger lower bound."
        : current.phase === "enter-bst-node"
          ? `Check whether the node lies strictly inside ${range}.`
          : "Continue the recursive bounds check.",
    accessibleSummary: summarize(stepNumber, [current.narration, invariant]),
  };
}

function maximumDepthReasoning(current: Step, stepNumber?: number): Reasoning {
  const queue = current.aux?.find((panel) => panel.kind === "queue");
  const panel = current.aux?.find(
    (entry) => entry.kind === "keyvalue" && entry.label === "Maximum depth",
  );
  const depth =
    panel?.kind === "keyvalue"
      ? (panel.rows.find((row) => row.k === "levels complete")?.v ?? "0")
      : "0";
  const queued = queue?.kind === "queue" ? queue.items.length : 0;
  const invariant = `${depth} complete ${depth === "1" ? "level has" : "levels have"} been counted; queued nodes belong only to deeper levels.`;
  if (current.phase === "done") {
    return {
      happened: current.narration,
      why: current.detail,
      invariant: `Return maximum depth ${depth}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [current.narration, `Return ${depth}.`]),
    };
  }
  const next =
    current.phase === "finish-depth-level"
      ? queued
        ? `Process the ${queued} queued ${queued === 1 ? "node" : "nodes"} as the next level.`
        : `Return depth ${depth}.`
      : current.phase === "start-level"
        ? "Visit exactly the nodes captured for this level."
        : "Continue processing the frozen level boundary.";
  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant,
    invariantLabel: "Invariant",
    next,
    accessibleSummary: summarize(stepNumber, [current.narration, next]),
  };
}

function rightSideViewReasoning(current: Step, frame: TreeFrame, stepNumber?: number): Reasoning {
  const queue = current.aux?.find((panel) => panel.kind === "queue");
  const queueSize = queue?.kind === "queue" ? queue.items.length : 0;
  const panel = current.aux?.find(
    (entry) => entry.kind === "keyvalue" && entry.label === "Right-side view",
  );
  const visible =
    panel?.kind === "keyvalue" ? (panel.rows.find((row) => row.k === "visible")?.v ?? "[]") : "[]";
  const position =
    panel?.kind === "keyvalue"
      ? (panel.rows.find((row) => row.k === "level position")?.v ?? "—")
      : "—";
  const active = frame.nodes.find((node) => node.state === "active");
  const selected = frame.nodes.filter((node) => String(node.badge).startsWith("view ")).length;
  const invariant = `Every completed level contributes exactly its final left-to-right node; the visible list is ${visible}.`;

  if (current.phase === "done") {
    return {
      happened: current.narration,
      why: current.detail ?? "Every level boundary was processed exactly once.",
      invariant: `Return ${visible}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [current.narration, `Return ${visible}.`]),
    };
  }

  if (current.phase === "inspect-view-node" && active) {
    const [at, size] = position.split(" / ").map(Number);
    const isLast = Number.isFinite(at) && at === size;
    const next = isLast
      ? `Record ${active.label} as the visible node for this level.`
      : "Continue across the frozen level; a later node can still hide this one.";
    return {
      happened: `Dequeued ${active.label} at level position ${position}.`,
      why: isLast
        ? "The final node encountered in left-to-right order is the one visible from the right."
        : "A node later in the same level lies farther right.",
      invariant,
      invariantLabel: "Invariant",
      next,
      accessibleSummary: summarize(stepNumber, [`Checked node ${active.label}.`, next]),
    };
  }

  if (current.phase === "record-rightmost") {
    return {
      happened: current.narration,
      why: current.detail,
      invariant,
      invariantLabel: "Invariant",
      next: queueSize
        ? "Start or continue the next level from the front of the queue."
        : "Return the completed right-side view.",
      accessibleSummary: summarize(stepNumber, [current.narration, invariant]),
    };
  }

  return {
    happened: current.narration,
    ...(current.detail ? { why: current.detail } : {}),
    invariant,
    invariantLabel: "Invariant",
    next:
      current.phase === "start-level"
        ? "Process the frozen level and keep only its final node."
        : `${selected} visible ${selected === 1 ? "node is" : "nodes are"} recorded; continue with the queue.`,
    accessibleSummary: summarize(stepNumber, [current.narration, invariant]),
  };
}

/**
 * Reasoning for `steps[index]`, using `steps[index - 1]` only to diff.
 *
 * `stepNumber` is 1-based and used for the accessible summary only. Milestone
 * steps get one extra teaching sentence; they never change which branch of the
 * derivation runs.
 */
export function deriveReasoning(
  current: Step | null | undefined,
  previous?: Step | null,
  stepNumber?: number,
): Reasoning | null {
  if (!current) return null;
  if (current.frame.kind === "tree") {
    const invertPanel = current.aux?.find(
      (panel) => panel.kind === "keyvalue" && panel.label === "Invert tree",
    );
    if (invertPanel) return invertTreeReasoning(current, stepNumber);
    const validatePanel = current.aux?.find(
      (panel) => panel.kind === "keyvalue" && panel.label === "BST bounds",
    );
    if (validatePanel) return validateBstReasoning(current, stepNumber);
    const depthPanel = current.aux?.find(
      (panel) => panel.kind === "keyvalue" && panel.label === "Maximum depth",
    );
    if (depthPanel) return maximumDepthReasoning(current, stepNumber);
    const rightSidePanel = current.aux?.find(
      (panel) => panel.kind === "keyvalue" && panel.label === "Right-side view",
    );
    if (rightSidePanel) return rightSideViewReasoning(current, current.frame, stepNumber);
    return levelOrderReasoning(current, current.frame, previous, stepNumber);
  }
  const frame = asArrayFrame(current);
  if (!frame) {
    const happened = current.narration;
    return {
      happened,
      ...(current.detail ? { why: current.detail } : {}),
      invariantLabel: "Invariant",
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }
  const prev = asArrayFrame(previous);

  const threeSum = threeSumReasoning(current, frame, stepNumber);
  if (threeSum) return threeSum;
  const removeDuplicates = removeDuplicatesReasoning(current, frame, stepNumber);
  if (removeDuplicates) return removeDuplicates;
  const moveZeroes = moveZeroesReasoning(current, frame, stepNumber);
  if (moveZeroes) return moveZeroes;
  const palindrome = palindromeReasoning(current, frame, stepNumber);
  if (palindrome) return palindrome;
  const rain = rainReasoning(current, frame, stepNumber);
  if (rain) return rain;
  const container = containerReasoning(current, frame, stepNumber);
  if (container) return container;
  const pairReasoning = pairSumReasoning(current, frame, stepNumber);
  if (pairReasoning) return pairReasoning;

  if (frame.target === undefined) {
    const happened = current.narration;
    const partitionInvariant = threeWayPartitionInvariant(frame);
    const mid = ptr(frame, "mid");
    const high = ptr(frame, "high");
    const finished = partitionInvariant !== null && mid !== null && high !== null && mid > high;
    return {
      happened,
      ...(current.detail ? { why: current.detail } : {}),
      ...(partitionInvariant ? { invariant: partitionInvariant } : {}),
      invariantLabel: finished ? "Result" : "Invariant",
      ...(!finished && partitionInvariant && mid !== null
        ? { next: `Classify nums[${mid}] and apply the matching pointer transition.` }
        : {}),
      accessibleSummary: summarize(stepNumber, [happened, partitionInvariant ?? ""]),
    };
  }

  const lo = ptr(frame, "lo");
  const hi = ptr(frame, "hi");
  const mid = ptr(frame, "mid");
  const target = targetText(frame);
  const invariant = rangeInvariant(frame);
  const milestone = current.isMilestone === true;
  const found = foundIndex(frame);

  /* ---- terminal: found ---- */
  if (found !== null) {
    const happened = `Found the target ${target} at index ${found}.`;
    return {
      happened,
      why: "The middle value exactly matches the target, so no further search is necessary.",
      invariant: `arr[${found}] = ${target}.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }

  /* ---- terminal: empty range ---- */
  if (lo !== null && hi !== null && lo > hi) {
    const happened = "The search range became empty.";
    return {
      happened,
      why: "Every remaining index was ruled out by an earlier comparison.",
      invariant: `No candidate index remains, so ${target} is not present in the array.`,
      invariantLabel: "Result",
      accessibleSummary: summarize(stepNumber, [happened, `${target} is not in the array.`]),
    };
  }

  /* ---- comparison ---- */
  const c = frame.comparison;
  if (c && mid !== null) {
    if (c.op === "=" || c.op === "==" || c.op === "===") {
      const happened = `${c.left} at index ${mid} matches the target ${c.right}.`;
      return {
        happened,
        why: "The middle value equals the target, so the index is known and the search can stop.",
        invariant: `arr[${mid}] = ${c.right}.`,
        invariantLabel: "Result",
        next: "Report the index and stop the search.",
        accessibleSummary: summarize(stepNumber, [happened]),
      };
    }

    const smaller = c.op === "<" || c.op === "<=";
    const firstElimination = lo === 0 && hi === frame.values.length - 1;
    const happened = smaller
      ? `${c.left} is smaller than the target ${c.right}.`
      : `${c.left} is larger than the target ${c.right}.`;
    const why = [
      `Because the array is sorted, every value ${smaller ? "at or left of" : "at or right of"} index ${mid} is also ${smaller ? "too small" : "too large"}.`,
      /* The misconception is worth naming on the first elimination — when the
         window is still the whole array — and on milestone steps. Semantic
         state decides this; it never changes which branch runs. */
      firstElimination || milestone
        ? "We are not guessing which side holds the target — sorted order proves the other side cannot."
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    const from = smaller ? lo : mid;
    const to = smaller ? mid : hi;
    const discard =
      from !== null && to !== null
        ? `Discard indices ${from} through ${to}.`
        : "Discard the impossible half.";
    return {
      happened,
      why,
      invariant: `Any occurrence of ${c.right} must be to the ${smaller ? "right" : "left"} of index ${mid}.`,
      invariantLabel: "Invariant",
      next: discard,
      accessibleSummary: summarize(stepNumber, [happened, discard]),
    };
  }

  /* ---- boundary movement, confirmed by a real pointer diff ---- */
  const moved = movedBoundary(frame, prev);
  if (moved && prev) {
    const label = pointerLabel(moved.name);
    const prevMid = ptr(prev, "mid");
    const forward = moved.to > moved.from;
    const happened = `Moved ${label} from index ${moved.from} to index ${moved.to}.`;
    const why =
      prevMid === null
        ? `The discarded side was already ruled out, so index ${moved.to} is the ${forward ? "first" : "last"} remaining candidate.`
        : forward
          ? `Indices up to ${prevMid} were already proven too small, so index ${moved.to} is the first remaining candidate.`
          : `Indices from ${prevMid} onward were already proven too large, so index ${moved.to} is the last remaining candidate.`;
    return {
      happened,
      why,
      ...(invariant ? { invariant } : {}),
      invariantLabel: "Invariant",
      next: "Calculate the midpoint of the smaller search range.",
      accessibleSummary: summarize(stepNumber, [happened, invariant ?? ""]),
    };
  }

  /* ---- midpoint probe ---- */
  if (mid !== null && lo !== null && hi !== null) {
    const value = frame.values[mid];
    const happened = `Calculated the midpoint at index ${mid}.`;
    return {
      happened,
      why: "Reading the middle value lets us decide which half of the remaining range can be discarded.",
      ...(invariant ? { invariant } : {}),
      invariantLabel: "Invariant",
      next:
        value === undefined
          ? `Compare the middle value with the target ${target}.`
          : `Compare arr[${mid}] = ${String(value)} with the target ${target}.`,
      accessibleSummary: summarize(stepNumber, [happened]),
    };
  }

  /* ---- setup ---- */
  const happened = `We start with the entire sorted array of ${frame.values.length} values as the search range.`;
  return {
    happened,
    why: "Binary search needs a valid candidate range before it can repeatedly cut that range in half.",
    ...(invariant ? { invariant } : {}),
    invariantLabel: "Invariant",
    next: "Calculate the midpoint of the current search range.",
    accessibleSummary: summarize(stepNumber, [happened]),
  };
}
