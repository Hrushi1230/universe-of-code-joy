import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  CalendarDays,
  Check,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  Gem,
  GitBranch,
  GraduationCap,
  Hash,
  Lock,
  Milestone,
  Moon,
  Puzzle,
  Rocket,
  ScrollText,
  Snowflake,
  Star,
  Sunrise,
  Swords,
  Trophy,
  Waypoints,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { DemoNotice } from "@/components/demo-notice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useHydrated from "@/hooks/useHydrated";
import { evaluateAchievements, type AchievementState } from "@/lib/achievements";
import { baselineProgress, useProgressStore } from "@/stores/progressStore";

export const Route = createFileRoute("/achievements")({
  component: Achievements,
  head: () => ({
    meta: [
      { title: "Achievements & rewards — badge progress — Algora" },
      {
        name: "description",
        content:
          "Track your algorithm badges: earned, in progress and locked. Spend XP in the rewards shop on streak freezes, themes and hint packs.",
      },
      { property: "og:title", content: "Achievements & rewards — badge progress — Algora" },
      {
        property: "og:description",
        content: "Earn badges for streaks, graph mastery and speed — then spend XP on perks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ICONS: Record<string, LucideIcon> = {
  Footprints,
  BookOpen,
  GraduationCap,
  Crown,
  Swords,
  Puzzle,
  Dumbbell,
  Gem,
  Zap,
  Flame,
  CalendarCheck,
  Rocket,
  Waypoints,
  ArrowDownUp,
  GitBranch,
  Hash,
  Milestone,
  Trophy,
  Brain,
  Moon,
  Sunrise,
  ScrollText,
  CalendarDays,
  Star,
};

const TIERS = ["All tiers", "bronze", "silver", "gold", "platinum"] as const;
type Tier = (typeof TIERS)[number];
type Filter = "All" | "Earned" | "In progress" | "Locked";

function Crest({ icon: Icon, muted }: { icon: LucideIcon; muted?: boolean }) {
  const stroke = muted ? "var(--slate-soft)" : "var(--primary)";
  return (
    <span className="relative flex h-[62px] w-[56px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 62" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M28 2 52 15.5v31L28 60 4 46.5v-31z"
          fill={muted ? "var(--muted)" : "var(--card)"}
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
      <Icon
        className={`relative h-6 w-6 ${muted ? "text-slate-soft" : "text-primary"}`}
        strokeWidth={1.7}
      />
    </span>
  );
}

const SHOP = [
  {
    id: "freeze",
    icon: Snowflake,
    name: "Streak Freeze",
    desc: "Protect your streak for one day.",
    price: 200,
  },
];

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });

function Achievements() {
  const hydrated = useHydrated();
  const live = useProgressStore((s) => s);
  const state = hydrated ? live : baselineProgress;
  const unlockAchievementReward = useProgressStore((s) => s.unlockAchievementReward);
  const redeemReward = useProgressStore((s) => s.redeemReward);

  const [filter, setFilter] = useState<Filter>("All");
  const [tier, setTier] = useState<Tier>("All tiers");
  const [purchase, setPurchase] = useState<{
    item: (typeof SHOP)[number];
    transactionId: string;
  } | null>(null);

  const all = useMemo(() => evaluateAchievements(state), [state]);

  // Record freshly earned badges once, awarding their XP and toasting the unlock.
  const announced = useRef(false);
  useEffect(() => {
    if (!hydrated || announced.current) return;
    announced.current = true;
    const fresh = evaluateAchievements(useProgressStore.getState()).filter(
      (a) => a.unlocked && !a.unlockedAt,
    );
    for (const a of fresh) {
      if (unlockAchievementReward(a.achievement.id, 100, a.achievement.xp)) {
        toast.success(`Badge unlocked — ${a.achievement.name}`, {
          description: `${a.achievement.description} +${a.achievement.xp} XP`,
        });
      }
    }
  }, [hydrated, unlockAchievementReward]);

  const earned = all.filter((a) => a.unlocked).length;
  const pct = all.length === 0 ? 0 : Math.round((earned / all.length) * 100);

  const rank = (a: AchievementState): number => (a.unlocked ? 0 : a.pct > 0 ? 1 : 2);

  const visible = all
    .filter((a) => (tier === "All tiers" ? true : a.achievement.tier === tier))
    .filter((a) => {
      if (filter === "Earned") return a.unlocked;
      if (filter === "In progress") return !a.unlocked && a.pct > 0;
      if (filter === "Locked") return !a.unlocked && a.pct === 0;
      return true;
    })
    .sort((a, b) => rank(a) - rank(b) || b.pct - a.pct);

  const requestRedeem = (item: (typeof SHOP)[number]) => {
    setPurchase({ item, transactionId: `shop:${item.id}:${Date.now()}` });
  };

  const confirmRedeem = () => {
    if (!purchase) return;
    const redeemed = redeemReward(purchase.transactionId, purchase.item.id, purchase.item.price, 1);
    if (redeemed) {
      toast.success(`${purchase.item.name} redeemed`, {
        description: `${purchase.item.price} XP spent. One freeze was added locally.`,
      });
    } else {
      toast.error("Reward was not redeemed", {
        description: "Check your XP balance and freeze limit, then try again.",
      });
    }
    setPurchase(null);
  };

  return (
    <div className="flex min-h-screen w-full bg-background lg:h-screen lg:overflow-hidden">
      <AppSidebar active="Achievements" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={[]} search />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8">
          <div className="flex shrink-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-8">
            <div>
              <h1 className="text-[28px] font-semibold leading-none tracking-tight text-foreground">
                Achievements
              </h1>
              <p className="mt-2 font-mono text-[13px] text-muted-foreground">
                {earned} of {all.length} badges earned. Keep going.
              </p>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-[420px]">
              <span className="font-mono text-[13px] text-primary">{pct}%</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <DemoNotice>
              Badge criteria, XP, and streak freezes use progress stored on this device. Rewards are
              not server-verified yet.
            </DemoNotice>
          </div>

          <div className="mt-3.5 flex shrink-0 flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-hairline bg-card sm:flex">
              {(["All", "Earned", "In progress", "Locked"] as Filter[]).map((t, i) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  aria-pressed={filter === t}
                  className={`h-10 px-6 font-mono text-[13px] transition-colors ${
                    i > 0 ? "border-l border-hairline" : ""
                  } ${
                    filter === t
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
              Tier
              <select
                value={tier}
                onChange={(event) => setTier(event.target.value as Tier)}
                className="h-10 rounded-xl border border-hairline bg-card px-3 font-mono text-[13px] capitalize text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint"
              >
                {TIERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="mt-3.5 rounded-2xl border border-hairline bg-card px-5 py-10 text-center font-mono text-[13px] text-muted-foreground">
              No badges match these filters.
            </div>
          ) : (
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {visible.map((a) => {
                const locked = !a.unlocked && a.pct === 0;
                const Icon = ICONS[a.achievement.icon] ?? Trophy;
                return (
                  <div
                    key={a.achievement.id}
                    className={`relative flex min-h-0 flex-col rounded-2xl border p-4 ${
                      a.unlocked
                        ? "border-primary/25 bg-primary-tint/40"
                        : locked
                          ? "border-hairline bg-paper"
                          : "border-hairline bg-card"
                    }`}
                  >
                    {locked && (
                      <Lock
                        className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-muted-foreground"
                        strokeWidth={1.9}
                      />
                    )}
                    <div className="flex gap-3.5">
                      <Crest icon={Icon} muted={locked} />
                      <div className="min-w-0 pt-1">
                        <div className="text-[14.5px] font-semibold leading-tight text-foreground">
                          {a.achievement.name}
                        </div>
                        <p className="mt-1 font-mono text-[11.5px] leading-[1.5] text-muted-foreground">
                          {a.achievement.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-3">
                      {a.unlocked && (
                        <span className="inline-flex items-center gap-2 font-mono text-[12px] text-primary">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                          {a.unlockedAt ? `Earned ${formatDate(a.unlockedAt)}` : "Earned"}
                        </span>
                      )}
                      {!a.unlocked && !locked && (
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${a.pct}%` }}
                            />
                          </div>
                          <span className="shrink-0 font-mono text-[12px] text-foreground">
                            {a.current} / {a.target}
                          </span>
                        </div>
                      )}
                      {locked && (
                        <span className="inline-flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" strokeWidth={1.9} />
                          {a.achievement.criteria}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rewards shop */}
          <div className="mt-3.5 flex shrink-0 flex-col items-stretch gap-4 rounded-2xl border border-hairline bg-primary-tint/50 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="w-[150px] shrink-0">
              <div className="text-[17px] font-semibold leading-tight text-foreground">
                Rewards shop
              </div>
              <p className="mt-1 font-mono text-[12px] text-muted-foreground">Spend XP on perks</p>
            </div>

            {SHOP.map((item) => (
              <div
                key={item.name}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-hairline bg-card px-3.5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-primary-tint/60">
                  <item.icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold leading-tight text-foreground">
                    {item.name}
                  </div>
                  <p className="mt-0.5 font-mono text-[11.5px] leading-[1.45] text-muted-foreground">
                    {item.desc}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="whitespace-nowrap font-mono text-[12.5px] text-primary">
                      {item.price} XP
                    </span>
                    <button
                      onClick={() => requestRedeem(item)}
                      disabled={!hydrated || state.xp < item.price || state.streak.freezesLeft >= 9}
                      className="h-7 rounded-lg bg-primary px-3 font-mono text-[12px] text-primary-foreground hover:bg-primary-glow disabled:opacity-45"
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="shrink-0 text-left sm:ml-auto sm:w-[190px] sm:text-right">
              <div className="font-mono text-[13px] text-foreground">
                Balance: <span className="text-primary">{state.xp.toLocaleString("en-US")} XP</span>
              </div>
              <span className="mt-2 inline-flex items-center gap-2 font-mono text-[12.5px] text-primary">
                Freezes: {state.streak.freezesLeft}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
          </div>

          <AlertDialog open={Boolean(purchase)} onOpenChange={(open) => !open && setPurchase(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Redeem one streak freeze?</AlertDialogTitle>
                <AlertDialogDescription>
                  This spends {purchase?.item.price ?? 0} XP from this device and adds one streak
                  freeze. This local action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep XP</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRedeem}>Spend XP</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
