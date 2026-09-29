import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

// Regression ceilings for emitted assets, not a substitute for runtime profiling.
const directory = ".output/public/assets";
const limits = { ".js": 400 * 1024, ".css": 150 * 1024 };
let checked = 0;
for (const name of await readdir(directory)) {
  const extension = Object.keys(limits).find((suffix) => name.endsWith(suffix));
  if (!extension) continue;
  const { size } = await stat(join(directory, name));
  assert.ok(size <= limits[extension], `${name}: ${size} bytes exceeds ${limits[extension]}`);
  checked++;
}
assert.ok(checked > 0, "No built assets found");
console.log(`Bundle budget: ${checked} assets passed (400 KiB JS / 150 KiB CSS per file).`);
