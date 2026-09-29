# Algora — Original Homepage Motion Roadmap

Updated: 2026-09-12. Status: original-design implementation pass recorded; semantic and sitewide acceptance reopened by the audit below.

## Direction correction

The accepted direction is to preserve the original Algora homepage design and turn its static presentation into a responsive, animated, interactive page. The alternate seven-chapter redesign was rejected and removed. The original hero, BFS card, social-proof strip, progress cards, feature row, CTA band, navigation, and footer remain the visual structure.

This checkpoint covers every section of the homepage at `/`. It does not claim that every route in the application received a new motion pass. Existing visualizer routes retain their fixed-workspace and zero-scroll contract, and Watch videos remain deferred.

## Previously recorded implementation behavior

These describe the earlier implementation pass, not a fresh certification of algorithm correctness or all runtime cases. The audit addendum below takes precedence where it identifies a gap.

- The original BFS hero now derives ten deterministic setup/visit/finish states from real queue operations.
- Code highlighting, active tree node, visited nodes, edges, step count, and explanation update together.
- Play, Pause, Next, Replay, and the 0.5x–2x speed control are functional.
- The intro autoplays once while visible, pauses offscreen, and does not autoplay when reduced motion is requested.
- The hero buttons and every progress, feature, and CTA link now open real routes instead of inert placeholders.
- Existing SVG illustrations animate once as they enter the viewport. Cards have restrained focus/hover movement; no endless background animation was added.
- Marketing examples do not write learner progress, XP, streak, mastery, or review state.

## Responsive contract

- Mobile 320/390px: sections stack; navigation keeps the wordmark and primary action; footer becomes two columns; playback controls wrap; no horizontal page overflow.
- Tablet/small desktop: the original hero relationship is retained while the BFS card stacks its code and tree internally when space is tight.
- Large desktop 1440/1920px: the original two-column hero and two-panel BFS card remain intact.
- The explanation reserves height so traversal steps do not move surrounding content.
- Homepage uses normal document scrolling. It has no nested demo scroller or scroll-driven playback.

## Verification evidence

- `bun run verify`: passed on 2026-09-12 after the correction pass — 89 test files and 996 tests. ESLint reports eight Fast Refresh warnings and zero errors.
- `bun run build`: passed after the correction pass. Vite reports the existing large-chunk advisory; deployment was not requested.
- Browser QA: 320, 390, 1024, 1440, and 1920px checked with no horizontal overflow.
- Playback QA: manual traversal completion, replay, speed input, fixed demo height, reduced-motion content visibility, and fresh-load autoplay checked.
- Screenshots: `output/playwright/original-home-mobile-320.png`, `original-home-mobile-390.png`, `original-home-desktop-1024.png`, `original-home-desktop-1440.png`, and `original-home-desktop-1920.png`.

## Completion

- [x] Restore and preserve the original homepage composition.
- [x] Correct operation-level BFS/code/explanation synchronization and terminal state. Fixture tests and browser playback reached all eight visited nodes with no current node and an empty queue on 2026-09-12.
- [x] Make visible homepage controls and calls to action functional.
- [x] Add restrained entry motion to all original homepage sections.
- [ ] Reverify reduced-motion lifecycle and keyboard behavior after corrections; initial native controls exist.
- [ ] Complete mobile navigation and reverify responsive layouts after corrections; prior screenshots remain historical evidence.
- [x] Run repository verification and production build.
- [ ] Deploy the site. This requires a separate explicit request.
- [ ] Apply the now-requested sitewide motion/interaction pass according to the new roadmap; implementation remains open.

## 2026-09-12 sitewide audit addendum

The latest request is a complete, researched all-pages plan, not permission to replace the original homepage. The active specification is [PRODUCT_READINESS_ROADMAP.md](PRODUCT_READINESS_ROADMAP.md), with the full [page matrix](PAGE_READINESS_MATRIX.md).

- `src/routes/index.tsx` derives highlighted code partly from node index modulo three, not actual BFS operations. Its terminal state keeps node 8 current while only preceding nodes are marked visited. The displayed Python also enqueues absent children without filtering them. Correct these before calling the demonstration semantically synchronized.
- At 390px, the header hides main navigation and provides no replacement menu. Keeping only the logo and Start free is not complete mobile navigation.
- Autoplay/reduced-motion change handling, hidden-tab lifecycle and accessible announcements need targeted renewed verification; prior screenshot/static checks do not certify every playback case.
- Marketing registry labels such as `SUBSTANTIATED` are not measurement evidence for `60fps` or proof of customer/content claims. Review actual artifacts and qualify/remove unsupported claims.
- Existing verify/build counts above are retained as historical execution records. They were not rerun during the planning audit and do not override these findings.

Preserve the restored original composition while repairing these issues. No app implementation or redesign was performed as part of this planning update.

## 2026-09-12 ordered execution record

- Homepage BFS fixtures, displayed code, highlighted operations, queue state and terminal explanation were corrected without changing the accepted composition.
- The mobile header now opens a keyboard/touch-accessible navigation sheet; Compete and Blog point to their real routes, and unsupported About/Changelog promises were removed.
- Unsupported homepage measurements and institutional endorsement-style marks were replaced with repository-grounded product/catalog language.
- Current evidence: full verification passed 89 files / 996 tests; production build passed; public E2E passed 5/5; mobile menu navigation passed; homepage playback reached step 10/10 with all eight nodes visited and an empty queue. Full responsive/reduced-motion H4 acceptance remains open.
