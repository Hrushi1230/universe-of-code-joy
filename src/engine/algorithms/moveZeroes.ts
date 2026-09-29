import { parseNumberList } from "@/engine/algorithms/binarySearch";
import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_ITEMS = 12;

const PSEUDOCODE = [
  "function moveZeroes(nums)",
  "  write <- 0",
  "  for read <- 0 to length(nums) - 1",
  "    if nums[read] != 0",
  "      nums[write] <- nums[read]; write <- write + 1",
  "  while write < length(nums)",
  "    nums[write] <- 0; write <- write + 1",
  "  return nums",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function moveZeroes(nums) {",
    "  let write = 0;",
    "  for (let read = 0; read < nums.length; read++) {",
    "    if (nums[read] !== 0) {",
    "      nums[write] = nums[read]; write++;",
    "    }",
    "  }",
    "  while (write < nums.length) {",
    "    nums[write] = 0; write++;",
    "  }",
    "  return nums;",
    "}",
  ],
  ts: [
    "function moveZeroes(nums: number[]): number[] {",
    "  let write = 0;",
    "  for (let read = 0; read < nums.length; read++) {",
    "    if (nums[read] !== 0) {",
    "      nums[write] = nums[read]; write++;",
    "    }",
    "  }",
    "  while (write < nums.length) {",
    "    nums[write] = 0; write++;",
    "  }",
    "  return nums;",
    "}",
  ],
  py: [
    "def move_zeroes(nums):",
    "    write = 0",
    "    for read in range(len(nums)):",
    "        if nums[read] != 0:",
    "            nums[write] = nums[read]; write += 1",
    "    while write < len(nums):",
    "        nums[write] = 0; write += 1",
    "    return nums",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 8, 9, 11],
  ts: [1, 2, 3, 4, 5, 8, 9, 11],
  py: [1, 2, 3, 4, 5, 6, 7, 8],
};

type Phase = "scan" | "fill" | "done";
type Action = "copy" | "skip" | "fill";

interface FrameSpec {
  read: number;
  write: number;
  phase: Phase;
  inspect?: boolean;
  action?: Action;
  actionIndex?: number;
  sourceIndex?: number;
  done?: boolean;
  decision?: ArrayFrame["decision"];
}

function pointerIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const {
    read,
    write,
    phase,
    inspect = false,
    action,
    actionIndex,
    sourceIndex,
    done = false,
    decision,
  } = spec;
  const states: Record<number, CellState> = {};
  for (let index = 0; index < values.length; index += 1) {
    states[index] =
      done || index < write ? "sorted" : phase === "scan" && index < read ? "excluded" : "idle";
  }
  if (inspect && phase === "scan" && read < values.length) states[read] = "compare";
  if (inspect && phase === "fill" && write < values.length) states[write] = "compare";
  if (actionIndex !== undefined) {
    states[actionIndex] = action === "copy" ? "found" : action === "fill" ? "sorted" : "active";
  }
  if (sourceIndex !== undefined && sourceIndex !== actionIndex) states[sourceIndex] = "active";

  const comparison =
    inspect && phase === "scan" && read < values.length
      ? {
          left: `nums[${read}]`,
          op: values[read] === 0 ? "=" : "≠",
          right: "0",
          verdict: values[read] === 0 ? "skip zero" : `copy to index ${write}`,
          tone: values[read] === 0 ? ("warning" as const) : ("accent" as const),
        }
      : inspect && phase === "fill" && write < values.length
        ? {
            left: `nums[${write}]`,
            op: "←",
            right: "0",
            verdict: "fill zero suffix",
            tone: "accent" as const,
          }
        : undefined;

  return {
    kind: "array",
    values: [...values],
    states,
    pointers: done
      ? []
      : [
          {
            name: "write",
            index: pointerIndex(write, values.length),
            note: write >= values.length ? "done" : `next slot ${write}`,
          },
          {
            name: "read",
            index: pointerIndex(read, values.length),
            color: "warning",
            note: read >= values.length ? "scan done" : `scan ${read}`,
          },
        ],
    pointerNotes: true,
    ranges:
      write < values.length
        ? [{ from: write, to: values.length - 1, label: "Unfinished suffix", tone: "tint" }]
        : [],
    rangeRows: 1,
    target: { label: "output", value: `[${values.join(", ")}]` },
    ...(comparison ? { comparison } : {}),
    ...(decision ? { decision } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const values = [...(parsed["values"] as number[])];
  const original = [...values];
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  let read = 0;
  let write = 0;

  b.emit({
    frame: frameFor(values, { read, write, phase: "scan" }),
    codeLine: 2,
    narration: "Start read and write at index 0.",
    detail: "Read scans every value; write marks the next slot in the stable non-zero prefix.",
    phase: "setup",
    timelineLabel: "Set pointers",
    isMilestone: true,
  });

  while (read < values.length) {
    const value = values[read]!;
    b.emit({
      frame: frameFor(values, { read, write, phase: "scan", inspect: true }),
      codeLine: 4,
      narration: `Inspect nums[${read}] = ${value}.`,
      detail:
        value === 0
          ? "Zero does not belong in the packed prefix, so only read advances."
          : `Copy ${value} into the next output slot at index ${write}, then advance write.`,
      phase: "inspect-value",
      timelineLabel: "Inspect value",
      isMilestone: true,
    });
    b.bump("inspections");

    const source = read;
    read += 1;
    if (value === 0) {
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(values, {
          read,
          write,
          phase: "scan",
          action: "skip",
          actionIndex: source,
          decision: {
            title: "Leave write in place",
            detail: `read → ${read}; write stays ${write}`,
            tone: "warning",
          },
        }),
        codeLine: 4,
        narration: `Skip the zero; advance read to ${read} while write stays ${write}.`,
        detail: "The next non-zero value will overwrite this unresolved output slot.",
        phase: "skip-zero",
        timelineLabel: "Skip zero",
        isMilestone: true,
      });
      continue;
    }

    const destination = write;
    values[destination] = value;
    write += 1;
    b.bump("writes");
    b.bump("pointerMoves", 2);
    b.emit({
      frame: frameFor(values, {
        read,
        write,
        phase: "scan",
        action: "copy",
        actionIndex: destination,
        sourceIndex: source,
        decision: {
          title: destination === source ? "Keep value in place" : "Copy into packed prefix",
          detail: `nums[${destination}] = ${value}; write → ${write}`,
          tone: "accent",
        },
      }),
      codeLine: 5,
      narration: `Write ${value} at index ${destination}; advance write to ${write} and read to ${read}.`,
      detail: "Appending each encountered non-zero preserves their original relative order.",
      phase: "copy-nonzero",
      timelineLabel: "Copy value",
      isMilestone: true,
    });
  }

  while (write < values.length) {
    b.emit({
      frame: frameFor(values, { read, write, phase: "fill", inspect: true }),
      codeLine: 6,
      narration: `The scan is complete; fill output index ${write} with zero.`,
      detail:
        "Every non-zero value is already packed before write, so the remaining suffix must be zero.",
      phase: "inspect-fill",
      timelineLabel: "Fill suffix",
      isMilestone: true,
    });

    const destination = write;
    values[destination] = 0;
    write += 1;
    b.bump("writes");
    b.bump("pointerMoves");
    b.emit({
      frame: frameFor(values, {
        read,
        write,
        phase: "fill",
        action: "fill",
        actionIndex: destination,
        decision: {
          title: "Write trailing zero",
          detail: `nums[${destination}] = 0; write → ${write}`,
          tone: "accent",
        },
      }),
      codeLine: 7,
      narration: `Set index ${destination} to zero and advance write to ${write}.`,
      detail: "This slot lies after every preserved non-zero value.",
      phase: "write-zero",
      timelineLabel: "Write zero",
      isMilestone: true,
    });
  }

  b.emit({
    frame: frameFor(values, {
      read,
      write,
      phase: "done",
      done: true,
      decision: {
        title: "Stable compaction complete",
        detail: `[${values.join(", ")}]`,
        tone: "accent",
      },
    }),
    codeLine: 8,
    narration: "All non-zero values are packed in order and every remaining slot is zero.",
    detail: "Return the same array after completing the in-place transformation.",
    phase: "done",
    timelineLabel: "Compaction done",
    isMilestone: true,
  });

  return b.finish("move-zeroes", `[${original.join(", ")}]`, `Result: [${values.join(", ")}].`);
}

export const moveZeroesModule: AlgorithmModule = {
  slug: "move-zeroes",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "0, 1, 0, 3, 12",
      help: "Use 1–12 integers.",
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length < 1) return { ok: false, error: "Enter at least one number." };
    if (list.values.some((value) => !Number.isInteger(value))) {
      return { ok: false, error: "Move Zeroes requires integer values." };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Classic", values: { values: "0, 1, 0, 3, 12" } },
    { label: "Already packed", values: { values: "1, 3, 12, 0, 0" } },
    { label: "No zeroes", values: { values: "1, 2, 3, 4" } },
    { label: "All zeroes", values: { values: "0, 0, 0, 0" } },
    { label: "Negative values", values: { values: "0, -2, 0, 5, -7" } },
    { label: "Single zero", values: { values: "0" } },
    {
      label: "Maximum visible",
      values: { values: "0, 4, 0, -2, 7, 0, 0, 5, 9, 0, 3, 0" },
    },
  ],
};

export default moveZeroesModule;
