import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Live region announcements with aria-atomic (Criterion S7.5)", () => {
  describe("ExplainPane accessibility contracts", () => {
    const panelsPath = path.resolve(process.cwd(), "src/components/player/ExplainPane.tsx");
    const panelsContent = fs.readFileSync(panelsPath, "utf-8");

    it("keeps ExplainPane's empty state readable without adding a competing live region", () => {
      expect(panelsContent).toContain("Run the algorithm to see the explanation.");
      expect(panelsContent).not.toContain('aria-live="polite"');
    });

    it("keeps the reasoning body a fixed non-scrolling flex child", () => {
      expect(panelsContent).toContain("min-h-0 flex-1 space-y-2.5 overflow-hidden");
      expect(panelsContent).not.toContain("overflow-y-auto");
    });

    it("verifies VisualStage provides an accessible polite live region for cross-tab announcements", () => {
      const workspacePanelsPath = path.resolve(
        process.cwd(),
        "src/components/player/WorkspacePanels.tsx",
      );
      const workspacePanelsContent = fs.readFileSync(workspacePanelsPath, "utf-8");
      expect(workspacePanelsContent).toContain(
        '<div className="sr-only" aria-live="polite" aria-atomic="true">',
      );
    });
  });

  describe("StepCounter accessibility contracts", () => {
    const counterPath = path.resolve(process.cwd(), "src/components/player/StepCounter.tsx");
    const counterContent = fs.readFileSync(counterPath, "utf-8");

    it("verifies StepCounter defines both aria-live='polite' and aria-atomic='true'", () => {
      expect(counterContent).toContain('aria-live="polite"');
      expect(counterContent).toContain('aria-atomic="true"');
    });
  });
});
