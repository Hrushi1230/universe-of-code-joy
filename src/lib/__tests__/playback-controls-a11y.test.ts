import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Playback Controls Accessible Names Audit (WCAG 2.1 SC 4.1.2 & SC 1.1.1)", () => {
  const srcDir = path.resolve(__dirname, "../../");

  it("ensures PlaybackBar has accessible names and keyboard shortcut hints on all buttons", () => {
    const playbackBarPath = path.join(srcDir, "components", "player", "PlaybackBar.tsx");
    const content = fs.readFileSync(playbackBarPath, "utf-8");

    // Verify IconButton template enforces `label (shortcut)`
    expect(content).toContain("aria-label={`${label} (${shortcut})`}");

    // Verify Play/Pause button has aria-label with shortcut
    expect(content).toContain(
      'aria-label={`${isPlaying ? "Pause" : isEnded ? "Replay" : "Play"} (Space)`}',
    );

    // Verify all control buttons with their respective shortcuts exist
    const expectedControls = [
      { label: "First step", shortcut: "Home" },
      { label: "Previous step", shortcut: "←" },
      { label: "Next step", shortcut: "→" },
      { label: "Last step", shortcut: "End" },
    ];

    for (const ctrl of expectedControls) {
      expect(content).toContain(`label="${ctrl.label}"`);
      expect(content).toContain(`shortcut="${ctrl.shortcut}"`);
    }
  });

  it("ensures SpeedControl implements an accessible radiogroup with labelled speed options", () => {
    const speedControlPath = path.join(srcDir, "components", "player", "SpeedControl.tsx");
    const content = fs.readFileSync(speedControlPath, "utf-8");

    expect(content).toContain('role="radiogroup"');
    expect(content).toContain('aria-label="Playback speed"');
    expect(content).toContain('role="radio"');
    expect(content).toContain("aria-checked={active}");
    expect(content).toContain("aria-label={`Speed ${value}x`}");
  });

  it("ensures StepScrubber implements a fully-annotated slider with accessible name and values", () => {
    const stepScrubberPath = path.join(srcDir, "components", "player", "StepScrubber.tsx");
    const content = fs.readFileSync(stepScrubberPath, "utf-8");

    expect(content).toContain('role="slider"');
    expect(content).toContain("tabIndex={0}");
    expect(content).toContain('aria-label="Algorithm step"');
    expect(content).toContain("aria-valuemin={0}");
    expect(content).toContain("aria-valuemax={max}");
    expect(content).toContain("aria-valuenow={index}");
    expect(content).toContain("aria-valuetext={narration}");
  });

  it("ensures CodePane provides descriptive accessible labels on language select dropdown", () => {
    const codePanePath = path.join(srcDir, "components", "player", "CodePane.tsx");
    const content = fs.readFileSync(codePanePath, "utf-8");

    expect(content).toContain('name: "JavaScript"');
    expect(content).toContain('name: "TypeScript"');
    expect(content).toContain('name: "Python"');
    expect(content).toContain("<select");
    expect(content).toContain("value={language}");
  });

  it("ensures landing page interactive player preview buttons have accessible names matching their actions", () => {
    const indexPath = path.join(srcDir, "routes", "index.tsx");
    const content = fs.readFileSync(indexPath, "utf-8");

    expect(content).toContain('aria-label="Pause traversal"');
    expect(content).toContain('aria-label="Play traversal"');
    expect(content).toContain('aria-label="Next traversal step"');
    expect(content).toContain('aria-label="Replay traversal"');
  });
});
