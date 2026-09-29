# Algora — All-Pages Interaction, Motion, and Product-Readiness Roadmap

Updated: 2026-09-29. Status: **P0–P3 and P5 delivered locally; P4 resumed with the first question-specific Rain Water scene; P6 local engineering/automated QA delivered; final freeze remains blocked by documented gates**. The remaining 55 visual directions are tracked in [the question scene rollout](QUESTION_SCENE_ROLLOUT.md). Evidence and capability boundaries: [P0–P5 acceptance](P0_P5_ACCEPTANCE.md), [P6 acceptance](P6_FRONTEND_ACCEPTANCE.md).

Canonical priority: [ROADMAP.md](../ROADMAP.md). Route-by-route work: [PAGE_READINESS_MATRIX.md](PAGE_READINESS_MATRIX.md).

## 1. Decision and scope

Make the existing Algora feel like a carefully built, animation-first learning product across the entire website. Preserve its original light paper/white surfaces, teal accents, typography, SVG language, and recognizable layouts. Fix broken responsive compositions where necessary; do not replace them with another landing-page template.

“A $100 million website” is a quality aspiration, not a valuation, budget, revenue forecast, or a promise that animation alone creates a successful business. The practical bar is: distinctive design, correct teaching, complete interactions, reliable state, accessibility, speed, and trustworthy operations.

This plan covers all **32 file-route patterns**, the shared root/navigation/error surfaces, every learning stage, and eventual production services. Dynamic routes represent many lessons/questions, not just one page. It is not permission to deploy, buy services, collect real credentials/payments, or replace the design.

### Non-negotiables

- Preserve the original design. No dark/glowing panels, generic gradient blobs, stock illustrations, decorative 3D scenes, cursor gimmicks, scrolling marquees, or repeated oversized marketing sections.
- Animate meaningful events: an item enters a queue, a boundary moves, a choice gets feedback, a saved state changes. Do not make every card float or every route replay an entrance sequence.
- A visible control must perform its named action, or clearly explain why it is unavailable. Routing every unfinished link to `/` is not completion.
- Fixed learning panels and an always-visible bottom controller: no page or nested scrolling during the supported visualizer experience, no clipping, no illegible whole-page scaling, no shifting boxes between steps.
- Normal vertical document scrolling remains appropriate for the homepage, public information, long-form content, and ordinary non-workspace pages. This is not permission to reintroduce visualizer scrollers.
- Animation and code must agree with the algorithm. One authoritative execution state, not an independent decorative timeline that only looks plausible.
- Frontend/content/QA before production backend implementation; integration and hardening before beta. The current user-directed sitewide pass brings page work forward while question expansion is paused. All 56 questions still remain a release gate.
- Watch/video stays visibly **Coming Soon** and excluded from completion claims until separately produced and approved. Use `Golden-partial` for that exception, not “fully complete.” Python execution is also not silently promised by a code reader.

## 2. What was actually checked

### Evidence method

Reviewed the canonical roadmap, homepage delivery record, question matrix, design/visualizer contracts, prior deployment audit, route declarations, relevant route handlers, shared navigation, stores, runner, module registry, marketing claims, public assets, and server entry. The audit distinguishes source behavior from rendered behavior; it is not an exhaustive end-to-end certification of every route.

Live local browser spot-check: `/`, `/pricing`, `/contact`, each at 390×900 and 1440×900 on 2026-09-12. Captured mobile screenshots and inspected homepage/contact images. No forms were submitted and no production account or payment action was taken. These viewport checks are not real-device tests.

Reproduction script: [product-roadmap-audit.txt](../output/playwright/product-roadmap-audit.txt). Screenshots: [home](../output/playwright/roadmap-home-390.png), [pricing](../output/playwright/roadmap-pricing-390.png), [contact](../output/playwright/roadmap-contact-390.png).

| Baseline                 | Current evidence                                                     | Meaning / limitation                                                                              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Routes                   | 32 `createFileRoute` declarations plus `__root.tsx`                  | 32 route patterns, not 32 production-ready pages; includes one developer route                    |
| Questions                | Live imports of `src/data/problems.ts`: 56                           | Catalog records, not completed lessons                                                            |
| Runnable resolution      | Live registry check: 36/56                                           | A direct or inherited module resolves; this does not prove question-specific teaching correctness |
| Engine modules           | Live `listAllModules()`: 34                                          | 13 algorithm-keyed + 21 problem-keyed modules; not interchangeable with question count            |
| Remaining resolution     | 20/56 lack a resolving module                                        | Additional inherited matches also need semantic review                                            |
| Explicit learning slices | Question matrix records 14 Code/Solve/Trace/Review slices            | Documentary status, not 14 newly rerun E2E certifications                                         |
| Homepage                 | Original design restored; local playback and SVG motion exist        | Correctness, navigation, motion, and claims gates reopened below                                  |
| Product state            | Useful local stores, practice runner, review/progression flows exist | Local functionality is valuable; it is not authenticated cloud persistence                        |
| Services                 | Auth/billing handlers inspected are simulated/local                  | No production identity, payment, or multi-user readiness established                              |
| Toolchain                | React, TanStack, Zustand, SVG, existing Framer Motion                | Reuse the stack; no new animation framework required by this plan                                 |
| Verification history     | Homepage record reports 993 tests and a passing build                | Historical evidence only; full verify/build/E2E were not rerun for this planning-only audit       |

