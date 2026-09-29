import { getAchievement } from "@/content/achievements";
import { getLesson } from "@/content/lessons";
import { getProblem } from "@/content/problems";
import { getQuest } from "@/content/quests";
import type { ProgressData } from "@/stores/progressStore";
import { dayKey } from "@/stores/progressStore";

export type LocalNotificationKind = "achievement" | "quest" | "lesson" | "problem" | "streak";

export interface LocalNotification {
  id: string;
  kind: LocalNotificationKind;
  title: string;
  detail: string;
  createdAt: string;
  href: string;
  section: "today" | "earlier";
}

function validIso(value: string | null | undefined): value is string {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

export function buildLocalNotifications(
  state: ProgressData,
  now: Date = new Date(),
): LocalNotification[] {
  const items: Omit<LocalNotification, "section">[] = [];

  for (const [id, progress] of Object.entries(state.achievements)) {
    if (!validIso(progress.unlockedAt)) continue;
    const achievement = getAchievement(id);
    if (!achievement) continue;
    items.push({
      id: `achievement:${id}:${progress.unlockedAt}`,
      kind: "achievement",
      title: `${achievement.name} earned`,
      detail: `${achievement.criteria}. +${achievement.xp} XP was recorded locally.`,
      createdAt: progress.unlockedAt,
      href: "/achievements",
    });
  }

  for (const [id, progress] of Object.entries(state.quests)) {
    if (!validIso(progress.claimedAt)) continue;
    const quest = getQuest(id);
    if (!quest) continue;
    items.push({
      id: `quest:${id}:${progress.periodKey}`,
      kind: "quest",
      title: `${quest.title} claimed`,
      detail: `${quest.xp} XP was added for ${progress.periodKey}.`,
      createdAt: progress.claimedAt,
      href: "/quests",
    });
  }

  for (const [slug, progress] of Object.entries(state.lessons)) {
    if (!validIso(progress.completedAt)) continue;
    const lesson = getLesson(slug);
    if (!lesson) continue;
    items.push({
      id: `lesson:${slug}:${progress.completedAt}`,
      kind: "lesson",
      title: `${lesson.title} completed`,
      detail:
        progress.quizScore === null
          ? "Lesson completion was saved on this device."
          : `Quiz score: ${progress.quizScore}%.`,
      createdAt: progress.completedAt,
      href: `/algorithms/${lesson.algorithmSlug}`,
    });
  }

  for (const [slug, progress] of Object.entries(state.problems)) {
    if (!validIso(progress.solvedAt)) continue;
    const problem = getProblem(slug);
    if (!problem) continue;
    items.push({
      id: `problem:${slug}:${progress.solvedAt}`,
      kind: "problem",
      title: `${problem.title} solved`,
      detail: `${progress.attempts} attempt${progress.attempts === 1 ? "" : "s"}; result saved locally.`,
      createdAt: progress.solvedAt,
      href: `/practice/${problem.slug}`,
    });
  }

  if (state.streak.current > 0 && validIso(state.streak.lastActiveISO)) {
    items.push({
      id: `streak:${dayKey(new Date(state.streak.lastActiveISO))}`,
      kind: "streak",
      title: `${state.streak.current}-day streak active`,
      detail: "This streak is calculated from activity stored on this device.",
      createdAt: state.streak.lastActiveISO,
      href: "/dashboard",
    });
  }

  const today = dayKey(now);
  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30)
    .map((item) => ({
      ...item,
      section: dayKey(new Date(item.createdAt)) === today ? "today" : "earlier",
    }));
}

export function notificationTimeLabel(iso: string, now: Date = new Date()): string {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return "Saved locally";
  const difference = Math.max(0, now.getTime() - time.getTime());
  const minutes = Math.floor(difference / 60_000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && dayKey(time) === dayKey(now)) return `${hours}h`;
  return time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
