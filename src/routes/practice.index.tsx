import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Code2,
  Filter,
  Search,
  Zap,
  Target,
  Trophy,
  ArrowRight,
  Circle,
  Play,
  Lock,
} from "lucide-react";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { fetchProblems } from "@/content/problems";
import type { Problem } from "@/data/types";
import { getAlgorithm } from "@/content/algorithms";
import { useHydrated } from "@/hooks/useHydrated";
import { useProgressStore, type ProgressData } from "@/stores/progressStore";

export const Route = createFileRoute("/practice/")({
  loader: async () => {
    const problems = await fetchProblems();
    return { problems };
  },
  head: () => ({
    meta: [
      { title: "Practice Challenges — Algora" },
      {
        name: "description",
        content: "Master algorithms by solving curated coding challenges in our live editor.",
      },
    ],
  }),
  component: PracticeIndexPage,
});

const DIFFICULTY_CLASS: Record<Problem["difficulty"], string> = {
  easy: "border-primary bg-primary-tint text-primary",
  medium: "border-warning bg-warning-tint text-warning",
  hard: "border-destructive bg-destructive/10 text-destructive",
};

const DIFFICULTY_COLORS: Record<Problem["difficulty"], string> = {
  easy: "text-primary",
  medium: "text-warning",
  hard: "text-destructive",
};

function PracticeIndexPage() {
  const { problems } = Route.useLoaderData();
  const hydrated = useHydrated();
  const navigate = useNavigate();

  // Sort problems by ID or Difficulty. For now, default order from catalog.
  const storedProblems = useProgressStore((s) => s.problems);

  // Derive stats
  const total = problems.length;
  const solvedCount = hydrated
    ? problems.filter((p) => storedProblems[p.slug]?.solvedAt).length
    : 0;
  const progressPct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  const easyCount = problems.filter((p) => p.difficulty === "easy").length;
  const mediumCount = problems.filter((p) => p.difficulty === "medium").length;
  const hardCount = problems.filter((p) => p.difficulty === "hard").length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar active="Practice" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Practice"]} />

        <main tabIndex={0} className="flex-1 overflow-y-auto bg-paper px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-[1000px]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent-strong/20 bg-tint px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-accent-strong uppercase mb-4">
                  <Code2 size={12} strokeWidth={2} /> Challenge Library
                </div>
                <h1 className="font-display text-[32px] sm:text-[40px] font-semibold text-ink leading-tight tracking-tight">
                  Practice Problems
                </h1>
                <p className="mt-2 max-w-[540px] font-sans text-[15px] leading-relaxed text-slate">
                  Test your understanding by solving curated coding challenges. Every problem
                  includes hints, live test cases, and instant XP rewards.
                </p>
              </div>

              {/* Stats Card */}
              <div className="rounded-2xl border border-hairline bg-card p-5 shadow-sm min-w-[240px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-sans text-[13px] font-medium text-slate">Completion</span>
                  <span className="font-mono text-[13px] font-bold text-ink">
                    {solvedCount} / {total}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-hairline">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-accent-strong transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-slate-soft border-t border-hairline pt-4">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary" /> {easyCount} Easy
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-warning" /> {mediumCount} Med
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-destructive" /> {hardCount} Hard
                  </span>
                </div>
              </div>
            </div>

            {/* Problem Table */}
            <div className="rounded-2xl border border-hairline bg-card shadow-1 overflow-hidden">
              <div
                tabIndex={0}
                role="region"
                aria-label="Practice question table"
                className="overflow-x-auto"
              >
                <table className="w-full text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-paper/50">
                      <th className="px-6 py-4 font-medium text-slate-soft w-[60px] text-center">
                        Status
                      </th>
                      <th className="px-6 py-4 font-medium text-slate-soft">Title</th>
                      <th className="px-6 py-4 font-medium text-slate-soft">Algorithm</th>
                      <th className="px-6 py-4 font-medium text-slate-soft">Difficulty</th>
                      <th className="px-6 py-4 font-medium text-slate-soft text-right">Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {problems.map((problem) => {
                      const isSolved = hydrated && !!storedProblems[problem.slug]?.solvedAt;
                      const algo = getAlgorithm(problem.algorithmSlug);

                      return (
                        <tr
                          key={problem.slug}
                          onClick={() =>
                            navigate({ to: "/practice/$slug", params: { slug: problem.slug } })
                          }
                          className="group cursor-pointer bg-card transition-colors hover:bg-paper"
                        >
                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              {isSolved ? (
                                <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full border border-hairline bg-transparent text-slate-soft group-hover:border-slate group-hover:text-slate transition-colors">
                                  <Circle size={10} strokeWidth={2} className="opacity-40" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Title */}
                          <td className="px-6 py-4">
                            <div className="font-medium text-ink transition-colors group-hover:text-accent-strong">
                              {problem.title}
                            </div>
                          </td>

                          {/* Algorithm Category */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-slate group-hover:text-ink transition-colors">
                              {algo?.name || problem.algorithmSlug}
                            </span>
                          </td>

                          {/* Difficulty */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] capitalize ${DIFFICULTY_CLASS[problem.difficulty]}`}
                            >
                              {problem.difficulty}
                            </span>
                          </td>

                          {/* Reward / XP */}
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center justify-end gap-1 font-mono text-[12px] font-semibold text-highlight">
                              +{problem.xp}{" "}
                              <span className="text-slate-soft font-normal text-[10px]">XP</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 text-center text-slate-soft font-sans text-[13px] pb-12">
              Showing all {problems.length} practice challenges.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
