import type { AlgorithmRun, ArrayFrame, CellState, Step, TreeFrame } from "@/engine/types";
import { derivePrediction } from "@/lib/prediction";

/**
 * Trace Mode derivation.
 *
 * The canonical engine run is the correctness oracle: every expected answer here
 * is read out of the run's semantic frame data — `pointers`, `comparison`,
 * `ranges`, `target` and the pointer diff against the next step. Narration,
 * `detail` and `decision` English are never parsed, and binary search is never
 * reimplemented.
 *
 * Pure functions only: no React, no DOM, no stores, no engine schema additions.
 */

/* ---------------- pointer helpers ---------------- */

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

/* ---------------- public types ---------------- */

export type TraceKind =
  | "choose-mid"
  | "compare"
  | "action"
  | "partition"
  | "pair-sum"
  | "container-area"
  | "trapped-water"
  | "palindrome-action"
  | "move-zeroes"
  | "remove-duplicates"
  | "three-sum"
  | "level-order"
  | "bst-validation"
  | "result";

export type TraceRelation = "lt" | "eq" | "gt";

export interface TraceOption {
  id: string;
  label: string;
  /** Only set for choose-mid: the array index this option selects. */
  index?: number;
}

/** The learner-visible algorithm state. Never contains unanswered future state. */
export interface TraceView {
  low: number;
  high: number;
  /** Shown only once the learner has correctly chosen it. */
  mid: number | null;
  /** Shown only once the learner has correctly named the comparison. */
  comparison: { left: string; op: string; right: string } | null;
  /** Index the target was found at, once the trace is complete. */
  found: number | null;
  /** True on the final view of an unsuccessful search. */
  exhausted: boolean;
  /** Question-specific array state for non-search traces. */
  frame?: ArrayFrame;
  /** Question-specific tree state without widening the established array contract. */
  treeFrame?: TreeFrame;
  /** Fixed learner-maintained variables shown below the array. */
  variables?: Array<{ label: string; value: string }>;
}

export interface TraceQuestion {
  id: string;
  kind: TraceKind;
  prompt: string;
  /** Evidence the learner may reason from — never the answer. */
  context: string[];
  options: TraceOption[];
  correctOptionId: string;
  /** Why the correct answer follows. Shown after correct or reveal. */
  explanation: string;
  /** Per-option copy naming the misconception behind a wrong choice. */
  feedback: Record<string, string>;
  /** Progressive hints, levels 1..3. The answer itself is not in here. */
  hints: string[];
  /** Answer-level sentence used by "Show answer". */
  answerReveal: string;
  /** One sentence a screen reader hears when the question opens. */
  accessiblePrompt: string;
}

export interface TraceCheckpoint {
  id: string;
  kind: TraceKind;
  question: TraceQuestion;
  /** State on screen WHILE this question is unanswered. */
  view: TraceView;
}

export interface TraceSummary {
  /** Candidate counts at each probe, e.g. [9, 4, 2]. */
  candidateCounts: number[];
  found: boolean;
  foundIndex: number | null;
  /** Question-specific completion copy and progress path. */
  completionText?: string;
  pathLabel?: string;
  pathValues?: number[];
}

export interface TraceSession {
  algorithmSlug: string;
  values: (number | string)[];
  target: number | string;
  checkpoints: TraceCheckpoint[];
  /** State after every checkpoint is resolved. */
  finalView: TraceView;
  summary: TraceSummary;
}

/* ---------------- frame construction (presentation state) ---------------- */

/**
 * The `ArrayFrame` for a trace view, so Trace can reuse the guided canvas
 * without a second renderer. This is presentation state assembled from
 * already-confirmed learner answers, not an algorithm simulation.
 */
export function traceFrame(session: TraceSession, view: TraceView): ArrayFrame {
  if (view.frame) return JSON.parse(JSON.stringify(view.frame)) as ArrayFrame;
  const values = session.values;
  const states: Record<number, CellState> = {};
  for (let i = 0; i < values.length; i += 1) {
    states[i] = i < view.low || i > view.high ? "excluded" : "idle";
  }
  if (view.mid !== null && view.mid >= view.low && view.mid <= view.high) {
    states[view.mid] = "compare";
  }
  if (view.found !== null) states[view.found] = "found";

  const pointers: ArrayFrame["pointers"] = [
    { name: "lo", index: view.low },
    { name: "hi", index: view.high },
  ];
  if (view.mid !== null) pointers.push({ name: "mid", index: view.mid, color: "accent" });

  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    pointerNotes: false,
    ranges: view.low <= view.high ? [{ from: view.low, to: view.high, tone: "tint" }] : [],
    rangeRows: 1,
    target: { label: "target", value: session.target },
    ...(view.comparison ? { comparison: { ...view.comparison } } : {}),
  };
}

function asTreeFrame(step: Step | null | undefined): TreeFrame | null {
  const frame = step?.frame;
  return frame?.kind === "tree" ? frame : null;
}

/* ---------------- question builders ---------------- */

const relationOf = (midValue: number, target: number): TraceRelation =>
  midValue === target ? "eq" : midValue < target ? "lt" : "gt";

const relationWord = (relation: TraceRelation): string =>
  relation === "eq" ? "equal to" : relation === "lt" ? "smaller than" : "larger than";

function chooseMidQuestion(
  id: string,
  low: number,
  high: number,
  correctIndex: number,
): TraceQuestion {
  const options: TraceOption[] = [];
  for (let i = low; i <= high; i += 1)
    options.push({ id: `index-${i}`, label: `index ${i}`, index: i });

  const feedback: Record<string, string> = {};
  for (const option of options) {
    const i = option.index ?? 0;
    feedback[option.id] =
      i === correctIndex
        ? ""
        : `Index ${i} does not split the current range evenly. The midpoint must be calculated from the CURRENT low (${low}) and high (${high}), not from the whole array.`;
  }

  return {
    id,
    kind: "choose-mid",
    prompt: "Where should mid be?",
    context: [`low = ${low}, high = ${high}`],
    options,
    correctOptionId: `index-${correctIndex}`,
    explanation: `mid = floor((${low} + ${high}) / 2) = ${correctIndex}. Mid splits the current search range as evenly as possible.`,
    feedback,
    hints: [
      "Use both current boundaries — low and high.",
      "Compute floor((low + high) / 2).",
      `floor((${low} + ${high}) / 2) = ?`,
    ],
    answerReveal: `mid = ${correctIndex}`,
    accessiblePrompt: `Choose mid. low is ${low}, high is ${high}. Where should mid be?`,
  };
}

function compareQuestion(
  id: string,
  mid: number,
  midValue: number,
  target: number,
  relation: TraceRelation,
): TraceQuestion {
  const options: TraceOption[] = [
    { id: "lt", label: `${midValue} < ${target}` },
    { id: "eq", label: `${midValue} = ${target}` },
    { id: "gt", label: `${midValue} > ${target}` },
  ];
  const correct = `${midValue} is ${relationWord(relation)} ${target}.`;
  const feedback: Record<string, string> = {
    lt: relation === "lt" ? correct : `${midValue} is not smaller than ${target}. ${correct}`,
    eq: relation === "eq" ? correct : `${midValue} and ${target} are different values. ${correct}`,
    gt: relation === "gt" ? correct : `${midValue} is not larger than ${target}. ${correct}`,
  };

  return {
    id,
    kind: "compare",
    prompt: `How does ${midValue} compare with ${target}?`,
    context: [`arr[${mid}] = ${midValue}`, `target = ${target}`],
    options,
    correctOptionId: relation,
    explanation: correct,
    feedback,
    hints: [
      `Read only arr[${mid}] — the rest of the range does not matter yet.`,
      `Compare the single value ${midValue} with the target ${target}.`,
      `Is ${midValue} below, at, or above ${target}?`,
    ],
    answerReveal: correct,
    accessiblePrompt: `Compare. arr index ${mid} is ${midValue}, target is ${target}. How do they compare?`,
  };
}

export type TraceActionId = "move-low" | "move-high" | "return-mid" | "not-found";

