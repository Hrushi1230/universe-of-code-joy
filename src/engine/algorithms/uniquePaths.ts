import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  CodeLineMap,
  TableFrame,
  ValidationResult,
} from "@/engine/types";

const MAX_ROWS = 8;
const MAX_COLS = 10;

const PSEUDOCODE = [
  "function uniquePaths(rows, cols)",
  "  paths <- rows by cols empty table",
  "  set every cell in first row to 1",
  "  set every cell in first column to 1",
  "  for r from 1 to rows - 1",
  "    for c from 1 to cols - 1",
  "      paths[r][c] <- paths[r - 1][c] + paths[r][c - 1]",
  "  return paths[rows - 1][cols - 1]",
];

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function uniquePaths(rows, cols) {",
    "  const paths = Array.from({ length: rows }, () => Array(cols).fill(0));",
    "  for (let c = 0; c < cols; c++) paths[0][c] = 1;",
    "  for (let r = 0; r < rows; r++) paths[r][0] = 1;",
    "  for (let r = 1; r < rows; r++) {",
    "    for (let c = 1; c < cols; c++) {",
    "      paths[r][c] = paths[r - 1][c] + paths[r][c - 1];",
    "    }",
    "  }",
    "  return paths[rows - 1][cols - 1];",
    "}",
  ],
  ts: [
    "function uniquePaths(rows: number, cols: number): number {",
    "  const paths = Array.from({ length: rows }, () => Array<number>(cols).fill(0));",
    "  for (let c = 0; c < cols; c++) paths[0]![c] = 1;",
    "  for (let r = 0; r < rows; r++) paths[r]![0] = 1;",
    "  for (let r = 1; r < rows; r++) {",
    "    for (let c = 1; c < cols; c++) {",
    "      paths[r]![c] = paths[r - 1]![c]! + paths[r]![c - 1]!;",
    "    }",
    "  }",
    "  return paths[rows - 1]![cols - 1]!;",
    "}",
  ],
  py: [
    "def unique_paths(rows, cols):",
    "    paths = [[0] * cols for _ in range(rows)]",
    "    for c in range(cols): paths[0][c] = 1",
    "    for r in range(rows): paths[r][0] = 1",
    "    for r in range(1, rows):",
    "        for c in range(1, cols):",
    "            paths[r][c] = paths[r - 1][c] + paths[r][c - 1]",
    "    return paths[rows - 1][cols - 1]",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 10],
  ts: [1, 2, 3, 4, 5, 6, 7, 10],
  py: [1, 2, 3, 4, 5, 6, 7, 8],
};

