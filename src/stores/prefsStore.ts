import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CodeLanguage = "js" | "ts" | "py";
export type BillingPlan = "free" | "pro-monthly" | "pro-annual";

export interface NotificationPref {
  email: boolean;
  push: boolean;
}

export type NotificationPrefs = PrefsState["notificationPrefs"];

export interface ProfileData {
  fullName: string;
  username: string;
  email: string;
  country: string;
  bio: string;
  twoFactorEnabled: boolean;
}

export interface PrefsState {
  /* ---- code / playback ---- */
  language: CodeLanguage;
  playbackSpeed: number;
  narrationOn: boolean;
  soundOn: boolean;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;

  /* ---- profile ---- */
  profile: ProfileData;

  /* ---- billing ---- */
  billingPlan: BillingPlan;

  /* ---- notification preferences ---- */
  notificationPrefs: {
    streakReminders: NotificationPref;
    achievements: NotificationPref;
    pathUpdates: NotificationPref;
    leaderboard: NotificationPref;
    weeklyRecap: NotificationPref;
  };
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationReadIds: string[];

  /* ---- code / playback setters ---- */
  setLanguage: (language: CodeLanguage) => void;
  setPlaybackSpeed: (playbackSpeed: number) => void;
  setNarrationOn: (narrationOn: boolean) => void;
  setSoundOn: (soundOn: boolean) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  /* ---- profile setters ---- */
  updateProfile: (patch: Partial<ProfileData>) => void;

  /* ---- billing setters ---- */
  setBillingPlan: (plan: BillingPlan) => void;

  /* ---- notification pref setters ---- */
  setNotificationPref: (
    key: keyof PrefsState["notificationPrefs"],
    channel: "email" | "push",
    value: boolean,
  ) => void;
  setQuietHours: (start: string, end: string) => void;
  saveNotificationSettings: (
    prefs: PrefsState["notificationPrefs"],
    start: string,
    end: string,
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids: string[]) => void;
}

const defaultProfile: ProfileData = {
  fullName: "Local Learner",
  username: "@learner",
  email: "",
  country: "",
  bio: "",
  twoFactorEnabled: false,
};

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      /* ---- code / playback ---- */
      language: "js",
      playbackSpeed: 1,
      narrationOn: true,
      soundOn: true,
      reducedMotion: false,
      sidebarCollapsed: false,

      /* ---- profile ---- */
      profile: { ...defaultProfile },

      /* ---- billing ---- */
      billingPlan: "free",

      /* ---- notification preferences ---- */
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

      /* ---- code / playback setters ---- */
      setLanguage: (language) => set({ language }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setNarrationOn: (narrationOn) => set({ narrationOn }),
      setSoundOn: (soundOn) => set({ soundOn }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      /* ---- profile setters ---- */
      updateProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch },
        })),

      /* ---- billing setters ---- */
      setBillingPlan: (plan) => set({ billingPlan: plan }),

      /* ---- notification pref setters ---- */
      setNotificationPref: (key, channel, value) =>
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            [key]: {
              ...state.notificationPrefs[key],
              [channel]: value,
            },
          },
        })),
      setQuietHours: (start, end) => set({ quietHoursStart: start, quietHoursEnd: end }),
      saveNotificationSettings: (notificationPrefs, quietHoursStart, quietHoursEnd) =>
        set({ notificationPrefs, quietHoursStart, quietHoursEnd }),
      markNotificationRead: (id) =>
        set((state) => ({
          notificationReadIds: state.notificationReadIds.includes(id)
            ? state.notificationReadIds
            : [...state.notificationReadIds, id],
        })),
      markAllNotificationsRead: (ids) =>
        set((state) => ({
          notificationReadIds: [...new Set([...state.notificationReadIds, ...ids])],
        })),
    }),
    {
      name: "algora-prefs",
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        if (version < 4) {
          const old = persisted as Partial<PrefsState>;
          const hadSeededProfile =
            !old.profile ||
            (old.profile.fullName === "Arjun Rao" &&
              old.profile.username === "@arjun" &&
              old.profile.email === "arjun@example.com");
          return {
            ...old,
            profile: hadSeededProfile
              ? { ...defaultProfile }
              : { ...defaultProfile, ...old.profile, twoFactorEnabled: false },
            billingPlan: "free",
            notificationPrefs: old.notificationPrefs ?? {
              streakReminders: { email: true, push: true },
              achievements: { email: true, push: true },
              pathUpdates: { email: true, push: false },
              leaderboard: { email: false, push: true },
              weeklyRecap: { email: true, push: false },
            },
            quietHoursStart: old.quietHoursStart ?? "22:00",
            quietHoursEnd: old.quietHoursEnd ?? "08:00",
            notificationReadIds: old.notificationReadIds ?? [],
          };
        }
        return persisted as PrefsState;
      },
    },
  ),
);
