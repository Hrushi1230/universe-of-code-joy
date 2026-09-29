import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Flame,
  Grid2x2,
  Layers,
  Lock,
  MoveHorizontal,
  ScrollText,
  Target,
  TrendingUp,
} from "lucide-react";
import { AppSidebar, AppTopBar } from "@/components/app-shell";
import { getAlgorithm, getAlgorithms } from "@/content/algorithms";
import { getLesson } from "@/content/lessons";
import { getPath, getPaths } from "@/content/paths";
import { getQuest } from "@/content/quests";
import { useHydrated } from "@/hooks/useHydrated";
import { readOnboardingState, weeklyGoalMinutes } from "@/lib/onboarding";
import { nextBestAction, sortRecommended } from "@/lib/recommend";
import { xpToNextLevel } from "@/lib/xp";
import {
  baselineProgress,
  dayKey,
  useProgressStore,
  type ProgressData,
} from "@/stores/progressStore";
import { usePrefsStore } from "@/stores/prefsStore";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — Algora" },
      {
        name: "description",
        content:
          "Your Algora home base: continue your lesson, track your streak and XP, and follow today's study plan.",
      },
      { property: "og:title", content: "Dashboard — Algora" },
      {
        property: "og:description",
        content:
          "Resume lessons, keep your streak alive, and follow your personalized algorithm-learning plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TealPeriod() {
  return <span className="ml-0.5 inline-block h-2.5 w-2.5 bg-primary align-baseline" />;
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** Monday-first keys for the current local week. */
function currentWeekKeys(now: Date): string[] {
  const monday = new Date(now);
  const shift = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - shift);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return dayKey(d);
  });
}

function StreakCard({ streak, active }: { streak: number; active: boolean[] }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-card px-5 py-4">
      <Flame className="h-8 w-8 shrink-0 text-primary" strokeWidth={1.6} />
      <div className="min-w-0">
        <div className="font-mono text-[13px] text-foreground">
          Streak · {streak} {streak === 1 ? "day" : "days"}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {WEEK.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">{d}</span>
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded-full",
                  active[i] ? "bg-primary" : "bg-secondary",
                ].join(" ")}
              >
                {active[i] && (
                  <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
                    <path
                      d="M2 5.2 L4 7.2 L8 3"
                      fill="none"
                      stroke="var(--card)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 56 56"
      className="h-14 w-14 shrink-0"
      role="img"
      aria-label={`${pct}% complete`}
    >
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--secondary)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
        fill="var(--primary)"
      >
        {pct}%
      </text>
    </svg>
  );
}

interface PlanItem {
  icon: typeof MoveHorizontal;
  title: string;
  time: string;
  due: boolean;
  to: string;
}

type NodeState = "done" | "current" | "next" | "locked";

interface PathNode {
  n: number;
  label: string;
  state: NodeState;
  slug: string | null;
}

/** "Week 1-2: Array & String Foundations" -> two balanced label lines. */
function twoLine(raw: string): string {
  const text = raw.replace(/^(Week|Module)\s[^:]*:\s*/i, "");
  const words = text.split(" ");
  if (words.length < 2) return text;
  let best = 1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const diff = Math.abs(a - b);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return `${words.slice(0, best).join(" ")}\n${words.slice(best).join(" ")}`;
}

function buildPathNodes(progress: ProgressData): PathNode[] {
  const path =
    (progress.activePathSlug ? getPath(progress.activePathSlug) : undefined) ?? getPaths()[0]!;
  const modules = path.modules.slice(0, 5);
  const completion = modules.map((m) => {
    const known = m.itemSlugs.filter((s) => getAlgorithm(s));
    if (known.length === 0) return 0;
    const total = known.reduce((sum, s) => sum + (progress.algorithms[s]?.masteryPct ?? 0), 0);
    return total / known.length;
  });
  const currentIndex = completion.findIndex((c) => c < 100);
  return modules.map((m, i) => {
    const state: NodeState =
      currentIndex === -1 || i < currentIndex
        ? "done"
        : i === currentIndex
          ? "current"
          : i === currentIndex + 1
            ? "next"
            : "locked";
    return {
      n: i + 1,
      label: twoLine(m.title),
      state,
      slug: m.itemSlugs.find((s) => getAlgorithm(s)) ?? null,
    };
  });
}

