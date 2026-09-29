import { reviewItems } from "@/data/review-items";
import type { ReviewItem } from "@/data/types";

export { reviewItems };

/** Every curated review prompt in the catalog. */
export function getReviewItems(): ReviewItem[] {
  return reviewItems;
}

/** One review prompt by id, or undefined when the id is unknown. */
export function getReviewItem(id: string): ReviewItem | undefined {
  return reviewItems.find((item) => item.id === id);
}

/**
 * The curated review set for an algorithm, in authored order (concept first,
 * transfer last). Empty for algorithms without a set yet — callers hide the
 * Review stage rather than inventing prompts.
 */
export function getReviewItemsByAlgorithm(algorithmSlug: string): ReviewItem[] {
  return reviewItems.filter((item) => item.algorithmSlug === algorithmSlug);
}

/** One question's curated review set, preserving other Golden slices in the family. */
export function getReviewItemsByProblem(problemSlug: string): ReviewItem[] {
  return reviewItems.filter((item) => item.problemSlug === problemSlug);
}
