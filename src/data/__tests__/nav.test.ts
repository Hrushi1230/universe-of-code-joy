import { describe, expect, it } from "vitest";
import { APP_NAV, SITE_FOOTER_COLS, SITE_NAV, SETTINGS_NAV } from "@/data/nav";

describe("canonical navigation (S0.3 / S1.9)", () => {
  it("defines APP_NAV with unique ids and valid routes", () => {
    expect(APP_NAV.length).toBeGreaterThan(0);
    const ids = new Set(APP_NAV.map((i) => i.id));
    expect(ids.size).toBe(APP_NAV.length);
    for (const item of APP_NAV) {
      expect(item.to.startsWith("/")).toBe(true);
    }
  });

  it("defines SITE_NAV and SITE_FOOTER_COLS without empty labels or links", () => {
    expect(SITE_NAV.length).toBeGreaterThan(0);
    for (const item of SITE_NAV) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.to.startsWith("/")).toBe(true);
    }
    expect(SITE_FOOTER_COLS.length).toBeGreaterThan(0);
    for (const col of SITE_FOOTER_COLS) {
      expect(col.links.length).toBeGreaterThan(0);
    }
  });

  it("routes named destinations to their actual pages", () => {
    expect(SITE_NAV.find((item) => item.label === "Compete")?.to).toBe("/leagues");
    expect(SITE_FOOTER_COLS.flatMap((column) => column.links)).not.toContain("About");
    expect(SITE_FOOTER_COLS.flatMap((column) => column.links)).not.toContain("Changelog");
  });

  it("defines SETTINGS_NAV with icons and routes", () => {
    expect(SETTINGS_NAV.length).toBeGreaterThan(0);
    for (const item of SETTINGS_NAV) {
      expect(typeof item.icon).not.toBe("undefined");
      expect(item.to.startsWith("/")).toBe(true);
    }
  });
});
