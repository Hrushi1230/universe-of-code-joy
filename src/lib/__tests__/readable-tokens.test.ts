import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../styles.css", import.meta.url), "utf8");
function token(name: string): string {
  const value = css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
  if (!value) throw new Error(`Missing token: ${name}`);
  const alias = value.match(/^var\(--(.+)\)$/);
  return alias ? token(alias[1]) : value;
}
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
describe("small text contrast tokens", () => {
  for (const [foreground, background] of [
    ["primary", "tint"],
    ["primary-foreground", "primary"],
    ["primary-foreground", "primary-glow"],
    ["slate-soft", "paper"],
    ["warning", "warning-tint"],
  ]) {
    it(`${foreground} on ${background} has at least 4.5:1 contrast`, () => {
      const a = luminance(token(foreground)),
        b = luminance(token(background));
      expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