Registry check used `problems.filter(p => hasModuleForProblem(p.slug) || hasModule(p.algorithmSlug))`. Do not promote that number to “36 finished animations.”

### Confirmed gaps to repair first

Priority means impact, not an assertion that every issue is exploitable. `P0` blocks truthful use/learning or release; `P1` blocks core usability/polish.

| ID  | Priority | Evidence in this checkout                                                                                                                                                                                                                                                                             | Required result                                                                                                                                         |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | P0       | [Homepage](../src/routes/index.tsx): `BFS_STEPS` assigns code lines partly using `index % 3`; terminal state still keeps node 8 current and only preceding nodes visited                                                                                                                              | Engine-authored operation states; correct terminal queue, visited set, code, and explanation                                                            |
| A02 | P0       | Same displayed Python queues `node.left` and `node.right` without filtering null children                                                                                                                                                                                                             | Correct executable example including empty root and missing children; line map follows actual operations                                                |
| A03 | P1       | [Site chrome](../src/components/site-chrome.tsx) hides main nav below `md`, with no mobile menu; browser confirms no visible main nav/header button at 390px                                                                                                                                          | Keyboard/touch mobile navigation with all primary destinations and login reachable                                                                      |
| A04 | P1       | Browser: Pricing `scrollWidth=433`, Contact `scrollWidth=614` at `innerWidth=390`; screenshots show contact content cut off                                                                                                                                                                           | Reflow content and controls; no horizontal document overflow                                                                                            |
| A05 | P0       | [Login](../src/routes/login.tsx), [signup](../src/routes/auth.tsx), [verification](../src/routes/verify-email.tsx), [recovery](../src/routes/forgot-password.tsx), [reset](../src/routes/reset-password.tsx) simulate progress with local state/navigation; reset starts with filled sample passwords | Explicit demo behavior during frontend phase; empty password inputs; real provider flows only in backend/integration phases                             |
| A06 | P0       | [Settings](../src/routes/settings.index.tsx) toggles a local 2FA boolean and announces success; [billing](../src/routes/settings.billing.tsx) toggles local plans and shows fixed invoices                                                                                                            | Never claim security/payment changes occurred without server confirmation; separate fixtures from live state                                            |
| A07 | P1       | [Contact](../src/routes/contact.tsx) has no form submission handler; Send message is inert; privacy/support anchors lack destinations                                                                                                                                                                 | Validated, accessible form state and meaningful links; actual delivery and retry only when integrated                                                   |
| A08 | P1       | [Pricing](../src/routes/pricing.tsx) has inert interval buttons/CTAs and FAQ plus icons without disclosures; [blog](../src/routes/blog.tsx) category buttons are unwired and featured article uses `href="#"`                                                                                         | Complete selection/disclosure/navigation states; published article destinations or honest unavailable state                                             |
| A09 | P1       | [Nav content](../src/content/nav.ts): main Compete and footer Blog route to `/`; About/Changelog also return home                                                                                                                                                                                     | Destination inventory: implement the intended destination, relabel, or remove the promise; no unrelated redirects                                       |
| A10 | P0       | [Preferences](../src/stores/prefsStore.ts) seed Arjun and Pro/2FA defaults; [dashboard](../src/routes/dashboard.tsx) uses the Ada demo learner; leagues use seeded peers                                                                                                                              | Consistent anonymous/local learner identity; clearly labeled samples; server-owned identity/rank later                                                  |
| A11 | P0       | [Marketing claims](../src/data/marketing-claims.ts) declares everything substantiated and displays `60fps`; such registry labels do not constitute device measurements or evidence of customers, authors, or reviews                                                                                  | Re-audit each claim against a real artifact; remove or qualify unsupported claims; never invent audit sign-off                                          |
| A12 | P1       | [Root](../src/routes/__root.tsx) references `/favicon.ico`; current `public/` contains only `robots.txt`; no `.github/` directory found                                                                                                                                                               | Verify emitted assets and metadata, add missing brand/share assets and CI where absent; inspect deployment output before claiming SEO/release readiness |

Browser geometry detail: at 390px the homepage document was 375px wide (the browser reserved scrollbar space), while Pricing/Contact exceeded even the full 390px viewport. At 1440px these three documents measured 1425px. This establishes the sampled mobile overflow, not that desktop interactions passed.

Additional inspection risks: reduced-motion preference changes during playback, hidden-tab playback, repeated screen-reader announcements, protected-route enforcement, and short-height form clipping. These require targeted tests; they are not all confirmed runtime failures from this audit.

The existing server does apply security headers and normalizes some SSR errors. Do not describe it as “no server at all,” or mistake those headers for authentication or a security assessment.

