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
  "function removeDuplicates(nums)",
  "  write <- 1",
  "  for read <- 1 to length(nums) - 1",
  "    if nums[read] != nums[write - 1]",
  "      nums[write] <- nums[read]",
  "      write <- write + 1",
  "  return write",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function removeDuplicates(nums) {",
    "  let write = 1;",
    "  for (let read = 1; read < nums.length; read++) {",
    "    if (nums[read] !== nums[write - 1]) {",
    "      nums[write] = nums[read];",
    "      write++;",
    "    }",
    "  }",
    "  return write;",
    "}",
  ],
  ts: [
    "function removeDuplicates(nums: number[]): number {",
    "  let write = 1;",
    "  for (let read = 1; read < nums.length; read++) {",
    "    if (nums[read] !== nums[write - 1]) {",
    "      nums[write] = nums[read];",
    "      write++;",
    "    }",
    "  }",
    "  return write;",
    "}",
  ],
  py: [
    "def remove_duplicates(nums):",
    "    write = 1",
    "    for read in range(1, len(nums)):",
    "        if nums[read] != nums[write - 1]:",
    "            nums[write] = nums[read]",
    "            write += 1",
    "    return write",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 9],
  ts: [1, 2, 3, 4, 5, 6, 9],
  py: [1, 2, 3, 4, 5, 6, 7],
};

type Action = "copy" | "skip";

interface FrameSpec {
  read: number;
  write: number;
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
    inspect = false,
    action,
    actionIndex,
    sourceIndex,
    done = false,
    decision,
  } = spec;
  const states: Record<number, CellState> = {};
  for (let index = 0; index < values.length; index += 1) {
    states[index] = index < write ? "sorted" : index < read || done ? "excluded" : "idle";
  }
  if (inspect && read < values.length) {
    states[read] = "compare";
    states[write - 1] = "compare";
  }
  if (actionIndex !== undefined) states[actionIndex] = action === "copy" ? "found" : "active";
  if (sourceIndex !== undefined && sourceIndex !== actionIndex) states[sourceIndex] = "active";

  const comparison =
    inspect && read < values.length
      ? {
          left: `nums[${read}] = ${values[read]}`,
          op: values[read] === values[write - 1] ? "=" : "≠",
          right: `nums[${write - 1}] = ${values[write - 1]}`,
          verdict:
            values[read] === values[write - 1]
              ? "duplicate — skip"
              : `new unique — copy to index ${write}`,
          tone: values[read] === values[write - 1] ? ("warning" as const) : ("accent" as const),
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
            note: write >= values.length ? "prefix full" : `next unique ${write}`,
          },
          {
            name: "read",
            index: pointerIndex(read, values.length),
            color: "warning",
            note: read >= values.length ? "scan done" : `scan ${read}`,
          },
        ],
    pointerNotes: true,
    ranges: [{ from: 0, to: write - 1, label: "Unique prefix", tone: "tint" }],
    rangeRows: 1,
    target: { label: "k", value: write },
    ...(comparison ? { comparison } : {}),
    ...(decision ? { decision } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const values = [...(parsed["values"] as number[])];
  const original = [...values];
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  let read = 1;
  let write = 1;

  b.emit({
    frame: frameFor(values, { read, write }),
    codeLine: 2,
    narration: "Keep the first sorted value as the initial unique prefix.",
    detail: "write starts at 1 because nums[0] is always the first unique value.",
    phase: "setup",
    timelineLabel: "Start prefix",
    isMilestone: true,
  });

  while (read < values.length) {
    const value = values[read]!;
    const lastUnique = values[write - 1]!;
    b.emit({
      frame: frameFor(values, { read, write, inspect: true }),
      codeLine: 4,
      narration: `Compare nums[${read}] = ${value} with the last unique value ${lastUnique}.`,
      detail:
        value === lastUnique
          ? "Sorted order makes this adjacent equality sufficient to classify the value as a duplicate."
          : `The value differs from the last unique value, so append it at index ${write}.`,
      phase: "inspect-unique",
      timelineLabel: "Compare value",
      isMilestone: true,
    });
    b.bump("comparisons");

    const source = read;
    read += 1;
    if (value === lastUnique) {
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(values, {
          read,
          write,
          action: "skip",
          actionIndex: source,
          decision: {
            title: "Skip duplicate",
            detail: `read → ${read}; k stays ${write}`,
            tone: "warning",
          },
        }),
        codeLine: 4,
        narration: `Skip duplicate ${value}; advance read to ${read} while k stays ${write}.`,
        detail: "The unique prefix does not gain a new value.",
        phase: "skip-duplicate",
        timelineLabel: "Skip duplicate",
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
        action: "copy",
        actionIndex: destination,
        sourceIndex: source,
        decision: {
          title: destination === source ? "Keep unique value in place" : "Append unique value",
          detail: `nums[${destination}] = ${value}; k → ${write}`,
          tone: "accent",
        },
      }),
      codeLine: 6,
      narration: `Write ${value} at index ${destination}; advance k to ${write} and read to ${read}.`,
      detail: "The first k slots again contain every distinct scanned value in sorted order.",
      phase: "copy-unique",
      timelineLabel: "Write unique",
      isMilestone: true,
    });
  }

  b.emit({
    frame: frameFor(values, {
      read,
      write,
      done: true,
      decision: {
        title: "Unique prefix complete",
        detail: `k = ${write}; prefix = [${values.slice(0, write).join(", ")}]`,
        tone: "accent",
      },
    }),
    codeLine: 7,
    narration: `Return k = ${write}; only the first ${write} array slots are part of the answer.`,
    detail: "Values after k are intentionally unspecified by the problem contract.",
    phase: "done",
    timelineLabel: "Return k",
    isMilestone: true,
  });

  return b.finish(
    "remove-duplicates-from-sorted-array",
    `[${original.join(", ")}]`,
    `Result: k = ${write}; unique prefix [${values.slice(0, write).join(", ")}].`,
  );
}

export const removeDuplicatesSortedModule: AlgorithmModule = {
  slug: "remove-duplicates-from-sorted-array",
  inputs: [
    {
      name: "values",
      label: "Sorted numbers",
      kind: "numbers",
      default: "0, 0, 1, 1, 1, 2, 2, 3, 3, 4",
      help: "Use 1–12 integers in non-decreasing order.",
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.some((value) => !Number.isInteger(value))) {
      return { ok: false, error: "Remove Duplicates requires integer values." };
    }
    if (list.values.some((value, index) => index > 0 && value < list.values[index - 1]!)) {
      return { ok: false, error: "Numbers must be sorted in non-decreasing order." };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Classic", values: { values: "0, 0, 1, 1, 1, 2, 2, 3, 3, 4" } },
    { label: "Small", values: { values: "1, 1, 2" } },
    { label: "Already unique", values: { values: "-3, -1, 0, 2, 5" } },
    { label: "All equal", values: { values: "2, 2, 2, 2" } },
    { label: "Single value", values: { values: "7" } },
    { label: "Negative duplicates", values: { values: "-4, -4, -1, -1, 0, 3, 3" } },
    {
      label: "Maximum visible",
      values: { values: "-5, -5, -2, -2, -2, 0, 1, 1, 4, 4, 7, 9" },
    },
  ],
};

export default removeDuplicatesSortedModule;
