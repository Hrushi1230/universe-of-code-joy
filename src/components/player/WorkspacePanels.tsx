import * as React from "react";
import { ArrowRight, MonitorPlay } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/common/EmptyState";
import { AboutPane } from "@/components/player/AboutPane";
import { CodePane } from "@/components/player/CodePane";
import { ControlStrip } from "@/components/player/ControlStrip";
import { ExplainPane } from "@/components/player/ExplainPane";
import { InputPane } from "@/components/player/InputPane";
import { StepTimeline } from "@/components/player/StepTimeline";
import { ArrayCanvas } from "@/components/viz/ArrayCanvas";
import { FrameView } from "@/components/viz/FrameView";
import type { Algorithm } from "@/content/types";
import type { AlgorithmModule } from "@/engine/types";
import { cn } from "@/lib/utils";
import { useCurrentStep, usePlayerStore } from "@/stores/playerStore";

export { AboutPane, CodePane, ExplainPane, InputPane };

/* ---------------- tabs ---------------- */

export type TabId = "code" | "explain" | "input" | "about";

const TABS: { id: TabId; label: string }[] = [
  { id: "code", label: "Code" },
  { id: "explain", label: "Explain" },
  { id: "input", label: "Input" },
  { id: "about", label: "About" },
];

export interface SidePanelProps {
  algo: Algorithm;
  module: AlgorithmModule | undefined;
  slug: string;
  initialTab: TabId;
  onRun?: (values: Record<string, string>) => void;
  className?: string;
}

export function SidePanel({
  algo,
  module: mod,
  slug,
  initialTab,
  onRun,
  className,
}: SidePanelProps): React.ReactElement {
  const [tab, setTab] = React.useState<TabId>(initialTab);
  const available = TABS.filter((t) => (mod ? true : t.id === "about"));

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-hairline bg-card",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Algorithm details"
        className="flex gap-1 border-b border-hairline px-2 py-2"
      >
        {available.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${slug}-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${slug}-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              tab === t.id ? "bg-tint text-primary" : "text-slate hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${slug}-${tab}`}
        aria-labelledby={`tab-${slug}-${tab}`}
        className="min-h-0 flex-1 overflow-hidden"
      >
        {tab === "code" && <CodePane />}
        {tab === "explain" && <ExplainPane />}
        {tab === "input" && mod && <InputPane module={mod} slug={slug} onRun={onRun} />}
        {tab === "about" && <AboutPane algo={algo} />}
      </div>
    </div>
  );
}

/* ---------------- visual column ---------------- */

export interface VisualStageProps {
  /** Undefined means this slug has no engine module yet. */
  module: AlgorithmModule | undefined;
  algoName: string;
  /** Hide the playback bar when a shared one drives both players. */
  showPlaybackBar?: boolean;
  showScrubber?: boolean;
  minHeightClass?: string;
  className?: string;
}

