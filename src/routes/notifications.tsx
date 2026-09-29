import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { DemoNotice } from "@/components/demo-notice";
import useHydrated from "@/hooks/useHydrated";
import {
  buildLocalNotifications,
  notificationTimeLabel,
  type LocalNotification,
  type LocalNotificationKind,
} from "@/lib/notifications";
import type { NotificationPrefs } from "@/stores/prefsStore";
import { usePrefsStore } from "@/stores/prefsStore";
import { baselineProgress, useProgressStore } from "@/stores/progressStore";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
  head: () => ({
    meta: [
      { title: "Notifications — local learning activity — Algora" },
      {
        name: "description",
        content: "Review learning activity saved on this device and configure local preferences.",
      },
      { property: "og:title", content: "Notifications — Algora" },
      {
        property: "og:description",
        content: "Review learning activity saved on this device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type FilterTab = "All" | "Unread";

const ICONS: Record<LocalNotificationKind, LucideIcon> = {
  achievement: ShieldCheck,
  quest: ScrollText,
  lesson: BookOpen,
  problem: Code2,
  streak: Flame,
};

const PREF_KEYS = [
  {
    key: "streakReminders" as const,
    icon: Flame,
    name: "Streak reminders",
    desc: "Daily reminders when delivery is connected.",
  },
  {
    key: "achievements" as const,
    icon: ShieldCheck,
    name: "Achievements",
    desc: "Badge and reward updates.",
  },
  {
    key: "pathUpdates" as const,
    icon: BookOpen,
    name: "Path updates",
    desc: "Changes to your selected path.",
  },
  {
    key: "leaderboard" as const,
    icon: BarChart3,
    name: "League preview",
    desc: "Local fixture-rank updates after integration.",
  },
  {
    key: "weeklyRecap" as const,
    icon: CheckCircle2,
    name: "Weekly recap",
    desc: "A summary of locally recorded work.",
  },
];

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
        on ? "bg-primary" : "bg-hairline"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-card transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function NotificationRow({
  item,
  unread,
  onRead,
}: {
  item: LocalNotification;
  unread: boolean;
  onRead: (id: string) => void;
}) {
  const Icon = ICONS[item.kind];
  return (
    <a
      href={item.href}
      onClick={() => onRead(item.id)}
      className={`flex min-h-[72px] w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left last:border-0 sm:px-5 ${
        unread ? "bg-primary-tint/35" : "bg-card"
      }`}
    >
      <span className="flex w-2 shrink-0 justify-center" aria-hidden="true">
        {unread && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-primary-tint/70">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium text-foreground">{item.title}</span>
        <span className="mt-0.5 block font-mono text-[12.5px] leading-relaxed text-muted-foreground">
          {item.detail}
        </span>
      </span>
      <span className="shrink-0 self-start pt-1 font-mono text-[12px] text-muted-foreground">
        {notificationTimeLabel(item.createdAt)}
      </span>
      <span className="sr-only">{unread ? "Unread" : "Read"}</span>
    </a>
  );
}

function Notifications() {
  const hydrated = useHydrated();
  const liveProgress = useProgressStore((state) => state);
  const progress = hydrated ? liveProgress : baselineProgress;
  const storedPrefs = usePrefsStore((state) => state.notificationPrefs);
  const storedStart = usePrefsStore((state) => state.quietHoursStart);
  const storedEnd = usePrefsStore((state) => state.quietHoursEnd);
  const readIds = usePrefsStore((state) => state.notificationReadIds);
  const saveNotificationSettings = usePrefsStore((state) => state.saveNotificationSettings);
  const markNotificationRead = usePrefsStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = usePrefsStore((state) => state.markAllNotificationsRead);

  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [draftPrefs, setDraftPrefs] = useState<NotificationPrefs>(() => storedPrefs);
  const [quietStart, setQuietStart] = useState(storedStart);
  const [quietEnd, setQuietEnd] = useState(storedEnd);

  useEffect(() => {
    if (!hydrated) return;
    setDraftPrefs(storedPrefs);
    setQuietStart(storedStart);
    setQuietEnd(storedEnd);
  }, [hydrated, storedEnd, storedPrefs, storedStart]);

  const items = useMemo(
    () => (hydrated ? buildLocalNotifications(progress) : []),
    [hydrated, progress],
  );
  const unreadItems = useMemo(
    () => items.filter((item) => !readIds.includes(item.id)),
    [items, readIds],
  );
  const filtered = activeTab === "Unread" ? unreadItems : items;
  const todayItems = filtered.filter((item) => item.section === "today");
  const earlierItems = filtered.filter((item) => item.section === "earlier");
  const dirty =
    hydrated &&
    (JSON.stringify(draftPrefs) !== JSON.stringify(storedPrefs) ||
      quietStart !== storedStart ||
      quietEnd !== storedEnd);

  const toggleDraft = (key: keyof NotificationPrefs, channel: "email" | "push"): void => {
    setDraftPrefs((previous) => ({
      ...previous,
      [key]: { ...previous[key], [channel]: !previous[key][channel] },
    }));
  };

  const handleMarkAllRead = useCallback(() => {
    if (unreadItems.length === 0) return;
    markAllNotificationsRead(unreadItems.map((item) => item.id));
    toast.success("All local activity marked as read");
  }, [markAllNotificationsRead, unreadItems]);

  const handleSave = () => {
    saveNotificationSettings(draftPrefs, quietStart, quietEnd);
    toast.success("Preferences saved on this device", {
      description: "No email or push delivery was started.",
    });
  };

  const handleCancel = () => {
    setDraftPrefs(storedPrefs);
    setQuietStart(storedStart);
    setQuietEnd(storedEnd);
  };

  return (
    <div className="flex min-h-screen w-full bg-background lg:h-screen lg:overflow-hidden">
      <AppSidebar active="Notifications" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Notifications"]} search />

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto px-4 py-5 sm:px-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="flex min-h-[440px] min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-card">
            <div className="flex flex-wrap items-center gap-3 px-4 pt-5 sm:px-5">
              <h1 className="text-[24px] font-semibold leading-none tracking-tight text-foreground">
                Activity inbox
              </h1>
              <span className="rounded-md bg-primary-tint px-2.5 py-1 font-mono text-[12px] text-primary">
                {unreadItems.length} unread
              </span>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={!hydrated || unreadItems.length === 0}
                className="ml-auto min-h-11 font-mono text-[13px] text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                Mark all read
              </button>
            </div>

            <div className="px-4 pt-3 sm:px-5">
              <DemoNotice>
                This inbox is generated only from progress saved on this device. It is not a live
                messaging or delivery service.
              </DemoNotice>
            </div>

            <div className="shrink-0 px-4 pt-4 sm:px-5">
              <div className="inline-flex overflow-hidden rounded-xl border border-hairline">
                {(["All", "Unread"] as FilterTab[]).map((tab, index) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    aria-pressed={activeTab === tab}
                    className={`h-11 px-7 font-mono text-[13px] transition-colors ${
                      index > 0 ? "border-l border-hairline" : ""
                    } ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {todayItems.length > 0 && (
                <>
                  <div className="border-b border-hairline px-5 py-2 font-mono text-[12px] text-muted-foreground">
                    Today
                  </div>
                  {todayItems.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      unread={!readIds.includes(item.id)}
                      onRead={markNotificationRead}
                    />
                  ))}
                </>
              )}
              {earlierItems.length > 0 && (
                <>
                  <div className="border-b border-hairline px-5 py-2 font-mono text-[12px] text-muted-foreground">
                    Earlier
                  </div>
                  {earlierItems.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      unread={!readIds.includes(item.id)}
                      onRead={markNotificationRead}
                    />
                  ))}
                </>
              )}
              {filtered.length === 0 && (
                <div className="grid min-h-[220px] place-items-center px-6 py-10 text-center">
                  <div>
                    <CheckCircle2 className="mx-auto h-7 w-7 text-primary" strokeWidth={1.6} />
                    <p className="mt-3 text-[15px] font-medium text-foreground">
                      {activeTab === "Unread" ? "No unread activity" : "No local activity yet"}
                    </p>
                    <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
                      {activeTab === "Unread"
                        ? "Everything saved on this device has been read."
                        : "Complete a lesson, solve a problem, or claim a quest to create an item."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex min-h-[540px] flex-col self-start rounded-2xl border border-hairline bg-card px-4 py-5 sm:px-5">
            <h2 className="text-[22px] font-semibold leading-none tracking-tight text-foreground">
              Delivery preferences
            </h2>
            <p className="mt-2 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
              Saved locally for future service integration. Email and push are not connected.
            </p>

            <div className="mt-3 flex items-center justify-end gap-4 pr-1">
              <span className="w-12 text-center font-mono text-[12px] text-muted-foreground">
                Email
              </span>
              <span className="w-12 text-center font-mono text-[12px] text-muted-foreground">
                Push
              </span>
            </div>

            <div className="mt-2 shrink-0 overflow-hidden rounded-xl border border-hairline">
              {PREF_KEYS.map(({ key, icon: Icon, name, desc }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 border-b border-hairline px-3 py-3 last:border-0"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.7} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-foreground">{name}</div>
                    <p className="mt-0.5 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Toggle
                      on={draftPrefs[key].email}
                      onToggle={() => toggleDraft(key, "email")}
                      label={`${name} email preference`}
                    />
                    <Toggle
                      on={draftPrefs[key].push}
                      onToggle={() => toggleDraft(key, "push")}
                      label={`${name} push preference`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <fieldset className="mt-4 rounded-xl border border-hairline p-3.5">
              <legend className="px-1 font-mono text-[12px] text-muted-foreground">
                Quiet hours preference
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="font-mono text-[12px] text-muted-foreground">
                  Start
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(event) => setQuietStart(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-hairline bg-card px-3 font-mono text-[13px] text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint"
                  />
                </label>
                <label className="font-mono text-[12px] text-muted-foreground">
                  End
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(event) => setQuietEnd(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-hairline bg-card px-3 font-mono text-[13px] text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint"
                  />
                </label>
              </div>
              <p className="mt-2 flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" strokeWidth={1.7} /> Uses this device's
                local time after delivery is connected.
              </p>
            </fieldset>

            <div className="mt-auto flex items-center justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!dirty}
                className="h-11 rounded-xl border border-hairline bg-card px-5 text-[14px] text-foreground hover:bg-secondary disabled:opacity-45"
              >
                Reset draft
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty}
                className="h-11 rounded-xl bg-primary px-5 text-[14px] font-medium text-primary-foreground hover:bg-primary-glow disabled:opacity-45"
              >
                Save locally
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