function actionQuestion(
  id: string,
  mid: number,
  midValue: number,
  target: number,
  relation: TraceRelation,
  correctAction: TraceActionId,
  newLow: number,
  newHigh: number,
): TraceQuestion {
  const options: TraceOption[] = [
    { id: "move-low", label: "low = mid + 1" },
    { id: "move-high", label: "high = mid - 1" },
    { id: "return-mid", label: "return mid" },
    { id: "not-found", label: "stop — target not found" },
  ];

  const explanation =
    correctAction === "return-mid"
      ? `The middle value equals the target, so index ${mid} is the answer and the search stops.`
      : correctAction === "move-low"
        ? `${midValue} is smaller than ${target}, so every value at or left of index ${mid} is too small. low becomes ${newLow}.`
        : `${midValue} is larger than ${target}, so every value at or right of index ${mid} is too large. high becomes ${newHigh}.`;

  const feedback: Record<string, string> = {
    "move-low":
      correctAction === "move-low"
        ? explanation
        : `Moving low right keeps the larger half, but ${midValue} is ${relationWord(relation)} ${target}, so that half cannot hold the target.`,
    "move-high":
      correctAction === "move-high"
        ? explanation
        : `Moving high left keeps the smaller half, but ${midValue} is ${relationWord(relation)} ${target}, so that half cannot hold the target.`,
    "return-mid":
      correctAction === "return-mid"
        ? explanation
        : `Returning mid claims a match, but ${midValue} is ${relationWord(relation)} ${target} — the middle value is not the target.`,
    "not-found":
      correctAction === "return-mid"
        ? "The middle value already matches the target, so there is nothing left to rule out."
        : `Stopping now gives up too early: half of the range has not been ruled out yet.`,
  };

  return {
    id,
    kind: "action",
    prompt: "What changes next?",
    context: [
      `arr[${mid}] = ${midValue}`,
      `${midValue} ${relation === "eq" ? "=" : relation === "lt" ? "<" : ">"} ${target}`,
    ],
    options,
    correctOptionId: correctAction,
    explanation,
    feedback,
    hints: [
      `${midValue} is ${relationWord(relation)} ${target}.`,
      relation === "eq"
        ? "The search is over the moment the middle value matches."
        : "Which side of mid can still contain the target?",
      relation === "eq"
        ? "Which line of the algorithm returns an index?"
        : "The half that cannot contain the target is discarded by moving one boundary past mid.",
    ],
    answerReveal:
      correctAction === "return-mid"
        ? `return mid (index ${mid})`
        : correctAction === "move-low"
          ? `low = mid + 1 → low = ${newLow}`
          : `high = mid - 1 → high = ${newHigh}`,
    accessiblePrompt: `Move boundary. ${midValue} is ${relationWord(relation)} ${target}. What changes next?`,
  };
}

function resultQuestion(
  id: string,
  found: boolean,
  low: number,
  high: number,
  index: number | null,
): TraceQuestion {
  const options: TraceOption[] = [
    { id: "found", label: "found — return the index" },
    { id: "absent", label: "not in the list — return -1" },
  ];
  const explanation = found
    ? `The middle value matched, so the search returns index ${index}.`
    : `low (${low}) has passed high (${high}), so no candidates remain and the target is not in this list.`;

  return {
    id,
    kind: "result",
    prompt: "What is the result?",
    context: found ? [`low = ${low}, high = ${high}`] : [`low = ${low}, high = ${high}`],
    options,
    correctOptionId: found ? "found" : "absent",
    explanation,
    feedback: {
      found: found
        ? explanation
        : `No index can be returned: the range is empty, so there is nothing left that could hold the target.`,
      absent: found
        ? `The target was matched at an index, so the search does not report it missing.`
        : explanation,
    },
    hints: [
      "Check whether any candidates remain in the search range.",
      `low = ${low}, high = ${high}.`,
      found
        ? "The middle value matched the target on the previous step."
        : "A range where low is greater than high holds no values at all.",
    ],
    answerReveal: found ? `found at index ${index}` : "not found (-1)",
    accessiblePrompt: `Result. low is ${low}, high is ${high}. What is the result?`,
  };
}

/* ---------------- session derivation ---------------- */

const cloneView = (v: TraceView): TraceView => ({
  ...v,
  comparison: v.comparison ? { ...v.comparison } : null,
  ...(v.frame ? { frame: JSON.parse(JSON.stringify(v.frame)) as ArrayFrame } : {}),
  ...(v.variables ? { variables: v.variables.map((cell) => ({ ...cell })) } : {}),
});

function sortVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  return ["low", "mid", "high"].map((name) => ({
    label: name,
    value: String(ptr(frame, [name]) ?? "—"),
  }));
}

function sortColorsQuestion(id: string, frame: ArrayFrame): TraceQuestion | null {
  const low = ptr(frame, ["low"]);
  const mid = ptr(frame, ["mid"]);
  const high = ptr(frame, ["high"]);
  if (low === null || mid === null || high === null) return null;
  const value = Number(frame.values[mid]);
  if (![0, 1, 2].includes(value)) return null;
  const correctOptionId = value === 0 ? "swap-low" : value === 1 ? "advance-mid" : "swap-high";
  const options: TraceOption[] = [
    { id: "swap-low", label: "swap(low, mid); low++; mid++" },
    { id: "advance-mid", label: "mid++" },
    { id: "swap-high", label: "swap(mid, high); high--" },
  ];
  const explanation =
    value === 0
      ? "A 0 belongs in the left partition, so swap it with low and advance both low and mid."
      : value === 1
        ? "A 1 already belongs in the middle partition, so only mid advances."
        : "A 2 belongs in the right partition, so swap it with high and move high left. Mid stays to classify the incoming value.";
  return {
    id,
    kind: "partition",
    prompt: `nums[mid] is ${value}. Which transition preserves the partition invariant?`,
    context: [`low = ${low}, mid = ${mid}, high = ${high}`, `nums[${mid}] = ${value}`],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "swap-low":
        value === 0
          ? explanation
          : value === 1
            ? "A 1 belongs between low and mid, not in the 0 partition."
            : "A 2 belongs after high, not before low.",
      "advance-mid":
        value === 1
          ? explanation
          : `Advancing mid would leave this ${value} inside the partition reserved for 1s.`,
      "swap-high":
        value === 2
          ? explanation
          : value === 1
            ? "A 1 is already classified; swapping it with high would bring an unknown value back to mid."
            : "A 0 belongs before low, not after high.",
    },
    hints: [
      "The regions before low, between low and mid, and after high have different meanings.",
      `The current value is ${value}. Decide which final region owns that value.`,
      value === 0
        ? "0 grows the left partition."
        : value === 1
          ? "1 grows the middle partition."
          : "2 grows the right partition without advancing mid.",
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Partition step. low is ${low}, mid is ${mid}, high is ${high}, and nums at mid is ${value}. Which transition preserves the partitions?`,
  };
}

function buildSortColorsTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "classify")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const values = first ? [...first.values] : [];
  const checkpoints: TraceCheckpoint[] = [];
  const unknownCounts: number[] = [];

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i]!;
    const question = sortColorsQuestion(`partition-${i}`, frame);
    if (!question) continue;
    const mid = ptr(frame, ["mid"]) ?? 0;
    const high = ptr(frame, ["high"]) ?? -1;
    unknownCounts.push(Math.max(0, high - mid + 1));
    checkpoints.push({
      id: `partition-${i}`,
      kind: "partition",
      question,
      view: {
        low: ptr(frame, ["low"]) ?? 0,
        mid,
        high,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables: sortVariables(frame),
      },
    });
  }

  const finalFrame = last ?? first;
  const finalView: TraceView = {
    low: finalFrame ? (ptr(finalFrame, ["low"]) ?? 0) : 0,
    mid: finalFrame ? (ptr(finalFrame, ["mid"]) ?? 0) : 0,
    high: finalFrame ? (ptr(finalFrame, ["high"]) ?? -1) : -1,
    comparison: null,
    found: null,
    exhausted: true,
    ...(finalFrame ? { frame: finalFrame, variables: sortVariables(finalFrame) } : {}),
  };

  return {
    algorithmSlug: run.slug,
    values,
    target: "",
    checkpoints,
    finalView,
    summary: {
      candidateCounts: unknownCounts,
      found: false,
      foundIndex: null,
      completionText: `You classified every value and produced ${run.result.replace(/^Sorted colors:\s*/, "")}.`,
      pathLabel: "unclassified",
      pathValues: [...unknownCounts, 0],
    },
  };
}

function pairSumVariables(
  frame: ArrayFrame,
  target: number,
): Array<{ label: string; value: string }> {
  const left = ptr(frame, ["left"]) ?? 0;
  const right = ptr(frame, ["right"]) ?? 0;
  const sum = left < right ? String(Number(frame.values[left]) + Number(frame.values[right])) : "—";
  return [
    { label: "left", value: String(left) },
    { label: "right", value: String(right) },
    { label: "sum", value: sum },
    { label: "target", value: String(target) },
  ];
}

function pairSumQuestion(id: string, frame: ArrayFrame, target: number): TraceQuestion | null {
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  if (left === null || right === null) return null;
  const leftValue = Number(frame.values[left]);
  const rightValue = Number(frame.values[right]);
  const sum = leftValue + rightValue;
  if (![leftValue, rightValue, sum, target].every(Number.isFinite)) return null;
  const correctOptionId =
    sum === target ? "return-pair" : sum < target ? "advance-left" : "retreat-right";
  const options: TraceOption[] = [
    { id: "advance-left", label: "left++" },
    { id: "retreat-right", label: "right--" },
    { id: "return-pair", label: "return [left + 1, right + 1]" },
  ];
  const explanation =
    sum === target
      ? `The sum equals ${target}, so return the two 1-indexed positions.`
      : sum < target
        ? `The sum is too small. Right is already the largest remaining partner, so advance left.`
        : `The sum is too large. Left is already the smallest remaining partner, so retreat right.`;
  return {
    id,
    kind: "pair-sum",
    prompt: `${leftValue} + ${rightValue} = ${sum}. What should happen next?`,
    context: [`left = ${left}`, `right = ${right}`, `target = ${target}`],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "advance-left":
        correctOptionId === "advance-left"
          ? explanation
          : sum === target
            ? "This pair already equals the target; moving left would discard the answer."
            : "Advancing left cannot reduce a sum that is already too large.",
      "retreat-right":
        correctOptionId === "retreat-right"
          ? explanation
          : sum === target
            ? "This pair already equals the target; moving right would discard the answer."
            : "Retreating right cannot increase a sum that is already too small.",
      "return-pair":
        correctOptionId === "return-pair"
          ? explanation
          : `The current sum is ${sum}, not ${target}.`,
    },
    hints: [
      "Use sorted order: moving left raises the smaller endpoint, while moving right lowers the larger endpoint.",
      `The current sum is ${sum}, compared with target ${target}.`,
      sum === target
        ? "The two current positions are the answer."
        : sum < target
          ? "Increase the sum by advancing left."
          : "Decrease the sum by retreating right.",
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Pair-sum step. Left is index ${left} with value ${leftValue}; right is index ${right} with value ${rightValue}. Their sum is ${sum} and target is ${target}. What should happen next?`,
  };
}

function buildTwoSumTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "compare-pair")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const target = Number(first?.target?.value ?? 0);
  const checkpoints: TraceCheckpoint[] = [];
  const spans: number[] = [];

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i]!;
    const question = pairSumQuestion(`pair-${i}`, frame, target);
    if (!question) continue;
    const left = ptr(frame, ["left"]) ?? 0;
    const right = ptr(frame, ["right"]) ?? 0;
    spans.push(Math.max(0, right - left + 1));
    checkpoints.push({
      id: `pair-${i}`,
      kind: "pair-sum",
      question,
      view: {
        low: left,
        mid: null,
        high: right,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables: pairSumVariables(frame, target),
      },
    });
  }

  const finalFrame = last ?? first;
  const foundIndices = finalFrame
    ? Object.entries(finalFrame.states)
        .filter(([, state]) => state === "found")
        .map(([index]) => Number(index))
    : [];
  const finalLeft = finalFrame ? (ptr(finalFrame, ["left"]) ?? 0) : 0;
  const finalRight = finalFrame ? (ptr(finalFrame, ["right"]) ?? 0) : 0;
  const found = foundIndices.length === 2;
  const finalView: TraceView = {
    low: finalLeft,
    mid: null,
    high: finalRight,
    comparison: null,
    found: found ? foundIndices[0]! : null,
    exhausted: !found,
    ...(finalFrame ? { frame: finalFrame, variables: pairSumVariables(finalFrame, target) } : {}),
  };

  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target,
    checkpoints,
    finalView,
    summary: {
      candidateCounts: spans,
      found,
      foundIndex: found ? foundIndices[0]! : null,
      completionText: found
        ? `You used sorted order to find ${run.result.replace(/^Pair found at /, "")}`
        : `You ruled out every endpoint safely. ${run.result}`,
      pathLabel: "candidate span",
      pathValues: [...spans, found ? Math.max(2, finalRight - finalLeft + 1) : 0],
    },
  };
}

function containerVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  const left = ptr(frame, ["left"]) ?? 0;
  const right = ptr(frame, ["right"]) ?? 0;
  const width = Math.max(0, right - left);
  const area =
    left < right ? Math.min(Number(frame.values[left]), Number(frame.values[right])) * width : 0;
  return [
    { label: "left", value: String(left) },
    { label: "right", value: String(right) },
    { label: "width", value: String(width) },
    { label: "area", value: String(area) },
    { label: "best", value: String(frame.target?.value ?? 0) },
  ];
}

function containerQuestion(id: string, frame: ArrayFrame): TraceQuestion | null {
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  if (left === null || right === null || left >= right) return null;
  const leftHeight = Number(frame.values[left]);
  const rightHeight = Number(frame.values[right]);
  if (![leftHeight, rightHeight].every(Number.isFinite)) return null;
  const width = right - left;
  const area = Math.min(leftHeight, rightHeight) * width;
  const correctOptionId =
    leftHeight === rightHeight
      ? "advance-both"
      : leftHeight < rightHeight
        ? "advance-left"
        : "retreat-right";
  const options: TraceOption[] = [
    { id: "advance-left", label: "left++" },
    { id: "retreat-right", label: "right--" },
    { id: "advance-both", label: "left++; right--" },
  ];
  const explanation =
    leftHeight === rightHeight
      ? `Both walls limit area ${area} equally. Smaller width cannot improve either one, so move both.`
      : leftHeight < rightHeight
        ? `The left wall limits area ${area}. Keeping it with smaller width cannot improve the result, so move left.`
        : `The right wall limits area ${area}. Keeping it with smaller width cannot improve the result, so move right.`;
  return {
    id,
    kind: "container-area",
    prompt: `The current area is ${Math.min(leftHeight, rightHeight)} × ${width} = ${area}. Which wall moves?`,
    context: [
      `left = ${left} (height ${leftHeight})`,
      `right = ${right} (height ${rightHeight})`,
      `best = ${frame.target?.value ?? 0}`,
    ],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "advance-left":
        correctOptionId === "advance-left"
          ? explanation
          : leftHeight === rightHeight
            ? "Both equal limiting walls are ruled out in this run, not only left."
            : "The right wall is shorter; moving the taller left wall cannot remove the current limit.",
      "retreat-right":
        correctOptionId === "retreat-right"
          ? explanation
          : leftHeight === rightHeight
            ? "Both equal limiting walls are ruled out in this run, not only right."
            : "The left wall is shorter; moving the taller right wall cannot remove the current limit.",
      "advance-both":
        correctOptionId === "advance-both"
          ? explanation
          : "Only the shorter wall is proved unable to improve; moving both may discard a useful taller wall.",
    },
    hints: [
      "Area is limited by the shorter endpoint, not the taller one.",
      `The endpoint heights are ${leftHeight} and ${rightHeight}.`,
      leftHeight === rightHeight
        ? "The limiting heights tie, so both endpoints are ruled out."
        : leftHeight < rightHeight
          ? "The left endpoint is shorter."
          : "The right endpoint is shorter.",
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Container-area step. Left height is ${leftHeight}, right height is ${rightHeight}, width is ${width}, and area is ${area}. Which wall moves?`,
  };
}

function buildContainerTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "compare-area")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const checkpoints: TraceCheckpoint[] = [];
  const widths: number[] = [];

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i]!;
    const question = containerQuestion(`container-${i}`, frame);
    if (!question) continue;
    const left = ptr(frame, ["left"]) ?? 0;
    const right = ptr(frame, ["right"]) ?? 0;
    widths.push(Math.max(0, right - left));
    checkpoints.push({
      id: `container-${i}`,
      kind: "container-area",
      question,
      view: {
        low: left,
        mid: null,
        high: right,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables: containerVariables(frame),
      },
    });
  }

  const finalFrame = last ?? first;
  const bestWalls = finalFrame
    ? Object.entries(finalFrame.states)
        .filter(([, state]) => state === "found")
        .map(([index]) => Number(index))
    : [];
  const finalLeft = finalFrame ? (ptr(finalFrame, ["left"]) ?? 0) : 0;
  const finalRight = finalFrame ? (ptr(finalFrame, ["right"]) ?? 0) : 0;
  const best = Number(finalFrame?.target?.value ?? 0);
  const finalView: TraceView = {
    low: finalLeft,
    mid: null,
    high: finalRight,
    comparison: null,
    found: bestWalls[0] ?? null,
    exhausted: true,
    ...(finalFrame ? { frame: finalFrame, variables: containerVariables(finalFrame) } : {}),
  };

  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target: best,
    checkpoints,
    finalView,
    summary: {
      candidateCounts: widths,
      found: true,
      foundIndex: bestWalls[0] ?? null,
      completionText: `You ruled out each limiting wall safely. ${run.result}`,
      pathLabel: "width",
      pathValues: [...widths, 0],
    },
  };
}

function rainState(frame: ArrayFrame): {
  left: number;
  right: number;
  leftMax: number;
  rightMax: number;
  water: number;
} {
  const left = ptr(frame, ["left"]) ?? 0;
  const right = ptr(frame, ["right"]) ?? Math.max(0, frame.values.length - 1);
  const heights = frame.values.map(Number);
  return {
    left,
    right,
    leftMax: Math.max(...heights.slice(0, left + 1)),
    rightMax: Math.max(...heights.slice(right)),
    water: Number(frame.target?.value ?? 0),
  };
}

function rainVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  const state = rainState(frame);
  return [
    { label: "left", value: String(state.left) },
    { label: "right", value: String(state.right) },
    { label: "leftMax", value: String(state.leftMax) },
    { label: "rightMax", value: String(state.rightMax) },
    { label: "water", value: String(state.water) },
  ];
}

function rainQuestion(id: string, frame: ArrayFrame): TraceQuestion | null {
  const { left, right, leftMax, rightMax, water } = rainState(frame);
  if (left >= right) return null;
  const processLeft = leftMax <= rightMax;
  const correctOptionId = processLeft ? "process-left" : "process-right";
  const options: TraceOption[] = [
    { id: "process-left", label: "process left side" },
    { id: "process-right", label: "process right side" },
    { id: "return-water", label: "return water" },
  ];
  const explanation = processLeft
    ? `leftMax ${leftMax} is no larger than rightMax ${rightMax}, so the next left bar has a guaranteed opposite boundary.`
    : `rightMax ${rightMax} is smaller than leftMax ${leftMax}, so the next right bar has a guaranteed opposite boundary.`;
  return {
    id,
    kind: "trapped-water",
    prompt: `leftMax is ${leftMax} and rightMax is ${rightMax}. Which side can be finalized next?`,
    context: [`left = ${left}`, `right = ${right}`, `water = ${water}`],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "process-left":
        correctOptionId === "process-left"
          ? explanation
          : "leftMax is the taller boundary. The smaller right boundary is the side whose water is already determined.",
      "process-right":
        correctOptionId === "process-right"
          ? explanation
          : leftMax === rightMax
            ? "The maxima tie, and this deterministic run resolves ties from the left."
            : "rightMax is taller, so the smaller left boundary is the side whose water is already determined.",
      "return-water":
        "Bars remain between the pointers, so the accumulated total is not final yet.",
    },
    hints: [
      "A bar can be finalized from the side with the smaller boundary maximum.",
      `Compare ${leftMax} with ${rightMax}.`,
      processLeft ? "Process the left side; ties also go left." : "Process the right side.",
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Trapped-water step. Left maximum is ${leftMax}, right maximum is ${rightMax}, left is ${left}, right is ${right}, and water is ${water}. Which side can be finalized next?`,
  };
}

function buildRainTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "compare-boundaries")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const checkpoints: TraceCheckpoint[] = [];
  const unresolvedCounts: number[] = [];

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    const question = rainQuestion(`rain-${index}`, frame);
    if (!question) continue;
    const state = rainState(frame);
    unresolvedCounts.push(state.right - state.left + 1);
    checkpoints.push({
      id: `rain-${index}`,
      kind: "trapped-water",
      question,
      view: {
        low: state.left,
        mid: null,
        high: state.right,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables: rainVariables(frame),
      },
    });
  }

  const finalFrame = last ?? first;
  const finalState = finalFrame
    ? rainState(finalFrame)
    : { left: 0, right: 0, leftMax: 0, rightMax: 0, water: 0 };
  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target: finalState.water,
    checkpoints,
    finalView: {
      low: finalState.left,
      mid: null,
      high: finalState.right,
      comparison: null,
      found: null,
      exhausted: true,
      ...(finalFrame ? { frame: finalFrame, variables: rainVariables(finalFrame) } : {}),
    },
    summary: {
      candidateCounts: unresolvedCounts,
      found: false,
      foundIndex: null,
      completionText: `You finalized every bar from the bounded side. ${run.result}`,
      pathLabel: "unresolved bars",
      pathValues: [...unresolvedCounts, 0],
    },
  };
}

function palindromeVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  return [
    { label: "left", value: String(ptr(frame, ["left"]) ?? 0) },
    { label: "right", value: String(ptr(frame, ["right"]) ?? 0) },
    { label: "palindrome", value: String(frame.target?.value ?? "undecided") },
  ];
}

function palindromeQuestion(id: string, frame: ArrayFrame): TraceQuestion | null {
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  const comparison = frame.comparison;
  if (left === null || right === null || left >= right || !comparison) return null;
  const correctOptionId =
    comparison.right === "skip left"
      ? "skip-left"
      : comparison.right === "skip right"
        ? "skip-right"
        : comparison.op === "="
          ? "advance-both"
          : "return-false";
  const options: TraceOption[] = [
    { id: "skip-left", label: "skip left symbol" },
    { id: "skip-right", label: "skip right symbol" },
    { id: "advance-both", label: "move both inward" },
    { id: "return-false", label: "return false" },
  ];
  const explanation =
    correctOptionId === "skip-left"
      ? "The left endpoint is not alphanumeric, so ignore it."
      : correctOptionId === "skip-right"
        ? "The right endpoint is not alphanumeric, so ignore it."
        : correctOptionId === "advance-both"
          ? "The normalized endpoint characters match, so both are proved."
          : "The normalized endpoint characters differ, which disproves the palindrome.";
  return {
    id,
    kind: "palindrome-action",
    prompt: "What should the two pointers do next?",
    context: [
      `left = ${left}`,
      `right = ${right}`,
      `${comparison.left} ${comparison.op} ${comparison.right}`,
    ],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "skip-left":
        correctOptionId === "skip-left"
          ? explanation
          : "The left endpoint is alphanumeric and must participate in comparison.",
      "skip-right":
        correctOptionId === "skip-right"
          ? explanation
          : "The right endpoint is alphanumeric and must participate in comparison.",
      "advance-both":
        correctOptionId === "advance-both"
          ? explanation
          : "Both pointers move only after two normalized alphanumeric characters match.",
      "return-false":
        correctOptionId === "return-false"
          ? explanation
          : "Only unequal normalized alphanumeric endpoints disprove the palindrome.",
    },
    hints: [
      "Ignore punctuation and spaces before comparing characters.",
      `Inspect ${comparison.left} ${comparison.op} ${comparison.right}.`,
      options.find((option) => option.id === correctOptionId)!.label,
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Palindrome step. Left is ${left}, right is ${right}, and the comparison is ${comparison.left} ${comparison.op} ${comparison.right}. What should the pointers do next?`,
  };
}

function buildPalindromeTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "inspect-characters")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const checkpoints: TraceCheckpoint[] = [];
  const uncheckedCounts: number[] = [];

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    const question = palindromeQuestion(`palindrome-${index}`, frame);
    if (!question) continue;
    const left = ptr(frame, ["left"]) ?? 0;
    const right = ptr(frame, ["right"]) ?? 0;
    uncheckedCounts.push(Math.max(0, right - left + 1));
    checkpoints.push({
      id: `palindrome-${index}`,
      kind: "palindrome-action",
      question,
      view: {
        low: left,
        mid: null,
        high: right,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables: palindromeVariables(frame),
      },
    });
  }

  const finalFrame = last ?? first;
  const finalOutcome = String(finalFrame?.target?.value ?? "false") === "true";
  const finalLeft = finalFrame ? (ptr(finalFrame, ["left"]) ?? 0) : 0;
  const finalRight = finalFrame ? (ptr(finalFrame, ["right"]) ?? 0) : 0;
  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target: String(finalOutcome),
    checkpoints,
    finalView: {
      low: finalLeft,
      mid: null,
      high: finalRight,
      comparison: null,
      found: null,
      exhausted: true,
      ...(finalFrame ? { frame: finalFrame, variables: palindromeVariables(finalFrame) } : {}),
    },
    summary: {
      candidateCounts: uncheckedCounts,
      found: finalOutcome,
      foundIndex: null,
      completionText: `You handled every endpoint according to normalization. ${run.result}`,
      pathLabel: "unchecked characters",
      pathValues: [...uncheckedCounts, 0],
    },
  };
}

function moveZeroesVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  const filling = frame.comparison?.op === "←";
  const write = frame.ranges[0]?.from ?? frame.values.length;
  return [
    { label: "read", value: String(filling ? frame.values.length : (ptr(frame, ["read"]) ?? 0)) },
    { label: "write", value: String(write) },
    { label: "phase", value: filling ? "fill zeroes" : "scan values" },
  ];
}

function moveZeroesQuestion(id: string, frame: ArrayFrame): TraceQuestion | null {
  const comparison = frame.comparison;
  if (!comparison) return null;
  const filling = comparison.op === "←";
  const write = frame.ranges[0]?.from ?? frame.values.length;
  const read = filling ? frame.values.length : (ptr(frame, ["read"]) ?? 0);
  const correctOptionId = filling
    ? "write-zero"
    : comparison.op === "="
      ? "skip-zero"
      : "copy-value";
  const options: TraceOption[] = [
    { id: "copy-value", label: "copy value and advance write" },
    { id: "skip-zero", label: "advance read only" },
    { id: "write-zero", label: "write a trailing zero" },
  ];
  const explanation =
    correctOptionId === "copy-value"
      ? `The scanned value is non-zero, so append it at output index ${write}.`
      : correctOptionId === "skip-zero"
        ? `The scanned value is zero, so read advances while write stays ${write}.`
        : `The scan is complete, so output index ${write} belongs to the trailing zero suffix.`;
  return {
    id,
    kind: "move-zeroes",
    prompt: "What should happen to the output next?",
    context: [
      `read = ${read}`,
      `write = ${write}`,
      `${comparison.left} ${comparison.op} ${comparison.right}`,
    ],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "copy-value":
        correctOptionId === "copy-value"
          ? explanation
          : "Only scanned non-zero values are appended to the packed prefix.",
      "skip-zero":
        correctOptionId === "skip-zero"
          ? explanation
          : "Read-only advancement applies only to a zero encountered during the scan.",
      "write-zero":
        correctOptionId === "write-zero"
          ? explanation
          : "The zero suffix is filled only after the read scan finishes.",
    },
    hints: [
      "First determine whether the read scan is still active.",
      `Inspect ${comparison.left} ${comparison.op} ${comparison.right}.`,
      options.find((option) => option.id === correctOptionId)!.label,
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Move Zeroes step. Read is ${read}, write is ${write}, and the operation is ${comparison.left} ${comparison.op} ${comparison.right}. What should happen next?`,
  };
}

function buildMoveZeroesTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "inspect-value" || step.phase === "inspect-fill")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const checkpoints: TraceCheckpoint[] = [];
  const writePath: number[] = [];

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    const question = moveZeroesQuestion(`move-zeroes-${index}`, frame);
    if (!question) continue;
    const variables = moveZeroesVariables(frame);
    const read = Number(variables[0]!.value);
    const write = Number(variables[1]!.value);
    writePath.push(write);
    checkpoints.push({
      id: `move-zeroes-${index}`,
      kind: "move-zeroes",
      question,
      view: {
        low: write,
        mid: null,
        high: read,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables,
      },
    });
  }

  const finalFrame = last ?? first;
  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target: finalFrame?.target?.value ?? "",
    checkpoints,
    finalView: {
      low: finalFrame?.values.length ?? 0,
      mid: null,
      high: finalFrame?.values.length ?? 0,
      comparison: null,
      found: null,
      exhausted: true,
      ...(finalFrame ? { frame: finalFrame, variables: moveZeroesVariables(finalFrame) } : {}),
    },
    summary: {
      candidateCounts: writePath,
      found: true,
      foundIndex: null,
      completionText: `You preserved every non-zero value and filled the remaining suffix. ${run.result}`,
      pathLabel: "write boundary",
      pathValues: [...writePath, finalFrame?.values.length ?? 0],
    },
  };
}

function removeDuplicatesVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  return [
    { label: "read", value: String(ptr(frame, ["read"]) ?? frame.values.length) },
    { label: "k", value: String(frame.target?.value ?? "—") },
    {
      label: "prefix",
      value: `[${frame.values.slice(0, Number(frame.target?.value)).join(", ")}]`,
    },
  ];
}

function removeDuplicatesQuestion(id: string, frame: ArrayFrame): TraceQuestion | null {
  const comparison = frame.comparison;
  const read = ptr(frame, ["read"]);
  const k = Number(frame.target?.value);
  if (!comparison || read === null || !Number.isInteger(k)) return null;
  const correctOptionId = comparison.op === "=" ? "skip-duplicate" : "copy-unique";
  const options: TraceOption[] = [
    { id: "copy-unique", label: "copy into nums[k]; advance k and read" },
    { id: "skip-duplicate", label: "advance read only" },
    { id: "advance-write", label: "advance k only" },
  ];
  const explanation =
    correctOptionId === "copy-unique"
      ? `The scanned value differs from nums[k - 1], so append it at unique-prefix index ${k}.`
      : `The scanned value equals nums[k - 1], so read advances while k stays ${k}.`;
  return {
    id,
    kind: "remove-duplicates",
    prompt: "What should happen to the unique prefix next?",
    context: [
      `read = ${read}`,
      `k = ${k}`,
      `${comparison.left} ${comparison.op} ${comparison.right}`,
    ],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "copy-unique":
        correctOptionId === "copy-unique"
          ? explanation
          : "Copying an equal value would put a duplicate inside the unique prefix.",
      "skip-duplicate":
        correctOptionId === "skip-duplicate"
          ? explanation
          : "Skipping a different value would omit a distinct element from the answer.",
      "advance-write":
        "k moves only after a new unique value is written, and read must advance after every comparison.",
    },
    hints: [
      "Use sorted order: compare only with the last accepted unique value.",
      `Inspect ${comparison.left} ${comparison.op} ${comparison.right}.`,
      options.find((option) => option.id === correctOptionId)!.label,
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: `Remove Duplicates step. Read is ${read}, k is ${k}, and the comparison is ${comparison.left} ${comparison.op} ${comparison.right}. What should happen next?`,
  };
}

function buildRemoveDuplicatesTraceSession(run: AlgorithmRun): TraceSession {
  const frames = run.steps
    .filter((step) => step.phase === "inspect-unique")
    .map(asArrayFrame)
    .filter((frame): frame is ArrayFrame => frame !== null);
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const checkpoints: TraceCheckpoint[] = [];
  const kPath: number[] = [];

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    const question = removeDuplicatesQuestion(`remove-duplicates-${index}`, frame);
    if (!question) continue;
    const variables = removeDuplicatesVariables(frame);
    const read = Number(variables[0]!.value);
    const k = Number(variables[1]!.value);
    kPath.push(k);
    checkpoints.push({
      id: `remove-duplicates-${index}`,
      kind: "remove-duplicates",
      question,
      view: {
        low: k,
        mid: null,
        high: read,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables,
      },
    });
  }

  const finalFrame = last ?? first;
  const finalK = Number(finalFrame?.target?.value ?? 0);
  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target: finalK,
    checkpoints,
    finalView: {
      low: finalK,
      mid: null,
      high: finalFrame?.values.length ?? 0,
      comparison: null,
      found: null,
      exhausted: true,
      ...(finalFrame
        ? { frame: finalFrame, variables: removeDuplicatesVariables(finalFrame) }
        : {}),
    },
    summary: {
      candidateCounts: kPath,
      found: true,
      foundIndex: null,
      completionText: `You kept each distinct sorted value exactly once. ${run.result}`,
      pathLabel: "unique count k",
      pathValues: [...kPath, finalK],
    },
  };
}

function threeSumVariables(frame: ArrayFrame): Array<{ label: string; value: string }> {
  return [
    { label: "anchor", value: String(ptr(frame, ["anchor"]) ?? "—") },
    { label: "left", value: String(ptr(frame, ["left"]) ?? "—") },
    { label: "right", value: String(ptr(frame, ["right"]) ?? "—") },
    { label: "found", value: String(frame.target?.value ?? 0) },
  ];
}

