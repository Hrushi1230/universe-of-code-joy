import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  CodeLineMap,
  TableFrame,
  ValidationResult,
} from "@/engine/types";

const MAX_STEPS = 11;

const PSEUDOCODE = [
  "function climbStairs(n)",
  "  ways <- array of n + 1 empty cells",
  "  ways[0] <- 1",
  "  ways[1] <- 1",
  "  for i from 2 to n",
  "    fromOne <- ways[i - 1]",
  "    fromTwo <- ways[i - 2]",
  "    ways[i] <- fromOne + fromTwo",
  "  return ways[n]",
];

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function climbStairs(n) {",
    "  const ways = Array(n + 1).fill(0);",
    "  ways[0] = 1;",
    "  ways[1] = 1;",
    "  for (let i = 2; i <= n; i++) {",
    "    const fromOne = ways[i - 1];",
    "    const fromTwo = ways[i - 2];",
    "    ways[i] = fromOne + fromTwo;",
    "  }",
    "  return ways[n];",
    "}",
  ],
  ts: [
    "function climbStairs(n: number): number {",
    "  const ways = Array<number>(n + 1).fill(0);",
    "  ways[0] = 1;",
    "  ways[1] = 1;",
    "  for (let i = 2; i <= n; i++) {",
    "    const fromOne = ways[i - 1]!;",
    "    const fromTwo = ways[i - 2]!;",
    "    ways[i] = fromOne + fromTwo;",
    "  }",
    "  return ways[n]!;",
    "}",
  ],
  py: [
    "def climb_stairs(n):",
    "    ways = [0] * (n + 1)",
    "    ways[0] = 1",
    "    ways[1] = 1",
    "    for i in range(2, n + 1):",
    "        from_one = ways[i - 1]",
    "        from_two = ways[i - 2]",
    "        ways[i] = from_one + from_two",
    "    return ways[n]",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 10],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 10],
  py: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

