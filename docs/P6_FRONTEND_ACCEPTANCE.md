# P6 — Frontend acceptance ledger

Updated: 2026-09-14. Status: **Local engineering and automated acceptance pass delivered. P6 final freeze remains blocked by the explicit gates below.** P4 remains skipped/open; Watch remains Coming Soon.

## Phone layout contract

- Login and signup use a compact layout below 768px. Every field, password visibility control, validation error, signup consent/legal links and submit button remains visible.
- The local-preview disclosure stays visible. Promotional badges/copy, unavailable social providers, password-length meter and repeated footer copy are omitted on phones.
- No overflow clipping, document scroll lock, or whole-page scaling is used. Inputs remain 40px high with 16px text.
- Homepage and marketing/document pages retain normal vertical reading scroll. Fixed visualizer panels/controller are unchanged.
- Chromium: **30 phone state checks passed**, across 320×480, 320×568, 360×640, 390×844 and 430×932. Signup includes initial, email, password-length and consent errors; login includes initial/email-error states. Both axes and essential control bounds checked.
- Twelve additional tablet/desktop state checks passed horizontal containment only; these are not desktop one-viewport claims.
- Screenshots reviewed: [smallest signup](../output/playwright/p6-auth-320x480.png), [phone signup](../output/playwright/p6-auth-390x844.png). Repeat with [phone audit](../output/playwright/p6-phone.txt).
- Scope is the visible browser viewport with the software keyboard closed. Physical iOS/Android keyboard, browser chrome, landscape and enlarged system text require device review. On smaller available heights, preserve access rather than hide controls.
- This supersedes the earlier P0–P5 scroll-to-submit acceptance for phone login/signup only.

## Production defects found and repaired

1. The former Vite preview looked for nonexistent `dist/server/server.js`, while the build emits a Nitro Cloudflare worker under `.output/server`. `bun run preview -- --port 4187` now uses the matching local worker runtime, pinned to Wrangler 4.131.1 and compatibility date 2026-09-13. The date avoids timezone-dependent future-date rejection. First use may download the tool through npm. This neither deploys nor selects a future backend vendor.
2. Unused default exports from Paths, Visualizer marketing and AlgorithmWorkspace prevented route splitting. The generated circular chunks read catalog/navigation data before initialization, causing HTTP 500 on production startup despite passing development tests. Removing those unused exports restored route splitting and production rendering. No catalog fallback values were added.
3. The first compact-phone implementation used a hidden desktop H1 before the mobile H1; the existing discovery test caught it. The final implementation uses one responsive H1.

## Verification

- Repository verification passed: typecheck, content validation, 94 test files / 1,017 unit tests. Lint has zero errors and eight existing Fast Refresh warnings.
- Production build succeeds. The oversized Explore chunk was fixed by replacing the wildcard Lucide import with the exact category icons. Explore route chunk fell from 588,828 to approximately 12,888 bytes; shared chunks remain separately loaded. No emitted client JS file exceeds 500kB. Build-tool advisories remain.
- Full browser regression: **69/69 Chromium E2E tests passed** (4.7 minutes) in the closeout pass. Production SSR smoke checks five representative routes, 404, and blocked developer-harness access.
- Final post-fix rerun: **16/16 Chromium E2E tests passed** (1.4 minutes), covering public pages, discovery/onboarding and engagement/account readiness after the accessibility corrections.
- Production-browser audit: **31 user-facing route instances**, **58 unique internal links**, no failing routes/links, no horizontal overflow at 390×844, no unnamed visible buttons under the audit heuristic, and no uncaught page exceptions.
- Missing route returns HTTP 404 and its Go home link recovers successfully.
- Each audited route has a title and description. This is presence checking, not full editorial/SEO certification.
- Repeat with [production audit](../output/playwright/p6-production.txt) against port 4187. Dynamic route patterns use representative instances, not all 56 question states. Developer route is excluded from public-route acceptance.
- Local, unthrottled navigation samples: DOMContentLoaded 31–190ms; load 52–294ms. These are smoke observations with cache reuse, **not** Core Web Vitals, mobile-network or production performance certification.
- [CI workflow](../.github/workflows/frontend-checks.yml) runs frozen dependency install, verify, build, production SSR smoke and the existing Chromium E2E suite. Failure traces are retained. The workflow is authored locally; no hosted CI run is claimed.
- `bun run test:production` checks five representative production pages plus HTTP 404; start `bun run preview -- --port 4187` first. Stop the preview before rebuilding on Windows to avoid file locks.