function threeSumQuestion(id: string, current: Step, frame: ArrayFrame): TraceQuestion | null {
  const comparison = frame.comparison;
  const anchor = ptr(frame, ["anchor"]);
  const left = ptr(frame, ["left"]);
  const right = ptr(frame, ["right"]);
  if (!comparison || anchor === null || left === null || right === null) return null;
  const duplicateAnchor = current.phase === "inspect-duplicate-anchor";
  const sum = Number(comparison.left);
  if (!duplicateAnchor && !Number.isFinite(sum)) return null;
  const correctOptionId = duplicateAnchor
    ? "skip-anchor"
    : sum === 0
      ? "record-triplet"
      : sum < 0
        ? "advance-left"
        : "retreat-right";
  const options: TraceOption[] = [
    { id: "advance-left", label: "left++" },
    { id: "retreat-right", label: "right--" },
    { id: "record-triplet", label: "record triplet; move both; skip repeats" },
    { id: "skip-anchor", label: "continue to next anchor" },
  ];
  const explanation = duplicateAnchor
    ? "This anchor repeats the previous anchor, so skip it to avoid regenerating triplets."
    : sum === 0
      ? "The sum is zero, so record the triplet once, move both pointers, and skip repeated endpoints."
      : sum < 0
        ? `The sum is ${sum}; advancing left is the only sorted move that can increase it.`
        : `The sum is ${sum}; retreating right is the only sorted move that can decrease it.`;
  return {
    id,
    kind: "three-sum",
    prompt: duplicateAnchor
      ? "How should this duplicate anchor be handled?"
      : "What should happen to this endpoint pair?",
    context: duplicateAnchor
      ? [`anchor = ${anchor}`, `${comparison.left} ${comparison.op} ${comparison.right}`]
      : [
          `anchor = ${anchor}, left = ${left}, right = ${right}`,
          `sum = ${sum}`,
          `triplets found = ${frame.target?.value ?? 0}`,
        ],
    options,
    correctOptionId,
    explanation,
    feedback: {
      "advance-left":
        correctOptionId === "advance-left"
          ? explanation
          : duplicateAnchor
            ? "Skip the repeated anchor before opening another endpoint sweep."
            : "Left advances only when the sum is too small.",
      "retreat-right":
        correctOptionId === "retreat-right"
          ? explanation
          : duplicateAnchor
            ? "Skip the repeated anchor before opening another endpoint sweep."
            : "Right retreats only when the sum is too large.",
      "record-triplet":
        correctOptionId === "record-triplet"
          ? explanation
          : duplicateAnchor
            ? "No endpoint sum is being evaluated; the anchor itself repeats."
            : `The current sum is ${sum}, not zero.`,
      "skip-anchor":
        correctOptionId === "skip-anchor"
          ? explanation
          : "This anchor is distinct, so its current endpoint sweep must continue.",
    },
    hints: [
      duplicateAnchor
        ? "Compare this anchor with the immediately previous sorted anchor."
        : "Compare the current sum with zero.",
      duplicateAnchor ? "Equal anchors regenerate the same search." : `The sum is ${sum}.`,
      options.find((option) => option.id === correctOptionId)!.label,
    ],
    answerReveal: options.find((option) => option.id === correctOptionId)!.label,
    accessiblePrompt: duplicateAnchor
      ? `3Sum step. Anchor ${anchor} repeats the previous value. How should it be handled?`
      : `3Sum step. Anchor is ${anchor}, left is ${left}, right is ${right}, and the sum is ${sum}. What should happen next?`,
  };
}

function buildThreeSumTraceSession(run: AlgorithmRun): TraceSession {
  const decisions = run.steps.filter(
    (step) => step.phase === "compare-triplet" || step.phase === "inspect-duplicate-anchor",
  );
  const first = run.steps.map(asArrayFrame).find((frame): frame is ArrayFrame => frame !== null);
  const last = [...run.steps]
    .reverse()
    .map(asArrayFrame)
    .find((frame): frame is ArrayFrame => frame !== null);
  const checkpoints: TraceCheckpoint[] = [];
  const foundPath: number[] = [];

  for (let index = 0; index < decisions.length; index += 1) {
    const current = decisions[index]!;
    const frame = asArrayFrame(current);
    if (!frame) continue;
    const question = threeSumQuestion(`three-sum-${index}`, current, frame);
    if (!question) continue;
    const variables = threeSumVariables(frame);
    const anchor = Number(variables[0]!.value);
    const left = Number(variables[1]!.value);
    const right = Number(variables[2]!.value);
    foundPath.push(Number(frame.target?.value ?? 0));
    checkpoints.push({
      id: `three-sum-${index}`,
      kind: "three-sum",
      question,
      view: {
        low: left,
        mid: anchor,
        high: right,
        comparison: null,
        found: null,
        exhausted: false,
        frame,
        variables,
      },
    });
  }

  const finalFrame = last ?? first;
  const finalCount = Number(finalFrame?.target?.value ?? 0);
  return {
    algorithmSlug: run.slug,
    values: first ? [...first.values] : [],
    target: 0,
    checkpoints,
    finalView: {
      low: finalFrame?.values.length ?? 0,
      mid: null,
      high: finalFrame?.values.length ?? 0,
      comparison: null,
      found: null,
      exhausted: true,
      ...(finalFrame ? { frame: finalFrame, variables: threeSumVariables(finalFrame) } : {}),
    },
    summary: {
      candidateCounts: foundPath,
      found: finalCount > 0,
      foundIndex: null,
      completionText: `You exhausted every distinct anchor and endpoint pair without repeating a triplet. ${run.result}`,
      pathLabel: "triplets found",
      pathValues: [...foundPath, finalCount],
    },
  };
}

function completedLevelCount(step: Step): number {
  const log = step.aux?.find((panel) => panel.kind === "log");
  return log?.kind === "log" && log.lines[0] !== "none yet" ? log.lines.length : 0;
}

function levelOrderVariables(step: Step, frame: TreeFrame) {
  const queue = step.aux?.find((panel) => panel.kind === "queue");
  const active = frame.nodes.find((node) => node.state === "active");
  return [
    { label: "current node", value: String(active?.label ?? "—") },
    { label: "queue remaining", value: String(queue?.kind === "queue" ? queue.items.length : 0) },
    { label: "levels complete", value: String(completedLevelCount(step)) },
  ];
}

function buildLevelOrderTraceSession(run: AlgorithmRun): TraceSession {
  const decisions = run.steps.filter((step) => step.phase === "inspect-node");
  const first = run.steps.map(asTreeFrame).find((frame): frame is TreeFrame => frame !== null);
  const lastStep = run.steps.at(-1);
  const last = asTreeFrame(lastStep);
  const checkpoints: TraceCheckpoint[] = [];
  const levelPath: number[] = [];

  for (let index = 0; index < decisions.length; index += 1) {
    const step = decisions[index]!;
    const frame = asTreeFrame(step);
    const prediction = derivePrediction(step, `level-order-${index}`);
    if (!frame || !prediction) continue;
    levelPath.push(completedLevelCount(step));
    checkpoints.push({
      id: `level-order-${index}`,
      kind: "level-order",
      question: {
        id: `level-order-${index}`,
        kind: "level-order",
        prompt: prediction.question,
        context: prediction.context,
        options: prediction.options.map((option) => ({ id: option.id, label: option.label })),
        correctOptionId: prediction.correctOptionId,
        explanation: prediction.explanation,
        feedback: prediction.misconceptionFeedback,
        hints: [
          "Inspect the current node's left and right child edges.",
          "Only existing children enter the queue, always left before right.",
          prediction.options.find((option) => option.id === prediction.correctOptionId)!.label,
        ],
        answerReveal: prediction.options.find((option) => option.id === prediction.correctOptionId)!
          .label,
        accessiblePrompt: prediction.accessiblePrompt,
      },
      view: {
        low: 0,
        mid: null,
        high: Math.max(0, frame.nodes.length - 1),
        comparison: null,
        found: null,
        exhausted: false,
        treeFrame: frame,
        variables: levelOrderVariables(step, frame),
      },
    });
  }

  const finalCount = lastStep ? completedLevelCount(lastStep) : 0;
  return {
    algorithmSlug: run.slug,
    values: first?.nodes.map((node) => node.label) ?? [],
    target: "levels",
    checkpoints,
    finalView: {
      low: 0,
      mid: null,
      high: Math.max(0, (last?.nodes.length ?? 1) - 1),
      comparison: null,
      found: null,
      exhausted: true,
      ...(last && lastStep
        ? { treeFrame: last, variables: levelOrderVariables(lastStep, last) }
        : {}),
    },
    summary: {
      candidateCounts: levelPath,
      found: true,
      foundIndex: null,
      completionText: `You processed every queued node in breadth-first, left-to-right order. ${run.result}`,
      pathLabel: "levels complete",
      pathValues: [...levelPath, finalCount],
    },
  };
}

