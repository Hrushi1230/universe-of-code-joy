import { beforeEach, describe, expect, it } from "vitest";
import { usePrefsStore } from "../prefsStore";

describe("prefsStore", () => {
  beforeEach(() => {
    usePrefsStore.setState({
      language: "js",
      playbackSpeed: 1,
      narrationOn: true,
      soundOn: true,
      reducedMotion: false,
      sidebarCollapsed: false,
      profile: {
        fullName: "Arjun Rao",
        username: "@arjun",
        email: "arjun@example.com",
        country: "India",
        bio: "CS undergrad",
        twoFactorEnabled: true,
      },
      billingPlan: "pro-annual",
      notificationPrefs: {
        streakReminders: { email: true, push: true },
        achievements: { email: true, push: true },
        pathUpdates: { email: true, push: false },
        leaderboard: { email: false, push: true },
        weeklyRecap: { email: true, push: false },
      },
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      notificationReadIds: [],
    });
  });

  it("updates profile fields", () => {
    usePrefsStore.getState().updateProfile({ fullName: "Ada Lovelace", username: "@ada" });
    const profile = usePrefsStore.getState().profile;
    expect(profile.fullName).toBe("Ada Lovelace");
    expect(profile.username).toBe("@ada");
    expect(profile.email).toBe("arjun@example.com");
  });

  it("toggles billing plan", () => {
    expect(usePrefsStore.getState().billingPlan).toBe("pro-annual");
    usePrefsStore.getState().setBillingPlan("free");
    expect(usePrefsStore.getState().billingPlan).toBe("free");
  });

  it("toggles notification preferences individually", () => {
    expect(usePrefsStore.getState().notificationPrefs.pathUpdates.push).toBe(false);
    usePrefsStore.getState().setNotificationPref("pathUpdates", "push", true);
    expect(usePrefsStore.getState().notificationPrefs.pathUpdates.push).toBe(true);

    usePrefsStore.getState().setNotificationPref("streakReminders", "email", false);
    expect(usePrefsStore.getState().notificationPrefs.streakReminders.email).toBe(false);
  });

  it("updates quiet hours", () => {
    usePrefsStore.getState().setQuietHours("23:00", "07:00");
    expect(usePrefsStore.getState().quietHoursStart).toBe("23:00");
    expect(usePrefsStore.getState().quietHoursEnd).toBe("07:00");
  });

  it("saves notification settings as one draft and persists read ids once", () => {
    const next = {
      ...usePrefsStore.getState().notificationPrefs,
      leaderboard: { email: true, push: false },
    };
    usePrefsStore.getState().saveNotificationSettings(next, "21:30", "07:15");
    expect(usePrefsStore.getState().notificationPrefs.leaderboard).toEqual({
      email: true,
      push: false,
    });
    expect(usePrefsStore.getState().quietHoursStart).toBe("21:30");

    usePrefsStore.getState().markNotificationRead("lesson:one");
    usePrefsStore.getState().markNotificationRead("lesson:one");
    usePrefsStore.getState().markAllNotificationsRead(["lesson:one", "quest:two"]);
    expect(usePrefsStore.getState().notificationReadIds).toEqual(["lesson:one", "quest:two"]);
  });

  it("toggles playback speed and narration", () => {
    usePrefsStore.getState().setPlaybackSpeed(1.5);
    expect(usePrefsStore.getState().playbackSpeed).toBe(1.5);

    usePrefsStore.getState().setNarrationOn(false);
    expect(usePrefsStore.getState().narrationOn).toBe(false);
  });
});
