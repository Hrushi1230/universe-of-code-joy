import type { ArrayFrame } from "@/engine/types";
import { cn } from "@/lib/utils";

/** The engine owns water amounts. This scene only draws the current snapshot. */
export function RainWaterView({
  frame,
  className,
  revealDecision = true,
}: {
  frame: ArrayFrame;
  className?: string;
  revealDecision?: boolean;
}) {
  const scene = frame.rainWater;
  if (!scene) return null;
  const heights = frame.values.map(Number);
  const ceiling = Math.max(1, ...heights);
  const left = frame.pointers.find((p) => p.name === "left")?.index ?? 0;
  const right = frame.pointers.find((p) => p.name === "right")?.index ?? heights.length - 1;
  const active = scene.activeIndex;
  const total = scene.depths.reduce((sum, depth) => sum + depth, 0);
  const ticks = [...new Set([0, Math.ceil(ceiling / 2), ceiling])];
  const summary = `Elevation heights ${heights.join(", ")}. Water depths ${scene.depths.join(", ")}. Total trapped water ${total}. Left at ${left}, maximum ${scene.leftMax}; right at ${right}, maximum ${scene.rightMax}.`;

  return (
    <div data-testid="rain-water-scene" className={cn("rain-water-scene", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate">ELEVATION / WATER</span>
        <output className="rounded-full border border-primary/20 bg-tint px-3 py-1 font-mono text-xs text-primary">
          trapped water = {total}
        </output>
      </div>
      <div className="flex justify-between gap-2 font-mono text-xs">
        <span className="text-primary">
          L {left} · max {scene.leftMax}
        </span>
        <span className="text-warning">
          R {right} · max {scene.rightMax}
        </span>
      </div>
      <div role="img" aria-label={summary} className="rain-water-plot">
        <div aria-hidden="true" className="rain-water-axis">
          {ticks.map((tick) => (
            <span key={tick} style={{ bottom: `${(tick / ceiling) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="rain-water-columns"
          style={{ gridTemplateColumns: `repeat(${heights.length}, minmax(0, 1fr))` }}
        >
          {heights.map((height, index) => {
            const depth = scene.depths[index] ?? 0;
            return (
              <div
                key={index}
                data-testid="elevation-column"
                data-height={height}
                data-water={depth}
                className={cn("rain-water-column", active === index && "rain-water-active")}
              >
                <div
                  className="rain-water-ground"
                  style={{ height: `${(height / ceiling) * 100}%` }}
                />
                <div
                  className="rain-water-fill"
                  style={{
                    bottom: `${(height / ceiling) * 100}%`,
                    height: `${(depth / ceiling) * 100}%`,
                  }}
                >
                  {depth > 0 && <span>{depth}</span>}
                </div>
                <span className="rain-water-index">{index}</span>
              </div>
            );
          })}
          {frame.pointers.map((pointer, lane) => (
            <span
              key={pointer.name}
              className={cn("rain-water-pointer", lane === 0 ? "text-primary" : "text-warning")}
              style={{
                left: `${((pointer.index + 0.5) / heights.length) * 100}%`,
                bottom: `${-48 - lane * 20}px`,
              }}
            >
              ↑ {lane === 0 ? "L" : "R"}
            </span>
          ))}
        </div>
      </div>
      <div className="rain-water-caption font-sans text-sm text-ink">
        {scene.done
          ? `${total} units trapped. Every column is resolved.`
          : active !== undefined
            ? `Bar ${active}: ${heights[active]! + scene.added} − ${heights[active]} = ${scene.added} water units.`
            : frame.comparison && revealDecision
              ? `Compare ${scene.leftMax} and ${scene.rightMax}: ${frame.comparison.verdict}.`
              : "Water is counted only when both sides guarantee a boundary."}
      </div>
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-5 font-mono text-xs text-slate"
      >
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 bg-slate" />
          Terrain
        </span>
        <span className="flex items-center gap-2">
          <i className="rain-water-swatch" />
          Water · units per bar
        </span>
      </div>
    </div>
  );
}
