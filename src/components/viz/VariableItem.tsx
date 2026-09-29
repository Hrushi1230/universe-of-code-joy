import * as React from "react";
import { cn } from "@/lib/utils";
import type { Variable } from "@/lib/variables";

export interface VariableItemProps {
  variable: Variable;
  className?: string;
}

/**
 * One tracked variable: its lesson-facing label and its value, showing
 * `0 → 5` on the step where it moved. Compact by design — the board is a
 * reference strip, not a hero panel. Pure presentation.
 */
export function VariableItem({ variable, className }: VariableItemProps): React.ReactElement {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-3", className)}>
      <dt className="font-mono text-[12px] text-slate">{variable.label}</dt>
      <dd
        className={cn(
          "flex items-center gap-1 font-mono text-[14px] tabular-nums",
          variable.changed ? "font-semibold text-accent-strong" : "text-ink",
        )}
      >
        <span className="sr-only">{variable.description}</span>
        {variable.previous !== undefined ? (
          <>
            <span aria-hidden="true" className="text-[12px] font-normal text-slate">
              {variable.previous}
            </span>
            <span aria-hidden="true" className="text-[11px] text-slate">
              &rarr;
            </span>
          </>
        ) : null}
        <span aria-hidden="true" key={variable.current} className="viz-swap">
          {variable.current}
        </span>
      </dd>
    </div>
  );
}

export default VariableItem;
