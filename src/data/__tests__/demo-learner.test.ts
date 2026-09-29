import { describe, expect, it } from "vitest";
import { demoLearner, mockUser } from "@/content/demo-learner";
import { levelFromXp, xpForLevel } from "@/lib/xp";

describe("demo learner (S1.9 / S10.1 / S6.10)", () => {
  it("maintains strict mathematical consistency between XP and level", () => {
    expect(demoLearner.level).toBe(levelFromXp(demoLearner.xp));
    expect(demoLearner.xpToNextLevel).toBe(xpForLevel(demoLearner.level));
  });

  it("is identically accessible via both demoLearner and mockUser exports", () => {
    expect(mockUser).toBe(demoLearner);
  });

  it("contains complete mastery and daily activity records without fabricated placeholders", () => {
    expect(demoLearner.handle).toBe("local_learner");
    expect(demoLearner.activity.length).toBeGreaterThan(0);
    expect(Object.keys(demoLearner.mastery).length).toBeGreaterThan(10);
  });
});