function frameFor(
  ways: Array<number | null>,
  computation?: TableFrame["computation"],
  done = false,
): TableFrame {
  const dependencyKeys = new Set((computation?.dependencies ?? []).map(({ r, c }) => `${r}:${c}`));

  return {
    kind: "table",
    layout: "1d",
    title: "Ways to reach each step",
    rowLabels: ["ways"],
    colLabels: ways.map((_, index) => index),
    cells: ways.map((value, c) => {
      let state: TableFrame["cells"][number]["state"] = value === null ? "idle" : "visited";
      let role: TableFrame["cells"][number]["role"] = value !== null && c <= 1 ? "base" : undefined;
      let annotation = role === "base" ? "Base case" : undefined;

      if (dependencyKeys.has(`0:${c}`)) {
        state = "compare";
        role = "dependency";
        annotation = "Previously solved dependency";
      }
      if (computation?.target.c === c) {
        state = "active";
        role = computation.phase === "write" ? "write" : "target";
        annotation = computation.phase === "write" ? "Write this result" : "Next state to solve";
      }
      if (done && c === ways.length - 1) {
        state = "found";
        role = "result";
        annotation = "Final answer";
      }

      return {
        r: 0,
        c,
        value,
        state,
        ...(role ? { role } : {}),
        ...(annotation ? { annotation } : {}),
      };
    }),
    ...(computation ? { computation } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const n = parsed["n"] as number;
  const ways: Array<number | null> = Array.from({ length: n + 1 }, () => null);
  const builder = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  builder.emit({
    frame: frameFor(ways),
    codeLine: 2,
    narration: `Create one stable table cell for every step from 0 through ${n}.`,
    detail: "Each cell will be solved once from smaller step counts that are already known.",
    phase: "setup",
    isMilestone: true,
  });

  ways[0] = 1;
  builder.bump("writes");
  builder.emit({
    frame: frameFor(ways, {
      phase: "write",
      target: { r: 0, c: 0 },
      dependencies: [],
      formula: "ways[0] = 1",
      candidates: [],
      result: 1,
    }),
    codeLine: 3,
    narration: "Write the base case ways[0] = 1.",
    detail: "There is one way to stand before the staircase: take no steps.",
    phase: "base",
    isMilestone: true,
  });

  ways[1] = 1;
  builder.bump("writes");
  builder.emit({
    frame: frameFor(ways, {
      phase: "write",
      target: { r: 0, c: 1 },
      dependencies: [],
      formula: "ways[1] = 1",
      candidates: [],
      result: 1,
    }),
    codeLine: 4,
    narration: "Write the base case ways[1] = 1.",
    detail: "A single step can only be reached with one one-step move.",
    phase: "base",
    isMilestone: true,
  });

  for (let i = 2; i <= n; i += 1) {
    const fromOne = ways[i - 1]!;
    const fromTwo = ways[i - 2]!;
    const dependencies = [
      { r: 0, c: i - 1, label: `ways[${i - 1}]` },
      { r: 0, c: i - 2, label: `ways[${i - 2}]` },
    ];
    const candidates = [
      { label: "one step back", value: fromOne },
      { label: "two steps back", value: fromTwo },
    ];
    const formula = `ways[${i}] = ways[${i - 1}] + ways[${i - 2}]`;

    builder.bump("reads", 2);
    builder.emit({
      frame: frameFor(ways, {
        phase: "read",
        target: { r: 0, c: i },
        dependencies,
        formula,
        candidates,
        result: null,
      }),
      codeLine: 7,
      narration: `Read the two solved states that can lead to step ${i}.`,
      detail: `Every route to step ${i} ends with either a one-step move from ${i - 1} or a two-step move from ${i - 2}.`,
      phase: "read",
    });

    const result = fromOne + fromTwo;
    builder.bump("additions");
    builder.emit({
      frame: frameFor(ways, {
        phase: "compute",
        target: { r: 0, c: i },
        dependencies,
        formula,
        candidates,
        result,
      }),
      codeLine: 8,
      narration: `${fromOne} + ${fromTwo} gives ${result} ways to reach step ${i}.`,
      detail: "The two route sets are disjoint because their final move has a different length.",
      phase: "compute",
      isMilestone: true,
    });

    ways[i] = result;
    builder.bump("writes");
    builder.emit({
      frame: frameFor(ways, {
        phase: "write",
        target: { r: 0, c: i },
        dependencies,
        formula,
        candidates,
        result,
      }),
      codeLine: 8,
      narration: `Write ${result} into ways[${i}].`,
      detail: "This state is now solved and can be used by later cells without recomputation.",
      phase: "write",
    });
  }

  const answer = ways[n]!;
  builder.emit({
    frame: frameFor(
      ways,
      {
        phase: "write",
        target: { r: 0, c: n },
        dependencies: [],
        formula: `answer = ways[${n}]`,
        candidates: [],
        result: answer,
      },
      true,
    ),
    codeLine: 9,
    narration: `The completed table gives ${answer} ways to climb ${n} steps.`,
    detail: "Every state was written once after its dependencies were available.",
    phase: "done",
    isMilestone: true,
  });

  return builder.finish("climbing-stairs", `n = ${n}`, `${answer} ways`);
}

export const climbingStairsModule: AlgorithmModule = {
  slug: "climbing-stairs",
  inputs: [{ name: "n", label: "Steps", kind: "number", default: 7, min: 1, max: MAX_STEPS }],
  validate(raw: Record<string, string>): ValidationResult {
    const n = Number(raw["n"]);
    if (!Number.isInteger(n) || n < 1 || n > MAX_STEPS) {
      return { ok: false, error: `Steps must be a whole number from 1 to ${MAX_STEPS}.` };
    }
    return { ok: true, parsed: { n } };
  },
  run,
  presets: [
    { label: "Seven steps", values: { n: "7" } },
    { label: "Single step", values: { n: "1" } },
    { label: "Maximum visible", values: { n: "11" } },
  ],
};

export default climbingStairsModule;
