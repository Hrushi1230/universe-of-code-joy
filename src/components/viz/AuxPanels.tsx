import * as React from "react";
import { cn } from "@/lib/utils";
import type { AuxPanel } from "@/engine/types";
import { LinearStructureView } from "@/components/viz/LinearStructureView";
import { RecursionStackView } from "@/components/viz/RecursionStackView";

export interface AuxPanelsProps {
  aux: AuxPanel[] | undefined;
  className?: string;
}

export function AuxPanels({ aux, className }: AuxPanelsProps): React.ReactElement | null {
  if (!aux || aux.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {aux.map((panel, panelIndex) => {
        if (panel.kind === "queue" || panel.kind === "stack") {
          return <LinearStructureView key={`${panel.kind}-${panelIndex}`} panel={panel} />;
        }

        if (panel.kind === "callstack") {
          return <RecursionStackView key={`${panel.kind}-${panelIndex}`} panel={panel} />;
        }

        // For keyvalue (e.g., current node: 1)
        if (panel.kind === "keyvalue") {
          // Flatten into pills
          return (
            <React.Fragment key={`${panel.kind}-${panelIndex}`}>
              {panel.rows.map((row) => (
                <div
                  key={row.k}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-hairline px-4 py-2 font-mono text-[12px]",
                    row.highlight && "bg-tint border-primary",
                  )}
                >
                  <span className="text-slate lowercase">{row.k}:</span>
                  <span className="text-primary">{row.v}</span>
                </div>
              ))}
            </React.Fragment>
          );
        }

        // Log panel is rarely used inline, but if it is, render a simple pill with the latest log
        if (panel.kind === "log") {
          const lastLine = panel.lines[panel.lines.length - 1];
          if (!lastLine) return null;
          return (
            <div
              key={`${panel.kind}-${panelIndex}`}
              className="flex items-center gap-3 rounded-lg border border-hairline px-4 py-2 font-mono text-[12px]"
            >
              <span className="text-slate lowercase">{panel.label}:</span>
              <span className="text-primary truncate max-w-[200px]">{lastLine}</span>
            </div>
          );
        }

        // Cost-per-item evidence stays explicit: the learner can verify every
        // contribution instead of seeing only an unexplained total.
        if (panel.kind === "cost") {
          return (
            <div
              key={`${panel.kind}-${panelIndex}`}
              className="w-full rounded-xl border border-hairline px-4 py-3 font-mono text-[12px]"
            >
              <span className="font-semibold text-ink">{panel.label}</span>
              <ul className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-4">
                {panel.rows.map((row) => (
                  <li key={row.id} className="flex items-baseline justify-between gap-2">
                    <span className="text-slate">{row.item}</span>
                    <span className="tabular-nums text-ink">{row.cost}</span>
                  </li>
                ))}
              </ul>
              {panel.total ? (
                <div className="mt-2 flex items-center justify-end gap-2 border-t border-hairline pt-2 text-ink">
                  <span>{panel.total.label}</span>
                  <span className="font-semibold text-primary">{panel.total.value}</span>
                  <span>
                    / {panel.total.budget} {panel.total.ok ? "✓" : "✕"}
                  </span>
                </div>
              ) : null}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default AuxPanels;
