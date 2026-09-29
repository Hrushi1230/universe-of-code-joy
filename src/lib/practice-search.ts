/**
 * Search params for /practice/$slug.
 *
 * Purely optional origin context: it changes a caption and the results page's
 * recommended next action, never the solved state or the test run. A direct
 * visit with no params — or with hand-edited junk — renders the plain workspace.
 */
import { getAlgorithm } from "@/content/algorithms";
import { getProblem } from "@/content/problems";

export interface PracticeSearch {
  /** Where the learner came from. Only "lesson" is meaningful today. */
  from?: "lesson";
  /** Algorithm slug of the originating Golden Lesson, validated against the catalog. */
  algorithm?: string;
  /** Which lesson stage sent them here. */
  stage?: "code" | "solve";
  /** Question-specific Golden slice that originated the handoff. */
  problem?: string;
}

/** Validates raw search into `PracticeSearch`, dropping anything unrecognised. */
export function validatePracticeSearch(search: Record<string, unknown>): PracticeSearch {
  const from = search.from === "lesson" ? ("lesson" as const) : undefined;
  const algorithm =
    typeof search.algorithm === "string" && getAlgorithm(search.algorithm)
      ? search.algorithm
      : undefined;
  const stage =
    search.stage === "code"
      ? ("code" as const)
      : search.stage === "solve"
        ? ("solve" as const)
        : undefined;
  const problem =
    algorithm &&
    typeof search.problem === "string" &&
    getProblem(search.problem)?.algorithmSlug === algorithm
      ? search.problem
      : undefined;
  return {
    ...(from ? { from } : {}),
    ...(algorithm ? { algorithm } : {}),
    ...(stage ? { stage } : {}),
    ...(problem ? { problem } : {}),
  };
}