function rightSideViewVariables(step: Step, frame: TreeFrame) {
  const active = frame.nodes.find((node) => node.state === "active");
  const panel = step.aux?.find(
    (entry) => entry.kind === "keyvalue" && entry.label === "Right-side view",
  );
  const row = (key: string) =>
    panel?.kind === "keyvalue" ? (panel.rows.find((entry) => entry.k === key)?.v ?? "—") : "—";
  return [
    { label: "current node", value: String(active?.label ?? "—") },
    { label: "level position", value: row("level position") },
    { label: "right view", value: row("visible") },
  ];
}

function buildInvertTreeTraceSession(run: AlgorithmRun): TraceSession {
  const decisions = run.steps.filter((s) => s.phase === "inspect-invert-node"),
    first = run.steps.map(asTreeFrame).find((f): f is TreeFrame => f !== null),
    last = asTreeFrame(run.steps.at(-1)),
    checkpoints: TraceCheckpoint[] = [];
  for (let i = 0; i < decisions.length; i += 1) {
    const step = decisions[i]!,
      frame = asTreeFrame(step),
      p = derivePrediction(step, `invert-tree-${i}`);
    if (!frame || !p) continue;
    checkpoints.push({
      id: `invert-tree-${i}`,
      kind: "level-order",
      question: {
        id: `invert-tree-${i}`,
        kind: "level-order",
        prompt: p.question,
        context: p.context,
        options: p.options.map((o) => ({ id: o.id, label: o.label })),
        correctOptionId: p.correctOptionId,
        explanation: p.explanation,
        feedback: p.misconceptionFeedback,
        hints: [
          "Inversion changes references, not values.",
          "Each node exchanges its whole left and right subtrees.",
          p.options.find((o) => o.id === p.correctOptionId)!.label,
        ],
        answerReveal: p.options.find((o) => o.id === p.correctOptionId)!.label,
        accessiblePrompt: p.accessiblePrompt,
      },
      view: {
        low: 0,
        mid: null,
        high: Math.max(0, frame.nodes.length - 1),
        comparison: null,
        found: null,
        exhausted: false,
        treeFrame: frame,
        variables: [{ label: "swaps complete", value: String(i) }],
      },
    });
  }
  return {
    algorithmSlug: run.slug,
    values: first?.nodes.map((n) => n.label) ?? [],
    target: "inverted tree",
    checkpoints,
    finalView: {
      low: 0,
      mid: null,
      high: Math.max(0, (last?.nodes.length ?? 1) - 1),
      comparison: null,
      found: null,
      exhausted: true,
      ...(last
        ? {
            treeFrame: last,
            variables: [{ label: "swaps complete", value: String(decisions.length) }],
          }
        : {}),
    },
    summary: {
      candidateCounts: decisions.map((_, i) => i),
      found: true,
      foundIndex: null,
      completionText: `You swapped both child references at every node. ${run.result}`,
      pathLabel: "swaps complete",
      pathValues: decisions.map((_, i) => i + 1),
    },
  };
}

function buildValidateBstTraceSession(run: AlgorithmRun): TraceSession {
  const decisions = run.steps.filter((step) => step.phase === "check-bst-node");
  const first = run.steps.map(asTreeFrame).find((frame): frame is TreeFrame => frame !== null);
  const last = asTreeFrame(run.steps.at(-1));
  const checkpoints: TraceCheckpoint[] = [];
  const checkedPath: number[] = [];

  for (let index = 0; index < decisions.length; index += 1) {
    const step = decisions[index]!;
    const frame = asTreeFrame(step);
    const prediction = derivePrediction(step, `validate-bst-${step.i}`);
    if (!frame || !prediction) continue;
    const boundsPanel = step.aux?.find(
      (panel) => panel.kind === "keyvalue" && panel.label === "BST bounds",
    );
    const row = (key: string) =>
      boundsPanel?.kind === "keyvalue"
        ? (boundsPanel.rows.find((entry) => entry.k === key)?.v ?? "—")
        : "—";
    const [range, check] = row("bounds").split(" | ");
    checkedPath.push(index + 1);
    checkpoints.push({
      id: `validate-bst-${step.i}`,
      kind: "bst-validation",
      question: {
        id: `validate-bst-${step.i}`,
        kind: "bst-validation",
        prompt: prediction.question,
        context: prediction.context,
        options: prediction.options.map((option) => ({ id: option.id, label: option.label })),
        correctOptionId: prediction.correctOptionId,
        explanation: prediction.explanation,
        feedback: prediction.misconceptionFeedback,
        hints: [
          "Use the complete range inherited from every ancestor.",
          "BST bounds are strict: the value must be greater than min and less than max.",
          prediction.options.find((option) => option.id === prediction.correctOptionId)!.label,
        ],
        answerReveal: prediction.options.find((option) => option.id === prediction.correctOptionId)!
          .label,
        accessiblePrompt: prediction.accessiblePrompt,
      },
      view: {
        low: 0,
        mid: null,
        high: Math.max(0, frame.nodes.length - 1),
        comparison: null,
        found: null,
        exhausted: false,
        treeFrame: frame,
        variables: [
          { label: "allowed range", value: range ?? "—" },
          { label: "current check", value: check ?? "—" },
          { label: "nodes checked", value: String(index) },
        ],
      },
    });
  }

  const finalResult = run.result.includes("true") ? "true" : "false";
  return {
    algorithmSlug: run.slug,
    values: first?.nodes.map((node) => node.label) ?? [],
    target: "valid BST",
    checkpoints,
    finalView: {
      low: 0,
      mid: null,
      high: Math.max(0, (last?.nodes.length ?? 1) - 1),
      comparison: null,
      found: null,
      exhausted: true,
      ...(last
        ? {
            treeFrame: last,
            variables: [{ label: "result", value: finalResult }],
          }
        : {}),
    },
    summary: {
      candidateCounts: checkedPath,
      found: finalResult === "true",
      foundIndex: null,
      completionText: `You checked ${decisions.length} node bounds. ${run.result}`,
      pathLabel: "nodes checked",
      pathValues: checkedPath,
    },
  };
}

function buildMaximumDepthTraceSession(run: AlgorithmRun): TraceSession {
  const decisions = run.steps.filter((step) => step.phase === "finish-depth-level");
  const first = run.steps.map(asTreeFrame).find((frame): frame is TreeFrame => frame !== null);
  const last = asTreeFrame(run.steps.at(-1));
  const checkpoints: TraceCheckpoint[] = [];
  for (let index = 0; index < decisions.length; index += 1) {
    const step = decisions[index]!;
    const frame = asTreeFrame(step);
    const prediction = derivePrediction(step, `maximum-depth-${index}`);
    if (!frame || !prediction) continue;
    checkpoints.push({
      id: `maximum-depth-${index}`,
      kind: "level-order",
      question: {
        id: `maximum-depth-${index}`,
        kind: "level-order",
        prompt: prediction.question,
        context: prediction.context,
        options: prediction.options.map((option) => ({ id: option.id, label: option.label })),
        correctOptionId: prediction.correctOptionId,
        explanation: prediction.explanation,
        feedback: prediction.misconceptionFeedback,
        hints: [
          "Inspect how many nodes remain queued.",
          "A non-empty queue forms another level.",
          prediction.options.find((option) => option.id === prediction.correctOptionId)!.label,
        ],
        answerReveal: prediction.options.find((option) => option.id === prediction.correctOptionId)!
          .label,
        accessiblePrompt: prediction.accessiblePrompt,
      },
      view: {
        low: 0,
        mid: null,
        high: Math.max(0, frame.nodes.length - 1),
        comparison: null,
        found: null,
        exhausted: false,
        treeFrame: frame,
        variables: [
          { label: "levels complete", value: String(index + 1) },
          { label: "queued nodes", value: prediction.context[1]?.split(" = ")[1] ?? "0" },
        ],
      },
    });
  }
  const finalDepth = last?.nodes.length ? new Set(last.nodes.map((node) => node.y)).size : 0;
  return {
    algorithmSlug: run.slug,
    values: first?.nodes.map((node) => node.label) ?? [],
    target: "maximum depth",
    checkpoints,
    finalView: {
      low: 0,
      mid: null,
      high: Math.max(0, (last?.nodes.length ?? 1) - 1),
      comparison: null,
      found: null,
      exhausted: true,
      ...(last
        ? { treeFrame: last, variables: [{ label: "maximum depth", value: String(finalDepth) }] }
        : {}),
    },
    summary: {
      candidateCounts: decisions.map((_, index) => index + 1),
      found: true,
      foundIndex: null,
      completionText: `You counted every breadth-first level exactly once. ${run.result}`,
      pathLabel: "levels complete",
      pathValues: decisions.map((_, index) => index + 1),
    },
  };
}

