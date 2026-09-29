import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, ChevronsLeft, Flame, Search, Menu, Timer } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { AlgoraGlyph } from "@/components/site-chrome";
import { useDueCardCount } from "@/hooks/useProgress";
import { useHydrated } from "@/hooks/useHydrated";
import { progressPct, xpAtLevelStart, xpForLevel } from "@/lib/xp";
import { buildLocalNotifications } from "@/lib/notifications";
import { baselineProgress, useProgressStore } from "@/stores/progressStore";
import { usePrefsStore } from "@/stores/prefsStore";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function useLocalIdentity() {
  const hydrated = useHydrated();
  const storedName = usePrefsStore((state) => state.profile.fullName);
  const displayName = hydrated && storedName.trim() ? storedName.trim() : "Local Learner";
  const words = displayName.split(/\s+/);
  return {
    shortName: `${words[0]} ${words[1]?.[0] ? `${words[1][0]}.` : ""}`.trim(),
    initials: words
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}

function useUnreadNotificationCount(): number {
  const hydrated = useHydrated();
  const progress = useProgressStore((state) => state);
  const readIds = usePrefsStore((state) => state.notificationReadIds);
  return useMemo(() => {
    if (!hydrated) return 0;
    return buildLocalNotifications(progress).filter((item) => !readIds.includes(item.id)).length;
  }, [hydrated, progress, readIds]);
}

/** Streak, XP and level, hydration-safe (pre-hydration falls back to the shared baseline). */
export function useHeaderStats(): { streak: number; xp: number; level: number } {
  const hydrated = useHydrated();
  const streak = useProgressStore((s) => s.streak.current);
  const xp = useProgressStore((s) => s.xp);
  const level = useProgressStore((s) => s.level);
  if (!hydrated) {
    return {
      streak: baselineProgress.streak.current,
      xp: baselineProgress.xp,
      level: baselineProgress.level,
    };
  }
  return { streak, xp, level };
}

const formatXp = (xp: number): string => xp.toLocaleString("en-US");

import { APP_NAV, type AppNavKey } from "@/content/nav";
export type { AppNavKey };

const NAV = APP_NAV.filter((item) => item.inSidebar);

function AppMobileNav() {
  const hydrated = useHydrated();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open app navigation"
          disabled={!hydrated}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-hairline text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-wait disabled:opacity-55 lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(88vw,340px)] overflow-y-auto bg-card p-5">
        <SheetHeader className="border-b border-hairline pb-4 text-left">
          <SheetTitle className="flex items-center gap-2 font-mono text-[20px] font-medium">
            <AlgoraGlyph /> algora
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile app navigation" className="mt-5 space-y-1">
          {NAV.map(({ label, icon: Icon, to }) => (
            <SheetClose asChild key={label}>
              <Link
                to={to}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-mono text-[14px] text-foreground hover:bg-secondary"
              >
                <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.7} />
                {label}
              </Link>
            </SheetClose>
          ))}
          <div className="my-3 border-t border-hairline" />
          <SheetClose asChild>
            <Link
              to="/notifications"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-mono text-[14px] text-foreground hover:bg-secondary"
            >
              <Bell className="h-[18px] w-[18px] text-primary" strokeWidth={1.7} /> Notifications
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/settings"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-mono text-[14px] text-foreground hover:bg-secondary"
            >
              <AlgoraGlyph /> Settings
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function AppSidebar({ active, collapsible }: { active: AppNavKey; collapsible?: boolean }) {
  const { xp, level } = useHeaderStats();
  const { initials, shortName } = useLocalIdentity();
  const dueCount = useDueCardCount();
  const hydrated = useHydrated();
  const sidebarCollapsed = usePrefsStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = usePrefsStore((state) => state.toggleSidebarCollapsed);
  const isCollapsed = Boolean(collapsible && hydrated && sidebarCollapsed);

  const levelStart = xpAtLevelStart(level);
  const levelEnd = xpForLevel(level);
  const pct = progressPct(xp);

  return (
    <aside
      aria-label="Sidebar"
      className={`hidden shrink-0 flex-col border-r border-hairline bg-card transition-[width] duration-200 lg:flex ${
        isCollapsed ? "w-[76px]" : "w-[240px]"
      }`}
    >
      <div className="flex h-[68px] shrink-0 items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <AlgoraGlyph />
          <span
            className={`font-mono text-[22px] font-medium tracking-tight text-foreground ${isCollapsed ? "sr-only" : ""}`}
          >
            algora
          </span>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 pt-2">
        {NAV.map(({ label, icon: Icon, to }) => {
          const isActive = label === active;
          const showDueBadge = label === "Review" && hydrated && dueCount > 0;
          return (
            <Link
              key={label}
              to={to}
              className={[
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-mono text-[14px] transition-colors",
                isActive
                  ? "bg-primary-tint text-primary"
                  : "text-muted-foreground hover:bg-secondary",
              ].join(" ")}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
              <span className={isCollapsed ? "sr-only" : "flex-1"}>{label}</span>
              {showDueBadge && !isCollapsed && (
                <span className="rounded-md bg-primary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-foreground">
                  {dueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className={`rounded-xl border border-hairline bg-card ${isCollapsed ? "p-2" : "p-4"}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-mono text-[12px] text-primary">
              {initials}
            </span>
            <div className={isCollapsed ? "sr-only" : ""}>
              <div className="text-[14px] font-semibold text-foreground">{shortName}</div>
              <div className="font-mono text-[12px] text-muted-foreground">Lvl {level}</div>
            </div>
          </div>
          <div
            className={`${isCollapsed ? "sr-only" : "mt-3"} h-1.5 overflow-hidden rounded-full bg-secondary`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div
            className={`${isCollapsed ? "sr-only" : "mt-2"} font-mono text-[11.5px] text-muted-foreground`}
          >
            {formatXp(xp - levelStart)} / {formatXp(levelEnd - levelStart)} XP
          </div>
        </div>
      </div>

      {collapsible && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            disabled={!hydrated}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-2 py-2 font-sans text-[14px] text-muted-foreground hover:bg-secondary disabled:cursor-wait disabled:opacity-55"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-card">
              <ChevronsLeft
                className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                strokeWidth={1.8}
              />
            </span>
            <span className={isCollapsed ? "sr-only" : ""}>Collapse</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export function AppTopBar({
  title,
  searchValue,
  onSearchChange,
}: {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const { streak, xp } = useHeaderStats();
  const { initials } = useLocalIdentity();
  const hydrated = useHydrated();
  const unreadCount = useUnreadNotificationCount();
  const [cmdOpen, setCmdOpen] = useState(false);

  /* Global ⌘K / Ctrl+K listener */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline bg-card px-3 sm:px-6 lg:gap-6 lg:px-8">
        <AppMobileNav />
        <h2 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-foreground md:flex-none">
          {title}
        </h2>

        <div role="search" className="relative mx-auto hidden w-full max-w-[500px] md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {onSearchChange ? (
            <input
              type="search"
              aria-label="Search algorithms"
              disabled={!hydrated}
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search algorithms, lessons…"
              className="h-11 w-full rounded-xl border border-hairline bg-card pl-11 pr-4 font-mono text-[13.5px] text-foreground placeholder:text-muted-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <button
              onClick={() => setCmdOpen(true)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-hairline bg-card pl-11 pr-4 font-mono text-[13.5px] text-muted-foreground hover:bg-secondary/40"
            >
              Search algorithms, lessons…
              <span className="rounded border border-hairline bg-paper px-1.5 py-0.5 text-[11px]">
                ⌘K
              </span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className="hidden h-10 items-center gap-2 rounded-xl border border-hairline bg-card px-4 font-mono text-[13.5px] text-foreground lg:inline-flex"
            aria-label={`Current streak ${streak} days`}
          >
            <Flame className="h-4 w-4 text-primary" strokeWidth={1.8} /> {streak}
          </span>
          <span className="hidden h-10 items-center rounded-xl border border-hairline bg-card px-4 font-mono text-[13.5px] text-foreground lg:inline-flex">
            {formatXp(xp)} XP
          </span>
          <Link
            to="/notifications"
            className="relative hidden sm:block"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
          <Link
            to="/settings"
            aria-label="Account settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-mono text-[12px] text-primary"
          >
            {initials}
          </Link>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}

export function AppWorkspaceBar({
  crumbs,
  timer,
  xp,
  search,
}: {
  crumbs: string[];
  timer?: string;
  xp?: string;
  search?: boolean;
}) {
  const { initials } = useLocalIdentity();
  const stats = useHeaderStats();
  const unreadCount = useUnreadNotificationCount();
  const xpLabel = xp ?? `${formatXp(stats.xp)} XP`;
  const [cmdOpen, setCmdOpen] = useState(false);

  /* Global ⌘K / Ctrl+K listener */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-hairline bg-card px-3 sm:h-[68px] sm:gap-4 sm:px-6">
        <AppMobileNav />
        <nav
          aria-label="Breadcrumbs"
          className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden font-sans text-[14px] sm:text-[15px]"
        >
          {crumbs.map((c, i) => (
            <span
              key={c}
              className={`${i === crumbs.length - 1 ? "flex min-w-0" : "hidden sm:flex"} items-center gap-3`}
            >
              {i > 0 && <span className="text-muted-foreground">/</span>}
              <span
                className={`${i === crumbs.length - 1 ? "truncate font-medium" : ""} text-foreground`}
              >
                {c}
              </span>
            </span>
          ))}
        </nav>

        {search ? (
          <div role="search" className="relative mx-auto hidden w-full max-w-[460px] md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <button
              onClick={() => setCmdOpen(true)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-hairline bg-card pl-11 pr-4 font-mono text-[13.5px] text-muted-foreground hover:bg-secondary/40"
            >
              Search algorithms, lessons…
              <span className="rounded border border-hairline bg-paper px-1.5 py-0.5 text-[11px]">
                ⌘K
              </span>
            </button>
          </div>
        ) : null}

        <div className={`flex shrink-0 items-center gap-3 ${search ? "" : "ml-auto"}`}>
          {timer && (
            <span className="hidden h-10 items-center gap-2 rounded-xl border border-hairline bg-card px-4 font-mono text-[13.5px] text-foreground sm:inline-flex">
              <Timer className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} /> {timer}
            </span>
          )}
          <span className="hidden h-10 items-center gap-2 rounded-xl border border-hairline bg-card px-4 font-mono text-[13.5px] text-foreground sm:inline-flex">
            <Flame className="h-4 w-4 text-primary" strokeWidth={1.8} /> {stats.streak}
          </span>
          <span className="hidden h-10 items-center rounded-xl border border-hairline bg-card px-4 font-mono text-[13.5px] text-foreground md:inline-flex">
            {xpLabel}
          </span>
          <Link
            to="/notifications"
            className="relative hidden sm:block"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
          <Link
            to="/settings"
            aria-label="Account settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-mono text-[12px] text-primary"
          >
            {initials}
          </Link>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