## 3. Research translated into Algora decisions

Research checked 2026-09-12. Product references below inform design decisions; their pages were read, not benchmarked in a controlled motion/performance comparison. They do not prove Algora outcomes or justify copying another brand.

| Primary source                                                                            | Relevant evidence                                                                                                                         | Algora decision (our inference / design choice)                                                                                                                         |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Brilliant](https://brilliant.org/)                                                       | Describes visual, interactive, step-by-step learning and questions that develop understanding                                             | Make the learner act and explain, not just watch a looping illustration. Do not add an AI tutor because a reference has one                                             |
| [VisuAlgo](https://visualgo.net/en)                                                       | Algorithm animation, custom input, and graph-specific interaction                                                                         | Preserve real structure/operation semantics and bounded custom inputs; do not substitute one generic animation across questions                                         |
| [Linear features](https://linear.app/features)                                            | Organizes its product into connected planning/building workflows and destinations                                                         | Organize Algora around discover → understand → practice → return. Consistency and task continuity matter more than decorative effects                                   |
| [Motion accessibility](https://motion.dev/docs/react-accessibility)                       | Provides `MotionConfig` reduced-motion behavior and a hook for custom logic                                                               | Use the installed Motion stack; handle autoplay/timers separately, since disabling transforms does not stop application playback logic                                  |
| [web.dev animation guide](https://web.dev/articles/animations-guide)                      | Explains rendering costs, transform/opacity, profiling and restrained layer promotion                                                     | Default product microinteractions to cheap properties; profile necessary SVG path/color changes instead of promising blanket 60fps                                      |
| [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Requires controls for qualifying automatically moving content lasting over five seconds alongside other content, subject to its exception | Visible pause/replay; no endless autonomous visual noise; stop offscreen/hidden-tab work                                                                                |
| [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)   | WCAG 2.2 AA minimum is 24×24 CSS pixels or applicable exceptions                                                                          | Product target: 44×44 hit areas for primary touch controls. Do not misstate 44px as the AA minimum                                                                      |
| [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)                     | Content must remain available at the specified narrow/zoomed view, with defined two-dimensional-content exceptions                        | Fit/paginate/switch learning views instead of clipping; preserve normal reading reflow elsewhere                                                                        |
| [Core Web Vitals](https://web.dev/articles/vitals)                                        | Good thresholds: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, at p75 segmented by mobile/desktop; lab is not field evidence                           | Use repeatable lab gates before release and actual-user monitoring during beta; report the distinction                                                                  |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)   | Provides testable application-security requirements                                                                                       | Later threat-model authentication, authorization, code execution, data isolation and payments against selected requirements; do not call a header scan a security audit |

## 4. What “no AI slop” means in reviews

Review every change against these concrete questions:

1. **Identity:** Is this visibly the original Algora, or did the layout/visual language get replaced?
2. **Purpose:** Can we name the learner action or state change this motion explains? If not, remove it.
3. **Truth:** Are nodes, highlighted code, explanation, stats, and claims accurate?
4. **Restraint:** Is there one main focus? Does motion settle and let the person read?
5. **Craft:** Are spacing, baselines, SVG strokes, labels, hit areas, loading states and responsive compositions intentional?
6. **Control:** Does the same experience work with touch, keyboard, reduced motion, interruption, and replay?

Polish is not a blanket fade-up wrapper around every page. A privacy page may need excellent reading/navigation and disclosure feedback, not a hero animation. No new decorative assets or dependencies unless a specific accepted interaction requires them.

## 5. Shared interaction and motion specification

### Three kinds of motion

| Layer                   | Purpose                                                                  | Rules                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Product feedback        | Hover/focus, selection, saving, errors, navigation                       | Start from existing 120ms micro / 220ms standard tokens; never delay an action for a flourish                                             |
| Educational motion      | Pointer moves, swaps, enqueue/dequeue, recursion, relaxation, recurrence | Start from existing 380ms teaching transition; reading hold is separate and user-controlled; do not force every concept into one duration |
| Marketing demonstration | Prove the learning experience in the existing SVG/cards                  | One coherent sequence, explicit controls, no progress writes, no scroll-scrubbing or page pinning                                         |

These durations are starting design tokens from the repository, not measured optimal teaching speeds. Tune a representative example with user review before rolling changes across families.

### Motion acceptance contract

- For each motion specify trigger → before-state → movement → after-state → explanation → interruption/reduced-motion behavior.
- Keep stable entity IDs and stable diagram topology. Highlight an edge without hiding its structural existence. Node spacing accounts for badges and pointer labels, not circles alone.
- Use one execution frame for world, code, reasoning, queue/stack and controller. Back, seek, replay and language switching must resolve exactly to the requested frame; cancel superseded animations.
- Do not animate layout height or move the workspace/controller in response to explanations, results, or prediction feedback. Reserve space or paginate the relevant content.
- Pause promotional playback offscreen and when the document is hidden. Do not restart after a manual pause merely because it re-enters view. Reduced motion defaults to a readable static state with manual stepping.
- Observe preference changes while running. Short opacity/state feedback may remain; no parallax, large translations, or pulsing background loops in reduced-motion mode.
- Announce meaningful user-requested steps/results accessibly without reading every automatic frame. Keep visible explanations and an accessible state summary.
- Native links/buttons remain semantic; every hover affordance has keyboard focus and touch behavior. Menu/dialog focus returns to its trigger; Escape works where expected.
- Default to CSS for simple feedback and existing Motion for coordinated SVG/state transitions. No GSAP/Three.js/video runtime migration. Renderers remain presentational; domain logic stays in the engine.

### Original homepage story — retain sections, improve causality

| Existing section        | Interaction/motion to deliver                                                                                                                                                             | Acceptance                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Hero and BFS card       | Initialize queue → dequeue → record visit → enqueue real children → finish. Code and explanation advance per operation, not per arbitrary node count. Keep original tree/card composition | Final visited order and queue are correct; code handles absent children; controls interrupt cleanly; card bounds do not move |
| Hero CTA                | Watch traversal focuses/opens the existing demo predictably; Start free names the real next experience                                                                                    | No unexpected page jump from autoplay; reduced motion avoids smooth travel; no false account creation                        |
| Social-proof strip      | Retain its quiet placement; only verified claims or clearly labeled capability/sample content                                                                                             | No looping logo strip, fabricated institutional endorsement, or unmeasured performance claim                                 |
| Existing progress cards | Demonstrate one local illustrative state change or navigate to the actual progress experience                                                                                             | Label example data; no marketing animation writes XP/mastery/streaks                                                         |
| Existing feature row    | One small algorithm-relevant SVG response on first visibility or deliberate interaction; accessible equivalent                                                                            | No competing continuous loops; each feature opens its stated destination                                                     |
| Closing CTA and footer  | Clear next action and complete navigation                                                                                                                                                 | Keyboard/mobile usable; no dead links or forced new sections                                                                 |

The corrected BFS may need more than eight operation frames. Eight is not a product requirement; coherent teaching and preserved geometry are.

## 6. Fixed-workspace and responsive contract

The desktop experience retains left Algorithm World, right Code/Reasoning, and a fully visible bottom playback band with clear separation/border. Their outer rectangles are stable across all steps, prediction states, completion states, and supported inputs.

For narrow/short screens, the proposed solution is a fixed World / Code / Reason view switch that retains the same current step, plus the persistent bottom controller. Do not squeeze both desktop columns into a phone. Validate one prototype before applying it across families; this is an explicit responsive adaptation, not a new visual identity.

- No horizontal or vertical scrolling inside visualizer panels. Use bounded datasets, readable code/reasoning pages, selectable detail views, and an explicit overflow summary with access to every item.
- Never satisfy a zero-scroll assertion merely with `overflow:hidden`, ellipses hiding essential values, reduced body text, or `DesktopScaleFrame` shrinking the entire product.
- At increased text size/zoom and with a phone keyboard, switch to a readable focused/paginated view. Preserve access to inputs, feedback and controller; do not disable browser zoom.
- Distinguish stable layout at one viewport from responsive relayout after an actual viewport/orientation change. Preserve step/selection through the latter.
- Controller safe-area clearance and hit areas are included in the height budget. Browser chrome and virtual keyboard must be tested, not estimated from desktop screenshots.
- Non-workspace forms and reading pages must reflow; forcing them into `h-screen overflow-hidden` is not a shortcut to the visualizer rule.

### Family verification matrix

These are **existing repository limits / cases**, not new claims of mobile certification. Derive any smaller responsive limits from measured readable layouts. Reject oversized input with an exact explanation before starting; do not silently drop data or change the lesson mid-run.

| Family                        | Layout and semantic proof required                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arrays, strings, two pointers | Existing 12-cell hard limit; distinct index/value/pointer lanes; min/max input, duplicate values, negative values, read/write overlap, long strings |
| Stack / queue                 | LIFO vs FIFO order, head/tail or top/bottom, enqueue/dequeue trajectory; empty/full states; every visible entry accessible without a scroller       |
| Linked list                   | Stable identity, next/null/reversed links, crossing pointer labels, cycle/merge states; no crowded arrowheads or misleading reordered topology      |
| Tree / BST                    | Existing 15-node / four-level bound; widest and skewed accepted tree; all badges/labels clear; recursion and queue remain synchronized              |
| Graph                         | Existing 10-node / 16-edge bound; directed/weighted edges, disconnected cases, stable coordinates, readable edge labels and auxiliary state         |
| Heap                          | Tree and array show the same slots; compare/swap and active boundary agree; long values and max accepted size tested                                |
| Recursion / backtracking      | Calls/arguments/returns and undo transitions are truthful; deep-stack detail is paginated/focused without losing context                            |
| DP                            | Existing 1-D 12-state and 2-D 8×10 bounds; recurrence inputs → current cell → value commit; all row/column/result labels readable                   |

Breakpoint QA starts at 320, 390, 768, 1024, 1280, 1440 and 1920 CSS-pixel widths, including 568/667/720px short-height cases, portrait/landscape, text zoom, reduced motion and keyboard input. The accepted family limit must be recorded per supported layout, not inferred from a single 1440×900 test.

## 7. Execution phases and exit gates

These work packets supplement the canonical phases rather than deleting historical progress. No completion dates or staffing estimates are invented. Size each packet after its first representative implementation and record actual QA effort.

### P0 — Freeze the baseline and correct misleading behavior

Scope: findings A01–A12; preserve existing dirty work. Record representative original screenshots and accepted geometry. Reopen overstated homepage gates, audit claim provenance, identify all inert/wrong-destination controls, and distinguish demo/local/live state. Do not implement production backend here.

Deliverables: corrected homepage semantic plan/fixtures, navigation/action inventory, explicit demo boundaries, missing/unsupported feature messages, route matrix owner assignments. Any replacement of the original composition requires separate user review.

Exit: no known falsely successful security/payment action in the frontend experience; homepage teaches valid BFS; next destination is honest; old “complete” labels no longer conceal reopened work.

### P1 — Shared chrome, accessibility and motion foundation

Scope: public/app navigation, mobile menu, focus/active states, consistent local identity, buttons/links/disclosures, reduced motion and timer lifecycle, shared empty/loading/error feedback, original typography/spacing tokens.

Deliverables: smallest reusable primitives required by multiple real consumers, not a new design system. Correct route labels and browser back/forward behavior. Reconcile older scrolling guidance with the latest fixed-workspace rule in design/visualizer docs.

Exit: keyboard/touch access to primary destinations at all target widths; no focus loss or hidden content; representative motion works with reduced motion and interruption; no newly introduced layout shift.

### P2 — Complete all public pages in the original design

Scope: `/`, `/visualizer`, `/pricing`, `/campus`, `/blog`, `/contact`, `/privacy`, `/terms`, public header/footer and missing destinations identified by their promises.

Deliverables: homepage story above; real demo launch; pricing selection/FAQ frontend; campus inquiry instead of unsupported SSO promises; working blog discovery and reviewed article destinations; contact validation and service-state contract; reading/anchor/copy interactions. Simulated service outcomes remain explicitly labeled until integration.

Exit: every public CTA has a meaningful destination/action; sample/claim provenance approved; 390px failures fixed and narrow/short layouts tested; original design recognizable; no decorative motion added to legal reading.

### P3 — Discovery, onboarding and learner continuity

Scope: Explore, Paths, Mastery Map, Dashboard, onboarding goals/assessment/path; auth/recovery frontend state contracts.

Deliverables: complete filter/search/empty states, URL and back-state retention, real recommendation inputs, assessment feedback, resume/restart, guest/local identity, honest unavailable account operations. Test freshness after progress changes and storage hydration.

Exit: a new local learner can choose a goal, find an appropriate lesson, leave and return to the right place; a returning learner sees their own state, not a hardcoded persona. Repeated actions do not invent progress.

### P4 — Finish learning interaction quality and all 56 questions

Scope: algorithm workspace, practice list/editor/results, review, every family and every question. Resume the parked question sequence only after the current sitewide foundation/public pass is accepted; `lowest-common-ancestor-bst` remains the recorded next question, subject to the semantic audit.

Deliverables: validate the current 36 resolving questions for actual question fit; build the 20 unresolved modules; replace inappropriate inherited matches; finish every non-video learning stage. A resolver match for sorting is not sufficient proof for merge-sorted-arrays or selection, and DFS alone is not proof of graph cloning.

Every question requires concept/invariant, suitable presets and edge cases, deterministic operation frames, correct language code maps, prediction/trace, typed input/output, runnable supported-language tests, meaningful results, and review items. Verify expected answers independently of the visual narrative. Link content gaps to the question matrix; do not invent golden status for shared rendering foundations.

Exit: all 56 audited non-video learning experiences pass their contracts, fixed-layout families pass boundary tests, practice/review results are truthful, unsupported Watch/Python capabilities stay explicit. No new backend yet.

### P5 — Engagement and account frontend completion

Scope: achievements, quests, leagues, notifications, settings and billing UI; finish any account/frontend cases left by P3.

Deliverables: idempotent rewards, accurate due/claimed/read/saved states, accessible progress feedback, confirmed cancellation/destructive intent, undo where valid, and explicit local-only/fixture data. Competitive ranks, 2FA, invoices and payment methods are not made “real” by animation.

Exit: each row of the route matrix has a passing frontend interaction/motion/responsive record; reload/back/empty/error/retry states covered; no fake success. Shared components cover each page without flattening their distinct jobs.

### P6 — Frontend freeze

Dependencies: P0–P5 complete, all 56 non-video questions complete under the Watch exception.

Deliverables: repository verification/build/E2E, all-route link/action audit, keyboard/screen-reader checks, responsive screenshots and motion recordings, production-build performance profiles, content/copy review, missing favicon/share metadata, CI checks, 404/error/deep-link recovery.

Exit: no open critical/high-severity frontend defects; no unreviewed placeholders or fabricated public claims; exact deferred capabilities documented. Freeze UI/data contracts before choosing implementation services. This is **frontend-ready**, not production-ready.

### P7 — Backend decisions, then implementation

Only after frontend freeze: select providers and architecture against actual needs/costs. No vendor choice is assumed by this roadmap.

Deliverables: identity/session and authorization model; verified recovery/optional real 2FA; data schema and migrations for profile, attempts, progress, review schedules, rewards, preferences and notifications; guest-to-account migration; server validation; content versioning; contact delivery; payment/entitlement contract if paid plans remain launch scope.

Define canonical ownership: engine state is local/presentational; account identity and authorization are server-owned; confirmed attempts/rewards/review history are durable and idempotent; billing entitlements derive from verified provider events; catalog content is versioned and reviewed. Specify retry keys, conflict resolution, clock/timezone rules and delete/export behavior before writing integrations.

Code execution needs a separate threat model. The existing browser Worker and 3-second timeout support local practice but are not a secure server judge, secret test store or anti-cheat guarantee. Do not add Python/server execution without an approved isolation/resource-limits design.

Exit: integration contracts, migration/rollback plan, selected security requirements and cost assumptions reviewed; services pass isolated tests. Do not purchase/deploy without explicit authorization.

### P8 — Integrate real services end to end

Deliverables: real signup/login/verification/recovery/session expiry/logout, protected routes and per-user authorization, cloud progress + local migration, stable review/XP transactions, notification delivery/preferences, contact receipt/retry, paid checkout/customer portal if retained, verified webhook lifecycle including duplicates/out-of-order events/refunds/cancellation.

Exit: demo fixtures cannot leak into live identity/billing; failures never display success; two users cannot access each other's records; refresh/multiple devices/retries preserve agreed state; all advertised services have successful and failed E2E evidence.

### P9 — Production hardening and release rehearsal

Deliverables: security review against chosen ASVS requirements, production dependency/build audit, CSP compatible with real integrations, rate limits and abuse controls, secret handling, data retention/export/deletion, legally reviewed policy claims for the chosen audience/regions, backups plus restore test, logs/alerts, uptime/error monitoring, incident and rollback runbooks, support ownership, production SEO/crawl policy.

Recheck full motion/performance/accessibility matrix on the integrated production build. Keep `/dev/engine` out of public production routing and indexing. A robots rule alone is not access control.

Exit: release checklist signed by accountable reviewers, no known critical/high blockers, tested recovery and rollback, explicit user deployment approval. “Build succeeds” does not satisfy this gate.

### P10 — Controlled beta, then launch decision

Beta starts only after the preceding product gates, not as a substitute for missing frontend/backend work. Validate actual first-lesson understanding, navigation, practice/review return, real-device performance and support flow with representative learners.

Measure time to first meaningful algorithm interaction, explanation/prediction accuracy, first successful practice, review return and error/drop-off points. Define success thresholds before the study after observing a baseline; do not manufacture a conversion/retention forecast. Log task observations separately from aesthetic preference.

Exit: address beta blockers; check field metrics once enough observations exist; confirm paid value/support claims and final release scope. Production launch is a separate explicit approval. Video remains a disclosed exception until separately delivered.

## 8. Definition of done — evidence, not adjectives

Every route receives **three independent sign-offs**: frontend interaction, motion/responsive/accessibility, and live-service/release readiness. “Local working” does not automatically satisfy the third.

### Required route checklist

- [ ] Every button, link, input, tab, dropdown, disclosure and keyboard shortcut inventoried; no wrong destination, inert action or misleading enabled state.
- [ ] Happy, invalid, pending, success, failure, retry, empty, disabled/locked and unavailable states covered where relevant; no made-up success toast.
- [ ] Refresh, browser back/forward, deep link, hydration, interrupted navigation and repeated action preserve the intended state; corrupt/old local storage is handled safely.
- [ ] Saved drafts/preferences are distinguished from submitted/confirmed service data; risky actions request intent and give accurate results.
- [ ] Motion source/trigger and cancellation documented; no hidden/offscreen loops; reduced-motion test includes a live preference change.
- [ ] Keyboard order, focus visibility, form labels/errors, accessible names, contrast, non-color state cues, screen-reader summaries and touch targets verified.
- [ ] Target widths, short heights, text zoom and keyboard/safe-area states have screenshots; learning routes additionally have zero-scroll/unchanging-boundary assertions across playback.
- [ ] Loading content reserves space; no accidental horizontal overflow or clipped essential content.
- [ ] Content, code, algorithm evidence, marketing claims and legal/service promises agree with shipped capability.
- [ ] Relevant tests/build pass; screenshot/recording, command, browser/device, viewport and date attached. Existing unrelated warnings remain clearly separated.

### Performance and accessibility gates

- Target WCAG 2.2 AA with manual keyboard and representative screen-reader review, not automated checks alone. Reduced-motion support is an explicit additional product requirement; do not present every motion preference as an AA criterion.
- Core Web Vitals target: LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at mobile/desktop p75. Pre-release lab evidence cannot certify these field percentiles. [Measurement guidance](https://web.dev/articles/vitals).
- Record cold/warm production-build loads with fixed CPU/network profiles and at least three repeat runs per representative route. Record actual assets transferred; set/enforce route-specific JS/font/image budgets from that baseline rather than inventing current bundle performance.
- For animation, profile maximum accepted family inputs plus simultaneous input/resize/seek. Record dropped frames and long tasks. A 60Hz display has about 16.7ms per frame, but that is a profiling budget, not a cross-device FPS guarantee.
- Keep nonessential libraries out of public route startup; lazy-load heavy editor/lesson work when needed. Fonts and SVG dimensions must not shift content. Do not add WebGL or video files to solve a small SVG interaction.
- Desktop Chromium, Firefox and WebKit coverage plus actual iOS Safari and an Android Chrome device are proposed release coverage. Viewport emulation alone must be labeled as such. Record supported versions at execution time.

## 9. Scope decisions that must remain explicit

These do not block saving or starting the frontend plan. Resolve them before their dependent phase rather than guessing:

| Decision                                                                          | Needed before                | Safe position until decided                                                                                               |
| --------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Accepted mobile focused-view prototype                                            | P4 rollout                   | Preserve current state and original visual language; do not clip or silently shrink                                       |
| Launch audience/age range and regions                                             | P7 data design / P9 policies | Do not assume adult-only, school compliance or jurisdiction-specific coverage                                             |
| Real Free/Pro limits, prices, student/campus offer                                | P7 billing                   | Existing mock prices and discount labels are not approved commercial terms                                                |
| Authentication, storage, email, hosting and payment vendors; operating budget     | P7 implementation            | Use provider-neutral frontend contracts and explicit fixtures                                                             |
| Article authorship, testimonials, logos, metrics and support response commitments | P2 public content            | Publish only substantiated claims; remove/label unverified samples                                                        |
| Campus roster/SSO/educator tooling                                                | P2 promises / P7 scope       | Do not expand into a separate institutional product because marketing copy mentions it; qualify/remove unsupported claims |
| Python runtime and video production                                               | Separate later authorization | Reader-only Python / Coming Soon Watch, never included as finished                                                        |
| Deployment and release approval                                                   | P9–P10                       | No deployment in this planning task                                                                                       |

No speculative AI chatbot, social network, mobile native app, large CMS, analytics warehouse or administration platform is added. Build only the capabilities required to fulfill the retained public product promises.

## 10. First execution packet

Start with **P0 + the shared-navigation part of P1**, not a site redesign or a bulk animation wrapper.

1. Add homepage BFS semantic fixtures that fail on the current arbitrary code-line map/terminal state/null-child example. Correct the demo using the existing engine contract while keeping the original composition.
2. Verify Play/Pause/Next/Replay/speed, interruption, hidden-tab behavior, reduced motion, exact final state and fixed card geometry; add regression tests for the corrected contract.
3. Complete mobile navigation and fix misleading destinations in `site-chrome.tsx` / `content/nav.ts`; verify keyboard/touch/back behavior.
4. Separate demo identity/auth/security/billing claims from real success; remove sample password defaults and unsupported public claims without inventing service integrations.
5. Recheck the homepage at 320/390/1024/1440/1920 and short heights, plus the captured Pricing/Contact overflow as the next P2 fixes. Show before/after evidence for original-design fidelity.
6. Run relevant tests, then `bun run verify` and `bun run build` for implementation changes; attach browser evidence and update only the gates actually passed.

### Ordered execution record — 2026-09-12

- **P0 partial:** homepage BFS semantics, seeded identity, unsupported public measurements, and fabricated legal/service claims were corrected; auth/recovery, settings security, and billing mock outcomes are explicitly labeled local previews. The complete all-route action audit remains open.
- **P1 partial:** public and app mobile navigation, real desktop sidebar collapse, corrected destinations, and hydration-ready controls are implemented. Full keyboard, reduced-motion, short-height, text-zoom, and target-width acceptance remains open.
- **P2 partial:** all eight public routes have meaningful/non-placeholder destinations and pass 390px/1440px overflow checks. Pricing selection/disclosures, Blog search/category/empty/reset, Campus inquiry routing, Contact validation/no-delivery, legal reading content, and a real Visualizer demo launch are implemented. Route-specific motion, wider device/accessibility evidence, article publishing, and every live-service dependency remain open.
- **P3 complete (frontend/local contract):** Explore retains search through result navigation, Back, and Reload; onboarding persists goals, pace, three-question diagnostic answers, skip/restart state, score, and an actual catalog-path recommendation; starting/restoring a path opens its real next algorithm. Paths derives counts/progress from catalog and local progress, visibly restores selection, and labels its static diagram as an example. Dashboard and shared app chrome use the saved local identity and onboarding pace. Mastery Map uses real prerequisite data, avoids fake hard locks, and exposes every skill as a keyboard link. Runtime progress now starts empty, and the v3 migration removes the old showcase seed while preserving later local activity. Auth/recovery operations remain explicitly local previews until P7–P8.
- **P3 evidence:** `bun run verify` passed 90 files / 1,001 tests with eight existing Fast Refresh warnings and zero errors; `bun run build` passed with the existing large-chunk advisory. Discovery/onboarding Chromium E2E passed 7/7 after the final fixes; shared app navigation/collapse passed 2/2. The route-width sweep covers P3 discovery/onboarding/auth routes at 390px and 1440px. Focused onboarding/progress tests passed 18/18, including legacy-seed migration.

### Ordered execution record — 2026-09-13

- **P4 deliberately skipped and still open:** execution moved directly to P5 by explicit user direction. None of the remaining 56-question audit, unresolved visualizer modules, Watch exception, practice/review coverage, or P4 frontend-freeze dependencies are claimed complete.
- **P5 complete (frontend/local contract):** quests and achievements use one atomic reward ledger, reject duplicate claims/redemptions, and restore earned/claimed state after Reload. Notification items come only from saved local activity; read state and draft preferences persist without claiming email or push delivery. League identity uses the saved learner profile and labels peers, ranks, tiers, promotion boundaries, and changes as deterministic fixtures. Settings validates and saves local profile drafts while explicitly leaving password, photo upload, and 2FA unconnected. Billing reports actual local usage and exposes no fake card, invoice, subscription, cancellation, checkout, or entitlement success.
- **P5 interaction and layout evidence:** Chromium P5 E2E passed 4/4 across `/quests`, `/achievements`, `/leagues`, `/notifications`, `/settings/`, and `/settings/billing`, including 390px/1440px document-fit checks, reward double-action/Reload protection, notification read/preference Reload, profile invalid/saved/Reload behavior, and fixture/service truth labels. Desktop visual review confirmed the original bright Algora composition and meaningful empty states without a site redesign or decorative global animation wrapper.
- **P5 repository evidence:** `bun run verify` passed 92 files / 1,010 tests with zero errors and the same eight Fast Refresh warnings; `bun run build` passed with the existing large-chunk advisory. Focused P5 unit coverage passed 63/63 tests across reward transactions, preference persistence, local notification generation, profile validation, quests, and gamification.
- **Still not product-ready:** P0–P2 acceptance gaps, all of P4, P6 frontend freeze, and P7–P10 service/security/release work remain open. P5 does not provide live ranks, cloud accounts, cross-device state, email/push delivery, 2FA, payments, invoices, subscriptions, or server-authoritative rewards.

### P0–P5 closeout — P4 excluded, 2026-09-13

This record supersedes the earlier partial implementation statuses for the tested local frontend scope. It does not supersede the P4 question requirements or the P6–P10 acceptance gates.

- **P0 complete for local frontend truth:** BFS frames/code are corrected; identity/recovery/payment operations disclose their local or unavailable behavior; misleading footer destinations, password-strength labels, security footers and service metadata are repaired. The route inventory and explicit unavailable editorial/service destinations are recorded in the page matrix.
- **P1 complete for the tested shared frontend foundation:** phone/tablet navigation, keyboard Escape/focus return, accessible password controls, short-screen form access, reactive reduced-motion cancellation and stable homepage demo geometry pass. Older scrolling instructions are reconciled with the fixed learning panels. Full screen-reader, physical-device, browser-zoom and cross-browser certification remains P6.
- **P2 complete for the existing public frontend/preview scope:** original design retained; pricing selection/FAQ, blog discovery, campus inquiry navigation, contact validation, legal reading and actual demo destinations are implemented. Editorial articles and newsletter remain explicitly unavailable, and real publication/delivery/commercial approval are not claimed complete.
- **P3 local frontend complete:** prior onboarding/discovery continuity evidence retained; stale summary rows reconciled with the detailed implementation record.
- **P4 skipped/open by explicit user direction.** No new question animations or learning-stage completion is claimed.
- **P5 local frontend complete:** prior reward/profile/notification evidence retained; notification preferences no longer clip at short desktop heights and all ten switches are reachable on a narrow screen.
- **Evidence:** 156/156 route/viewport checks, 22 keyboard/motion/short-screen checks and 14 public-form/reflow checks passed. Existing frontend browser suites passed 18/18; repository verification passed 92 files / 1,010 tests; production build passed. Eight existing Fast Refresh warnings and bundle/toolchain advisories remain. See [P0–P5 acceptance](P0_P5_ACCEPTANCE.md) for scripts, screenshots and precise limits.

P6 cannot be signed off while P4 is skipped. Backend, live services, production hardening and beta remain separate future work.

### Planning checklist

- [x] Current route inventory and registry counts checked.
- [x] Source-grounded gaps and focused browser evidence recorded.
- [x] First-party research converted into explicit design/testing decisions.
- [x] All-route work matrix and staged release gates written.
- [ ] P0–P10 implemented and verified.

This document completes the planning deliverable. It does not claim the website is product-ready.
