import { describe, expect, it } from "vitest";
import { renderErrorPage } from "../error-page";

describe("catastrophic SSR recovery page", () => {
  it("offers reload and home without leaking exception details", () => {
    const html = renderErrorPage();
    expect(html).toContain('onclick="location.reload()"');
    expect(html).toContain('href="/"');
    expect(html).not.toContain("stack");
  });
  it("includes a viewport and bounded border-box sizing for phones", () => {
    const html = renderErrorPage();
    expect(html).toContain('name="viewport"');
    expect(html).toContain("box-sizing: border-box");
    expect(html).toContain("width: 100%");
    expect(html).toContain('lang="en"');
  });
});
