import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { StateIcon } from "@/components/viz/StateIcon";
import { FILL, INK, STATE_LABELS } from "@/components/viz/tokens";
import {
  LINEAR_STRUCTURE_VISIBLE_LIMIT,
  linearStructureWindow,
  type LinearStructurePanel,
} from "@/lib/linearStructure";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface LinearStructureViewProps {
  panel: LinearStructurePanel;
  className?: string;
}

function endpointLabel(panel: LinearStructurePanel, sourceIndex: number): string | null {
  const last = panel.items.length - 1;
  if (panel.kind === "stack") {
    if (sourceIndex === 0 && sourceIndex === last) return "bottom · top";
    if (sourceIndex === last) return "top";
    if (sourceIndex === 0) return "bottom";
    return null;
  }

  if (sourceIndex === 0 && sourceIndex === last) return "head · tail";
  if (sourceIndex === 0) return "head";
  if (sourceIndex === last) return "tail";
  return null;
}

function describe(panel: LinearStructurePanel, hiddenCount: number): string {
  const labels = panel.items.map((item) => item.label).join(", ");
  const hidden = hiddenCount > 0 ? ` ${hiddenCount} middle or lower entries are summarized.` : "";
  if (panel.kind === "stack") {
    const top = panel.items.at(-1)?.label ?? "empty";
    return `${panel.label}. Stack with ${panel.items.length} entries, bottom to top: ${labels || "empty"}. Top is ${top}.${hidden}`;
  }

  const head = panel.items[0]?.label ?? "empty";
  const tail = panel.items.at(-1)?.label ?? "empty";
  return `${panel.label}. Queue with ${panel.items.length} entries, head to tail: ${labels || "empty"}. Head is ${head}; tail is ${tail}.${hidden}`;
}

export function LinearStructureView({
  panel,
  className,
}: LinearStructureViewProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false;
  const window = linearStructureWindow(panel);
  const isStack = panel.kind === "stack";
  const initial = reduced
    ? false
    : isStack
      ? { opacity: 0, y: -12, scale: 0.9 }
      : { opacity: 0, x: 18, scale: 0.9 };
  const exit = reduced
    ? { opacity: 0 }
    : isStack
      ? { opacity: 0, y: -12, scale: 0.9 }
      : { opacity: 0, x: -18, scale: 0.9 };
  const transition = reduced ? { duration: 0 } : { duration: 0.35, ease: EASE };

  return (
    <section
      aria-label={describe(panel, window.hiddenCount)}
      data-testid={`${panel.kind}-structure`}
      data-kind={panel.kind}
      data-entry-count={window.totalCount}
      data-visible-limit={LINEAR_STRUCTURE_VISIBLE_LIMIT}
      data-hidden-count={window.hiddenCount}
      data-motion={isStack ? "push-pop" : "enqueue-dequeue"}
      className={cn(
        "min-h-[96px] min-w-0 max-w-full rounded-xl border border-hairline bg-card px-3 py-2.5 font-mono",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
        <span className="truncate font-semibold text-ink">{panel.label}</span>
        <span className="shrink-0 uppercase tracking-[0.16em] text-slate">
          {isStack ? "LIFO" : "FIFO"}
        </span>
      </div>

      {window.totalCount === 0 ? (
        <p className="rounded-lg border border-dashed border-hairline px-3 py-2 text-center text-[11px] text-slate">
          empty
        </p>
      ) : (
        <ol
          aria-label={
            isStack ? "Stack entries from bottom to top" : "Queue entries from head to tail"
          }
          className="flex min-w-0 items-end gap-1.5 overflow-hidden pt-3"
        >
          <AnimatePresence initial={false}>
            {window.entries.map((entry) => {
              if (entry.kind === "summary") {
                return (
                  <li
                    key={`${panel.kind}-summary`}
                    className="flex h-9 min-w-[58px] items-center justify-center rounded-lg border border-dashed border-hairline px-2 text-[10px] text-slate"
                    aria-label={`${entry.hiddenCount} hidden entries`}
                  >
                    {entry.label}
                  </li>
                );
              }

              const state = entry.item.state ?? "idle";
              const endpoint = endpointLabel(panel, entry.sourceIndex);
              return (
                <motion.li
                  key={entry.item.id}
                  layout={!reduced}
                  initial={initial}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={exit}
                  transition={transition}
                  data-state={state}
                  aria-label={`${String(entry.item.label)}${endpoint ? `, ${endpoint}` : ""}, ${STATE_LABELS[state]}`}
                  className="relative flex h-9 min-w-9 max-w-[72px] flex-1 items-center justify-center rounded-lg border border-hairline px-2 text-[12px]"
                  style={{ background: FILL[state], color: INK[state] }}
                  title={String(entry.item.label)}
                >
                  {endpoint ? (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-card px-1 text-[9px] uppercase tracking-wide text-slate">
                      {endpoint}
                    </span>
                  ) : null}
                  {state !== "idle" ? (
                    <span className="mr-1 inline-flex shrink-0" aria-hidden="true">
                      <StateIcon state={state} size={11} color={INK[state]} />
                    </span>
                  ) : null}
                  <span className="truncate">{entry.item.label}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}

export default LinearStructureView;
