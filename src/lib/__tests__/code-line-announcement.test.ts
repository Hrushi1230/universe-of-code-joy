import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { listModules } from "@/engine/registry";

describe("Code line screen reader announcements with aria-current='step' (Criterion S7.6)", () => {
  describe("CodePane contracts", () => {
    const panelsPath = path.resolve(process.cwd(), "src/components/player/CodePane.tsx");
    const panelsContent = fs.readFileSync(panelsPath, "utf-8");

    it("verifies CodePane applies aria-current='step' to the active code line", () => {
      expect(panelsContent).toContain('aria-current={isActive ? "step" : undefined}');
    });
  });

  describe("Homepage code demo contracts in index.tsx", () => {
    const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
    const indexContent = fs.readFileSync(indexPath, "utf-8");

    it("verifies homepage hero BFS demo applies aria-current='step' to highlighted row", () => {
      expect(indexContent).toContain(
        'aria-current={activeStep.codeLines.includes(row.n) ? "step" : undefined}',
      );
    });
  });

  describe("Engine codeLine alignment across all algorithm modules and presets", () => {
    it("ensures every step in every algorithm module has a valid 1-based codeLine within bounds", () => {
      const allModules = listModules();
      expect(allModules.length).toBe(13);

      for (const mod of allModules) {
        expect(mod.presets.length).toBeGreaterThan(0);
        for (const preset of mod.presets) {
          const validation = mod.validate(preset.values);
          expect(validation.ok, `validation succeeds for ${mod.slug} preset ${preset.label}`).toBe(
            true,
          );
          if (!validation.ok) continue;

          const run = mod.run(validation.parsed);
          expect(run.pseudocode.length).toBeGreaterThan(0);
          expect(run.steps.length).toBeGreaterThan(0);

          for (const step of run.steps) {
            expect(step.codeLine).toBeGreaterThanOrEqual(1);
            expect(step.codeLine).toBeLessThanOrEqual(run.pseudocode.length);
          }

          // Check multi-language code availability
          if (run.codeByLang) {
            for (const lang of ["ts", "js", "py"] as const) {
              const langLines = run.codeByLang[lang];
              if (langLines) {
                expect(langLines.length).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    });
  });
});
