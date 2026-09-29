import { describe, expect, it } from "vitest";
import type { ProgressData } from "@/stores/progressStore";
import { buildLocalNotifications, notificationTimeLabel } from "./notifications";

function emptyProgress(): ProgressData {
  return {
    xp: 0,
    level: 1,
    streak: { current: 0, longest: 0, lastActiveISO: null, freezesLeft: 2 },
    algorithms: {},
    lessons: {},
    problems: {},
    reviewCards: {},
    quests: {},
    achievements: {},
    rewardTransactions: {},
    activity: {},
    bookmarks: [],
    activePathSlug: null,
  };
}

describe("local notifications", () => {
  it("is empty for a fresh learner and never creates fixture messages", () => {
    expect(buildLocalNotifications(emptyProgress(), new Date(2026, 8, 12, 12))).toEqual([]);
  });

  it("builds stable links and ids from actual progress", () => {
    const state = emptyProgress();
    state.lessons["binary-search"] = {
      completedAt: "2026-09-12T08:00:00.000Z",
      sectionIndex: 4,
      quizScore: 90,
    };
    state.quests["daily-problems"] = {
      progress: 2,
      claimedAt: "2026-09-12T09:00:00.000Z",
      periodKey: "2026-09-12",
    };
    const items = buildLocalNotifications(state, new Date("2026-09-12T10:00:00.000Z"));
    expect(items.map((item) => item.kind)).toEqual(["quest", "lesson"]);
    expect(items[0]?.id).toBe("quest:daily-problems:2026-09-12");
    expect(items[0]?.href).toBe("/quests");
    expect(items[1]?.href).toBe("/algorithms/binary-search");
  });

  it("formats recent and older timestamps without inventing relative activity", () => {
    const now = new Date("2026-09-12T10:00:00.000Z");
    expect(notificationTimeLabel("2026-09-12T09:59:30.000Z", now)).toBe("Now");
    expect(notificationTimeLabel("2026-09-12T09:30:00.000Z", now)).toBe("30m");
    expect(notificationTimeLabel("not-a-date", now)).toBe("Saved locally");
  });
});