## Extended closeout evidence — 2026-09-14

- Firefox and WebKit each passed 20 targeted phone/form/menu-focus/reduced-motion checks. Each also passed the 31-route production audit and internal-link/404 recovery checks: [Firefox](../output/playwright/p6-firefox-routes.json), [WebKit](../output/playwright/p6-webkit-routes.json). These are desktop browser engines, not physical Safari/iOS certification.
- Axe-core 4.12.0 reports **zero automated violations across 31 route instances** at 390×844: [final accessibility report](../output/playwright/p6-accessibility-final.json). Twenty routes contain automated incomplete/manual-review findings, chiefly SVG/contrast cases; these remain review work, not waived passes.
- Repairs: readable teal/warning/tertiary text tokens; no opacity-faded informative text in the flagged cases; accessible language selector and onboarding home link; proper definition-list and heading semantics; existing reading regions/tables reachable by keyboard. No visualizer scrolling or layout redesign was introduced.
- Token contrast has five unit regression checks. The original light palette and bright graphical highlight remain; readable text/control tones are documented in [Design System](DESIGN_SYSTEM.md).
- Final screenshots inspected: [phone signup](../output/playwright/p6-final-auth.png), [phone visualizer](../output/playwright/p6-final-visualizer.png).
- [Throttled profile](../output/playwright/p6-performance-results.json): three cold-cache samples each for Home, Explore and Binary Search, 390×844, CPU 4× slowdown, 150ms network latency, 4Mbps down/1Mbps up. Observed LCP 556–792ms and cumulative layout-shift sums 0.0014–0.0764. This is a short local synthetic profile, not field performance, INP, a production p75 guarantee or a full Core Web Vitals certification.
- `bun run test:bundle` passes 112 emitted assets and enforces per-file regression ceilings of 400KiB JS / 150KiB CSS in CI. These ceilings are not total-page download budgets.
- [Motion/recovery probe](../output/playwright/p6-motion-recovery.txt) passed: manual BFS finishes with eight visited nodes/empty queue, reduced-motion autoplay stays disabled, card height stays fixed; an aborted Explore chunk shows the error boundary and Go home restores the homepage. The large diagnostic browser trace remains local and is not part of the repository.
- `/dev/engine` now rejects production access with 404. The local development harness remains available. This is route protection, not removal of all algorithm code from client bundles.
- Emergency SSR fallback now uses bounded border-box sizing; recovery actions and viewport contract have unit tests.
- Until an approved domain/share image exists, default social metadata requests a summary card rather than falsely declaring a large image.

## Remaining final-freeze gates — not marked complete

- Complete the skipped P4/all-56 non-video learning acceptance before final freeze.
- Physical iOS/Android keyboard, landscape and enlarged-system-text review. User confirmed no physical-device testing is available on 2026-09-14. Browser emulation is not substituted for this evidence.
- Screen-reader listening sessions and the axe incomplete/manual findings. Automated semantics/contrast checks alone do not certify accessibility.
- Field performance/INP and device performance review when a real hosted environment exists.
- Share-image/canonical origin approval and external social-preview verification. User confirmed no domain exists yet on 2026-09-14; no origin was invented. Favicon is present.
- Hosted CI evidence and final editorial/learning-content review. CI is authored and its commands were tested locally; nothing was pushed or deployed to obtain a hosted run.
- Backend, real accounts/email, cloud progress, payments and deployment remain later phases. No release authorization is implied.
