import type { ReviewItem } from "./types";

/**
 * Curated active-recall review prompts.
 *
 * Review is retrieval, not replay: every prompt asks the learner to reconstruct
 * a decision from memory, and each distractor encodes a real misconception seen
 * in the lesson stages (halving because the array is small, moving the wrong
 * boundary, off-by-one midpoints, treating an empty range as a failure of the
 * loop rather than of the candidate set).
 */
export const reviewItems: ReviewItem[] = [
  {
    id: "bs-review-concept",
    algorithmSlug: "binary-search",
    kind: "concept",
    prompt: "Why can binary search discard half of the current range?",
    given: [],
    choices: [
      {
        id: "a",
        label: "Because the values are sorted, one side provably cannot hold the target",
      },
      {
        id: "b",
        label: "Because mid is always close to the target",
        misconception:
          "mid is only the middle of the range, not an estimate of where the target lives. The discarded half is safe because of order, not proximity.",
      },
      {
        id: "c",
        label: "Because the array is small enough to halve",
        misconception:
          "Size never justifies elimination. Halving a small unsorted array would still skip the answer.",
      },
      {
        id: "d",
        label: "Because every value in the array is unique",
        misconception:
          "Duplicates are allowed. What matters is that values never decrease as the index grows.",
      },
    ],
    answerId: "a",
    explanation:
      "Sorted order turns one comparison into a proof: everything before a value too small, or after a value too large, cannot possibly equal the target.",
    hint: "Ask what property of the input the comparison is allowed to rely on.",
  },
  {
    id: "bs-review-boundary",
    algorithmSlug: "binary-search",
    kind: "boundary",
    prompt: "Which boundary changes next?",
    given: ["low = 0", "mid = 4", "high = 9", "arr[mid] = 16", "target = 23"],
    choices: [
      { id: "a", label: "low = mid + 1" },
      {
        id: "b",
        label: "high = mid - 1",
        misconception:
          "arr[mid] is below the target, so the target can only be to the right. Moving high would throw away the half that still contains it.",
      },
      {
        id: "c",
        label: "low = mid",
        misconception:
          "mid has already been compared and rejected. Keeping it in the range lets the same index be tested forever.",
      },
      {
        id: "d",
        label: "high = mid",
        misconception:
          "The surviving side is the right one, so high stays where it is; only low advances.",
      },
    ],
    answerId: "a",
    explanation:
      "16 < 23, so indices 0…4 are all too small. low jumps past mid to 5 and the range becomes 5…9.",
    hint: "Compare arr[mid] with the target first, then ask which side survives.",
  },
  {
    id: "bs-review-midpoint",
    algorithmSlug: "binary-search",
    kind: "midpoint",
    prompt: "What is mid for this range?",
    given: ["low = 5", "high = 8"],
    choices: [
      { id: "a", label: "6 — floor((5 + 8) / 2)" },
      {
        id: "b",
        label: "7 — round((5 + 8) / 2)",
        misconception:
          "The midpoint is floored, not rounded. 13 / 2 is 6.5, and floor takes it to 6.",
      },
      {
        id: "c",
        label: "4 — floor((8 - 5) / 2)",
        misconception: "Halving the width gives an offset, not an index. Add it to low: 5 + 1 = 6.",
      },
      {
        id: "d",
        label: "6.5 — (5 + 8) / 2",
        misconception: "An index must be an integer, so the division is floored to 6.",
      },
    ],
    answerId: "a",
    explanation: "mid = low + floor((high - low) / 2) = 5 + 1 = 6, the same as floor(13 / 2).",
    hint: "The midpoint is an index, so the division has to land on a whole number.",
  },
  {
    id: "bs-review-termination",
    algorithmSlug: "binary-search",
    kind: "termination",
    prompt: "What does this state mean?",
    given: ["low = 6", "high = 5"],
    choices: [
      { id: "a", label: "The candidate range is empty, so the target is not present" },
      {
        id: "b",
        label: "The loop overshot and should back up one step",
        misconception:
          "Nothing overshot. Crossed boundaries are the intended stop condition, not a bug to undo.",
      },
      {
        id: "c",
        label: "mid should now be checked one more time",
        misconception:
          "There is no index left between the boundaries, so there is nothing left to check.",
      },
      {
        id: "d",
        label: "The array was not sorted",
        misconception:
          "Crossed boundaries happen on perfectly sorted input whenever the target is absent.",
      },
    ],
    answerId: "a",
    explanation:
      "low > high means every index has been proved impossible. The search ends and reports absence.",
    hint: "Count how many indices satisfy low ≤ i ≤ high.",
  },
  {
    id: "bs-review-code",
    algorithmSlug: "binary-search",
    kind: "code",
    prompt: "Which statement completes the branch: if (nums[mid] < target) { ___ }",
    given: [
      "while (low <= high) {",
      "  mid = low + ((high - low) >> 1);",
      "  if (nums[mid] < target) { ___ }",
    ],
    choices: [
      { id: "a", label: "low = mid + 1;" },
      {
        id: "b",
        label: "high = mid - 1;",
        misconception:
          "That is the branch for nums[mid] > target. Here mid is too small, so the left side is the impossible one.",
      },
      {
        id: "c",
        label: "low = mid;",
        misconception:
          "Leaving mid inside the range means the loop can recompute the same mid and never terminate.",
      },
      {
        id: "d",
        label: "return mid;",
        misconception: "Returning is only correct on equality, which this branch has ruled out.",
      },
    ],
    answerId: "a",
    explanation:
      "A value below the target rules out mid and everything left of it, so low moves to mid + 1 and the range strictly shrinks.",
    hint: "Each branch must remove at least one index, including mid itself.",
  },
  {
    id: "bs-review-pattern",
    algorithmSlug: "binary-search",
    kind: "pattern",
    prompt: "What makes Search Insert Position solvable with this strategy?",
    given: [],
    choices: [
      {
        id: "a",
        label: "The candidate positions are ordered, so half of them can be eliminated per test",
      },
      {
        id: "b",
        label: "The answer is always near the middle of the array",
        misconception:
          "The insertion point can be at either end. Elimination comes from order, not from where the answer tends to sit.",
      },
      {
        id: "c",
        label: "The array is short, so any scan is fast enough",
        misconception:
          "Input size is not the property being exploited; a linear scan would work but would not be the same technique.",
      },
      {
        id: "d",
        label: "Every value in the array is distinct",
        misconception:
          "Distinctness is not required. A monotonic ordering of candidate positions is.",
      },
    ],
    answerId: "a",
    explanation:
      "Transfer works whenever the candidate answers form an ordered space and one test can prove a whole side impossible — here, positions left or right of mid.",
    hint: "Ask what the search space is: values, or positions?",
  },
  {
    id: "tp-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "sort-colors",
    kind: "concept",
    prompt: "Why can Sort Colors finish in one pass with constant extra space?",
    given: [],
    choices: [
      {
        id: "a",
        label: "Each inspected value immediately grows one of three in-place partitions",
      },
      {
        id: "b",
        label: "The values are automatically sorted before the pointers start",
        misconception:
          "The input may be in any order. The pointers create the partitions while scanning it.",
      },
      {
        id: "c",
        label: "The algorithm stores a second array of colors",
        misconception:
          "All swaps happen inside the input array, so only three pointer variables use extra space.",
      },
      {
        id: "d",
        label: "Every value is compared with every other value",
        misconception:
          "No pairwise scan is needed. Each iteration classifies the value currently at mid.",
      },
    ],
    answerId: "a",
    explanation:
      "The low, mid, and high boundaries preserve three classified regions while the unknown region shrinks, so each value is handled in place.",
    hint: "Count the regions being maintained, not the number of possible pairs.",
  },
  {
    id: "tp-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "sort-colors",
    kind: "invariant",
    prompt: "Which partition invariant is correct before each loop iteration?",
    given: ["low <= mid <= high + 1"],
    choices: [
      {
        id: "a",
        label: "before low: 0s; low…mid-1: 1s; mid…high: unknown; after high: 2s",
      },
      {
        id: "b",
        label: "before mid: fully sorted; mid…high: descending",
        misconception:
          "The middle prefix is partitioned by color, not generally sorted by comparing neighboring values.",
      },
      {
        id: "c",
        label: "before low: unknown; after high: 0s",
        misconception:
          "The completed sides are the reverse: 0s accumulate before low and 2s after high.",
      },
      {
        id: "d",
        label: "only nums[mid] is classified; every other position is unknown",
        misconception:
          "The algorithm relies on all three surrounding regions remaining classified after every transition.",
      },
    ],
    answerId: "a",
    explanation:
      "Those four regions are exactly what makes each swap safe and proves that crossing mid and high means the entire array is classified.",
    hint: "Name what is guaranteed on both sides of the unknown region.",
  },
  {
    id: "tp-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "sort-colors",
    kind: "classification",
    prompt: "nums[mid] is 2. What transition is correct?",
    given: ["low = 1", "mid = 3", "high = 6", "nums[mid] = 2"],
    choices: [
      { id: "a", label: "swap nums[mid] with nums[high], then high--" },
      {
        id: "b",
        label: "mid++",
        misconception:
          "Advancing mid would leave a 2 inside the middle partition, where only 1s belong.",
      },
      {
        id: "c",
        label: "swap nums[mid] with nums[low], then low++ and mid++",
        misconception: "That is the transition for a 0, which belongs in the left partition.",
      },
      {
        id: "d",
        label: "return because the 2 is already a final value",
        misconception:
          "The value is valid but not necessarily in its final partition; the unknown region still contains values.",
      },
    ],
    answerId: "a",
    explanation:
      "A 2 grows the right partition. High moves left, while mid stays to inspect the unknown value swapped in from the right.",
    hint: "Which side of the array is reserved for 2s?",
  },
  {
    id: "tp-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "sort-colors",
    kind: "boundary",
    prompt: "Why does mid stay put after swapping a 2 with nums[high]?",
    given: ["nums[mid] = 2", "swap(nums[mid], nums[high])"],
    choices: [
      { id: "a", label: "The value arriving from high has not been classified yet" },
      {
        id: "b",
        label: "mid is never allowed to move when a swap happens",
        misconception:
          "Mid does move after the 0 swap because the incoming value then came from a classified region.",
      },
      {
        id: "c",
        label: "high always contains a 1",
        misconception:
          "High is inside the unknown region before the swap, so it may contain any color.",
      },
      {
        id: "d",
        label: "The algorithm must compare the same 2 twice",
        misconception:
          "The 2 moved to the completed right partition. It is the newly arrived value at mid that needs inspection.",
      },
    ],
    answerId: "a",
    explanation:
      "Only high's old value is now at mid, and that position was previously unknown. Advancing mid would skip its classification.",
    hint: "Track the value that arrives at mid, not the 2 that leaves it.",
  },
  {
    id: "tp-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "sort-colors",
    kind: "code",
    prompt: "Which updates complete the nums[mid] === 0 branch?",
    given: ["swap(nums, low, mid);", "___"],
    choices: [
      { id: "a", label: "low++; mid++;" },
      {
        id: "b",
        label: "high--;",
        misconception: "High changes only when a 2 is placed into the right partition.",
      },
      {
        id: "c",
        label: "low++;",
        misconception:
          "The value now at mid came from the classified middle region, so mid must also advance.",
      },
      {
        id: "d",
        label: "mid--; low++;",
        misconception:
          "Moving mid backward would revisit a completed position and can break the monotonic progress of the scan.",
      },
    ],
    answerId: "a",
    explanation:
      "The left 0 region and the middle 1 region both grow by one, so low and mid advance together.",
    hint: "After the swap, ask whether the new value at mid was already classified.",
  },
  {
    id: "tp-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "sort-colors",
    kind: "pattern",
    prompt: "Which new problem most directly reuses the reader/writer two-pointer pattern?",
    given: [],
    choices: [
      { id: "a", label: "Move all zeroes to the end while keeping non-zero values in order" },
      {
        id: "b",
        label: "Find the shortest path through a weighted graph",
        misconception:
          "Weighted shortest paths require a graph frontier and distance relaxation, not an in-place linear compaction.",
      },
      {
        id: "c",
        label: "Search a sorted array by repeatedly halving it",
        misconception:
          "That is binary search. Its boundaries eliminate ranges rather than reading and writing a compact prefix.",
      },
      {
        id: "d",
        label: "Generate every permutation of a string",
        misconception:
          "Permutation generation is recursive/backtracking work, not a one-pass pointer compaction.",
      },
    ],
    answerId: "a",
    explanation:
      "Move Zeroes uses one pointer to read each value and another to write the next retained non-zero value, then fills the remaining suffix.",
    hint: "Look for one pass that separates reading from writing in the same array.",
  },
  {
    id: "two-sum-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "two-sum",
    kind: "concept",
    prompt: "Why does the converging-pointer solution require the input to be sorted?",
    given: [],
    choices: [
      {
        id: "a",
        label: "The pair sum tells us which endpoint cannot participate in any remaining answer",
      },
      {
        id: "b",
        label: "Sorting guarantees the answer uses the first and last values",
        misconception:
          "The answer may be anywhere inside the array. The endpoints are probes whose order supports safe elimination.",
      },
      {
        id: "c",
        label: "Sorting makes every pair have the same sum",
        misconception:
          "Pair sums still vary. Sorting only makes their direction predictable when a pointer moves.",
      },
      {
        id: "d",
        label: "Sorting changes the required target into an index",
        misconception:
          "The target remains a value. Sorted order lets one comparison rule out an endpoint value.",
      },
    ],
    answerId: "a",
    explanation:
      "If the sum is too small, even the largest remaining partner cannot rescue the old left value. If it is too large, even the smallest remaining partner cannot rescue the old right value.",
    hint: "Ask what becomes provably impossible after a sum is too small or too large.",
  },
  {
    id: "two-sum-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "two-sum",
    kind: "invariant",
    prompt: "Which invariant is true before every pair comparison?",
    given: ["left < right"],
    choices: [
      {
        id: "a",
        label: "Any valid pair still uses two distinct indices inside the current left…right span",
      },
      {
        id: "b",
        label: "Every index inside the span must belong to the answer",
        misconception:
          "The span contains candidates, not guaranteed answer positions. Each comparison eliminates one endpoint.",
      },
      {
        id: "c",
        label: "All values outside the span are larger than the target",
        misconception:
          "The left side was ruled out for being unable to make a large enough sum; the right side for making sums too large.",
      },
      {
        id: "d",
        label: "left and right always move together",
        misconception:
          "Exactly one endpoint moves after an unequal sum so that the sum changes in the required direction.",
      },
    ],
    answerId: "a",
    explanation:
      "Sorted-order proofs remove endpoints permanently, so a still-possible answer must remain between left and right and use two different positions.",
    hint: "Describe where an unruled-out pair is allowed to live.",
  },
  {
    id: "two-sum-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "two-sum",
    kind: "classification",
    prompt: "The current pair sum is larger than the target. Which action is correct?",
    given: ["numbers[left] + numbers[right] = 17", "target = 9"],
    choices: [
      { id: "a", label: "right--" },
      {
        id: "b",
        label: "left++",
        misconception:
          "Advancing left replaces the smaller endpoint with an equal or larger value, so it cannot reduce the sum.",
      },
      {
        id: "c",
        label: "return [left + 1, right + 1]",
        misconception: "The current sum is 17, not 9, so this pair is not the answer.",
      },
      {
        id: "d",
        label: "restart both pointers in the middle",
        misconception:
          "Restarting discards the monotonic elimination proof and may skip the unique answer.",
      },
    ],
    answerId: "a",
    explanation:
      "Retreating right replaces the larger endpoint with an equal or smaller value, which is the only move that can reduce an oversized sum.",
    hint: "Which endpoint must change if the sum needs to become smaller?",
  },
  {
    id: "two-sum-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "two-sum",
    kind: "boundary",
    prompt: "Why is it safe to advance left when the pair sum is too small?",
    given: ["numbers[left] + numbers[right] < target"],
    choices: [
      {
        id: "a",
        label:
          "right is already the largest candidate partner, so the old left value can never reach the target",
      },
      {
        id: "b",
        label: "left is always the smaller index, so it must move first",
        misconception:
          "Index order alone proves nothing about the sum. The proof depends on sorted values and right being the largest remaining partner.",
      },
      {
        id: "c",
        label: "moving left always decreases the pair sum",
        misconception:
          "On a non-decreasing array, advancing left keeps the value equal or increases it, which is why it can repair a small sum.",
      },
      {
        id: "d",
        label: "the old left value was already used in the answer",
        misconception:
          "A too-small sum proves the current pair is not the answer and rules out the old left value entirely.",
      },
    ],
    answerId: "a",
    explanation:
      "Pairing the old left value with anything before right would make an equal or smaller sum, so none of those pairs can hit the target.",
    hint: "Right is the largest value still available to pair with left.",
  },
  {
    id: "two-sum-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "two-sum",
    kind: "code",
    prompt: "Which return statement satisfies the problem's 1-indexed output contract?",
    given: ["sum === target", "left and right are 0-indexed"],
    choices: [
      { id: "a", label: "return [left + 1, right + 1];" },
      {
        id: "b",
        label: "return [left, right];",
        misconception:
          "Those are internal 0-indexed positions, one below each required answer index.",
      },
      {
        id: "c",
        label: "return [numbers[left], numbers[right]];",
        misconception: "The problem asks for positions, not the two values themselves.",
      },
      {
        id: "d",
        label: "return left + right;",
        misconception:
          "Adding indices loses both positions and does not satisfy the array return type.",
      },
    ],
    answerId: "a",
    explanation:
      "The pointers are ordinary 0-indexed array offsets, while Two Sum II explicitly requires two 1-indexed positions.",
    hint: "Convert both internal offsets to the indexing convention in the statement.",
  },
  {
    id: "two-sum-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "two-sum",
    kind: "pattern",
    prompt: "Which transfer problem most directly reuses opposite-end pointer elimination?",
    given: [],
    choices: [
      {
        id: "a",
        label: "Container With Most Water — move the endpoint with the shorter height",
      },
      {
        id: "b",
        label: "Course Schedule — repeatedly remove zero-indegree courses",
        misconception:
          "Course Schedule uses a graph and topological queue, not ordered endpoint elimination.",
      },
      {
        id: "c",
        label: "Climbing Stairs — combine two previous counts",
        misconception: "That is a dynamic-programming recurrence rather than a converging scan.",
      },
      {
        id: "d",
        label: "Top K Frequent Elements — maintain a frequency map and heap",
        misconception:
          "Frequency counting and heap selection do not use monotonic endpoint movement.",
      },
    ],
    answerId: "a",
    explanation:
      "Both problems start at opposite ends and use one local comparison to prove which endpoint cannot improve any future candidate.",
    hint: "Look for two endpoints moving inward under a monotonic proof.",
  },
  {
    id: "container-water-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "container-with-most-water",
    kind: "concept",
    prompt: "Why does the algorithm begin with the first and last walls?",
    given: [],
    choices: [
      {
        id: "a",
        label: "They give the maximum possible width, which can only shrink as pointers move",
      },
      {
        id: "b",
        label: "The outer walls are guaranteed to be the tallest",
        misconception:
          "The tallest walls may be inside. The outer pair is useful because it starts with maximum width.",
      },
      {
        id: "c",
        label: "Every optimal container must include index 0",
        misconception:
          "The optimal pair often excludes index 0. The proof safely eliminates walls as width shrinks.",
      },
      {
        id: "d",
        label: "Starting outside sorts the heights automatically",
        misconception:
          "The heights remain unsorted. This algorithm depends on the limiting wall, not sorted order.",
      },
    ],
    answerId: "a",
    explanation:
      "The endpoints provide the widest candidate. Every later candidate is narrower, so an endpoint must offer a taller limiting wall to improve the area.",
    hint: "Ask which factor in width × limiting height is largest at the start.",
  },
  {
    id: "container-water-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "container-with-most-water",
    kind: "invariant",
    prompt: "Which invariant is true before each area check?",
    given: ["best stores the largest checked area"],
    choices: [
      {
        id: "a",
        label: "Any unchecked container that can beat best uses two walls between left and right",
      },
      {
        id: "b",
        label: "Every wall outside left…right is shorter than every wall inside",
        misconception:
          "Discarded walls need not be globally shorter. Each was ruled out because it could not improve after width shrank.",
      },
      {
        id: "c",
        label: "The current pair always has the largest area",
        misconception:
          "The current pair is only the next candidate. The stored best may come from an earlier pair.",
      },
      {
        id: "d",
        label: "left and right always have different heights",
        misconception:
          "Equal heights are valid; both endpoints can then be ruled out together after checking their area.",
      },
    ],
    answerId: "a",
    explanation:
      "The shorter-wall proof permanently removes endpoints, so any pair still capable of improving the answer must remain inside the live span.",
    hint: "Describe where an unruled-out better container is still allowed to exist.",
  },
  {
    id: "container-water-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "container-with-most-water",
    kind: "classification",
    prompt: "The left wall is shorter than the right wall. Which transition is correct?",
    given: ["height[left] = 3", "height[right] = 8"],
    choices: [
      { id: "a", label: "left++" },
      {
        id: "b",
        label: "right--",
        misconception:
          "Moving the taller right wall leaves height 3 as the limit while reducing width, so area cannot improve.",
      },
      {
        id: "c",
        label: "left++; right--",
        misconception:
          "Only the shorter left wall is proved useless. Moving both may discard a valuable taller wall.",
      },
      {
        id: "d",
        label: "return the current area immediately",
        misconception:
          "The current area updates best, but an inner pair with taller walls may still produce more water.",
      },
    ],
    answerId: "a",
    explanation:
      "The left wall limits the current area. Any narrower container retaining it has no greater limiting height, so left is safe to discard.",
    hint: "Move the endpoint responsible for the limiting height.",
  },
  {
    id: "container-water-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "container-with-most-water",
    kind: "boundary",
    prompt: "After checking two equal-height endpoint walls, why may this run move both pointers?",
    given: ["height[left] = height[right] = h"],
    choices: [
      {
        id: "a",
        label: "Any pair retaining either endpoint has smaller width and limiting height at most h",
      },
      {
        id: "b",
        label: "Equal walls always form the global optimum",
        misconception:
          "They form one checked candidate, but taller inner walls may still create a larger area.",
      },
      {
        id: "c",
        label: "Moving both keeps the width unchanged",
        misconception:
          "Moving inward reduces width; the proof works because neither equal endpoint can improve.",
      },
      {
        id: "d",
        label: "Equal values are duplicates and may be deleted from the array",
        misconception:
          "No data is deleted. The pointers only rule out those endpoint positions for future candidates.",
      },
    ],
    answerId: "a",
    explanation:
      "With either equal endpoint retained, width decreases while the limiting height cannot exceed h, so that area cannot beat the pair just checked.",
    hint: "Hold one endpoint fixed and ask what happens to both width and limiting height.",
  },
  {
    id: "container-water-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "container-with-most-water",
    kind: "code",
    prompt: "Which expression computes the current container area?",
    given: ["width = right - left"],
    choices: [
      {
        id: "a",
        label: "Math.min(height[left], height[right]) * width",
      },
      {
        id: "b",
        label: "Math.max(height[left], height[right]) * width",
        misconception:
          "Water spills over the shorter wall, so the taller wall cannot determine the filled height.",
      },
      {
        id: "c",
        label: "(height[left] + height[right]) * width",
        misconception: "Adding wall heights does not represent the water level between them.",
      },
      {
        id: "d",
        label: "Math.min(height[left], height[right]) + width",
        misconception: "Area multiplies height by width; adding them has incompatible units.",
      },
    ],
    answerId: "a",
    explanation:
      "The shorter wall sets the water height, and the pointer distance sets the width, so area is their product.",
    hint: "Water height is limited by one endpoint, then multiplied by distance.",
  },
  {
    id: "container-water-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "container-with-most-water",
    kind: "pattern",
    prompt:
      "Which transfer problem most directly extends reasoning about water and two boundaries?",
    given: [],
    choices: [
      {
        id: "a",
        label: "Trapping Rain Water — maintain boundary maxima while moving inward",
      },
      {
        id: "b",
        label: "Valid Parentheses — match closing symbols with a stack",
        misconception: "That is a stack discipline problem, not a boundary-height problem.",
      },
      {
        id: "c",
        label: "Group Anagrams — bucket strings by a signature",
        misconception: "Anagram grouping uses hashing rather than converging boundary proofs.",
      },
      {
        id: "d",
        label: "Binary Tree Level Order — process nodes through a queue",
        misconception: "Level-order traversal uses a tree frontier, not paired height boundaries.",
      },
    ],
    answerId: "a",
    explanation:
      "Trapping Rain Water also uses left and right boundaries, but extends the idea by tracking the maximum wall seen from each side and accumulating local water.",
    hint: "Look for another problem where wall heights and inward-moving boundaries govern water.",
  },
  {
    id: "trapping-water-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "trapping-rain-water",
    kind: "concept",
    prompt: "Why can the algorithm finalize the side with the smaller boundary maximum?",
    given: ["leftMax <= rightMax"],
    choices: [
      {
        id: "a",
        label:
          "The opposite boundary is at least leftMax, so leftMax fixes the next left bar's water",
      },
      {
        id: "b",
        label: "The next left bar is guaranteed to be shorter than every other bar",
        misconception: "Only the boundary maxima are compared; interior bar ordering is unknown.",
      },
      {
        id: "c",
        label: "The taller boundary must always move first",
        misconception: "Moving the taller side does not provide a tighter guaranteed water level.",
      },
      {
        id: "d",
        label: "Both pointers must move together to preserve symmetry",
        misconception: "Only one bounded side is finalized per iteration.",
      },
    ],
    answerId: "a",
    explanation:
      "When leftMax is no larger, rightMax guarantees an opposite wall at least leftMax high. Future interior bars cannot lower that guarantee, so the next left bar is final.",
    hint: "Ask whether an unseen bar can remove the boundary already known on the opposite side.",
  },
  {
    id: "trapping-water-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "trapping-rain-water",
    kind: "invariant",
    prompt: "Which invariant is true before each boundary comparison?",
    given: ["left and right enclose the unresolved bars"],
    choices: [
      {
        id: "a",
        label:
          "Bars outside [left, right] are finalized and water stores their exact accumulated total",
      },
      {
        id: "b",
        label: "Every bar inside [left, right] already has its final water amount",
        misconception: "The interior is precisely the unresolved region.",
      },
      {
        id: "c",
        label: "leftMax and rightMax are the two globally tallest bars",
        misconception: "They are maxima only over the prefixes and suffixes seen so far.",
      },
      {
        id: "d",
        label: "water equals the sum of all bar heights outside the pointers",
        misconception: "Water is empty capacity above bars, not the bars' own heights.",
      },
    ],
    answerId: "a",
    explanation:
      "Each move finalizes exactly one new bar. The running total contains every resolved bar once, while only the interval between the pointers remains undecided.",
    hint: "Separate the finalized exterior from the unresolved interior.",
  },
  {
    id: "trapping-water-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "trapping-rain-water",
    kind: "classification",
    prompt: "leftMax and rightMax are equal. Which side does this deterministic run process?",
    given: ["leftMax = 4", "rightMax = 4", "left < right"],
    choices: [
      { id: "a", label: "Process the left side" },
      {
        id: "b",
        label: "Process the right side",
        misconception:
          "That can be mathematically safe, but it does not match this run's explicit left-on-tie rule.",
      },
      {
        id: "c",
        label: "Move both sides and count both bars immediately",
        misconception:
          "This implementation finalizes one bar per iteration to keep each water addition explicit.",
      },
      {
        id: "d",
        label: "Stop because equal maxima prove no water remains",
        misconception:
          "Equal outer maxima can enclose substantial water over shorter interior bars.",
      },
    ],
    answerId: "a",
    explanation:
      "The condition is leftMax <= rightMax, so equality enters the left branch and finalizes the next left bar.",
    hint: "Read the comparison operator exactly, including equality.",
  },
  {
    id: "trapping-water-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "trapping-rain-water",
    kind: "boundary",
    prompt: "After moving left, how much water is finalized above height[left]?",
    given: ["leftMax = max(leftMax, height[left])"],
    choices: [
      { id: "a", label: "leftMax - height[left]" },
      {
        id: "b",
        label: "rightMax - height[left]",
        misconception:
          "The smaller guaranteed side is leftMax; using a taller rightMax can overcount.",
      },
      {
        id: "c",
        label: "height[left] - leftMax",
        misconception:
          "That reverses the empty capacity and would be non-positive after updating leftMax.",
      },
      {
        id: "d",
        label: "leftMax + height[left]",
        misconception: "Water is the gap above the bar, not the sum of boundary and bar heights.",
      },
    ],
    answerId: "a",
    explanation:
      "Updating leftMax first guarantees leftMax is at least the current bar, so leftMax - height[left] is the non-negative trapped amount.",
    hint: "Compute the empty vertical space between the known boundary level and the bar.",
  },
  {
    id: "trapping-water-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "trapping-rain-water",
    kind: "code",
    prompt: "Which condition chooses the left side and preserves the tie rule?",
    given: ["lMax and rMax are the running boundary maxima", "ties process left"],
    choices: [
      { id: "a", label: "if (lMax <= rMax)" },
      {
        id: "b",
        label: "if (height[l] <= height[r])",
        misconception:
          "Current bar heights do not represent the strongest boundaries seen from each side.",
      },
      {
        id: "c",
        label: "if (lMax < rMax)",
        misconception:
          "A strict comparison sends ties to the right branch instead of the documented left branch.",
      },
      {
        id: "d",
        label: "if (water <= lMax + rMax)",
        misconception:
          "The accumulated total does not decide which side has a guaranteed boundary.",
      },
    ],
    answerId: "a",
    explanation:
      "Comparing the two running maxima identifies the bounded side, and <= makes the left-on-tie behavior deterministic.",
    hint: "The decision depends on boundary maxima and must include equality.",
  },
  {
    id: "trapping-water-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "trapping-rain-water",
    kind: "pattern",
    prompt:
      "Which transfer problem also moves opposite-end pointers inward, but compares characters?",
    given: [],
    choices: [
      { id: "a", label: "Valid Palindrome" },
      {
        id: "b",
        label: "Coin Change",
        misconception:
          "Coin Change builds dynamic-programming states rather than converging endpoints.",
      },
      {
        id: "c",
        label: "Course Schedule",
        misconception: "Course Schedule uses graph dependencies and cycle detection.",
      },
      {
        id: "d",
        label: "Top K Frequent Elements",
        misconception: "Top K frequency selection uses counting and a heap or buckets.",
      },
    ],
    answerId: "a",
    explanation:
      "Valid Palindrome reuses the converging left/right pointer shape, while replacing boundary maxima and water accumulation with normalized character comparison.",
    hint: "Look for another problem whose candidates live at two opposite ends.",
  },
  {
    id: "valid-palindrome-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "valid-palindrome",
    kind: "concept",
    prompt: "Why are spaces and punctuation skipped before comparing endpoints?",
    given: ["Only alphanumeric characters participate"],
    choices: [
      { id: "a", label: "They do not affect the normalized palindrome sequence" },
      {
        id: "b",
        label: "They always appear symmetrically",
        misconception: "Punctuation may appear anywhere; it is ignored, not assumed symmetric.",
      },
      {
        id: "c",
        label: "They count as lowercase letters",
        misconception: "Symbols are not letters and have no lowercase comparison value.",
      },
      {
        id: "d",
        label: "Skipping them makes every string a palindrome",
        misconception: "Alphanumeric mirrored pairs can still mismatch.",
      },
    ],
    answerId: "a",
    explanation:
      "The required sequence is formed only from lowercase alphanumeric characters, so symbols are irrelevant to equality.",
    hint: "Think about the exact normalized sequence the problem asks you to compare.",
  },
  {
    id: "valid-palindrome-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "valid-palindrome",
    kind: "invariant",
    prompt: "Which invariant holds before each endpoint inspection?",
    given: ["left and right enclose the unchecked region"],
    choices: [
      { id: "a", label: "Outside characters are already matched or intentionally ignored" },
      {
        id: "b",
        label: "Every interior character is already proved",
        misconception: "The interior is the remaining unchecked region.",
      },
      {
        id: "c",
        label: "left and right always point to letters",
        misconception: "Either endpoint can still be punctuation that must be skipped.",
      },
      {
        id: "d",
        label: "The original text has been rearranged",
        misconception: "Pointers move over the original order; nothing is rearranged.",
      },
    ],
    answerId: "a",
    explanation:
      "Each transition either ignores one irrelevant symbol or proves one mirrored alphanumeric pair, shrinking only the unresolved interval.",
    hint: "Separate the proved exterior from the unchecked interior.",
  },
  {
    id: "valid-palindrome-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "valid-palindrome",
    kind: "classification",
    prompt: "left points to a comma while right points to a letter. What happens first?",
    given: ["text[left] = ','", "text[right] = 'a'"],
    choices: [
      { id: "a", label: "Advance left only" },
      {
        id: "b",
        label: "Retreat right only",
        misconception: "The right letter is relevant; the left comma is the endpoint to skip.",
      },
      {
        id: "c",
        label: "Move both pointers",
        misconception: "Both move only after two normalized alphanumeric characters match.",
      },
      {
        id: "d",
        label: "Return false",
        misconception: "Punctuation is ignored and cannot create a mismatch.",
      },
    ],
    answerId: "a",
    explanation:
      "The left endpoint fails the alphanumeric test, so left advances without consuming the right letter.",
    hint: "Handle one irrelevant endpoint before comparing a pair.",
  },
  {
    id: "valid-palindrome-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "valid-palindrome",
    kind: "boundary",
    prompt: "When may the algorithm safely return true?",
    given: ["No mismatch has been found"],
    choices: [
      { id: "a", label: "When left is greater than or equal to right" },
      {
        id: "b",
        label: "After the first matching pair",
        misconception: "More mirrored pairs may remain unchecked.",
      },
      {
        id: "c",
        label: "When either pointer sees punctuation",
        misconception: "Punctuation is skipped; it does not complete the proof.",
      },
      {
        id: "d",
        label: "Only when the original text has even length",
        misconception:
          "Odd-length palindromes are valid because the center needs no mirror comparison.",
      },
    ],
    answerId: "a",
    explanation:
      "Once the pointers meet or cross, every required mirrored pair has matched and no unchecked pair remains.",
    hint: "Ask when the unchecked interval becomes empty or a single center character.",
  },
  {
    id: "valid-palindrome-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "valid-palindrome",
    kind: "code",
    prompt: "Which comparison correctly checks two relevant endpoint characters?",
    given: ["Both endpoints are alphanumeric"],
    choices: [
      { id: "a", label: "s[left].toLowerCase() !== s[right].toLowerCase()" },
      {
        id: "b",
        label: "s[left] !== s[right]",
        misconception:
          "A case-sensitive comparison incorrectly rejects matching letters with different case.",
      },
      {
        id: "c",
        label: "left !== right",
        misconception: "Pointer indices normally differ; the character values are what matter.",
      },
      {
        id: "d",
        label: "s.sort()",
        misconception: "Reordering destroys mirrored positions and solves a different problem.",
      },
    ],
    answerId: "a",
    explanation:
      "Relevant endpoints are compared after case normalization; inequality immediately proves false.",
    hint: "Normalize both character values without changing their positions.",
  },
  {
    id: "valid-palindrome-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "valid-palindrome",
    kind: "pattern",
    prompt: "Which transfer problem uses read and write pointers moving forward through an array?",
    given: [],
    choices: [
      { id: "a", label: "Move Zeroes" },
      {
        id: "b",
        label: "Course Schedule",
        misconception: "Course Schedule uses graph indegrees and a queue.",
      },
      {
        id: "c",
        label: "Coin Change",
        misconception: "Coin Change builds dynamic-programming states.",
      },
      {
        id: "d",
        label: "Binary Tree Level Order",
        misconception: "Level order traverses a tree frontier with a queue.",
      },
    ],
    answerId: "a",
    explanation:
      "Move Zeroes transfers two-pointer reasoning from converging string endpoints to forward read/write positions.",
    hint: "Look for another two-pointer problem with a different pointer direction.",
  },
  {
    id: "move-zeroes-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "move-zeroes",
    kind: "concept",
    prompt: "Why does copying non-zero values in read order preserve their relative order?",
    given: ["read moves only from left to right"],
    choices: [
      { id: "a", label: "Each non-zero is appended to the packed prefix in encounter order" },
      {
        id: "b",
        label: "The array is sorted first",
        misconception: "Sorting would change the required relative order.",
      },
      {
        id: "c",
        label: "Zeroes are compared by size",
        misconception:
          "The method classifies zero versus non-zero; numeric ordering is irrelevant.",
      },
      {
        id: "d",
        label: "write moves backward",
        misconception: "write advances forward through consecutive output slots.",
      },
    ],
    answerId: "a",
    explanation:
      "Read encounters non-zero values in original order and write assigns them to increasing prefix positions in exactly that order.",
    hint: "Track the sequence in which values reach the write pointer.",
  },
  {
    id: "move-zeroes-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "move-zeroes",
    kind: "invariant",
    prompt: "Which invariant holds during the read scan?",
    given: ["write is the next output slot"],
    choices: [
      {
        id: "a",
        label: "Indices before write contain all scanned non-zero values in stable order",
      },
      {
        id: "b",
        label: "Indices after read are already final",
        misconception: "Values after read have not been inspected yet.",
      },
      {
        id: "c",
        label: "Every slot before read is non-zero",
        misconception: "Skipped zero slots may remain temporarily beyond the packed prefix.",
      },
      {
        id: "d",
        label: "write always equals read",
        misconception: "write trails read after the scan encounters a zero.",
      },
    ],
    answerId: "a",
    explanation:
      "The packed prefix is complete for the scanned portion, and write points immediately after that prefix.",
    hint: "Separate the finalized packed prefix from scanned but unfinished slots.",
  },
  {
    id: "move-zeroes-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "move-zeroes",
    kind: "classification",
    prompt: "nums[read] is zero during the scan. Which pointers move?",
    given: ["nums[read] = 0", "write marks the next packed slot"],
    choices: [
      { id: "a", label: "Advance read only" },
      {
        id: "b",
        label: "Advance write only",
        misconception: "No non-zero value was appended, so the next packed slot cannot move.",
      },
      {
        id: "c",
        label: "Advance both",
        misconception: "Advancing write would leave a zero inside the packed prefix.",
      },
      {
        id: "d",
        label: "Move read backward",
        misconception: "The scan is one directional and never revisits a classified value.",
      },
    ],
    answerId: "a",
    explanation:
      "A zero contributes nothing to the stable prefix, so read continues while write waits for the next non-zero.",
    hint: "Ask whether the packed prefix gained a new value.",
  },
  {
    id: "move-zeroes-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "move-zeroes",
    kind: "boundary",
    prompt: "When does the algorithm begin filling trailing zeroes?",
    given: ["read has scanned every original index"],
    choices: [
      { id: "a", label: "After read reaches nums.length" },
      {
        id: "b",
        label: "After the first zero",
        misconception: "Later non-zero values still need to be packed before filling the suffix.",
      },
      {
        id: "c",
        label: "Whenever write equals read",
        misconception:
          "That equality says no zero has delayed write yet; it does not end the scan.",
      },
      {
        id: "d",
        label: "Before scanning begins",
        misconception: "Early filling would overwrite values that have not been classified.",
      },
    ],
    answerId: "a",
    explanation:
      "Only after all non-zero values are packed is every slot from write onward guaranteed to belong to the zero suffix.",
    hint: "Do not overwrite an unscanned value.",
  },
  {
    id: "move-zeroes-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "move-zeroes",
    kind: "code",
    prompt: "Which transition appends a scanned non-zero value to the packed prefix?",
    given: ["nums[read] !== 0"],
    choices: [
      { id: "a", label: "nums[write] = nums[read]; write++" },
      {
        id: "b",
        label: "nums[read] = 0; read--",
        misconception: "That moves backward and can erase a value before preserving it.",
      },
      {
        id: "c",
        label: "write = read",
        misconception: "Jumping write to read leaves earlier zero gaps inside the output prefix.",
      },
      {
        id: "d",
        label: "nums.sort()",
        misconception: "Sorting does not preserve the required relative order of non-zero values.",
      },
    ],
    answerId: "a",
    explanation:
      "Copying to write appends the value to the stable prefix; incrementing write reserves the following output slot.",
    hint: "The destination is the next packed slot, not necessarily the read index.",
  },
  {
    id: "move-zeroes-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "move-zeroes",
    kind: "pattern",
    prompt: "Which transfer problem also uses read/write pointers to build a stable array prefix?",
    given: [],
    choices: [
      { id: "a", label: "Remove Duplicates from Sorted Array" },
      {
        id: "b",
        label: "Course Schedule",
        misconception: "Course Schedule uses graph indegrees and a queue.",
      },
      {
        id: "c",
        label: "Coin Change",
        misconception: "Coin Change builds dynamic-programming states.",
      },
      {
        id: "d",
        label: "Diameter of Binary Tree",
        misconception: "Tree diameter uses recursive subtree heights.",
      },
    ],
    answerId: "a",
    explanation:
      "Remove Duplicates also scans with read while write marks the next accepted position in a stable prefix.",
    hint: "Look for another in-place stable compaction problem.",
  },
  {
    id: "remove-duplicates-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "remove-duplicates-from-sorted-array",
    kind: "concept",
    prompt: "Why is comparing nums[read] only with nums[k - 1] enough?",
    given: ["nums is sorted", "nums[k - 1] is the last accepted unique value"],
    choices: [
      { id: "a", label: "Equal values are adjacent in sorted order" },
      {
        id: "b",
        label: "Every value is positive",
        misconception: "The method works with negative, zero, and positive integers.",
      },
      {
        id: "c",
        label: "k always equals read",
        misconception: "k trails read whenever duplicates are skipped.",
      },
      {
        id: "d",
        label: "The suffix is already unique",
        misconception: "The suffix has not been scanned yet.",
      },
    ],
    answerId: "a",
    explanation:
      "Sorted order groups equal values together, so a value is new exactly when it differs from the last accepted unique value.",
    hint: "Ask where another copy of the current value could appear in sorted order.",
  },
  {
    id: "remove-duplicates-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "remove-duplicates-from-sorted-array",
    kind: "invariant",
    prompt: "Which invariant holds before every read comparison?",
    given: ["k is the unique count so far"],
    choices: [
      { id: "a", label: "nums[0..k - 1] contains every scanned distinct value once" },
      {
        id: "b",
        label: "nums[k..read] is final",
        misconception:
          "Slots at and after k are outside the accepted prefix and may be overwritten.",
      },
      {
        id: "c",
        label: "All scanned values are different",
        misconception: "Scanned duplicates are intentionally skipped.",
      },
      {
        id: "d",
        label: "k is the last scanned index",
        misconception: "k is a count and next write position, not the read index.",
      },
    ],
    answerId: "a",
    explanation:
      "The prefix before k is complete, unique, sorted, and contains exactly the distinct values seen by read.",
    hint: "Separate the accepted prefix from the scanned duplicate region.",
  },
  {
    id: "remove-duplicates-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "remove-duplicates-from-sorted-array",
    kind: "classification",
    prompt: "nums[read] equals nums[k - 1]. Which pointers move?",
    given: ["the current value is a duplicate"],
    choices: [
      { id: "a", label: "Advance read only" },
      {
        id: "b",
        label: "Advance k only",
        misconception: "k cannot grow because no distinct value was added.",
      },
      {
        id: "c",
        label: "Advance both",
        misconception: "Advancing k would reserve a duplicate inside the answer prefix.",
      },
      {
        id: "d",
        label: "Move read backward",
        misconception: "The sorted scan is one directional.",
      },
    ],
    answerId: "a",
    explanation: "A duplicate does not expand the unique prefix, so only the scanner advances.",
    hint: "Did the prefix gain a new distinct value?",
  },
  {
    id: "remove-duplicates-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "remove-duplicates-from-sorted-array",
    kind: "boundary",
    prompt: "Why do read and k both start at 1?",
    given: ["nums contains at least one value"],
    choices: [
      { id: "a", label: "nums[0] already forms a one-value unique prefix" },
      {
        id: "b",
        label: "Index 0 must be deleted",
        misconception: "The first value is always retained.",
      },
      {
        id: "c",
        label: "The first two values are always equal",
        misconception: "They may be equal or different.",
      },
      {
        id: "d",
        label: "Arrays are 1-indexed",
        misconception: "The array uses zero-based indices; k is a count and next slot.",
      },
    ],
    answerId: "a",
    explanation:
      "With a non-empty array, nums[0] is the first unique value, so scanning and the next write slot begin at index 1.",
    hint: "Establish the smallest valid prefix before entering the loop.",
  },
  {
    id: "remove-duplicates-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "remove-duplicates-from-sorted-array",
    kind: "code",
    prompt: "Which code appends a newly discovered unique value?",
    given: ["nums[read] !== nums[k - 1]"],
    choices: [
      { id: "a", label: "nums[k] = nums[read]; k++" },
      {
        id: "b",
        label: "nums[read] = nums[k]; read--",
        misconception: "That copies in the wrong direction and reverses the scan.",
      },
      {
        id: "c",
        label: "k = read + 1",
        misconception: "Jumping k over skipped slots can leave duplicates inside the prefix.",
      },
      {
        id: "d",
        label: "nums = new Set(nums)",
        misconception: "A set violates the O(1) extra-memory and in-place requirements.",
      },
    ],
    answerId: "a",
    explanation:
      "Writing at k appends the distinct value to the compact prefix, then incrementing k updates its length.",
    hint: "The destination is the first slot after the accepted prefix.",
  },
  {
    id: "remove-duplicates-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "remove-duplicates-from-sorted-array",
    kind: "pattern",
    prompt: "Which next problem extends two-pointer duplicate handling to triplets?",
    given: [],
    choices: [
      { id: "a", label: "3Sum" },
      {
        id: "b",
        label: "Climbing Stairs",
        misconception: "Climbing Stairs uses dynamic programming.",
      },
      {
        id: "c",
        label: "Binary Tree Right Side View",
        misconception: "Right Side View uses tree traversal.",
      },
      {
        id: "d",
        label: "Top K Frequent Elements",
        misconception: "Top K Frequent Elements uses frequency counting and a heap or buckets.",
      },
    ],
    answerId: "a",
    explanation:
      "3Sum sorts the array, skips duplicate anchors, and moves two endpoints while avoiding duplicate triplets.",
    hint: "Look for the remaining two-pointer question in this phase.",
  },
  {
    id: "three-sum-review-concept",
    algorithmSlug: "two-pointers",
    problemSlug: "three-sum",
    kind: "concept",
    prompt: "Why must 3Sum sort the array before moving left and right?",
    given: ["anchor is fixed", "the endpoint sum must move predictably"],
    choices: [
      { id: "a", label: "Sorted order makes left increase and right decrease the sum" },
      {
        id: "b",
        label: "Sorting makes every value positive",
        misconception: "Sorting changes positions, not numeric signs.",
      },
      {
        id: "c",
        label: "Sorting removes duplicates automatically",
        misconception: "Duplicates remain and must still be skipped explicitly.",
      },
      {
        id: "d",
        label: "Sorting creates the output triplets",
        misconception: "The endpoint sweeps still have to discover zero-sum combinations.",
      },
    ],
    answerId: "a",
    explanation:
      "With a fixed anchor, advancing left cannot lower the sum and retreating right cannot raise it, enabling safe elimination.",
    hint: "Ask how each pointer changes the current value after sorting.",
  },
  {
    id: "three-sum-review-invariant",
    algorithmSlug: "two-pointers",
    problemSlug: "three-sum",
    kind: "invariant",
    prompt: "Which invariant holds during one anchor's endpoint sweep?",
    given: ["left < right"],
    choices: [
      {
        id: "a",
        label: "Every pair outside [left, right] is ruled out or already recorded",
      },
      {
        id: "b",
        label: "Every pair inside [left, right] sums to zero",
        misconception: "The interval contains candidates, not guaranteed solutions.",
      },
      {
        id: "c",
        label: "The anchor changes after every comparison",
        misconception: "The anchor remains fixed for the entire inner sweep.",
      },
      {
        id: "d",
        label: "The output may contain duplicate triplets",
        misconception: "Duplicate skipping preserves output uniqueness throughout.",
      },
    ],
    answerId: "a",
    explanation:
      "Sorted pointer moves eliminate endpoint pairs monotonically, so only the current interval can still contain an unseen solution for this anchor.",
    hint: "Track which endpoint values can no longer participate.",
  },
  {
    id: "three-sum-review-classification",
    algorithmSlug: "two-pointers",
    problemSlug: "three-sum",
    kind: "classification",
    prompt: "The anchored sum is -3. Which pointer moves?",
    given: ["nums is sorted", "sum < 0"],
    choices: [
      { id: "a", label: "Advance left" },
      {
        id: "b",
        label: "Retreat right",
        misconception: "Retreating right can only keep or lower an already-too-small sum.",
      },
      {
        id: "c",
        label: "Record the triplet",
        misconception: "Only a zero sum is a valid triplet.",
      },
      {
        id: "d",
        label: "Skip the anchor",
        misconception: "A distinct anchor must finish its endpoint sweep.",
      },
    ],
    answerId: "a",
    explanation:
      "Advancing left selects an equal or larger value, the only move that can raise the sum toward zero.",
    hint: "Choose the move that increases the sum.",
  },
  {
    id: "three-sum-review-boundary",
    algorithmSlug: "two-pointers",
    problemSlug: "three-sum",
    kind: "boundary",
    prompt: "When should an outer anchor be skipped?",
    given: ["the array is sorted"],
    choices: [
      { id: "a", label: "When it equals the immediately previous anchor" },
      {
        id: "b",
        label: "Whenever it is negative",
        misconception: "Negative anchors are often required for zero-sum triplets.",
      },
      {
        id: "c",
        label: "Whenever left meets right",
        misconception: "That ends one sweep; it does not make the next distinct anchor redundant.",
      },
      {
        id: "d",
        label: "Before the first anchor",
        misconception: "The first occurrence of every anchor value must be processed.",
      },
    ],
    answerId: "a",
    explanation:
      "An identical adjacent anchor would search the same sorted suffix pattern and regenerate triplets already considered.",
    hint: "Skip repeated anchor values, not useful signs or positions.",
  },
  {
    id: "three-sum-review-code",
    algorithmSlug: "two-pointers",
    problemSlug: "three-sum",
    kind: "code",
    prompt: "What must happen immediately after recording a zero-sum triplet?",
    given: ["sum === 0"],
    choices: [
      { id: "a", label: "Move both endpoints and skip repeated endpoint values" },
      {
        id: "b",
        label: "Keep both endpoints unchanged",
        misconception: "That records the same triplet forever.",
      },
      {
        id: "c",
        label: "Move only the anchor",
        misconception: "The current anchor may still have other distinct endpoint solutions.",
      },
      {
        id: "d",
        label: "Reverse the sorted array",
        misconception: "Reversing destroys the pointer movement assumptions.",
      },
    ],
    answerId: "a",
    explanation:
      "Moving both leaves the recorded pair, and skipping equal endpoint values prevents duplicate triplets for the same anchor.",
    hint: "Make progress while preserving output uniqueness.",
  },
  {
    id: "three-sum-review-pattern",
    algorithmSlug: "two-pointers",
    problemSlug: "three-sum",
    kind: "pattern",
    prompt: "Which simpler problem is the inner sweep most similar to?",
    given: ["anchor is fixed", "the remaining pair targets -anchor"],
    choices: [
      { id: "a", label: "Two Sum II on a sorted suffix" },
      {
        id: "b",
        label: "Course Schedule",
        misconception: "Course Schedule uses graph indegrees and a queue.",
      },
      {
        id: "c",
        label: "Coin Change",
        misconception: "Coin Change uses dynamic programming.",
      },
      {
        id: "d",
        label: "Invert Binary Tree",
        misconception: "Tree inversion swaps child references recursively or iteratively.",
      },
    ],
    answerId: "a",
    explanation:
      "Fixing one value reduces 3Sum to finding a complementary pair in a sorted suffix with two endpoints.",
    hint: "Remove the fixed anchor from the equation.",
  },
  {
    id: "binary-tree-level-order-review-concept",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-level-order",
    kind: "concept",
    prompt: "Why does level-order traversal use a queue?",
    given: ["nodes must be returned top to bottom", "each level is left to right"],
    choices: [
      { id: "a", label: "FIFO keeps earlier-level nodes ahead of their children" },
      {
        id: "b",
        label: "A queue always sorts node values",
        misconception: "Queue order follows discovery order, not numeric value.",
      },
      {
        id: "c",
        label: "A queue visits the deepest node first",
        misconception: "Deepest-first traversal is associated with a stack or recursion.",
      },
      {
        id: "d",
        label: "A queue removes the need to inspect children",
        misconception: "Each visited node must still contribute its existing children.",
      },
    ],
    answerId: "a",
    explanation:
      "Children are appended behind every node already waiting, so all nodes at one depth are processed before the next depth.",
    hint: "Think about which discovered node must be processed first.",
  },
  {
    id: "binary-tree-level-order-review-invariant",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-level-order",
    kind: "invariant",
    prompt: "Which invariant does the queue preserve?",
    given: ["children are enqueued left before right"],
    choices: [
      { id: "a", label: "Unvisited nodes remain in breadth-first, left-to-right order" },
      {
        id: "b",
        label: "Only leaf nodes remain in the queue",
        misconception: "Internal nodes enter the queue before their children are inspected.",
      },
      {
        id: "c",
        label: "The queue contains one node at all times",
        misconception: "A level can contain many nodes.",
      },
      {
        id: "d",
        label: "The queue is ordered by node value",
        misconception: "Structural discovery order, not value, determines traversal order.",
      },
    ],
    answerId: "a",
    explanation:
      "FIFO plus left-before-right enqueueing makes the queue the exact remaining level-order sequence.",
    hint: "Describe the queue as the traversal work that remains.",
  },
  {
    id: "binary-tree-level-order-review-classification",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-level-order",
    kind: "classification",
    prompt: "A visited node has both children. What enters the queue?",
    given: ["left child = 4", "right child = 12"],
    choices: [
      { id: "a", label: "4, then 12" },
      {
        id: "b",
        label: "12, then 4",
        misconception: "Right-first enqueueing reverses the required order within the level.",
      },
      {
        id: "c",
        label: "Only 4",
        misconception: "Both existing children must be traversed.",
      },
      {
        id: "d",
        label: "Neither child",
        misconception: "Skipping both would omit the entire subtree.",
      },
    ],
    answerId: "a",
    explanation: "Enqueueing left before right preserves the requested left-to-right output order.",
    hint: "Match the order required inside each output row.",
  },
  {
    id: "binary-tree-level-order-review-boundary",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-level-order",
    kind: "boundary",
    prompt: "Why capture queue.length before processing a level?",
    given: ["children are added during the loop"],
    choices: [
      { id: "a", label: "It freezes how many nodes belong to the current level" },
      {
        id: "b",
        label: "It prevents any child from entering the queue",
        misconception: "Children should enter the queue, but belong to the next level.",
      },
      {
        id: "c",
        label: "It sorts the current level",
        misconception: "The level already follows left-to-right discovery order.",
      },
      {
        id: "d",
        label: "It counts every node in the tree",
        misconception: "The captured length counts only nodes waiting at this boundary.",
      },
    ],
    answerId: "a",
    explanation:
      "The captured size separates nodes already queued for this level from children appended for the next one.",
    hint: "Ask what changes while the inner loop is running.",
  },
  {
    id: "binary-tree-level-order-review-code",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-level-order",
    kind: "code",
    prompt: "Which loop processes exactly one tree level?",
    given: ["size = queue.length"],
    choices: [
      { id: "a", label: "for (let i = 0; i < size; i++) dequeue one node" },
      {
        id: "b",
        label: "while (queue.length) process every remaining node",
        misconception: "That mixes newly enqueued children into the current output row.",
      },
      {
        id: "c",
        label: "for each value from smallest to largest",
        misconception: "Traversal follows structure, not sorted values.",
      },
      {
        id: "d",
        label: "pop nodes from the back of the queue",
        misconception: "Back removal turns the worklist into a stack and breaks BFS order.",
      },
    ],
    answerId: "a",
    explanation: "A fixed-size loop consumes exactly the nodes present at the level boundary.",
    hint: "Use the captured boundary, not the changing queue length.",
  },
  {
    id: "binary-tree-level-order-review-pattern",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-level-order",
    kind: "pattern",
    prompt: "Which related problem reuses level boundaries but keeps only one node per level?",
    given: [],
    choices: [
      { id: "a", label: "Binary Tree Right Side View" },
      {
        id: "b",
        label: "3Sum",
        misconception: "3Sum uses sorting and two pointers.",
      },
      {
        id: "c",
        label: "Coin Change",
        misconception: "Coin Change uses dynamic programming states.",
      },
      {
        id: "d",
        label: "Valid Parentheses",
        misconception: "Valid Parentheses uses a stack over a string.",
      },
    ],
    answerId: "a",
    explanation:
      "Right Side View performs the same breadth-first level traversal and records the final visible node from each level.",
    hint: "Look for another problem whose output has one entry per depth.",
  },
  {
    id: "binary-tree-right-side-view-review-concept",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-right-side-view",
    kind: "concept",
    prompt: "Which node from each breadth-first level belongs in the right-side view?",
    given: ["nodes are processed left to right"],
    choices: [
      { id: "a", label: "The final node processed in that level" },
      { id: "b", label: "The first node processed", misconception: "That is the leftmost node." },
      {
        id: "c",
        label: "The largest value",
        misconception: "Visibility follows position, not value.",
      },
      { id: "d", label: "Every leaf", misconception: "Internal nodes can also be visible." },
    ],
    answerId: "a",
    explanation: "Left-to-right BFS reaches the structurally rightmost node last at each level.",
    hint: "Imagine looking across one row from its right edge.",
  },
  {
    id: "binary-tree-right-side-view-review-invariant",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-right-side-view",
    kind: "invariant",
    prompt: "What is guaranteed after a level finishes?",
    given: ["size was captured before processing the level"],
    choices: [
      { id: "a", label: "Exactly one value from that level was appended" },
      {
        id: "b",
        label: "Every value was appended",
        misconception: "The result keeps only the visible node.",
      },
      { id: "c", label: "The queue is empty", misconception: "Children may already be waiting." },
      { id: "d", label: "The tree is sorted", misconception: "BFS does not sort values." },
    ],
    answerId: "a",
    explanation:
      "The size boundary identifies one final node and therefore one visible value per level.",
    hint: "Count result entries by completed depth.",
  },
  {
    id: "binary-tree-right-side-view-review-classification",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-right-side-view",
    kind: "classification",
    prompt: "Node 7 is position 3 of 3 in its level. What happens?",
    given: ["the level is processed left to right"],
    choices: [
      { id: "a", label: "Append 7 to the right-side view" },
      { id: "b", label: "Skip 7", misconception: "No later node exists to hide it." },
      {
        id: "c",
        label: "Append all three nodes",
        misconception: "Only one node per level is visible.",
      },
      {
        id: "d",
        label: "Reverse the queue",
        misconception: "The established BFS order must remain stable.",
      },
    ],
    answerId: "a",
    explanation: "Position size is the final left-to-right position, so that node is visible.",
    hint: "Compare the one-based position with the level size.",
  },
  {
    id: "binary-tree-right-side-view-review-boundary",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-right-side-view",
    kind: "boundary",
    prompt: "Why must queue.length be captured before the inner loop?",
    given: ["children are enqueued during that loop"],
    choices: [
      { id: "a", label: "It freezes the current level's final position" },
      {
        id: "b",
        label: "It prevents enqueueing children",
        misconception: "Children still form the next level.",
      },
      {
        id: "c",
        label: "It finds the largest node",
        misconception: "The boundary is structural, not numeric.",
      },
      {
        id: "d",
        label: "It removes null values",
        misconception: "Input parsing handles null placeholders.",
      },
    ],
    answerId: "a",
    explanation:
      "Without a frozen size, newly enqueued children would blur the boundary between depths.",
    hint: "Ask which nodes were already waiting when the level began.",
  },
  {
    id: "binary-tree-right-side-view-review-code",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-right-side-view",
    kind: "code",
    prompt: "Which condition records the visible node during a left-to-right level sweep?",
    given: ["for (let i = 0; i < size; i++)"],
    choices: [
      { id: "a", label: "if (i === size - 1) output.push(node.val)" },
      {
        id: "b",
        label: "if (i === 0) output.push(node.val)",
        misconception: "That records the left view.",
      },
      {
        id: "c",
        label: "if (queue.length === 0)",
        misconception: "The queue may contain the next level.",
      },
      { id: "d", label: "if (node.val > 0)", misconception: "Visibility is unrelated to sign." },
    ],
    answerId: "a",
    explanation: "The zero-based final position is size - 1.",
    hint: "Translate final position into a zero-based index.",
  },
  {
    id: "binary-tree-right-side-view-review-pattern",
    algorithmSlug: "level-order",
    problemSlug: "binary-tree-right-side-view",
    kind: "pattern",
    prompt: "Which next problem reuses level boundaries but returns the number of levels?",
    given: [],
    choices: [
      { id: "a", label: "Maximum Depth of Binary Tree" },
      { id: "b", label: "3Sum", misconception: "3Sum uses sorting and two pointers." },
      { id: "c", label: "Min Stack", misconception: "Min Stack tracks a running minimum." },
      { id: "d", label: "Coin Change", misconception: "Coin Change is dynamic programming." },
    ],
    answerId: "a",
    explanation: "Maximum Depth also advances one frozen breadth-first level at a time.",
    hint: "Look for a tree result measured directly in levels.",
  },
  {
    id: "maximum-depth-review-concept",
    algorithmSlug: "level-order",
    problemSlug: "maximum-depth-of-binary-tree",
    kind: "concept",
    prompt: "What does maximum depth count?",
    given: [],
    choices: [
      { id: "a", label: "Levels on the longest root-to-leaf path" },
      { id: "b", label: "All tree nodes", misconception: "Node count and depth differ." },
      { id: "c", label: "Only leaf nodes", misconception: "Depth counts levels, not leaves." },
      { id: "d", label: "The largest value", misconception: "Values do not determine depth." },
    ],
    answerId: "a",
    explanation: "Each completed breadth-first layer adds exactly one to depth.",
    hint: "Measure vertical layers from the root.",
  },
  {
    id: "maximum-depth-review-invariant",
    algorithmSlug: "level-order",
    problemSlug: "maximum-depth-of-binary-tree",
    kind: "invariant",
    prompt: "What is true after depth is incremented?",
    given: ["one frozen queue boundary was fully processed"],
    choices: [
      { id: "a", label: "Exactly that many levels are complete" },
      {
        id: "b",
        label: "That many nodes were visited",
        misconception: "A level may contain many nodes.",
      },
      { id: "c", label: "The queue must be empty", misconception: "Deeper nodes may remain." },
      {
        id: "d",
        label: "All leaves were found",
        misconception: "Traversal may still have deeper levels.",
      },
    ],
    answerId: "a",
    explanation: "Depth advances once per completed level, never once per node.",
    hint: "Tie the counter to the outer loop.",
  },
  {
    id: "maximum-depth-review-classification",
    algorithmSlug: "level-order",
    problemSlug: "maximum-depth-of-binary-tree",
    kind: "classification",
    prompt: "Three nodes remain queued after completing depth 2. What happens next?",
    given: [],
    choices: [
      { id: "a", label: "Process depth 3" },
      {
        id: "b",
        label: "Return 2",
        misconception: "A non-empty queue proves another level exists.",
      },
      { id: "c", label: "Reset depth", misconception: "Completed levels remain counted." },
      { id: "d", label: "Sort the queue", misconception: "BFS order is structural." },
    ],
    answerId: "a",
    explanation: "Queued nodes form the next breadth-first level.",
    hint: "Check whether the queue is empty.",
  },
  {
    id: "maximum-depth-review-boundary",
    algorithmSlug: "level-order",
    problemSlug: "maximum-depth-of-binary-tree",
    kind: "boundary",
    prompt: "What is the depth of an empty tree?",
    given: ["root = null"],
    choices: [
      { id: "a", label: "0" },
      { id: "b", label: "1", misconception: "No root level exists." },
      { id: "c", label: "-1", misconception: "This problem counts nodes along the path." },
      { id: "d", label: "undefined", misconception: "The empty case has a defined result." },
    ],
    answerId: "a",
    explanation: "With no root, no tree level exists.",
    hint: "Count completed levels.",
  },
  {
    id: "maximum-depth-review-code",
    algorithmSlug: "level-order",
    problemSlug: "maximum-depth-of-binary-tree",
    kind: "code",
    prompt: "Where should depth++ occur in BFS?",
    given: ["size = queue.length"],
    choices: [
      { id: "a", label: "After processing exactly size nodes" },
      { id: "b", label: "After every node", misconception: "That counts nodes, not levels." },
      {
        id: "c",
        label: "Whenever a child exists",
        misconception: "Branching does not add depth repeatedly.",
      },
      { id: "d", label: "Before checking root", misconception: "The empty tree must return zero." },
    ],
    answerId: "a",
    explanation: "The fixed-size inner loop corresponds to one complete level.",
    hint: "Increment once per outer iteration.",
  },
  {
    id: "maximum-depth-review-pattern",
    algorithmSlug: "level-order",
    problemSlug: "maximum-depth-of-binary-tree",
    kind: "pattern",
    prompt: "Which related problem changes child links while traversing the tree?",
    given: [],
    choices: [
      { id: "a", label: "Invert Binary Tree" },
      { id: "b", label: "3Sum", misconception: "3Sum is an array problem." },
      { id: "c", label: "Coin Change", misconception: "Coin Change uses dynamic programming." },
      {
        id: "d",
        label: "Valid Parentheses",
        misconception: "Valid Parentheses uses a stack over text.",
      },
    ],
    answerId: "a",
    explanation: "Invert Binary Tree visits nodes and swaps each node's left and right children.",
    hint: "Look for the next tree transformation problem.",
  },
  {
    id: "invert-tree-review-concept",
    algorithmSlug: "level-order",
    problemSlug: "invert-binary-tree",
    kind: "concept",
    prompt: "What does inverting a binary tree change at every node?",
    given: [],
    choices: [
      { id: "a", label: "Its left and right child references" },
      { id: "b", label: "Only the child values", misconception: "Whole subtrees must move." },
      { id: "c", label: "The root value", misconception: "Values remain attached to nodes." },
      { id: "d", label: "Only leaf nodes", misconception: "Every node performs the local swap." },
    ],
    answerId: "a",
    explanation: "Swapping references mirrors both child subtrees recursively.",
    hint: "Move connections, not stored values.",
  },
  {
    id: "invert-tree-review-invariant",
    algorithmSlug: "level-order",
    problemSlug: "invert-binary-tree",
    kind: "invariant",
    prompt: "What is true after a node's swap?",
    given: [],
    choices: [
      { id: "a", label: "Its entire left and right subtrees have exchanged sides" },
      {
        id: "b",
        label: "Its descendants are all finished",
        misconception: "Queued descendants still need local swaps.",
      },
      { id: "c", label: "Its values are sorted", misconception: "Inversion does not sort." },
      { id: "d", label: "The queue is empty", misconception: "Other nodes may remain." },
    ],
    answerId: "a",
    explanation:
      "A child reference owns its entire subtree, so one reference swap moves both subtrees.",
    hint: "A link points to a whole subtree.",
  },
  {
    id: "invert-tree-review-classification",
    algorithmSlug: "level-order",
    problemSlug: "invert-binary-tree",
    kind: "classification",
    prompt: "A node has left 2 and right 7. What is the correct mutation?",
    given: [],
    choices: [
      { id: "a", label: "left = 7 and right = 2" },
      {
        id: "b",
        label: "left = 2 and right = 7",
        misconception: "That leaves the node unchanged.",
      },
      {
        id: "c",
        label: "change values to -2 and -7",
        misconception: "Values are not transformed.",
      },
      { id: "d", label: "remove both children", misconception: "Inversion preserves every node." },
    ],
    answerId: "a",
    explanation: "The two child references exchange positions.",
    hint: "Mirror the local branches.",
  },
  {
    id: "invert-tree-review-boundary",
    algorithmSlug: "level-order",
    problemSlug: "invert-binary-tree",
    kind: "boundary",
    prompt: "What should inversion return for an empty tree?",
    given: ["root = null"],
    choices: [
      { id: "a", label: "null" },
      { id: "b", label: "a new node", misconception: "No node should be invented." },
      { id: "c", label: "0", misconception: "The return type is a tree root." },
      { id: "d", label: "an error", misconception: "Empty input is valid." },
    ],
    answerId: "a",
    explanation: "There are no links to swap, so the same null root is returned.",
    hint: "Preserve the input root type.",
  },
  {
    id: "invert-tree-review-code",
    algorithmSlug: "level-order",
    problemSlug: "invert-binary-tree",
    kind: "code",
    prompt: "Which statement performs the truthful inversion step?",
    given: [],
    choices: [
      { id: "a", label: "[node.left, node.right] = [node.right, node.left]" },
      {
        id: "b",
        label: "[node.left.val, node.right.val] = [node.right.val, node.left.val]",
        misconception: "That swaps values, not subtrees.",
      },
      { id: "c", label: "node.left = null", misconception: "That deletes a subtree." },
      {
        id: "d",
        label: "queue.reverse()",
        misconception: "Queue order does not change tree links.",
      },
    ],
    answerId: "a",
    explanation: "Exchanging references moves each whole subtree.",
    hint: "Swap the pointers themselves.",
  },
  {
    id: "invert-tree-review-pattern",
    algorithmSlug: "level-order",
    problemSlug: "invert-binary-tree",
    kind: "pattern",
    prompt: "Which problem traverses the same levels without modifying links?",
    given: [],
    choices: [
      { id: "a", label: "Binary Tree Level Order Traversal" },
      { id: "b", label: "3Sum", misconception: "3Sum uses a sorted array." },
      { id: "c", label: "Coin Change", misconception: "Coin Change uses dynamic programming." },
      { id: "d", label: "Min Stack", misconception: "Min Stack is not a tree traversal." },
    ],
    answerId: "a",
    explanation:
      "Both can use a queue, but Level Order observes nodes while inversion mutates each node's links.",
    hint: "Choose the breadth-first tree traversal.",
  },
  {
    id: "validate-bst-review-concept",
    algorithmSlug: "bst-traversals",
    problemSlug: "validate-binary-search-tree",
    kind: "concept",
    prompt: "What must every node in a valid BST satisfy?",
    given: [],
    choices: [
      { id: "a", label: "It lies strictly inside all inherited ancestor bounds" },
      {
        id: "b",
        label: "It only compares with its parent",
        misconception: "A deeper descendant can violate an ancestor bound.",
      },
      {
        id: "c",
        label: "It is larger than every node",
        misconception: "Only right descendants must be larger.",
      },
      {
        id: "d",
        label: "Its subtree is balanced",
        misconception: "BST validity does not require balance.",
      },
    ],
    answerId: "a",
    explanation:
      "The recursive range records every ancestor constraint, not only the parent relationship.",
    hint: "Think about a value that is on the wrong side of the root.",
  },
  {
    id: "validate-bst-review-invariant",
    algorithmSlug: "bst-traversals",
    problemSlug: "validate-binary-search-tree",
    kind: "invariant",
    prompt: "What range does a right child of node 8 inherit when 8 is bounded by (4, 12)?",
    given: ["node = 8", "current range = (4, 12)"],
    choices: [
      { id: "a", label: "(8, 12)" },
      { id: "b", label: "(4, 8)", misconception: "That is the range for the left child." },
      { id: "c", label: "(-∞, +∞)", misconception: "Descendants keep ancestor bounds." },
      { id: "d", label: "(8, +∞)", misconception: "The upper bound 12 must also be preserved." },
    ],
    answerId: "a",
    explanation:
      "A right subtree must be greater than its node while remaining below every earlier upper bound.",
    hint: "Keep the existing upper bound and raise the lower bound.",
  },
  {
    id: "validate-bst-review-classification",
    algorithmSlug: "bst-traversals",
    problemSlug: "validate-binary-search-tree",
    kind: "classification",
    prompt: "In [5, 2, 8, 1, 6], which node proves the tree is invalid?",
    given: [],
    choices: [
      { id: "a", label: "6, because it is not below the root's upper bound 5" },
      {
        id: "b",
        label: "2, because it is less than 5",
        misconception: "A left child should be less than its parent.",
      },
      {
        id: "c",
        label: "8, because it is greater than 5",
        misconception: "A right child should be greater than its parent.",
      },
      {
        id: "d",
        label: "1, because leaves are invalid",
        misconception: "Leaves can be valid BST nodes.",
      },
    ],
    answerId: "a",
    explanation:
      "Node 6 is in the left subtree of 5, so it must be below 5 even though it is greater than its parent 2.",
    hint: "Apply the root bound as well as the parent bound.",
  },
  {
    id: "validate-bst-review-boundary",
    algorithmSlug: "bst-traversals",
    problemSlug: "validate-binary-search-tree",
    kind: "boundary",
    prompt: "Are duplicate values allowed in a strict BST?",
    given: ["left bound = min", "right bound = max"],
    choices: [
      { id: "a", label: "No; each value must satisfy min < value < max" },
      {
        id: "b",
        label: "Yes, duplicates always go left",
        misconception: "This contract uses strict inequalities.",
      },
      {
        id: "c",
        label: "Yes, duplicates always go right",
        misconception: "This contract uses strict inequalities.",
      },
      {
        id: "d",
        label: "Only the root may duplicate",
        misconception: "Every node is checked against strict bounds.",
      },
    ],
    answerId: "a",
    explanation: "The validator rejects values equal to either inherited bound.",
    hint: "Look at the <= and >= checks.",
  },
  {
    id: "validate-bst-review-code",
    algorithmSlug: "bst-traversals",
    problemSlug: "validate-binary-search-tree",
    kind: "code",
    prompt: "Which condition rejects a node in a strict BST validator?",
    given: [],
    choices: [
      { id: "a", label: "node.val <= min || node.val >= max" },
      {
        id: "b",
        label: "node.val < min && node.val > max",
        misconception: "A value cannot be both below min and above max.",
      },
      {
        id: "c",
        label: "node.left === null || node.right === null",
        misconception: "One-child and leaf nodes can be valid.",
      },
      {
        id: "d",
        label: "node.val === root.val",
        misconception: "Only equality with the active bounds matters.",
      },
    ],
    answerId: "a",
    explanation: "A value fails when it is at or beyond either strict boundary.",
    hint: "The valid interval is open on both sides.",
  },
  {
    id: "validate-bst-review-pattern",
    algorithmSlug: "bst-traversals",
    problemSlug: "validate-binary-search-tree",
    kind: "pattern",
    prompt: "Which upcoming tree problem also benefits from recursive subtree results?",
    given: [],
    choices: [
      { id: "a", label: "Diameter of Binary Tree" },
      {
        id: "b",
        label: "Move Zeroes",
        misconception: "Move Zeroes is a two-pointer array problem.",
      },
      {
        id: "c",
        label: "Two Sum II",
        misconception: "Two Sum II searches a sorted array with two pointers.",
      },
      {
        id: "d",
        label: "Daily Temperatures",
        misconception: "Daily Temperatures uses a monotonic stack.",
      },
    ],
    answerId: "a",
    explanation:
      "Both validators and diameter use recursive calls that return information from subtrees.",
    hint: "Choose the remaining recursive tree problem.",
  },
];