function frameFor(
  paths: Array<Array<number | null>>,
  computation?: TableFrame["computation"],
  done = false,
): TableFrame {
  const dependencyKeys = new Set((computation?.dependencies ?? []).map(({ r, c }) => `${r}:${c}`));
  const rows = paths.length;
  const cols = paths[0]?.length ?? 0;
  const cells: TableFrame["cells"] = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const value = paths[r]![c]!;
      let state: TableFrame["cells"][number]["state"] = value === null ? "idle" : "visited";
      let role: TableFrame["cells"][number]["role"] =
        value !== null && (r === 0 || c === 0) ? "base" : undefined;
      let annotation = role === "base" ? "Base case: one straight path" : undefined;

      if (dependencyKeys.has(`${r}:${c}`)) {
        state = "compare";
        role = "dependency";
        annotation = "Previously solved dependency";
      }
      if (computation?.target.r === r && computation.target.c === c) {
        state = "active";
        role = computation.phase === "write" ? "write" : "target";
        annotation = computation.phase === "write" ? "Write this result" : "Next state to solve";
      }
      if (done && r === rows - 1 && c === cols - 1) {
        state = "found";
        role = "result";
        annotation = "Final answer";
      }

      cells.push({
        r,
        c,
        value,
        state,
        ...(role ? { role } : {}),
        ...(annotation ? { annotation } : {}),
      });
    }
  }

  return {
    kind: "table",
    layout: "2d",
    title: "Paths to each grid cell",
    rowLabels: paths.map((_, r) => `r${r}`),
    colLabels: Array.from({ length: cols }, (_, c) => `c${c}`),
    cells,
    ...(computation ? { computation } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const rows = parsed["rows"] as number;
  const cols = parsed["cols"] as number;
  const paths: Array<Array<number | null>> = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );
  const builder = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  builder.emit({
    frame: frameFor(paths),
    codeLine: 2,
    narration: `Create a stable ${rows} by ${cols} table for path counts.`,
    detail:
      "Rows and columns never move; each cell is filled only after the cells above and left are ready.",
    phase: "setup",
    isMilestone: true,
  });

  for (let c = 0; c < cols; c += 1) paths[0]![c] = 1;
  for (let r = 0; r < rows; r += 1) paths[r]![0] = 1;
  builder.bump("writes", rows + cols - 1);
  builder.emit({
    frame: frameFor(paths, {
      phase: "write",
      target: { r: 0, c: 0 },
      dependencies: [],
      formula: "first row and first column = 1",
      candidates: [],
      result: 1,
    }),
    codeLine: 4,
    narration: "Seed the first row and first column with one path each.",
    detail: "A boundary cell can only be reached by moving straight right or straight down.",
    phase: "base",
    isMilestone: true,
  });

  for (let r = 1; r < rows; r += 1) {
    for (let c = 1; c < cols; c += 1) {
      const top = paths[r - 1]![c]!;
      const left = paths[r]![c - 1]!;
      const dependencies = [
        { r: r - 1, c, label: "top" },
        { r, c: c - 1, label: "left" },
      ];
      const candidates = [
        { label: "top", value: top },
        { label: "left", value: left },
      ];
      const formula = `paths[${r}][${c}] = paths[${r - 1}][${c}] + paths[${r}][${c - 1}]`;

      builder.bump("reads", 2);
      builder.emit({
        frame: frameFor(paths, {
          phase: "read",
          target: { r, c },
          dependencies,
          formula,
          candidates,
          result: null,
        }),
        codeLine: 7,
        narration: `Read the top and left path counts for cell (${r}, ${c}).`,
        detail: "Those are the only two cells that can move into the current position.",
        phase: "read",
      });

      const result = top + left;
      builder.bump("additions");
      builder.emit({
        frame: frameFor(paths, {
          phase: "compute",
          target: { r, c },
          dependencies,
          formula,
          candidates,
          result,
        }),
        codeLine: 7,
        narration: `${top} paths from above plus ${left} from the left gives ${result}.`,
        detail:
          "Every path into this cell ends with exactly one of those two moves, so the counts can be added.",
        phase: "compute",
        isMilestone: true,
      });

      paths[r]![c] = result;
      builder.bump("writes");
      builder.emit({
        frame: frameFor(paths, {
          phase: "write",
          target: { r, c },
          dependencies,
          formula,
          candidates,
          result,
        }),
        codeLine: 7,
        narration: `Write ${result} into paths[${r}][${c}].`,
        detail: "The cell is now solved and can become a dependency for the cells below and right.",
        phase: "write",
      });
    }
  }

  const answer = paths[rows - 1]![cols - 1]!;
  builder.emit({
    frame: frameFor(
      paths,
      {
        phase: "write",
        target: { r: rows - 1, c: cols - 1 },
        dependencies: [],
        formula: `answer = paths[${rows - 1}][${cols - 1}]`,
        candidates: [],
        result: answer,
      },
      true,
    ),
    codeLine: 8,
    narration: `The bottom-right cell gives ${answer} unique paths.`,
    detail: "Every table dependency was read only after it had been written.",
    phase: "done",
    isMilestone: true,
  });

  return builder.finish("unique-paths", `${rows} rows × ${cols} columns`, `${answer} paths`);
}

export const uniquePathsModule: AlgorithmModule = {
  slug: "unique-paths",
  inputs: [
    { name: "rows", label: "Rows", kind: "number", default: 4, min: 1, max: MAX_ROWS },
    { name: "cols", label: "Columns", kind: "number", default: 5, min: 1, max: MAX_COLS },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const rows = Number(raw["rows"]);
    const cols = Number(raw["cols"]);
    if (!Number.isInteger(rows) || rows < 1 || rows > MAX_ROWS) {
      return { ok: false, error: `Rows must be a whole number from 1 to ${MAX_ROWS}.` };
    }
    if (!Number.isInteger(cols) || cols < 1 || cols > MAX_COLS) {
      return { ok: false, error: `Columns must be a whole number from 1 to ${MAX_COLS}.` };
    }
    return { ok: true, parsed: { rows, cols } };
  },
  run,
  presets: [
    { label: "Four by five", values: { rows: "4", cols: "5" } },
    { label: "Single cell", values: { rows: "1", cols: "1" } },
    { label: "Maximum visible", values: { rows: "8", cols: "10" } },
  ],
};

export default uniquePathsModule;
