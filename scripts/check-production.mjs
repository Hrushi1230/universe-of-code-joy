import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

// Run against the local built-worker preview, never against a deployed service.
const base = "http://127.0.0.1:4187";
let ready = false;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const response = await fetch(base, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    // The worker process may still be starting.
  }
  await setTimeout(1000);
}
assert.ok(ready, "Production preview did not become healthy on port 4187");

for (const path of ["/", "/auth", "/login", "/explore", "/algorithms/binary-search"]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="en"/, path);
  assert.match(html, /<title>[^<]*Algora/, path);
}
const missing = await fetch(base + "/p6-does-not-exist");
assert.equal(missing.status, 404);
assert.match(await missing.text(), /Page not found/);
console.log("Production SSR smoke: 5 routes + 404 passed.");
const diagnostic = await fetch(base + "/dev/engine");
assert.equal(diagnostic.status, 404, "Developer harness must not be available in production");
assert.doesNotMatch(await diagnostic.text(), /id="dev-slug"/);
console.log("Production developer harness protection passed.");
