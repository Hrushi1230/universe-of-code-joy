import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Alt Text & Non-Text Content Accessibility Audit (WCAG 2.1 SC 1.1.1)", () => {
  const srcDir = path.resolve(__dirname, "../../");

  function getFiles(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (file !== "node_modules" && file !== "dist" && file !== ".git") {
          results.push(...getFiles(filePath, extensions));
        }
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
    return results;
  }

  it("ensures no <img> tags exist without an alt attribute", () => {
    const tsxFiles = getFiles(srcDir, [".tsx", ".jsx"]);
    const violations: { file: string; match: string }[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Match <img tag without alt=
      const imgRegex = /<img\b([^>]*?)>/gi;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        const attributes = match[1];
        if (!/alt\s*=/i.test(attributes)) {
          violations.push({
            file: path.relative(srcDir, file),
            match: match[0],
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures all <svg> elements are either labeled (role='img'/'group' + aria-label) or hidden (aria-hidden='true')", () => {
    const targetFiles = [
      ...getFiles(path.join(srcDir, "components"), [".tsx"]),
      ...getFiles(path.join(srcDir, "routes"), [".tsx"]),
    ];

    const unannotatedSvgs: { file: string; snippet: string }[] = [];

    for (const file of targetFiles) {
      // Exclude generated route tree
      if (file.endsWith("routeTree.gen.ts")) continue;

      const content = fs.readFileSync(file, "utf-8");
      // Match opening <svg ...>
      const svgRegex = /<svg\b([\s\S]*?)>/gi;
      let match;
      while ((match = svgRegex.exec(content)) !== null) {
        const tag = match[0];
        const hasAriaHidden = /aria-hidden/i.test(tag);
        const hasAriaLabel = /aria-label\s*=/i.test(tag) || /aria-labelledby\s*=/i.test(tag);
        const hasRole = /role\s*=\s*["'](img|group|graphics-document|presentation)["']/i.test(tag);

        // SVG must either be aria-hidden, or have an aria-label/role, or be inside a role="img" wrapper component
        if (!hasAriaHidden && !hasAriaLabel && !hasRole) {
          // Check if parent container has role="img" in surrounding context
          const matchIndex = match.index;
          const precedingContext = content.substring(Math.max(0, matchIndex - 300), matchIndex);
          const hasParentRole =
            /role\s*=\s*["'](img|group)["']/i.test(precedingContext) &&
            /aria-label/i.test(precedingContext);

          if (!hasParentRole) {
            unannotatedSvgs.push({
              file: path.relative(srcDir, file),
              snippet: tag.replace(/\s+/g, " ").trim(),
            });
          }
        }
      }
    }

    expect(unannotatedSvgs).toEqual([]);
  });

  it("verifies specific algorithmic visualization renderers have role='img' and aria-label", () => {
    const vizFiles = [
      path.join(srcDir, "components", "viz", "TreeView.tsx"),
      path.join(srcDir, "components", "viz", "HeapView.tsx"),
      path.join(srcDir, "components", "viz", "LinkedListView.tsx"),
      path.join(srcDir, "components", "viz", "GraphView.tsx"),
      path.join(srcDir, "components", "viz", "ArrayView.tsx"),
    ];

    for (const file of vizFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content).toMatch(/role="img"/);
      expect(content).toMatch(/aria-label=/);
    }
  });

  it("verifies interactive landing and practice visualizations have accessible roles and labels", () => {
    const indexContent = fs.readFileSync(path.join(srcDir, "routes", "index.tsx"), "utf-8");
    expect(indexContent).toMatch(/aria-label={`Interactive breadth-first traversal/);
    expect(indexContent).toMatch(/aria-label="Skill tree milestone map"/);

    const reviewContent = fs.readFileSync(path.join(srcDir, "routes", "review.tsx"), "utf-8");
    expect(reviewContent).toMatch(/aria-label="Frontier graph"/);

    const questsContent = fs.readFileSync(path.join(srcDir, "routes", "quests.tsx"), "utf-8");
    expect(questsContent).toMatch(/role="img"/);
    expect(questsContent).toMatch(/aria-label="Graph challenge"/);

    const assessmentContent = fs.readFileSync(
      path.join(srcDir, "routes", "onboarding", "assessment.tsx"),
      "utf-8",
    );
    expect(assessmentContent).toMatch(/aria-label="Binary tree for traversal assessment"/);

    const pathContent = fs.readFileSync(
      path.join(srcDir, "routes", "onboarding", "path.tsx"),
      "utf-8",
    );
    expect(pathContent).toMatch(/aria-label="Level 1 progress"/);
  });
});
