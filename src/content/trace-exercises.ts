/**
 * Curated "Trace it yourself" exercises.
 *
 * Data only — no React, no engine calls. The exercise names an algorithm module
 * slug plus the raw inputs that module validates, so the canonical run (and
 * therefore the correct answers) always comes from the engine, never from here.
 *
 * The guided visualizer teaches with the module's first preset; a trace exercise
 * MUST use a different input, otherwise the learner is replaying a memorised
 * example instead of executing the algorithm.
 */

export interface TraceExercise {
  /** Stable id, used in checkpoint ids and the trace run key. */
  slug: string;
  /** Algorithm this exercise traces; matches the engine registry slug. */
  algorithmSlug: string;
  /** Optional question-specific module when the algorithm family has no truthful generic run. */
  moduleSlug?: string;
  /** Question this exercise belongs to when one algorithm has multiple Golden slices. */
  problemSlug?: string;
  title: string;
  /** One line under the title, e.g. "New example · Binary Search". */
  subtitle: string;
  /** Raw inputs in the module's own `validate` shape. */
  inputs: Record<string, string>;
}

export const traceExercises: TraceExercise[] = [
  {
    slug: "validate-binary-search-tree-trace-1",
    algorithmSlug: "bst-traversals",
    moduleSlug: "validate-binary-search-tree",
    problemSlug: "validate-binary-search-tree",
    title: "Trace it yourself",
    subtitle: "New example · Validate Binary Search Tree",
    inputs: { tree: "[8,4,12,2,6,10,14]" },
  },
  {
    slug: "invert-binary-tree-trace-1",
    algorithmSlug: "level-order",
    moduleSlug: "invert-binary-tree",
    problemSlug: "invert-binary-tree",
    title: "Trace it yourself",
    subtitle: "New example · Invert Binary Tree",
    inputs: { tree: "[8,4,12,2,6,10,14]" },
  },
  {
    slug: "maximum-depth-binary-tree-trace-1",
    algorithmSlug: "level-order",
    moduleSlug: "maximum-depth-of-binary-tree",
    problemSlug: "maximum-depth-of-binary-tree",
    title: "Trace it yourself",
    subtitle: "New example · Maximum Depth of Binary Tree",
    inputs: { tree: "[8,4,12,2,null,null,14,1]" },
  },
  {
    slug: "binary-tree-right-side-view-trace-1",
    algorithmSlug: "level-order",
    moduleSlug: "binary-tree-right-side-view",
    problemSlug: "binary-tree-right-side-view",
    title: "Trace it yourself",
    subtitle: "New example · Binary Tree Right Side View",
    inputs: { tree: "[9,4,13,2,6,null,15]" },
  },
  {
    slug: "binary-tree-level-order-trace-1",
    algorithmSlug: "level-order",
    moduleSlug: "binary-tree-level-order",
    problemSlug: "binary-tree-level-order",
    title: "Trace it yourself",
    subtitle: "New example · Binary Tree Level Order",
    inputs: { tree: "[8,4,12,2,6,10,14]" },
  },
  {
    slug: "binary-search-trace-1",
    algorithmSlug: "binary-search",
    title: "Trace it yourself",
    subtitle: "New example · Binary Search",
    inputs: { values: "4, 9, 15, 21, 34, 47, 58, 63, 79", target: "58" },
  },
  {
    slug: "sort-colors-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "sort-colors",
    problemSlug: "sort-colors",
    title: "Trace it yourself",
    subtitle: "New example · Sort Colors",
    inputs: { values: "1, 2, 0, 2, 1, 0, 1" },
  },
  {
    slug: "two-sum-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "two-sum",
    problemSlug: "two-sum",
    title: "Trace it yourself",
    subtitle: "New example · Two Sum II",
    inputs: { values: "-4, -1, 2, 5, 8, 12, 19", target: "10" },
  },
  {
    slug: "container-with-most-water-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "container-with-most-water",
    problemSlug: "container-with-most-water",
    title: "Trace it yourself",
    subtitle: "New example · Container With Most Water",
    inputs: { height: "2, 7, 3, 7, 4, 6" },
  },
  {
    slug: "trapping-rain-water-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "trapping-rain-water",
    problemSlug: "trapping-rain-water",
    title: "Trace it yourself",
    subtitle: "New example · Trapping Rain Water",
    inputs: { height: "4, 1, 3, 1, 4, 2" },
  },
  {
    slug: "valid-palindrome-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "valid-palindrome",
    problemSlug: "valid-palindrome",
    title: "Trace it yourself",
    subtitle: "New example · Valid Palindrome",
    inputs: { text: "A,b ba!" },
  },
  {
    slug: "move-zeroes-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "move-zeroes",
    problemSlug: "move-zeroes",
    title: "Trace it yourself",
    subtitle: "New example · Move Zeroes",
    inputs: { values: "4, 0, 5, 0, 6" },
  },
  {
    slug: "remove-duplicates-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "remove-duplicates-from-sorted-array",
    problemSlug: "remove-duplicates-from-sorted-array",
    title: "Trace it yourself",
    subtitle: "New example · Remove Duplicates from Sorted Array",
    inputs: { values: "1, 1, 2, 2, 3, 4, 4" },
  },
  {
    slug: "three-sum-trace-1",
    algorithmSlug: "two-pointers",
    moduleSlug: "three-sum",
    problemSlug: "three-sum",
    title: "Trace it yourself",
    subtitle: "New example · 3Sum",
    inputs: { values: "-2, -2, 0, 0, 2, 2" },
  },
];

export function getTraceExercise(
  algorithmSlug: string,
  problemSlug?: string,
): TraceExercise | undefined {
  if (problemSlug) {
    return traceExercises.find(
      (exercise) =>
        exercise.algorithmSlug === algorithmSlug && exercise.problemSlug === problemSlug,
    );
  }
  return traceExercises.find((exercise) => exercise.algorithmSlug === algorithmSlug);
}

export function hasTraceExercise(algorithmSlug: string, problemSlug?: string): boolean {
  return getTraceExercise(algorithmSlug, problemSlug) !== undefined;
}
