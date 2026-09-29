import { describe, expect, it } from "vitest";

import { HOME_BFS_ORDER, HOME_BFS_STEPS } from "@/lib/home-bfs";

describe("homepage BFS demonstration", () => {
  it("derives the visit order and terminal state from queue operations", () => {
    expect(
      HOME_BFS_STEPS.filter((step) => step.phase === "visit").map((step) => step.current),
    ).toEqual(HOME_BFS_ORDER);

    const terminal = HOME_BFS_STEPS.at(-1)!;
    expect(terminal.phase).toBe("finish");
    expect(terminal.current).toBeNull();
    expect(terminal.queue).toEqual([]);
    expect(terminal.visited).toEqual(HOME_BFS_ORDER);
    expect(terminal.codeLines).toEqual([11]);
  });

  it("shows the real queue after each node is processed", () => {
    const afterOne = HOME_BFS_STEPS.find((step) => step.current === 1)!;
    const afterFour = HOME_BFS_STEPS.find((step) => step.current === 4)!;
    const afterFive = HOME_BFS_STEPS.find((step) => step.current === 5)!;

    expect(afterOne.queue).toEqual([2, 3]);
    expect(afterFour.queue).toEqual([5, 6, 7, 8]);
    expect(afterFive.queue).toEqual([6, 7, 8]);
    expect(afterFive.explanation).toContain("no children");
  });
});
