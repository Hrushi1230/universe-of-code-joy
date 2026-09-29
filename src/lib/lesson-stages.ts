/**
 * Which coding challenge each Golden Lesson stage opens.
 *
 * Pure functions over content + progress data: no React, no store, no router.
 * The CODE stage asks the learner to implement the algorithm itself; the SOLVE
 * stage asks them to recognise it inside a different question. Keeping both
 * resolutions here is what stops `if (slug === "binary-search")` branches from
 * spreading through the UI.
 */
import { getAlgorithm } from "@/content/algorithms";
import { getProblem, getProblemsByAlgorithm } from "@/content/problems";
import type { Algorithm, Problem } from "@/content/types";
import { resolvePracticeSlug } from "@/lib/explore-items";
import type { ProgressData } from "@/stores/progressStore";

interface QuestionStageMapping {
  code: string;
  solve: string;
}

const QUESTION_STAGE_MAPPINGS: Record<string, QuestionStageMapping> = {
  "binary-tree-level-order": {
    code: "binary-tree-level-order",
    solve: "binary-tree-right-side-view",
  },
  "binary-tree-right-side-view": {
    code: "binary-tree-right-side-view",
    solve: "maximum-depth-of-binary-tree",
  },
  "maximum-depth-of-binary-tree": {
    code: "maximum-depth-of-binary-tree",
    solve: "invert-binary-tree",
  },
  "invert-binary-tree": {
    code: "invert-binary-tree",
    solve: "binary-tree-level-order",
  },
  "validate-binary-search-tree": {
    code: "validate-binary-search-tree",
    solve: "diameter-of-binary-tree",
  },
  "sort-colors": { code: "sort-colors", solve: "move-zeroes" },
  "two-sum": { code: "two-sum", solve: "container-with-most-water" },
  "container-with-most-water": {
    code: "container-with-most-water",
    solve: "trapping-rain-water",
  },
  "trapping-rain-water": {
    code: "trapping-rain-water",
    solve: "valid-palindrome",
  },
  "valid-palindrome": { code: "valid-palindrome", solve: "move-zeroes" },
  "move-zeroes": { code: "move-zeroes", solve: "remove-duplicates-from-sorted-array" },
  "remove-duplicates-from-sorted-array": {
    code: "remove-duplicates-from-sorted-array",
    solve: "three-sum",
  },
  "three-sum": { code: "three-sum", solve: "two-sum" },
};

function validQuestionStageMapping(problemSlug: string): QuestionStageMapping | null {
  const mapping = QUESTION_STAGE_MAPPINGS[problemSlug];
  const source = getProblem(problemSlug);
  if (!mapping || !source) return null;
  const code = getProblem(mapping.code);
  const solve = getProblem(mapping.solve);
  if (!code || !solve || code.algorithmSlug !== source.algorithmSlug) return null;
  if (solve.algorithmSlug !== source.algorithmSlug || mapping.code === mapping.solve) return null;
  return mapping;
}

/** Question-specific Code target, preserving earlier Golden slices in the same family. */
export function resolveQuestionImplementationSlug(problemSlug?: string): string | null {
  if (!problemSlug) return null;
  return validQuestionStageMapping(problemSlug)?.code ?? null;
}

/** Question-specific transfer target for Solve. */
export function resolveQuestionTransferSlug(problemSlug?: string): string | null {
  if (!problemSlug) return null;
  return validQuestionStageMapping(problemSlug)?.solve ?? null;
}

/**
 * The implementation challenge for an algorithm, or null when there is none.
 *
 * A mapping that points at a slug the catalog does not have resolves to null
 * rather than a route that would 404 — callers hide the CODE link instead.
 */
export function resolveImplementationSlug(
  algorithmSlug: string,
  algorithm: Algorithm | undefined = getAlgorithm(algorithmSlug),
): string | null {
  const mapped = algorithm?.implementationProblemSlug;
  if (!mapped) return null;
  return getProblem(mapped) ? mapped : null;
}

/**
 * The transfer question for the SOLVE stage.
 *
 * Solve must not reopen the implementation challenge — recognising binary
 * search inside "Koko Eating Bananas" is a different skill from writing binary
 * search. When the ordinary practice resolution lands on the CODE problem, the
 * next easiest linked question is used instead; if that is the only question the
 * algorithm has, Solve resolves to null and its chip stays inert.
 */
export function resolveTransferSlug(
  algorithmSlug: string,
  preferredProblemSlug?: string,
  problems: Problem[] = getProblemsByAlgorithm(algorithmSlug),
  implementationSlug: string | null = resolveImplementationSlug(algorithmSlug),
  algorithm: Algorithm | undefined = getAlgorithm(algorithmSlug),
): string | null {
  const eligible =
    implementationSlug === null ? problems : problems.filter((p) => p.slug !== implementationSlug);
  const preferred =
    preferredProblemSlug && preferredProblemSlug !== implementationSlug
      ? preferredProblemSlug
      : undefined;
  if (preferred && eligible.some((p) => p.slug === preferred)) return preferred;
  /* The curated transfer mapping, when the catalog actually has it and it is not
     the implementation challenge, beats the generic easiest-first fallback. */
  const curated = algorithm?.transferProblemSlug;
  if (curated && curated !== implementationSlug && eligible.some((p) => p.slug === curated)) {
    return curated;
  }
  return resolvePracticeSlug(algorithmSlug, undefined, eligible);
}

/**
 * Whether a mapped stage problem is complete: derived only from that problem's
 * persisted `solvedAt`, never from having visited or run tests in Practice.
 * Used for both CODE (implementation) and SOLVE (transfer).
 */
export function isStageProblemSolved(
  problemSlug: string | null,
  progress: Pick<ProgressData, "problems">,
): boolean {
  if (!problemSlug) return false;
  return Boolean(progress.problems[problemSlug]?.solvedAt);
}

/** CODE stage completion. Thin alias over {@link isStageProblemSolved}. */
export const isImplementationSolved = isStageProblemSolved;

/** SOLVE stage completion. Thin alias over {@link isStageProblemSolved}. */
export const isTransferSolved = isStageProblemSolved;
