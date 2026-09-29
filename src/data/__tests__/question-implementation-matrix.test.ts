import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { algorithms } from "@/data/algorithms";
import { problems } from "@/data/problems";
import { hasModule, hasModuleForProblem } from "@/engine/registry";

const matrixPath = path.resolve(process.cwd(), "docs/QUESTION_IMPLEMENTATION_MATRIX.md");
const matrix = fs.readFileSync(matrixPath, "utf-8");

interface MatrixRow {
  ordinal: number;
  slug: string;
  algorithmSlug: string;
  family: string;
  teachingFocus: string;
  interaction: string;
  stages: string;
  visualizerStatus: string;
  deliveryStatus: string;
}

function unquote(value: string): string {
  return value.replace(/^`|`$/g, "");
}

function matrixRows(): MatrixRow[] {
  return matrix
    .split(/\r?\n/)
    .filter((line) => /^\|\s+\d+\s+\|/.test(line))
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());

      expect(cells).toHaveLength(9);

      return {
        ordinal: Number(cells[0]),
        slug: unquote(cells[1]),
        algorithmSlug: unquote(cells[2]),
        family: cells[3],
        teachingFocus: cells[4],
        interaction: cells[5],
        stages: cells[6],
        visualizerStatus: cells[7],
        deliveryStatus: cells[8],
      };
    });
}

describe("Phase 3 question implementation matrix", () => {
  it("contains every catalog question exactly once and in catalog order", () => {
    const rows = matrixRows();

    expect(rows).toHaveLength(56);
    expect(rows.map((row) => row.ordinal)).toEqual(problems.map((_, index) => index + 1));
    expect(rows.map((row) => row.slug)).toEqual(problems.map((problem) => problem.slug));
    expect(new Set(rows.map((row) => row.slug)).size).toBe(rows.length);
  });

  it("records the authoritative algorithm owner and a complete teaching contract", () => {
    const problemBySlug = new Map(problems.map((problem) => [problem.slug, problem]));
    const algorithmSlugs = new Set(algorithms.map((algorithm) => algorithm.slug));

    for (const row of matrixRows()) {
      const problem = problemBySlug.get(row.slug);

      expect(problem).toBeDefined();
      expect(row.algorithmSlug).toBe(problem?.algorithmSlug);
      expect(algorithmSlugs.has(row.algorithmSlug)).toBe(true);
      expect(row.family).not.toBe("");
      expect(row.teachingFocus).not.toBe("");
      expect(row.interaction).not.toBe("");
      expect(row.stages).not.toBe("");
      expect(row.deliveryStatus).not.toBe("");
    }
  });

  it("matches current shared, problem-specific, and missing module coverage", () => {
    const rows = matrixRows();
    const runnable = rows.filter(
      (row) => hasModuleForProblem(row.slug) || hasModule(row.algorithmSlug),
    );

    expect(runnable).toHaveLength(36);

    for (const row of rows) {
      if (hasModuleForProblem(row.slug)) {
        expect(row.visualizerStatus).toBe("Problem module");
      } else if (hasModule(row.algorithmSlug)) {
        expect(row.visualizerStatus.startsWith("Shared")).toBe(true);
      } else {
        expect(row.visualizerStatus).toBe("Missing module");
        expect(row.deliveryStatus).toBe("Planned");
      }
    }
  });

  it("freezes the fixed-workspace overflow and family viewport rules", () => {
    expect(matrix).toContain("do not scroll");
    expect(matrix).toContain("Hard limit: 12 cells");
    expect(matrix).toContain("Hard limit: 8 nodes");
    expect(matrix).toContain("Hard limit: 15 nodes and 4 levels");
    expect(matrix).toContain("10 nodes and 16 edges");
    expect(matrix).toContain("Hard limit: 8 × 10 cells");
    expect(matrix).toContain("remain fixed");
    expect(matrix).toContain("never shrink below readable size");
  });
});
