import { describe, expect, it } from "vitest";
import {
  calibratedLevel,
  defaultOnboardingState,
  parseOnboardingState,
  recommendPath,
  weeklyGoalMinutes,
} from "./onboarding";

describe("onboarding state", () => {
  it("recovers safely from missing and malformed local data", () => {
    expect(parseOnboardingState(null)).toEqual(defaultOnboardingState);
    expect(parseOnboardingState("not-json")).toEqual(defaultOnboardingState);
  });

  it("maps the learner's first goal to a real catalog path", () => {
    expect(recommendPath(["interview"])).toBe("interview-prep");
    expect(recommendPath(["competitive"])).toBe("competitive-programming");
    expect(recommendPath(["coursework"])).toBe("data-structures");
  });

  it("labels diagnostic evidence without inventing precision", () => {
    expect(calibratedLevel("beginner", null, 3, true)).toBe("Beginner (self-selected)");
    expect(calibratedLevel("beginner", 3, 3, false)).toBe("Advanced starting point");
    expect(calibratedLevel("advanced", 0, 3, false)).toBe("Foundations starting point");
  });

  it("turns the saved pace into an explicit weekly target", () => {
    expect(weeklyGoalMinutes("casual")).toBe(90);
    expect(weeklyGoalMinutes("steady")).toBe(240);
    expect(weeklyGoalMinutes("focused")).toBe(450);
    expect(weeklyGoalMinutes("intense")).toBe(600);
  });
});
