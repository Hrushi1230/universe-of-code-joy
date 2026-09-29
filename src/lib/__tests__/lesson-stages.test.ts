import { describe, expect, it } from "vitest";
import { getAlgorithm } from "@/content/algorithms";
import { getProblem, getProblemsByAlgorithm } from "@/content/problems";
import type { Problem } from "@/content/types";
import {
  isImplementationSolved,
  isTransferSolved,
  resolveImplementationSlug,
  resolveQuestionImplementationSlug,
  resolveQuestionTransferSlug,
  resolveTransferSlug,
} from "@/lib/lesson-stages";
import { validatePracticeSearch } from "@/lib/practice-search";
import type { ProgressData } from "@/stores/progressStore";

const progressWith = (slugs: string[]): Pick<ProgressData, "problems"> => ({
  problems: Object.fromEntries(
    slugs.map((slug) => [slug, { attempts: 1, solvedAt: "2026-01-01T00:00:00.000Z" }]),
  ) as ProgressData["problems"],
});

describe("resolveImplementationSlug", () => {
  it("maps binary search to its canonical implementation challenge", () => {
    expect(resolveImplementationSlug("binary-search")).toBe("binary-search-classic");
    expect(getProblem("binary-search-classic")?.title).toBe("Classic Binary Search");
  });

  it("returns null for an algorithm with no mapping", () => {
    const unmapped = getAlgorithm("linear-search");
    expect(unmapped?.implementationProblemSlug).toBeUndefined();
    expect(resolveImplementationSlug("linear-search")).toBeNull();
  });

  it("returns null when the mapping points at a slug the catalog lacks", () => {
    const broken = { ...getAlgorithm("binary-search")!, implementationProblemSlug: "nope" };
    expect(resolveImplementationSlug("binary-search", broken)).toBeNull();
  });

  it("returns null for an unknown algorithm slug", () => {
    expect(resolveImplementationSlug("not-an-algorithm")).toBeNull();
  });

  it("only ever resolves to real problems across the whole catalog", () => {
    for (const algo of [getAlgorithm("binary-search")!]) {
      const slug = resolveImplementationSlug(algo.slug);
      if (slug) expect(getProblem(slug)).toBeDefined();
    }
  });
});

describe("resolveTransferSlug", () => {
  it("never reuses the implementation challenge for the Solve stage", () => {
    const code = resolveImplementationSlug("binary-search");
    const solve = resolveTransferSlug("binary-search");
    expect(code).toBe("binary-search-classic");
    expect(solve).not.toBe(code);
    expect(getProblem(solve!)?.algorithmSlug).toBe("binary-search");
  });

  it("ignores a preferred slug that is the implementation challenge", () => {
    expect(resolveTransferSlug("binary-search", "binary-search-classic")).not.toBe(
      "binary-search-classic",
    );
  });

  it("honours a preferred transfer question that is linked to the algorithm", () => {
    const others = getProblemsByAlgorithm("binary-search").filter(
      (p) => p.slug !== "binary-search-classic",
    );
    const preferred = others[1]?.slug ?? others[0]!.slug;
    expect(resolveTransferSlug("binary-search", preferred)).toBe(preferred);
  });

  it("returns null when the implementation challenge is the only linked question", () => {
    const only = [getProblem("binary-search-classic")!] as Problem[];
    expect(
      resolveTransferSlug("binary-search", undefined, only, "binary-search-classic"),
    ).toBeNull();
  });
});

describe("question-specific Golden stage mappings", () => {
  it("maps Level Order Code to itself and Solve to Right Side View", () => {
    expect(resolveQuestionImplementationSlug("binary-tree-level-order")).toBe(
      "binary-tree-level-order",
    );
    expect(resolveQuestionTransferSlug("binary-tree-level-order")).toBe(
      "binary-tree-right-side-view",
    );
  });

  it("keeps each Two Pointers question on its own Code and Solve targets", () => {
    expect(resolveQuestionImplementationSlug("sort-colors")).toBe("sort-colors");
    expect(resolveQuestionTransferSlug("sort-colors")).toBe("move-zeroes");
    expect(resolveQuestionImplementationSlug("two-sum")).toBe("two-sum");
    expect(resolveQuestionTransferSlug("two-sum")).toBe("container-with-most-water");
    expect(resolveQuestionImplementationSlug("container-with-most-water")).toBe(
      "container-with-most-water",
    );
    expect(resolveQuestionTransferSlug("container-with-most-water")).toBe("trapping-rain-water");
    expect(resolveQuestionImplementationSlug("trapping-rain-water")).toBe("trapping-rain-water");
    expect(resolveQuestionTransferSlug("trapping-rain-water")).toBe("valid-palindrome");
    expect(resolveQuestionImplementationSlug("valid-palindrome")).toBe("valid-palindrome");
    expect(resolveQuestionTransferSlug("valid-palindrome")).toBe("move-zeroes");
    expect(resolveQuestionImplementationSlug("move-zeroes")).toBe("move-zeroes");
    expect(resolveQuestionTransferSlug("move-zeroes")).toBe("remove-duplicates-from-sorted-array");
    expect(resolveQuestionImplementationSlug("remove-duplicates-from-sorted-array")).toBe(
      "remove-duplicates-from-sorted-array",
    );
    expect(resolveQuestionTransferSlug("remove-duplicates-from-sorted-array")).toBe("three-sum");
    expect(resolveQuestionImplementationSlug("three-sum")).toBe("three-sum");
    expect(resolveQuestionTransferSlug("three-sum")).toBe("two-sum");
  });

  it("returns null for a question without a curated Golden mapping", () => {
    expect(resolveQuestionImplementationSlug("diameter-of-binary-tree")).toBeNull();
    expect(resolveQuestionTransferSlug("diameter-of-binary-tree")).toBeNull();
  });
});

