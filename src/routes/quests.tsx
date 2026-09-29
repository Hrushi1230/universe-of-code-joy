import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Code2,
  Flame,
  HelpCircle,
  Layers,
  Milestone,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { DemoNotice } from "@/components/demo-notice";
import { getQuests } from "@/content/quests";
import type { Quest } from "@/content/types";
import useHydrated from "@/hooks/useHydrated";
import { formatCountdown, periodEnd, questState, type QuestState } from "@/lib/quests";
import { baselineProgress, useProgressStore } from "@/stores/progressStore";

export const Route = createFileRoute("/quests")({
  component: Quests,
  head: () => ({
    meta: [
      { title: "Quests — daily goals, XP and rewards — Algora" },
      {
        name: "description",
        content:
          "Complete daily and weekly algorithm quests to earn XP, badges and streak freezes. Track progress and claim rewards before the timer resets.",
      },
      { property: "og:title", content: "Quests — daily goals, XP and rewards — Algora" },
      {
        property: "og:description",
        content:
          "Daily quests, weekly challenges, and streak freezes — all driven by what you actually did today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Code2,
  HelpCircle,
  Zap,
  Flame,
  RotateCcw,
  CalendarDays,
  Swords,
  Layers,
  Trophy,
  Milestone,
  Sparkles,
  Target,
};

type Tab = "Daily" | "Weekly" | "Special";

function Ring({ value, total }: { value: number; total: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const filled = total <= 0 ? 0 : Math.min(1, value / total);
  return (
    <svg
      viewBox="0 0 104 104"
      className="h-[104px] w-[104px]"
      role="img"
      aria-label={`${value} of ${total}`}
    >
      <circle cx={52} cy={52} r={r} fill="none" stroke="var(--hairline)" strokeWidth={7} />
      <circle
        cx={52}
        cy={52}
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${c * filled} ${c}`}
        transform="rotate(-90 52 52)"
      />
      <text
        x={52}
        y={57}
        textAnchor="middle"
        fill="var(--ink)"
        fontFamily="JetBrains Mono, monospace"
        fontSize={16}
      >
        {value} / {total}
      </text>
    </svg>
  );
}

function GraphMasterGlyph() {
  return (
    <svg viewBox="0 0 88 76" className="h-[76px] w-[88px]" role="img" aria-label="Graph challenge">
      <g stroke="var(--primary)" strokeWidth={1.8} fill="none" strokeLinecap="round">
        <path d="M44 14 L18 60 M44 14 L70 60 M18 60 L70 60" />
      </g>
      <circle
        cx={44}
        cy={14}
        r={7.5}
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth={1.8}
      />
      <circle
        cx={18}
        cy={60}
        r={7.5}
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth={1.8}
      />
      <circle cx={70} cy={60} r={7.5} fill="var(--primary)" />
    </svg>
  );
}

/** Live countdown to the end of the current quest period; static until mounted. */
function useCountdown(kind: Quest["kind"]): string {
  const [label, setLabel] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setLabel(formatCountdown(periodEnd(kind).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [kind]);
  return label;
}

function Quests() {
  const hydrated = useHydrated();
  const live = useProgressStore((s) => s);
  const state = hydrated ? live : baselineProgress;
  const claimQuestReward = useProgressStore((s) => s.claimQuestReward);

  const [tab, setTab] = useState<Tab>("Daily");
  const kind: Quest["kind"] = tab === "Weekly" ? "weekly" : "daily";
  const countdown = useCountdown(kind);

  const states = useMemo(() => getQuests().map((q) => questState(q, state)), [state]);
  const daily = states.filter((s) => s.quest.kind === "daily");
  const weeklyAll = states.filter((s) => s.quest.kind === "weekly");
  const weekly = weeklyAll;
  const featured = weeklyAll.find((s) => s.quest.id === "weekly-problems") ?? weeklyAll[0];

  const rows: QuestState[] = tab === "Daily" ? daily : tab === "Weekly" ? weekly : [];

  const claim = (q: QuestState) => {
    if (!hydrated || !q.complete) return;
    const claimed = claimQuestReward(q.quest.id, q.periodKey, q.current, q.quest.xp);
    if (claimed) {
      toast.success(`${q.quest.title} claimed — +${q.quest.xp} XP`, {
        description: "Saved once for this local quest period.",
      });
    } else {
      toast.info("Reward already claimed for this period");
    }
  };

  const taskHref = (id: string): string => {
    if (id.includes("review")) return "/review";
    if (id.includes("problem")) return "/practice/";
    if (id.includes("path")) return "/paths";
    return "/explore";
  };

  return (
    <div className="flex min-h-screen w-full bg-background lg:h-screen lg:overflow-hidden">
      <AppSidebar active="Compete" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={[]} search />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8">
          <div className="flex shrink-0 flex-col items-start justify-between gap-3 sm:flex-row">
            <div>
              <h1 className="text-[30px] font-semibold leading-none tracking-tight text-foreground">
                Quests
              </h1>
              <p className="mt-2 font-mono text-[13.5px] text-muted-foreground">
                Complete goals to earn XP, badges, and streak freezes.
              </p>
            </div>
            <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-hairline bg-card px-4 font-mono text-[13.5px] text-foreground">
              <Clock className="h-4 w-4 text-primary" strokeWidth={1.8} />
              {tab === "Special" ? "No active season" : `Resets in ${countdown}`}
            </span>
          </div>

          <div className="mt-3">
            <DemoNotice>
              Progress, reset periods, claims, and XP are calculated from activity saved on this
              device. Server-verified rewards come later.
            </DemoNotice>
          </div>

          <div className="mt-4 flex w-full shrink-0 overflow-hidden rounded-xl border border-hairline bg-card sm:w-fit">
            {(["Daily", "Weekly", "Special"] as Tab[]).map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`h-11 min-w-0 flex-1 px-3 font-mono text-[13.5px] transition-colors sm:w-[116px] sm:flex-none ${
                  i > 0 ? "border-l border-hairline" : ""
                } ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <h2 className="mt-3 shrink-0 font-mono text-[14px] text-foreground">{tab} quests</h2>

          {rows.length === 0 ? (
            <div className="mt-2.5 shrink-0 rounded-2xl border border-hairline bg-card px-5 py-10 text-center">
              <p className="font-mono text-[13px] text-muted-foreground">
                No special quests are running right now. Check back after the next season starts.
              </p>
            </div>
          ) : (
            <div className="mt-2.5 shrink-0 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-card">
              {rows.map((row) => {
                const Icon = ICONS[row.quest.icon] ?? Target;
                const isStreak = row.quest.id === "daily-streak";
                return (
                  <div
                    key={row.quest.id}
                    data-testid={`quest-${row.quest.id}`}
                    className="flex flex-col items-stretch gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3"
                  >
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-hairline bg-primary-tint/60">
                      <Icon className="h-6 w-6 text-primary" strokeWidth={1.7} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold leading-tight text-foreground">
                        {row.quest.title}
                      </div>
                      <p className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
                        {row.quest.description}
                      </p>
                      <div className="mt-2 h-[7px] w-full max-w-[400px] overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>

                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-[13px] text-foreground sm:w-[86px] sm:justify-center">
                      {isStreak ? state.streak.current : `${row.current} / ${row.target}`}
                      {isStreak && <Flame className="h-4 w-4 text-primary" strokeWidth={1.8} />}
                    </span>

                    <span className="shrink-0 rounded-lg border border-hairline bg-card px-3 py-1.5 font-mono text-[12.5px] text-primary">
                      +{row.quest.xp} XP
                    </span>

                    <div className="flex shrink-0 items-center justify-end gap-3 sm:w-[150px]">
                      {row.complete ? (
                        <>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3.4} />
                          </span>
                          <button
                            disabled={row.claimed}
                            onClick={() => claim(row)}
                            className={`h-9 rounded-lg px-5 font-mono text-[13px] ${
                              row.claimed
                                ? "border border-hairline bg-card text-muted-foreground"
                                : "bg-primary text-primary-foreground hover:bg-primary-glow"
                            }`}
                          >
                            {row.claimed ? "Claimed" : "Claim"}
                          </button>
                        </>
                      ) : (
                        <a
                          href={taskHref(row.quest.id)}
                          className="inline-flex items-center gap-2 font-mono text-[13px] text-primary hover:underline"
                        >
                          Open task <ArrowRight className="h-4 w-4" strokeWidth={2} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Weekly challenge */}
          {featured && (
            <div className="mt-3 flex shrink-0 flex-col items-start gap-5 rounded-2xl border border-hairline bg-primary-tint/60 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
              <GraphMasterGlyph />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[13px] text-primary">Weekly challenge</div>
                <div className="mt-1 text-[19px] font-semibold leading-tight text-foreground">
                  {featured.quest.title} — {featured.quest.description.replace(/\.$/, "")}
                </div>
                <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
                  Keep going to finish before the weekly reset.
                </p>
                <div className="mt-2 inline-flex items-center gap-2 font-mono text-[12.5px] text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  Reward: {featured.quest.xp} XP
                </div>
              </div>
              <Ring value={featured.current} total={featured.target} />
              {featured.complete && !featured.claimed ? (
                <button
                  onClick={() => claim(featured)}
                  className="h-12 shrink-0 rounded-xl bg-primary px-7 font-mono text-[14px] text-primary-foreground hover:bg-primary-glow"
                >
                  Claim
                </button>
              ) : (
                <a
                  href={taskHref(featured.quest.id)}
                  className="inline-flex h-12 shrink-0 items-center rounded-xl bg-primary px-7 font-mono text-[14px] text-primary-foreground hover:bg-primary-glow"
                >
                  Continue
                </a>
              )}
            </div>
          )}

          <div className="mt-3 inline-flex shrink-0 items-center gap-2 font-mono text-[13px] text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" strokeWidth={1.8} />
            Streak freezes:{" "}
            <span className="text-foreground">{state.streak.freezesLeft} available</span>
          </div>
        </main>
      </div>
    </div>
  );
}