export function VisualStage({
  module: mod,
  algoName,
  showPlaybackBar = true,
  showScrubber = true,
  minHeightClass = "min-h-[420px]",
  className,
}: VisualStageProps): React.ReactElement {
  const step = useCurrentStep();
  const run = usePlayerStore((s) => s.run);
  const index = usePlayerStore((s) => s.index);

  const frame = step?.frame;

  if (!mod) {
    return (
      <div className="rounded-2xl border border-hairline bg-card shadow-sm">
        <EmptyState
          icon={MonitorPlay}
          title="Visualization coming soon"
          description={`We are still building the step-by-step player for ${algoName}. The About tab has everything else.`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-hairline bg-card shadow-sm relative overflow-hidden",
        className,
      )}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {step ? `Step ${index + 1} of ${run?.steps.length ?? 0}: ${step.narration}` : ""}
      </div>

      {/* Floating Left Panels (Queue/Visited) */}
      <div className="absolute left-6 top-16 flex flex-col gap-4 z-10 pointer-events-none">
        {step?.aux?.map((panel, panelIndex) => {
          if (panel.kind === "queue" || panel.kind === "stack") {
            return (
              <div
                key={`queue-${panelIndex}`}
                className="flex flex-col rounded-xl border border-hairline bg-white/80 p-3 shadow-sm backdrop-blur-sm w-[200px] pointer-events-auto"
              >
                <span className="mb-2 font-mono text-[12px] font-semibold text-ink flex items-center gap-2">
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                  {panel.label}
                </span>
                <span className="font-mono text-[10px] text-slate uppercase mb-1">↑ Front</span>
                <div className="flex gap-2 min-h-[40px] items-center">
                  {panel.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-[#F2DEB4] bg-[#FDF5E6] font-mono text-[14px] text-ink shadow-sm"
                    >
                      {item.label}
                    </motion.div>
                  ))}
                  {panel.items.length === 0 && (
                    <span className="text-slate/50 text-xs italic">Empty</span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate uppercase mt-1">↓ Back</span>
              </div>
            );
          }
          /* Cost of each input item at the current candidate answer, plus the
             total against its budget. Only "binary search the answer" modules
             emit this kind, so no existing visualizer changes. */
          if (panel.kind === "cost") {
            return (
              <div
                key={`cost-${panelIndex}`}
                className="flex flex-col rounded-xl border border-hairline bg-white/80 p-3 shadow-sm backdrop-blur-sm w-[200px] pointer-events-auto"
              >
                <span className="mb-2 font-mono text-[12px] font-semibold text-ink">
                  {panel.label}
                </span>
                <ul className="flex flex-col gap-1">
                  {panel.rows.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-baseline justify-between gap-2 font-mono text-[11px]"
                    >
                      <span className="text-slate">{row.item}</span>
                      <span className="tabular-nums text-ink">{row.cost}</span>
                    </li>
                  ))}
                </ul>
                {panel.total ? (
                  <div className="mt-2 flex flex-col gap-1 border-t border-hairline pt-2 font-mono text-[11px]">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-slate">{panel.total.label}</span>
                      <span
                        className={cn(
                          "tabular-nums font-semibold",
                          panel.total.ok ? "text-primary" : "text-error",
                        )}
                      >
                        {panel.total.value}
                      </span>
                    </span>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-slate">allowed</span>
                      <span className="tabular-nums text-ink">
                        {panel.total.budget}
                        {/* Never colour alone: the verdict carries a glyph too (S7.2). */}
                        <span aria-hidden="true" className="ml-1">
                          {panel.total.ok ? "✓" : "✕"}
                        </span>
                      </span>
                    </span>
                    <span className="sr-only">
                      {panel.total.ok ? "within the budget" : "over the budget"}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          }
          if (panel.kind === "keyvalue" && panel.label === "Visited order") {
            return (
              <div
                key={`visited-${panelIndex}`}
                className="flex flex-col rounded-xl border border-hairline bg-white/80 p-3 shadow-sm backdrop-blur-sm w-[240px] pointer-events-auto mt-2"
              >
                <span className="mb-2 font-mono text-[12px] font-semibold text-ink">
                  Visited order
                </span>
                <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                  {panel.rows.map((row, i) => (
                    <React.Fragment key={row.k}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-tint font-mono text-[11px] text-ink"
                      >
                        {row.v}
                      </motion.div>
                      {i < panel.rows.length - 1 && (
                        <ArrowRight size={12} className="text-primary/40" />
                      )}
                    </React.Fragment>
                  ))}
                  {panel.rows.length === 0 && (
                    <span className="text-slate/50 text-xs italic">None</span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Canvas — the array/graph/grid itself, given the majority of the height */}
      <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 pb-3 pt-5">
        {step ? (
          frame?.kind === "array" ? (
            <ArrayCanvas frame={frame} />
          ) : (
            <FrameView frame={step.frame} className="max-h-full" />
          )
        ) : (
          <p className="t-small text-slate">Preparing the visualization…</p>
        )}
      </div>

      {/* Timeline and one-row control strip */}
      <div className="relative z-20 mt-auto flex shrink-0 flex-col gap-3 border-t border-hairline bg-card px-6 pb-5 pt-4">
        {showScrubber && <StepTimeline />}
        {showPlaybackBar && <ControlStrip />}
      </div>
    </div>
  );
}