describe("isImplementationSolved", () => {
  it("is false with no mapping", () => {
    expect(isImplementationSolved(null, progressWith(["binary-search-classic"]))).toBe(false);
  });

  it("is false while the mapped problem is unsolved (visiting is not completion)", () => {
    expect(isImplementationSolved("binary-search-classic", { problems: {} })).toBe(false);
    expect(
      isImplementationSolved("binary-search-classic", {
        problems: {
          "binary-search-classic": { attempts: 3 },
        } as unknown as ProgressData["problems"],
      }),
    ).toBe(false);
  });

  it("is true once the mapped problem has a solvedAt", () => {
    expect(
      isImplementationSolved("binary-search-classic", progressWith(["binary-search-classic"])),
    ).toBe(true);
  });

  it("is not satisfied by solving a different problem", () => {
    expect(isImplementationSolved("binary-search-classic", progressWith(["two-sum"]))).toBe(false);
  });
});

describe("validatePracticeSearch", () => {
  it("keeps recognised lesson origin context", () => {
    expect(
      validatePracticeSearch({ from: "lesson", algorithm: "binary-search", stage: "code" }),
    ).toEqual({ from: "lesson", algorithm: "binary-search", stage: "code" });
  });

  it("preserves a question only when it belongs to the originating algorithm", () => {
    expect(
      validatePracticeSearch({
        from: "lesson",
        algorithm: "two-pointers",
        problem: "two-sum",
        stage: "code",
      }),
    ).toEqual({
      from: "lesson",
      algorithm: "two-pointers",
      problem: "two-sum",
      stage: "code",
    });

    expect(
      validatePracticeSearch({
        from: "lesson",
        algorithm: "binary-search",
        problem: "two-sum",
        stage: "code",
      }),
    ).toEqual({ from: "lesson", algorithm: "binary-search", stage: "code" });
  });

  it("drops junk params", () => {
    expect(
      validatePracticeSearch({ from: "hack", algorithm: "not-real", stage: "everything" }),
    ).toEqual({});
    expect(validatePracticeSearch({})).toEqual({});
  });

  it("drops an algorithm slug that is not in the catalog even with from=lesson", () => {
    expect(validatePracticeSearch({ from: "lesson", algorithm: "🙈" })).toEqual({ from: "lesson" });
  });
});

describe("solve stage / transfer problem (Phase 9)", () => {
  const CODE = "binary-search-classic";
  const SOLVE = "search-insert-position";

  it("maps binary search to a curated transfer problem distinct from Code", () => {
    expect(getAlgorithm("binary-search")?.transferProblemSlug).toBe(SOLVE);
    expect(resolveTransferSlug("binary-search")).toBe(SOLVE);
    expect(resolveTransferSlug("binary-search")).not.toBe(
      resolveImplementationSlug("binary-search"),
    );
  });

  it("the transfer problem exists, is easy and is linked to binary search", () => {
    const p = getProblem(SOLVE)!;
    expect(p.title).toBe("Search Insert Position");
    expect(p.difficulty).toBe("easy");
    expect(p.algorithmSlug).toBe("binary-search");
    expect(p.tests.length).toBeGreaterThanOrEqual(6);
    expect(p.tests.some((t) => t.hidden)).toBe(true);
  });

  it("hints reveal the pattern progressively without naming the algorithm first", () => {
    const hints = getProblem(SOLVE)!.hints;
    expect(hints.length).toBeGreaterThanOrEqual(4);
    expect(hints[0]!.toLowerCase()).not.toContain("binary search");
    expect(hints[0]).toContain("sorted");
    expect(hints[1]).toContain("low");
    expect(hints.at(-1)!.toLowerCase()).toContain("insertion position");
    for (const h of hints) expect(h).not.toContain("return low;");
  });

  it("statement never instructs the learner to use binary search", () => {
    expect(getProblem(SOLVE)!.statementMarkdown.toLowerCase()).not.toContain("binary search");
  });

  it("ignores a curated mapping that points at the implementation challenge", () => {
    const bad = { ...getAlgorithm("binary-search")!, transferProblemSlug: CODE };
    expect(resolveTransferSlug("binary-search", undefined, undefined, CODE, bad)).not.toBe(CODE);
  });

  it("ignores a curated mapping the catalog does not have", () => {
    const bad = { ...getAlgorithm("binary-search")!, transferProblemSlug: "nope" };
    const slug = resolveTransferSlug("binary-search", undefined, undefined, CODE, bad);
    expect(slug).not.toBeNull();
    expect(getProblem(slug!)).toBeDefined();
  });

  it("Code solved alone gives CODE complete and SOLVE incomplete", () => {
    const progress = progressWith([CODE]);
    expect(isImplementationSolved(CODE, progress)).toBe(true);
    expect(isTransferSolved(SOLVE, progress)).toBe(false);
  });

  it("accepted transfer submission completes SOLVE", () => {
    expect(isTransferSolved(SOLVE, progressWith([CODE, SOLVE]))).toBe(true);
  });

  it("opening or failing the transfer challenge never completes SOLVE", () => {
    const attemptedOnly = {
      problems: { [SOLVE]: { attempts: 4 } } as unknown as ProgressData["problems"],
    };
    expect(isTransferSolved(SOLVE, { problems: {} })).toBe(false);
    expect(isTransferSolved(SOLVE, attemptedOnly)).toBe(false);
  });

  it("solve-stage practice search is preserved", () => {
    expect(
      validatePracticeSearch({ from: "lesson", algorithm: "binary-search", stage: "solve" }),
    ).toEqual({ from: "lesson", algorithm: "binary-search", stage: "solve" });
  });
});
