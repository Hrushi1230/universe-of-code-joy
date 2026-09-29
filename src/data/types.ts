export type Category =
  | "arrays"
  | "strings"
  | "linked-lists"
  | "stacks-queues"
  | "trees"
  | "heaps"
  | "hashing"
  | "graphs"
  | "sorting"
  | "searching"
  | "greedy"
  | "dp"
  | "backtracking"
  | "bit-manipulation"
  | "math";

export type Difficulty = "easy" | "medium" | "hard";

export type VizKind =
  | "array"
  | "tree"
  | "graph"
  | "grid"
  | "table"
  | "linked-list"
  | "stack"
  | "queue";

export interface Algorithm {
  slug: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  vizKind: VizKind;
  oneLiner: string;
  summary: string;
  timeBest: string;
  timeAvg: string;
  timeWorst: string;
  space: string;
  prerequisites: string[];
  tags: string[];
  realWorldUses: string[];
  commonMistakes: string[];
  estMinutes: number;
  xp: number;
  /**
   * The coding challenge that IS this algorithm — the Golden Lesson's CODE
   * stage. Distinct from transfer questions that merely apply the technique,
   * which the Solve stage resolves from `Problem.algorithmSlug`. Optional:
   * algorithms without a canonical implementation exercise hide the stage.
   */
  implementationProblemSlug?: string;
  /**
   * The Golden Lesson's SOLVE stage: a *different* question that applies the
   * technique rather than restating it. Must never equal
   * `implementationProblemSlug`; when absent, Solve falls back to the easiest
   * linked question that is not the implementation challenge.
   */
  transferProblemSlug?: string;
}

export interface LessonSection {
  id: string;
  heading: string;
  markdown: string;
  visualStep?: number;
}

export interface QuizQuestion {
  id: string;
  kind: "mcq" | "predict-step" | "order-steps" | "true-false";
  prompt: string;
  options: string[];
  answerIndex: number | number[];
  explanation: string;
}

export interface Lesson {
  slug: string;
  algorithmSlug: string;
  title: string;
  estMinutes: number;
  xp: number;
  sections: LessonSection[];
  quiz: QuizQuestion[];
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemTest {
  id: string;
  input: unknown[];
  expected: unknown;
  hidden: boolean;
}

/**
 * How one function argument is built from a test's `input` array, or how the
 * return value is converted back into something comparable with `expected`.
 *
 * - `raw` — pass through untouched (numbers, strings, arrays, grids)
 * - `list` — `number[]` to a `ListNode` chain
 * - `list-cycle` — consumes two input slots, `values` and a `pos` index, and
 *   links the tail back to `pos` (`-1` leaves the list acyclic)
 * - `tree` — LeetCode level-order array to a `TreeNode`
 * - `tree-node` — a node value to the matching node inside the tree built by the
 *   preceding `tree` argument
 * - `tree-val` — return only: a returned `TreeNode` to its `.val`
 */
export type IoCodec = "raw" | "list" | "list-cycle" | "tree" | "tree-node" | "tree-val";

export interface ProblemIo {
  /** One entry per function parameter, not per input slot — `list-cycle` eats two. */
  args: IoCodec[];
  returns: IoCodec;
}

export interface Problem {
  slug: string;
  algorithmSlug: string;
  title: string;
  difficulty: Difficulty;
  statementMarkdown: string;
  constraints: string[];
  examples: ProblemExample[];
  starterCode: Record<"js" | "ts" | "py", string>;
  tests: ProblemTest[];
  hints: string[];
  xp: number;
  /**
   * How the runner converts flat test JSON into the argument shapes the starter
   * code declares. Required only for problems whose signature names `TreeNode`
   * or `ListNode`; absent means every input is applied as-is.
   */
  io?: ProblemIo;
  /** Card-length summary for browse surfaces. Falls back to the statement's first sentence. */
  oneLiner?: string;
  /** Expected solve time in minutes. Falls back to an xp-derived estimate. */
  estMinutes?: number;
}

export interface PathModule {
  title: string;
  itemSlugs: string[];
}

export interface Path {
  slug: string;
  title: string;
  subtitle: string;
  weeks: number;
  audience: string;
  outcomes: string[];
  modules: PathModule[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  xp: number;
  criteria: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  kind: "daily" | "weekly";
  target: number;
  xp: number;
  icon: string;
}

export interface LegalSubSection {
  id: string;
  title: string;
  contentMarkdown: string;
}

export interface LegalSection {
  id: string;
  title: string;
  summary?: string;
  contentMarkdown: string;
  subsections?: LegalSubSection[];
}

export interface LegalDocument {
  id: "privacy" | "terms";
  title: string;
  subtitle: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  summaryMarkdown: string;
  sections: LegalSection[];
}

/**
 * Which retention skill a review prompt tests. Deliberately small: the Golden
 * template needs coverage of the reasoning that makes binary search valid, not
 * twenty trivia variants.
 */
export type ReviewItemKind =
  | "concept"
  | "boundary"
  | "classification"
  | "invariant"
  | "midpoint"
  | "termination"
  | "code"
  | "pattern";

export interface ReviewChoice {
  id: string;
  label: string;
  /**
   * The corrective sentence shown when this wrong choice is picked. Absent on
   * the correct choice, where the item's `explanation` is used instead.
   */
  misconception?: string;
}

/**
 * One active-recall prompt. Linked to its algorithm the same way problems are —
 * by `algorithmSlug` — so no new catalog field is needed to resolve a set.
 */
export interface ReviewItem {
  id: string;
  algorithmSlug: string;
  /** Question-specific Golden slice; omitted for algorithm-wide review prompts. */
  problemSlug?: string;
  kind: ReviewItemKind;
  prompt: string;
  /** Monospace state lines shown above the choices. Must never leak the answer. */
  given: string[];
  choices: ReviewChoice[];
  answerId: string;
  explanation: string;
  /** One small nudge, offered only after an incorrect attempt. */
  hint?: string;
}
