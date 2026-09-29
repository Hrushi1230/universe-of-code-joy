import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listModules, getModule } from "@/engine/registry";
import { useAutoplay } from "@/hooks/useAutoplay";
import { usePlayerKeys } from "@/hooks/usePlayerKeys";
import { usePlayerStore, useCurrentStep } from "@/stores/playerStore";
import { PlaybackBar, StepScrubber, CounterStrip } from "@/components/player";
import { FrameView, AuxPanels } from "@/components/viz";

export const Route = createFileRoute("/dev/engine")({
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound();
  },
  component: DevEngine,
  head: () => ({
    meta: [
      { title: "Engine harness — dev only — Algora" },
      { name: "description", content: "Internal regression harness for algora algorithm modules." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function DevEngine(): React.ReactElement {
  const modules = listModules();
  const [slug, setSlug] = useState<string>(modules[0]?.slug ?? "");
  const [raw, setRaw] = useState<Record<string, string>>(() => defaultsFor(modules[0]?.slug ?? ""));

  const load = usePlayerStore((s) => s.load);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggle = usePlayerStore((s) => s.toggle);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const index = usePlayerStore((s) => s.index);
  const run = usePlayerStore((s) => s.run);
  const error = usePlayerStore((s) => s.error);
  const seek = usePlayerStore((s) => s.seek);
  const step = useCurrentStep();

  useAutoplay();
  usePlayerKeys();

  useEffect(() => {
    load(slug, raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const module = getModule(slug);
  const total = run?.steps.length ?? 0;

  function onSlugChange(nextSlug: string): void {
    setSlug(nextSlug);
    const defaults = defaultsFor(nextSlug);
    setRaw(defaults);
    load(nextSlug, defaults);
  }

  return (
    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>/dev/engine — regression harness</h1>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="dev-slug">module&nbsp;</label>
        <select id="dev-slug" value={slug} onChange={(e) => onSlugChange(e.target.value)}>
          {modules.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.slug}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        {module?.inputs.map((field) => (
          <div key={field.name} style={{ marginBottom: 6 }}>
            <label htmlFor={`dev-${field.name}`}>{field.label}&nbsp;</label>
            <input
              id={`dev-${field.name}`}
              value={raw[field.name] ?? ""}
              onChange={(e) => setRaw((p) => ({ ...p, [field.name]: e.target.value }))}
              style={{ width: 360, border: "1px solid var(--border)", padding: "2px 4px" }}
            />
          </div>
        ))}
        <button type="button" onClick={() => load(slug, raw)}>
          Run
        </button>
      </div>

      {error ? <p style={{ color: "crimson" }}>error: {error}</p> : null}

      <div style={{ margin: "16px 0", maxWidth: 900 }}>
        {step ? <FrameView frame={step.frame} className="mb-3" /> : null}
        {step ? <AuxPanels aux={step.aux} className="mb-3" /> : null}
        <StepScrubber className="mb-3" />
        <CounterStrip className="mb-3" />
        <PlaybackBar />
      </div>

      <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={prev} disabled={index <= 0}>
          Prev
        </button>
        <button type="button" onClick={next} disabled={total === 0 || index >= total - 1}>
          Next
        </button>
        <button type="button" onClick={toggle} disabled={total === 0}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <span>
          step {total === 0 ? 0 : index + 1} of {total}
        </span>
        <input
          aria-label="scrub"
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={index}
          onChange={(e) => seek(Number(e.target.value))}
        />
      </div>

      <p>
        <strong>narration:</strong> {step?.narration ?? "—"}
      </p>
      <p>
        <strong>phase:</strong> {step?.phase ?? "—"} · <strong>codeLine:</strong>{" "}
        {step?.codeLine ?? "—"}
      </p>
      <p>
        <strong>counters:</strong>{" "}
        {step
          ? Object.entries(step.counters)
              .map(([k, v]) => `${k}=${v}`)
              .join("  ") || "none"
          : "—"}
      </p>
      <p>
        <strong>result:</strong> {run?.result ?? "—"}
      </p>

      <pre
        style={{
          background: "var(--muted)",
          border: "1px solid var(--border)",
          padding: 8,
          maxHeight: 460,
          overflow: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {step ? JSON.stringify(step, null, 2) : "no step"}
      </pre>
    </div>
  );
}

function defaultsFor(slug: string): Record<string, string> {
  const mod = getModule(slug);
  if (!mod) return {};
  const out: Record<string, string> = {};
  for (const field of mod.inputs) out[field.name] = String(field.default);
  return out;
}