function buildRightSideViewTraceSession(run: AlgorithmRun): TraceSession {
  const decisions = run.steps.filter((step) => step.phase === "inspect-view-node");
  const first = run.steps.map(asTreeFrame).find((frame): frame is TreeFrame => frame !== null);
  const lastStep = run.steps.at(-1);
  const last = asTreeFrame(lastStep);
  const checkpoints: TraceCheckpoint[] = [];
  const visiblePath: number[] = [];

  for (let index = 0; index < decisions.length; index += 1) {
    const step = decisions[index]!;
    const frame = asTreeFrame(step);
    const prediction = derivePrediction(step, `right-side-view-${index}`);
    if (!frame || !prediction) continue;
    const visibleCount = frame.nodes.filter((node) =>
      String(node.badge).startsWith("view "),
    ).length;
    visiblePath.push(visibleCount);
    checkpoints.push({
      id: `right-side-view-${index}`,
      kind: "level-order",
      question: {
        id: `right-side-view-${index}`,
        kind: "level-order",
        prompt: prediction.question,
        context: prediction.context,
        options: prediction.options.map((option) => ({ id: option.id, label: option.label })),
        correctOptionId: prediction.correctOptionId,
        explanation: prediction.explanation,
        feedback: prediction.misconceptionFeedback,
        hints: [
          "Use the frozen position inside the current level.",
          "Only the final left-to-right node is visible from the right.",
          prediction.options.find((option) => option.id === prediction.correctOptionId)!.label,
        ],
        answerReveal: prediction.options.find((option) => option.id === prediction.correctOptionId)!
          .label,
        accessiblePrompt: prediction.accessiblePrompt,
      },
      view: {
        low: 0,
        mid: null,
        high: Math.max(0, frame.nodes.length - 1),
        comparison: null,
        found: null,
        exhausted: false,
        treeFrame: frame,
        variables: rightSideViewVariables(step, frame),
      },
    });
  }

  const finalCount =
    last?.nodes.filter((node) => String(node.badge).startsWith("view ")).length ?? 0;
  return {
    algorithmSlug: run.slug,
    values: first?.nodes.map((node) => node.label) ?? [],
    target: "right view",
    checkpoints,
    finalView: {
      low: 0,
      mid: null,
      high: Math.max(0, (last?.nodes.length ?? 1) - 1),
      comparison: null,
      found: null,
      exhausted: true,
      ...(last && lastStep
        ? { treeFrame: last, variables: rightSideViewVariables(lastStep, last) }
        : {}),
    },
    summary: {
      candidateCounts: visiblePath,
      found: true,
      foundIndex: null,
      completionText: `You kept exactly the final left-to-right node from every level. ${run.result}`,
      pathLabel: "visible nodes",
      pathValues: [...visiblePath, finalCount],
    },
  };
}

/**
 * Folds a canonical run into the semantic checkpoints a learner must perform.
 *
 * One probe of the algorithm yields three learner actions — choose mid, compare,
 * move a boundary — and the run ends with one result question. Every expected
 * answer comes from the run's own frames.
 */
export function buildTraceSession(run: AlgorithmRun): TraceSession {
  if (run.slug === "validate-binary-search-tree") return buildValidateBstTraceSession(run);
  if (run.slug === "invert-binary-tree") return buildInvertTreeTraceSession(run);
  if (run.slug === "maximum-depth-of-binary-tree") return buildMaximumDepthTraceSession(run);
  if (run.slug === "binary-tree-right-side-view") return buildRightSideViewTraceSession(run);
  if (run.slug === "binary-tree-level-order") return buildLevelOrderTraceSession(run);
  if (run.slug === "sort-colors") return buildSortColorsTraceSession(run);
  if (run.slug === "two-sum") return buildTwoSumTraceSession(run);
  if (run.slug === "container-with-most-water") return buildContainerTraceSession(run);
  if (run.slug === "trapping-rain-water") return buildRainTraceSession(run);
  if (run.slug === "valid-palindrome") return buildPalindromeTraceSession(run);
  if (run.slug === "move-zeroes") return buildMoveZeroesTraceSession(run);
  if (run.slug === "remove-duplicates-from-sorted-array") {
    return buildRemoveDuplicatesTraceSession(run);
  }
  if (run.slug === "three-sum") return buildThreeSumTraceSession(run);
  const steps = run.steps;
  const first = steps.map(asArrayFrame).find((f): f is ArrayFrame => f !== null);
  const values = first ? [...first.values] : [];
  const target = first?.target?.value ?? "";

  const checkpoints: TraceCheckpoint[] = [];
  const candidateCounts: number[] = [];

  let view: TraceView = {
    low: first ? (ptr(first, LOW_NAMES) ?? 0) : 0,
    high: first ? (ptr(first, HIGH_NAMES) ?? Math.max(0, values.length - 1)) : 0,
    mid: null,
    comparison: null,
    found: null,
    exhausted: false,
  };

  let foundIndex: number | null = null;
  let probe = 0;

  for (let i = 0; i < steps.length; i += 1) {
    const frame = asArrayFrame(steps[i]);
    if (!frame) continue;
    const mid = ptr(frame, ["mid"]);
    const lo = ptr(frame, LOW_NAMES);
    const hi = ptr(frame, HIGH_NAMES);
    if (mid === null || lo === null || hi === null) continue;

    if (!frame.comparison) {
      /* Probe step: the engine has just computed mid for the current window. */
      view = { ...cloneView(view), low: lo, high: hi, mid: null, comparison: null };
      candidateCounts.push(Math.max(0, hi - lo + 1));
      checkpoints.push({
        id: `mid-${probe}`,
        kind: "choose-mid",
        question: chooseMidQuestion(`mid-${probe}`, lo, hi, mid),
        view: cloneView(view),
      });
      view = { ...cloneView(view), mid };
      continue;
    }

    /* Comparison step. */
    const midValue = Number(frame.comparison.left);
    const targetValue = Number(frame.comparison.right);
    if (!Number.isFinite(midValue) || !Number.isFinite(targetValue)) continue;
    const relation = relationOf(midValue, targetValue);

    checkpoints.push({
      id: `compare-${probe}`,
      kind: "compare",
      question: compareQuestion(`compare-${probe}`, mid, midValue, targetValue, relation),
      view: cloneView(view),
    });
    view = {
      ...cloneView(view),
      comparison: {
        left: String(midValue),
        op: relation === "eq" ? "=" : relation === "lt" ? "<" : ">",
        right: String(targetValue),
      },
    };

    const next = asArrayFrame(steps[i + 1]);
    const loNext = next ? (ptr(next, LOW_NAMES) ?? lo) : lo;
    const hiNext = next ? (ptr(next, HIGH_NAMES) ?? hi) : hi;

    if (relation === "eq") {
      checkpoints.push({
        id: `action-${probe}`,
        kind: "action",
        question: actionQuestion(
          `action-${probe}`,
          mid,
          midValue,
          targetValue,
          relation,
          "return-mid",
          lo,
          hi,
        ),
        view: cloneView(view),
      });
      foundIndex = mid;
      view = { ...cloneView(view), found: mid, low: mid, high: mid };
      break;
    }

    const correctAction: TraceActionId = relation === "lt" ? "move-low" : "move-high";
    const newLow = relation === "lt" ? mid + 1 : lo;
    const newHigh = relation === "lt" ? hi : mid - 1;

    checkpoints.push({
      id: `action-${probe}`,
      kind: "action",
      question: actionQuestion(
        `action-${probe}`,
        mid,
        midValue,
        targetValue,
        relation,
        correctAction,
        newLow,
        newHigh,
      ),
      view: cloneView(view),
    });

    /* The engine's own next frame is the oracle for the new boundaries; the
       arithmetic above only shapes the copy. */
    view = {
      ...cloneView(view),
      low: loNext,
      high: hiNext,
      mid: null,
      comparison: null,
    };
    probe += 1;
  }

  const found = foundIndex !== null;
  if (!found) view = { ...cloneView(view), exhausted: true };

  checkpoints.push({
    id: "result",
    kind: "result",
    question: resultQuestion("result", found, view.low, view.high, foundIndex),
    view: cloneView(view),
  });

  return {
    algorithmSlug: run.slug,
    values,
    target,
    checkpoints,
    finalView: cloneView(view),
    summary: { candidateCounts, found, foundIndex },
  };
}

/** The view to render given how many checkpoints have been resolved. */
export function viewAt(session: TraceSession, resolvedCount: number): TraceView {
  const checkpoint = session.checkpoints[resolvedCount];
  return checkpoint ? checkpoint.view : session.finalView;
}
