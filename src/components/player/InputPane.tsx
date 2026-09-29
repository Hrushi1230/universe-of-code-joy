import * as React from "react";
import { Dices, Play } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { AlgorithmModule, InputField } from "@/engine/types";
import { usePlayerStore } from "@/stores/playerStore";

function randomValue(field: InputField): string {
  switch (field.kind) {
    case "numbers": {
      const count = 8;
      return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 98)).join(", ");
    }
    case "number": {
      const span = field.max - field.min;
      return String(field.min + Math.floor(Math.random() * (span + 1)));
    }
    case "select": {
      const pick = field.options[Math.floor(Math.random() * field.options.length)];
      return String(pick ?? field.default);
    }
    case "text":
      return String(field.default);
    case "graph":
    case "grid":
    default:
      return String(field.default);
  }
}

export interface InputPaneProps {
  module: AlgorithmModule;
  slug: string;
  /** Called instead of the local player when the caller owns loading (compare mode). */
  onRun?: (values: Record<string, string>) => void;
}

export function InputPane({ module: mod, slug, onRun }: InputPaneProps): React.ReactElement {
  const rawInputs = usePlayerStore((s) => s.rawInputs);
  const error = usePlayerStore((s) => s.error);
  const load = usePlayerStore((s) => s.load);
  const [draft, setDraft] = React.useState<Record<string, string>>(rawInputs);

  React.useEffect(() => {
    setDraft(rawInputs);
  }, [rawInputs]);

  const run = React.useCallback(
    (values: Record<string, string>): void => {
      if (onRun) onRun(values);
      else load(slug, values);
    },
    [onRun, load, slug],
  );

  const setField = (name: string, value: string): void =>
    setDraft((d) => ({ ...d, [name]: value }));

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        {mod.presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setDraft(preset.values);
              run(preset.values);
            }}
            className="rounded-full border border-hairline bg-card px-3 py-1 font-mono text-xs text-ink transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mod.inputs.map((field) => {
          const id = `field-${slug}-${field.name}`;
          const value = draft[field.name] ?? String(field.default);
          return (
            <div key={field.name} className="space-y-1.5">
              <label htmlFor={id} className="t-mono-label block">
                {field.label}
              </label>
              {field.kind === "select" ? (
                <select
                  id={id}
                  value={value}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-card px-3 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.kind === "number" ? (
                <input
                  id={id}
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={value}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-card px-3 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              ) : field.kind === "graph" || field.kind === "grid" ? (
                <textarea
                  id={id}
                  rows={3}
                  value={value}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-card px-3 py-2 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  value={value}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-card px-3 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              )}
              {"help" in field && field.help ? (
                <p className="t-small text-slate">{field.help}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error-tint px-3 py-2 font-mono text-xs text-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" leadingIcon={Play} onClick={() => run(draft)}>
          Run
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={Dices}
          onClick={() => {
            const next: Record<string, string> = {};
            for (const field of mod.inputs) next[field.name] = randomValue(field);
            setDraft(next);
            run(next);
          }}
        >
          Randomize
        </Button>
      </div>
    </div>
  );
}

export default InputPane;
