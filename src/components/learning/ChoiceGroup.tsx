import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Choice<TId extends string = string> {
  id: TId;
  label: string;
}

export interface ChoiceGroupProps<TId extends string = string> {
  /** Radio group name; must be unique per question on the page. */
  name: string;
  /** Element id of the label/heading describing this group. */
  labelledBy: string;
  choices: readonly Choice<TId>[];
  selectedId: TId | null;
  onSelect: (id: TId) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * The accessible option list shared by the Prediction Gate and Trace Mode: a
 * real radio group, keyboard-native, with selection carried by weight and a
 * check glyph rather than colour alone.
 */
export function ChoiceGroup<TId extends string>({
  name,
  labelledBy,
  choices,
  selectedId,
  onSelect,
  disabled = false,
  className,
}: ChoiceGroupProps<TId>): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {choices.map((choice) => {
        const active = selectedId === choice.id;
        return (
          <label
            key={choice.id}
            className={cn(
              "flex min-h-9 items-center gap-2.5 rounded-lg border px-3 py-1.5 transition-colors",
              disabled ? "cursor-default opacity-60" : "cursor-pointer",
              active ? "border-primary bg-tint" : "border-hairline bg-card hover:bg-tint/60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={choice.id}
              checked={active}
              disabled={disabled}
              onChange={() => onSelect(choice.id)}
              className="size-4 shrink-0 accent-[var(--accent-strong)]"
            />
            <span
              className={cn(
                "flex-1 font-mono text-[12px]",
                active ? "font-semibold text-ink" : "text-slate",
              )}
            >
              {choice.label}
            </span>
            {active ? (
              <Check
                aria-hidden="true"
                size={13}
                strokeWidth={2}
                className="shrink-0 text-accent-strong"
              />
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

export default ChoiceGroup;
