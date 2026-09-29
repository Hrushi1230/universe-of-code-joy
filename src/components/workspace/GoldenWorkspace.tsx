import * as React from "react";
import { AboutPane } from "@/components/player/AboutPane";
import { CodePane } from "@/components/player/CodePane";
import { ExplainPane } from "@/components/player/ExplainPane";
import { InputPane } from "@/components/player/InputPane";
import { AlgorithmWorldPanel } from "@/components/workspace/AlgorithmWorldPanel";
import { PlaybackBand } from "@/components/workspace/PlaybackBand";
import type { Algorithm } from "@/content/types";
import type { AlgorithmModule } from "@/engine/types";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePredictionGate } from "@/hooks/usePredictionGate";
import { PredictionGate } from "@/components/player/PredictionGate";

type RightTab = "code" | "input" | "about";

const TABS: Array<{ id: RightTab; label: string }> = [
  { id: "code", label: "Code" },
  { id: "input", label: "Input" },
  { id: "about", label: "About" },
];

function RightColumn({
  algo,
  module: mod,
  slug,
}: {
  algo: Algorithm;
  module: AlgorithmModule | undefined;
  slug: string;
}): React.ReactElement {
  const [tab, setTab] = React.useState<RightTab>("code");
  const tabs = TABS.filter((t) => t.id !== "input" || mod);

  return (
    <div className="flex min-h-[620px] w-full min-w-0 flex-col gap-4 lg:h-full lg:min-h-0">
      <div className="flex min-h-0 flex-[55] flex-col overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm">
        <div
          role="tablist"
          aria-label="Code and settings"
          className="flex gap-1 border-b border-hairline px-3 py-2"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`golden-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`golden-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                tab === t.id ? "bg-tint font-semibold text-primary" : "text-slate hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`golden-panel-${tab}`}
          aria-labelledby={`golden-tab-${tab}`}
          className="min-h-0 flex-1 overflow-hidden"
        >
          {tab === "code" && (
            <CodePane hideTitle className="h-full rounded-none border-0 shadow-none" />
          )}
          {tab === "input" && mod && <InputPane module={mod} slug={slug} />}
          {tab === "about" && <AboutPane algo={algo} />}
        </div>
      </div>

      <ExplainPane className="flex min-h-0 flex-[45] flex-col rounded-2xl border border-hairline bg-card shadow-sm" />
    </div>
  );
}

export interface GoldenWorkspaceProps {
  algo: Algorithm;
  module: AlgorithmModule | undefined;
  /** Slug the player store loaded — a question's slug when one drives the canvas. */
  slug: string;
  className?: string;
}

/**
 * The Golden Visualizer shell: Algorithm World on the left (~58%), code and
 * reasoning on the right (~42%), with the playback band spanning both columns.
 */
export function GoldenWorkspace({
  algo,
  module: mod,
  slug,
  className,
}: GoldenWorkspaceProps): React.ReactElement {
  // Opt in question-by-question after verifying each scene at phone size.
  const focused = slug === "trapping-rain-water";
  const compact = useIsMobile(1024) && focused;
  const { prediction, entry, showGate } = usePredictionGate();
  return (
    <div
      className={cn(
        "grid flex-1 grid-cols-1 gap-3 lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_58px]",
        focused && "focused-workspace",
        className,
      )}
    >
      <div
        className={cn(
          "contents lg:grid lg:min-h-0 lg:overflow-hidden lg:grid-cols-[58fr_42fr] lg:gap-4",
          focused && "focused-world-row",
        )}
      >
        <AlgorithmWorldPanel
          module={mod}
          algoName={algo.name}
          className="order-1 min-h-[430px] lg:order-none lg:min-h-0"
        />
        {compact && showGate && prediction ? (
          <div className="focused-prediction">
            <PredictionGate prediction={prediction} entry={entry} />
          </div>
        ) : null}
        {!compact && (
          <div
            className={cn(
              "order-3 min-w-0 lg:order-none lg:h-full lg:min-h-0 lg:overflow-hidden",
              focused && "focused-code-column",
            )}
          >
            <RightColumn algo={algo} module={mod} slug={slug} />
          </div>
        )}
      </div>
      {mod ? <PlaybackBand className="order-2 lg:order-none" /> : null}
    </div>
  );
}

export default GoldenWorkspace;