function DashboardPage() {
  const hydrated = useHydrated();
  const live = useProgressStore((s) => s);
  const claimQuestReward = useProgressStore((s) => s.claimQuestReward);
  const profileName = usePrefsStore((s) => s.profile.fullName);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = React.useState(240);

  React.useEffect(() => {
    setWeeklyTargetMinutes(weeklyGoalMinutes(readOnboardingState().commitment));
  }, []);

  const p: ProgressData = hydrated ? live : baselineProgress;

  const todayKey = hydrated ? dayKey() : null;
  const weekKeys = React.useMemo(() => (hydrated ? currentWeekKeys(new Date()) : []), [hydrated]);

  const weekActive = React.useMemo(
    () =>
      weekKeys.length === 7
        ? weekKeys.map((k) => {
            const row = p.activity[k];
            return Boolean(row && (row.xp > 0 || row.minutes > 0 || row.solved > 0));
          })
        : Array.from({ length: 7 }, () => false),
    [weekKeys, p.activity],
  );

  const weekMinutes = React.useMemo(
    () => weekKeys.reduce((sum, k) => sum + (p.activity[k]?.minutes ?? 0), 0),
    [weekKeys, p.activity],
  );
  const goalPct = Math.min(100, Math.round((weekMinutes / weeklyTargetMinutes) * 100));
  const minutesLeft = Math.max(0, weeklyTargetMinutes - weekMinutes);
  const today = todayKey ? p.activity[todayKey] : undefined;
  const xpToday = today?.xp ?? 0;
  const solvedToday = today?.solved ?? 0;

  const dueCount = React.useMemo(() => {
    if (!hydrated) return 0;
    const now = Date.now();
    return Object.values(p.reviewCards).filter((c) => new Date(c.dueISO).getTime() <= now).length;
  }, [hydrated, p.reviewCards]);

  const action = React.useMemo(() => nextBestAction(p), [p]);

  const continueCard = React.useMemo(() => {
    const slug =
      action?.kind === "lesson"
        ? (getLesson(action.slug)?.algorithmSlug ?? action.slug)
        : (action?.slug ?? null);
    const algo = slug ? getAlgorithm(slug) : undefined;
    if (!algo) return null;
    const path = (p.activePathSlug ? getPath(p.activePathSlug) : undefined) ?? getPaths()[0]!;
    const index = path.modules.findIndex((m) => m.itemSlugs.includes(algo.slug));
    const totalItems = path.modules.reduce((n, m) => n + m.itemSlugs.length, 0);
    const position =
      index === -1
        ? 1
        : path.modules.slice(0, index).reduce((n, m) => n + m.itemSlugs.length, 0) + 1;
    return {
      slug: algo.slug,
      name: algo.name,
      meta: `${path.title} · Lesson ${position} of ${totalItems}`,
      pct: p.algorithms[algo.slug]?.masteryPct ?? 0,
      reason: action?.reason ?? "",
    };
  }, [action, p.activePathSlug, p.algorithms]);

  const recommended = React.useMemo(() => {
    const candidates = getAlgorithms()
      .filter((a) => (p.algorithms[a.slug]?.masteryPct ?? 0) < 100)
      .map((a) => a.slug);
    return sortRecommended(candidates, p).filter((s) => s !== continueCard?.slug);
  }, [p, continueCard?.slug]);

  const plan: PlanItem[] = React.useMemo(() => {
    const items: PlanItem[] = [];
    if (continueCard) {
      items.push({
        icon: MoveHorizontal,
        title: continueCard.name,
        time: `${getAlgorithm(continueCard.slug)?.estMinutes ?? 20}m`,
        due: true,
        to: `/algorithms/${continueCard.slug}`,
      });
    }
    const second = recommended[0];
    if (second) {
      items.push({
        icon: Layers,
        title: getAlgorithm(second)?.name ?? second,
        time: `${getAlgorithm(second)?.estMinutes ?? 25}m`,
        due: false,
        to: `/algorithms/${second}`,
      });
    }
    items.push({
      icon: ScrollText,
      title: dueCount > 0 ? `Review: ${dueCount} cards` : "Review queue is clear",
      time: dueCount > 0 ? `${Math.max(5, dueCount * 2)}m` : "0m",
      due: dueCount > 0,
      to: "/review",
    });
    return items;
  }, [continueCard, recommended, dueCount]);

  const pathNodes = React.useMemo(() => buildPathNodes(p), [p]);

  const quest = getQuest("daily-problems")!;
  const questProgress = Math.min(quest.target, solvedToday);
  const questDone = questProgress >= quest.target;
  const questState = hydrated ? p.quests[quest.id] : undefined;
  const questClaimed = Boolean(questState?.claimedAt && questState.periodKey === todayKey);

  const claim = React.useCallback(() => {
    if (!todayKey || !questDone) return;
    claimQuestReward(quest.id, todayKey, questProgress, quest.xp);
  }, [claimQuestReward, quest.id, quest.xp, questDone, questProgress, todayKey]);

  const firstName = hydrated && profileName.trim() ? profileName.trim().split(/\s+/)[0] : "Local";
  const toNext = xpToNextLevel(p.xp);

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-foreground">
      <AppSidebar active="Dashboard" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopBar title="Dashboard" />

        <main className="flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-8 sm:pb-2">
          <h1 className="text-[30px] font-semibold leading-none tracking-[-0.025em] text-foreground">
            Welcome back, {firstName}
            <TealPeriod />
          </h1>
          <p className="mt-2 font-mono text-[13.5px] text-muted-foreground">
            You&apos;re {toNext} XP from Level {p.level + 1} — keep the streak alive.
          </p>

          {/* Continue learning */}
          <div className="mt-4 rounded-2xl border border-hairline bg-card px-6 py-3">
            <div className="text-[16px] font-semibold text-foreground">Continue learning</div>
            {continueCard ? (
              <div className="mt-3 flex flex-wrap items-center gap-4 sm:gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-hairline bg-card">
                  <Grid2x2 className="h-6 w-6 text-primary" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[20px] font-semibold text-foreground">
                    {continueCard.name}
                  </div>
                  <div className="mt-1.5 inline-flex rounded-lg border border-hairline px-3 py-1 font-mono text-[12px] text-muted-foreground">
                    {continueCard.meta}
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="font-mono text-[12px] text-primary">{continueCard.pct}%</span>
                    <div className="h-2 w-[420px] max-w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${continueCard.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Link
                  to="/algorithms/$slug"
                  params={{ slug: continueCard.slug }}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-6 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow sm:ml-auto"
                >
                  Resume lesson <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-4 sm:gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-hairline bg-card">
                  <Grid2x2 className="h-6 w-6 text-primary" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[20px] font-semibold text-foreground">
                    Pick your first algorithm
                  </div>
                  <div className="mt-1.5 inline-flex rounded-lg border border-hairline px-3 py-1 font-mono text-[12px] text-muted-foreground">
                    Nothing in progress yet
                  </div>
                </div>
                <Link
                  to="/explore"
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-6 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow sm:ml-auto"
                >
                  Browse algorithms <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            <StreakCard streak={p.streak.current} active={weekActive} />
            <div className="rounded-2xl border border-hairline bg-card px-5 py-4">
              <div className="font-mono text-[13px] text-foreground">
                This week · {(weekMinutes / 60).toFixed(1)} / {weeklyTargetMinutes / 60}h
              </div>
              <div className="mt-2 flex items-center gap-4">
                <Ring pct={goalPct} />
                <div>
                  <div className="text-[14px] text-foreground">
                    {goalPct >= 100
                      ? "Goal reached!"
                      : goalPct >= 60
                        ? "Almost there!"
                        : "Good start."}
                  </div>
                  <div className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
                    {minutesLeft === 0
                      ? "Weekly goal complete."
                      : `${minutesLeft}m to hit your goal.`}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-hairline bg-card px-5 py-4">
              <div className="font-mono text-[13px] text-foreground">
                XP today · <span className="text-primary">+{xpToday}</span>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <TrendingUp className="h-8 w-8 shrink-0 text-primary" strokeWidth={1.6} />
                <div className="font-mono text-[12.5px] text-muted-foreground">
                  {xpToday > 0 ? (
                    <>
                      Nice work! Keep
                      <br />
                      the momentum.
                    </>
                  ) : (
                    <>
                      Start a lesson to
                      <br />
                      earn XP today.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lower body */}
          <div className="mt-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="rounded-2xl border border-hairline bg-card px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-foreground">Today&apos;s plan</span>
                <Link to="/explore" className="font-mono text-[12.5px] text-primary">
                  View all
                </Link>
              </div>
              <div className="mt-1">
                {plan.map(({ icon: Icon, title, time, due, to }, i) => (
                  <Link
                    key={title}
                    to={to}
                    className={[
                      "flex items-center gap-3 py-2 transition-colors hover:bg-secondary/40",
                      i > 0 ? "border-t border-hairline" : "",
                    ].join(" ")}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-card">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={1.7} />
                    </span>
                    <span className="truncate text-[14.5px] text-foreground">{title}</span>
                    {due && (
                      <span className="shrink-0 rounded-md bg-primary-tint px-2 py-0.5 font-mono text-[11px] text-primary">
                        Due now
                      </span>
                    )}
                    <span className="ml-auto shrink-0 rounded-lg border border-hairline px-3 py-1 font-mono text-[12px] text-foreground">
                      {time}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[12.5px] text-primary">
                      Start <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-hairline bg-card px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-foreground">Your path</span>
                <Link
                  to="/paths"
                  className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-primary"
                >
                  View full path <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-4 flex items-start overflow-x-auto pb-2">
                {pathNodes.map((node, i) => {
                  const badge = (
                    <span
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-full font-mono text-[13px]",
                        node.state === "current" || node.state === "done"
                          ? "bg-primary text-primary-foreground"
                          : node.state === "next"
                            ? "bg-primary-tint text-primary"
                            : "bg-secondary text-muted-foreground",
                      ].join(" ")}
                    >
                      {node.n}
                    </span>
                  );
                  return (
                    <div key={node.n} className="flex min-w-[108px] flex-1 flex-col items-center">
                      <div className="flex w-full items-center">
                        <span
                          className={[
                            "h-px flex-1",
                            i === 0
                              ? "bg-transparent"
                              : node.state === "next" || node.state === "done"
                                ? "bg-primary"
                                : "bg-hairline",
                          ].join(" ")}
                        />
                        <span className="relative flex flex-col items-center">
                          {node.state === "locked" && (
                            <Lock
                              className="absolute -top-5 h-3.5 w-3.5 text-muted-foreground"
                              strokeWidth={1.8}
                              aria-hidden
                            />
                          )}
                          {node.slug && node.state !== "locked" ? (
                            <Link
                              to="/algorithms/$slug"
                              params={{ slug: node.slug }}
                              aria-label={`Open ${node.label.replace("\n", " ")}`}
                              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              {badge}
                            </Link>
                          ) : (
                            badge
                          )}
                        </span>
                        <span
                          className={[
                            "h-px flex-1",
                            i === pathNodes.length - 1
                              ? "bg-transparent"
                              : node.state === "current" || node.state === "done"
                                ? "bg-primary"
                                : "bg-hairline",
                          ].join(" ")}
                        />
                      </div>
                      <div className="mt-2 whitespace-pre text-center text-[11.5px] leading-[1.35] text-foreground">
                        {node.label}
                      </div>
                      <div
                        className={[
                          "mt-1.5 font-mono text-[11px]",
                          node.state === "locked" ? "text-muted-foreground" : "text-primary",
                        ].join(" ")}
                      >
                        {node.state === "done"
                          ? "Done"
                          : node.state === "current"
                            ? "Current"
                            : node.state === "next"
                              ? "Up next"
                              : "Locked"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily quest */}
          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl bg-primary-tint/60 px-5 py-3.5 sm:gap-5 sm:px-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
              <Target className="h-6 w-6 text-primary" strokeWidth={1.6} />
            </span>
            <div>
              <div className="text-[16px] font-semibold text-foreground">Daily quest</div>
              <div className="mt-0.5 font-mono text-[13px] text-muted-foreground">
                {quest.description.replace(/\.$/, "")} to earn{" "}
                <span className="text-primary">+{quest.xp} XP</span>
              </div>
            </div>
            <div className="flex min-w-[220px] flex-1 items-center gap-3 sm:ml-auto sm:flex-none">
              <span className="font-mono text-[13px] text-foreground">
                {questProgress} / {quest.target}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary sm:w-[200px] sm:flex-none">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${(questProgress / quest.target) * 100}%` }}
                />
              </div>
            </div>
            {questDone && !questClaimed ? (
              <button
                type="button"
                onClick={claim}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-6 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                Claim +{quest.xp} XP <ArrowRight className="h-4 w-4" />
              </button>
            ) : questClaimed ? (
              <span className="inline-flex h-12 shrink-0 items-center rounded-xl border border-hairline px-6 font-mono text-[14px] text-primary">
                Claimed today
              </span>
            ) : (
              <Link
                to="/practice/$slug"
                params={{ slug: "two-sum" }}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-6 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                Go to practice <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </main>

        <footer className="flex h-[44px] shrink-0 items-center justify-center">
          <p className="font-mono text-[12px] text-muted-foreground">
            © 2026 Algora &nbsp;·&nbsp; Welcome aboard &nbsp;·&nbsp; Reduced-motion friendly
          </p>
        </footer>
      </div>
    </div>
  );
}
