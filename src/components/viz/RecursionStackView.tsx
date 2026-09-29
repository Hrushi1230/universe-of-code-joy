import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CallStackPanel, RecursionState } from "@/engine/types";
import { cn } from "@/lib/utils";

export const RECURSION_VISIBLE_FRAME_LIMIT = 8;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface RecursionStackViewProps {
  panel: CallStackPanel;
  className?: string;
}

const STATE_LABEL: Record<RecursionState, string> = {
  enter: "enter",
  active: "explore",
  return: "return",
  success: "success",
  failure: "failure",
  undo: "undo",
};

const STATE_SURFACE: Record<RecursionState, string> = {
  enter: "border-primary/40 bg-tint/70 text-ink",
  active: "border-accent-strong bg-tint text-accent-strong",
  return: "border-hairline bg-paper text-slate",
  success: "border-accent-strong bg-tint text-accent-strong",
  failure: "border-error/35 bg-error-tint text-error",
  undo: "border-viz-frontier bg-viz-frontier/40 text-viz-frontier-ink",
};

function argsText(frame: CallStackPanel["frames"][number]): string {
  return frame.args.map((arg) => `${arg.name}=${arg.value}`).join(", ");
}

function describe(panel: CallStackPanel, hiddenCount: number): string {
  const calls = panel.frames.map((frame, index) => {
    const detail = frame.choice
      ? ` Choice: ${frame.choice}.`
      : frame.result
        ? ` Result: ${frame.result}.`
        : "";
    return `Depth ${index + 1}: ${frame.call}(${argsText(frame)}), ${STATE_LABEL[frame.state]}.${detail}`;
  });
  const hidden = hiddenCount > 0 ? ` ${hiddenCount} older calls are summarized visually.` : "";
  return `${panel.label}. Call stack depth ${panel.frames.length}. ${calls.join(" ")}${hidden}`;
}

export function RecursionStackView({
  panel,
  className,
}: RecursionStackViewProps): React.ReactElement {
  const reduced = useReducedMotion() ?? false;
  const hiddenCount = Math.max(0, panel.frames.length - RECURSION_VISIBLE_FRAME_LIMIT);
  const visibleFrames = panel.frames.slice(-RECURSION_VISIBLE_FRAME_LIMIT);
  const currentState = panel.frames.at(-1)?.state ?? "return";
  const transition = reduced ? { duration: 0 } : { duration: 0.3, ease: EASE };

  return (
    <section
      aria-label={describe(panel, hiddenCount)}
      data-testid="recursion-call-stack"
      data-entry-count={panel.frames.length}
      data-visible-limit={RECURSION_VISIBLE_FRAME_LIMIT}
      data-hidden-count={hiddenCount}
      data-current-state={panel.frames.at(-1)?.state ?? "empty"}
      data-motion={currentState === "enter" ? "push" : currentState === "undo" ? "undo" : "pop"}
      className={cn(
        "h-[112px] w-full min-w-0 rounded-xl border border-hairline bg-card px-3 py-2.5 font-mono",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
        <span className="truncate font-semibold text-ink">{panel.label}</span>
        <span className="shrink-0 uppercase tracking-[0.16em] text-slate">
          depth {panel.frames.length}
        </span>
      </div>

      {panel.frames.length === 0 ? (
        <p className="flex h-[58px] items-center justify-center rounded-lg border border-dashed border-hairline text-[11px] text-slate">
          no active calls
        </p>
      ) : (
        <ol
          aria-label="Calls from root to current"
          className="flex min-w-0 gap-1.5 overflow-hidden"
        >
          {hiddenCount > 0 ? (
            <li
              aria-label={`${hiddenCount} older calls hidden`}
              className="flex h-[58px] min-w-[68px] items-center justify-center rounded-lg border border-dashed border-hairline px-1 text-center text-[9px] text-slate"
            >
              +{hiddenCount} older
            </li>
          ) : null}
          <AnimatePresence initial={false}>
            {visibleFrames.map((frame, visibleIndex) => {
              const sourceIndex = hiddenCount + visibleIndex;
              const detail = frame.choice ?? frame.result;
              return (
                <motion.li
                  key={frame.id}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: -10, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.94 }}
                  transition={transition}
                  data-state={frame.state}
                  data-depth={sourceIndex + 1}
                  aria-label={`Depth ${sourceIndex + 1}, ${frame.call}, ${argsText(frame)}, ${STATE_LABEL[frame.state]}${detail ? `, ${detail}` : ""}`}
                  className={cn(
                    "relative flex h-[58px] min-w-[68px] max-w-[110px] flex-1 flex-col justify-center rounded-lg border px-1.5 text-center",
                    STATE_SURFACE[frame.state],
                  )}
                >
                  <span className="absolute right-1 top-0.5 text-[8px] uppercase tracking-wide opacity-75">
                    {STATE_LABEL[frame.state]}
                  </span>
                  <span className="truncate pt-1 text-[10px] font-semibold" title={frame.call}>
                    {frame.call}
                  </span>
                  <span className="truncate text-[9px] opacity-80" title={argsText(frame)}>
                    {argsText(frame)}
                  </span>
                  {detail ? (
                    <span className="truncate text-[8px] opacity-75" title={detail}>
                      {frame.choice ? `choose ${detail}` : `→ ${detail}`}
                    </span>
                  ) : null}
                  <span className="sr-only">
                    {sourceIndex === 0 ? "root call" : ""}
                    {sourceIndex === panel.frames.length - 1 ? " current call" : ""}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}

export default RecursionStackView;
