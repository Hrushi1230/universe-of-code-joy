import * as React from "react";
import {
  ArrowDownUp,
  Binary,
  CaseSensitive,
  GitBranch,
  Grid3x3,
  Hash,
  Layers,
  Link,
  Mountain,
  Route,
  Rows3,
  Search,
  Sigma,
  Sparkles,
  Target,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { FrameView } from "@/components/viz/FrameView";
import { CATEGORY_META, getAlgorithm } from "@/content/algorithms";
import type { AlgorithmRun } from "@/engine/types";
import { getModule, getModuleForProblem, hasModule, hasModuleForProblem } from "@/engine/registry";
import { cn } from "@/lib/utils";
import { useIsReducedMotion } from "@/hooks/useReducedMotionSync";

export interface AlgorithmThumbnailProps {
  slug: string;
  /**
   * Set on a question card. When this question owns a module, its own run is
   * animated instead of the parent algorithm's — six searching questions share
   * `binary-search` as their algorithm, and showing all six the same plain
   * binary-search animation described none of them.
   */
  problemSlug?: string;
  animateOnHover?: boolean;
  className?: string;
}

/** One computed run per cache key, shared by every card and preserved across remounts. */
const runCache = new Map<string, AlgorithmRun | null>();

function computeRun(slug: string, problemSlug?: string): AlgorithmRun | null {
  const mod = (problemSlug ? getModuleForProblem(problemSlug) : undefined) ?? getModule(slug);
  // Keyed by the module actually chosen, not by the card. The 40-odd questions
  // with no module of their own all fall back to the same parent algorithm, and
  // keying by card slug would recompute and store that one run once per card.
  const key = mod?.slug ?? `none:${problemSlug ?? slug}`;
  if (runCache.has(key)) return runCache.get(key) ?? null;
  let run: AlgorithmRun | null = null;
  try {
    if (mod) {
      const preset = mod.presets[0]?.values ?? {};
      const validated = mod.validate(preset);
      if (validated.ok) run = mod.run(validated.parsed);
    }
  } catch {
    run = null;
  }
  runCache.set(key, run);
  return run;
}

/** At most three thumbnails may animate at once. */
let activeAnimations = 0;
const MAX_CONCURRENT = 3;
const STEP_MS = 450;
const MAX_STEPS = 6;

const categoryIcons: Record<string, LucideIcon> = {
  ArrowDownUp,
  Binary,
  CaseSensitive,
  GitBranch,
  Grid3x3,
  Hash,
  Layers,
  Link,
  Mountain,
  Route,
  Rows3,
  Search,
  Sigma,
  Sparkles,
  Target,
  Waypoints,
};

function CategoryFallback({ slug }: { slug: string }): React.ReactElement {
  const algo = getAlgorithm(slug);
  const iconName = algo ? CATEGORY_META[algo.category].icon : "Sparkles";
  const Icon = categoryIcons[iconName] ?? Sparkles;
  return (
    <div className="flex size-full items-center justify-center rounded-lg bg-tint">
      <Icon size={24} strokeWidth={1.5} className="text-primary" aria-hidden />
    </div>
  );
}

export function AlgorithmThumbnail({
  slug,
  problemSlug,
  animateOnHover = false,
  className,
}: AlgorithmThumbnailProps): React.ReactElement {
  const reducedMotion = useIsReducedMotion();
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [run, setRun] = React.useState<AlgorithmRun | null>(null);
  const [index, setIndex] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);
  const ownsSlotRef = React.useRef(false);

  const runnable = (problemSlug ? hasModuleForProblem(problemSlug) : false) || hasModule(slug);

  /* compute only once the card has been visible */
  React.useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible || !runnable) return;
    setIndex(0);
    setRun(computeRun(slug, problemSlug));
  }, [visible, runnable, slug, problemSlug]);

  const stop = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (ownsSlotRef.current) {
      activeAnimations = Math.max(0, activeAnimations - 1);
      ownsSlotRef.current = false;
    }
  }, []);

  const start = React.useCallback(() => {
    if (!animateOnHover || reducedMotion || !run || rafRef.current !== null) return;
    if (activeAnimations >= MAX_CONCURRENT) return;
    activeAnimations += 1;
    ownsSlotRef.current = true;
    const total = Math.min(MAX_STEPS, Math.max(0, run.steps.length - 1));
    const startedAt = performance.now();
    const tick = (now: number): void => {
      const target = Math.min(total, Math.floor((now - startedAt) / STEP_MS));
      setIndex(target);
      if (target >= total) {
        rafRef.current = null;
        if (ownsSlotRef.current) {
          activeAnimations = Math.max(0, activeAnimations - 1);
          ownsSlotRef.current = false;
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [animateOnHover, reducedMotion, run]);

  const reset = React.useCallback(() => {
    stop();
    setIndex(0);
  }, [stop]);

  React.useEffect(() => stop, [stop]);

  const frame = run?.steps[Math.min(index, Math.max(0, run.steps.length - 1))]?.frame;

  return (
    <div
      ref={hostRef}
      aria-hidden
      onMouseEnter={start}
      onMouseLeave={reset}
      onFocus={start}
      onBlur={reset}
      className={cn(
        "relative aspect-[16/9] min-h-[120px] w-full overflow-hidden rounded-lg bg-card",
        className,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center p-2">
        {frame ? (
          <FrameView frame={frame} className="max-h-full w-full" />
        ) : (
          <CategoryFallback slug={slug} />
        )}
      </div>
    </div>
  );
}

export default AlgorithmThumbnail;
