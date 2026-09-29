export const HOME_BFS_ORDER = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type HomeBfsNode = (typeof HOME_BFS_ORDER)[number];

export interface HomeBfsStep {
  phase: "setup" | "visit" | "finish";
  current: HomeBfsNode | null;
  visited: HomeBfsNode[];
  queue: HomeBfsNode[];
  codeLines: number[];
  explanation: string;
}

const CHILDREN: Record<HomeBfsNode, HomeBfsNode[]> = {
  1: [2, 3],
  2: [4, 5],
  3: [6, 7],
  4: [8],
  5: [],
  6: [],
  7: [],
  8: [],
};

export function buildHomeBfsSteps(): HomeBfsStep[] {
  const queue: HomeBfsNode[] = [1];
  const visited: HomeBfsNode[] = [];
  const steps: HomeBfsStep[] = [
    {
      phase: "setup",
      current: null,
      visited: [],
      queue: [...queue],
      codeLines: [5],
      explanation:
        "Start with node 1 in the queue. Breadth-first search explores one level at a time.",
    },
  ];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const children = CHILDREN[node];
    visited.push(node);
    queue.push(...children);

    const queueText = queue.length > 0 ? queue.join(" → ") : "empty";
    const childText =
      children.length > 0
        ? ` Add ${children.join(" and ")} to the back.`
        : " It has no children to add.";

    steps.push({
      phase: "visit",
      current: node,
      visited: [...visited],
      queue: [...queue],
      codeLines: [7, 8, 9, 10],
      explanation: `Remove node ${node}, record it, then inspect its children.${childText} Queue: ${queueText}.`,
    });
  }

  steps.push({
    phase: "finish",
    current: null,
    visited: [...visited],
    queue: [],
    codeLines: [11],
    explanation: `The queue is empty. Return the level-order traversal: ${visited.join(" → ")}.`,
  });

  return steps;
}

export const HOME_BFS_STEPS = buildHomeBfsSteps();
