# Algora — Page-by-Page Readiness Matrix

Updated: 2026-09-13. Frontend implementation and evidence ledger; P4 is skipped and release remains open. Parent: [Product Readiness Roadmap](PRODUCT_READINESS_ROADMAP.md). Current verification: [P0–P5 acceptance](P0_P5_ACCEPTANCE.md).

## How to read this matrix

All 32 current file-route patterns are included exactly once below. `/practice/` and `/settings/` are shown with their source-declared trailing slash. `__root` and missing destinations are separate shared-surface work, not extra implemented routes.

Current evidence labels:

- **Local:** useful implemented behavior exists against browser/content state; not proof of every edge case or live services.
- **Mixed:** some real local behavior, alongside static, simulated or incomplete elements.
- **Presentation:** primarily content/illustration or unwired controls; not a completed workflow.
- **Developer:** internal diagnostic surface, not a public product promise.

For every row, the parent roadmap's state checklist, responsive/accessibility rules and evidence gates apply. The dated acceptance record distinguishes tested behavior from release work. The production gate is open on every row; viewport automation does not certify physical devices or screen readers.

Use three independent statuses during execution: `F` frontend interaction, `M` motion/responsive/accessibility, `L` live-service/release integration. Attach dated evidence before changing a status to passed; `not applicable` for a service dependency needs an explanation, not an automatic pass.

## A. Public website — P0 repairs, P1 chrome, P2 completion

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/` — [index](../src/routes/index.tsx) | P0/P2 local frontend: original composition, correct BFS frames/code, explicit playback and working destinations | Play/Pause/Next/Replay/speed; correct empty queue and visited set; no progress writes from marketing | Reactive reduced motion, pause on interruption, stable demo height and restrained existing SVG feedback | Keyboard/motion script and route sweep; broader P6 profiling and device checks open |
| `/visualizer` — [source](../src/routes/visualizer.tsx) | P2 local frontend: original showcase, labeled illustrative controls and actual demo/catalog links | Demo launches the existing learning route; illustrative disabled controls do not claim execution | Existing SVG illustrations remain stable; actual educational playback belongs to the linked workspace | Route sweep; full learning semantics remain skipped P4 |
| `/pricing` — [source](../src/routes/pricing.tsx) | P2 local frontend: working interval selection, keyboard FAQ and responsive comparison; pricing is explicitly a preview | Selection/disclosure/inquiry destinations work; checkout and student verification unavailable | Local selection and disclosure feedback; no invented payment success | Public action script and route sweep; approved prices and provider flow later |
| `/campus` — [source](../src/routes/campus.tsx) | P2 local frontend: inquiry links reach Contact; cohort tools and sample data are labeled planned/illustrative | Meaningful inquiry destination; no claim of functioning SSO or student management | Original syllabus and cohort diagrams retained as illustrations | Existing campus-link regression and route sweep; delivery and institutional tools later |
| `/blog` — [source](../src/routes/blog.tsx) | P2 local preview: search/category/count/reset/empty states work; articles and newsletter explicitly unpublished/unavailable | Honest editorial previews without dead article links or invented publication; no newsletter success | Existing SVG art and local filter feedback | Existing filter/empty regression and route sweep; article publishing remains open |
| `/contact` — [source](../src/routes/contact.tsx) | P2 local frontend: labeled required fields, email validation, live character count and meaningful destinations | Invalid inputs blocked; valid form explicitly says nothing was sent/stored; input remains editable | Inline status and focus feedback; phone reflow | Public action script and route sweep; real delivery/retry later |
| `/privacy` — [source](../src/routes/privacy.tsx) | Local preview policy and reading interactions; fabricated provider/retention claims removed | Reading/navigation/search/copy controls remain; contact destination works | Stable reading layout and brief feedback | Public/legal regression and route sweep; legal approval after service decisions |
| `/terms` — [source](../src/routes/terms.tsx) | Local preview terms and reading interactions; fabricated commercial guarantees removed | Reading/navigation and policy destinations remain; no live commercial agreement claimed | Stable reading layout and brief feedback | Public/legal regression and route sweep; commercial/legal approval later |

## B. Identity and recovery — P0 truth, P3 frontend, P7–P8 real services

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/auth` — [source](../src/routes/auth.tsx) | P3 frontend contract complete: empty credentials, local-profile validation, and explicit preview boundary; provider actions do not claim authentication | Real signup/session/provider errors remain P7–P8 | Stable local field feedback; no fake provider success | Included in 390px/1440px P3 route sweep; real identity verification is still required before production |
| `/login` — [source](../src/routes/login.tsx) | P3 frontend contract complete: local profile entry is labeled, unsupported persistence control removed, and recovery/legal destinations work | Real credentials, session, expiry and protected-route enforcement remain P7–P8 | Immediate local validation without a fake success ceremony | Included in P3 route sweep; passwords are not persisted |
| `/verify-email` — [source](../src/routes/verify-email.tsx) | P3 frontend contract complete: six empty digits, input validation, incomplete-state blocking, and explicit no-email/no-verification disclosure | Provider tokens, expiry, resend throttling and verification remain P7–P8 | Focus moves only for deliberate digit entry; no server success is invented | Included in P3 route sweep; cannot be called verified without service evidence |
| `/forgot-password` — [source](../src/routes/forgot-password.tsx) | P3 frontend contract complete: validates the address and states that no recovery email is delivered in local preview | Privacy-preserving provider request, throttling and delivery remain P7–P8 | Stable form-to-local-information transition | Included in P3 route sweep; no email success claim |
| `/reset-password` — [source](../src/routes/reset-password.tsx) | P3 frontend contract complete: empty inputs and length/digit/uppercase/confirmation validation with explicit local-preview behavior | Real single-use reset context and save result remain P7–P8 | Criteria update locally; no server password-change success is shown | Included in P3 route sweep; no password logging/storage |

## C. Onboarding — P3, then persistence integration

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/onboarding/goals` — [source](../src/routes/onboarding/goals.tsx) | P3 complete locally: empty honest start, required goal, selectable pace/level, back/edit, and persisted resume state | Real account migration remains a P7–P8 integration concern | Immediate border/check feedback; controls wait for hydration without delaying deliberate input | Browser-tested through the full local flow at 390px/1440px; `algora-onboarding` persists on this device |
| `/onboarding/assessment` — [source](../src/routes/onboarding/assessment.tsx) | P3 complete locally: three repository-grounded questions, deterministic score, correct/incorrect explanation, partial resume, skip, completion redirect, and retake | Expand only with reviewed diagnostic content; do not imply psychometric precision | Stable question area and immediate checked-answer feedback; answer is not revealed before Check | Known-answer E2E covers all questions plus skip/retake; backend profile sync remains later |
| `/onboarding/path` — [source](../src/routes/onboarding/path.tsx) | P3 complete locally: recommendation derives from first saved goal; pace/starting point/path weeks/modules/algorithms come from saved state and current catalog | Account migration and cross-device persistence remain P7–P8 | Recommended modules and first lessons are highlighted without a fake generation spinner | Reload retains the recommendation; Start stores the real path and opens its actual first algorithm |

## D. Discovery and learner home — P3

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/dashboard` — [source](../src/routes/dashboard.tsx) | P3 complete locally: fresh state is zero, saved profile identity and onboarding pace restore after Reload, and recommendations/activity/path derive from local progress | Cloud sync, multi-device state and reward hardening remain P5/P7–P8 | Only confirmed progress drives bars and next actions; deterministic empty state replaces showcase mastery | Identity/pace Reload E2E passes; progress-store v3 strips the legacy demo seed without deleting later local activity |
| `/explore` — [source](../src/routes/explore.tsx) | P3 complete locally: validated search, combined filters/sort/page, count, no-results/reset, responsive controls, and URL state | Bookmarked catalog view can be expanded in a later accepted scope | Result replacement stays stable; hydration-ready search prevents lost first input | Search survives result navigation, Back and Reload in Chromium; 390px/1440px sweep passes |
| `/paths` — [source](../src/routes/paths.tsx) | P3 complete locally: catalog-derived algorithm/time counts, earned progress, hydration-ready selection, active-path marker, next algorithm, and truthful local-storage principles | Cross-device/account path ownership remains P7–P8 | Active selection changes the existing card treatment; the static map is explicitly labeled an example | Fresh selection persists and visibly restores; 390px/1440px route checks pass |
| `/mastery-map` — [source](../src/routes/mastery-map.tsx) | P3 complete locally: graph and prerequisite links derive from catalog/progress, scale controls work, every node opens, and all skills have a visible keyboard-list equivalent | Cross-device selection/history remains P7–P8 | Stable graph positions and internal canvas pan/zoom; no fabricated blocked state | Keyboard navigation to Dijkstra and responsive route checks pass; dense canvas remains internally pannable on narrow screens |

## E. Learning, practice and return — P4, frontend freeze, integration

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/algorithms/$slug` — [source](../src/routes/algorithms.$slug.tsx) | Local/mixed: shared workspace, 36 resolving questions and partial Golden coverage; unsupported content remains | Full non-video stage chain; input/preset validation; Play/Pause/Back/Next/Replay/seek/speed; predictions and trace feedback; code-language consistency; unavailable/invalid slug states | Real family-specific operations from one frame. Fixed desktop left/right panels and visible separated controller; mobile focused views preserve step; node labels never collide | All 56 question contracts/edge cases, state/line synchronization, deterministic seek/interruption, no scroll or moving boxes at accepted limits; Watch stays Coming Soon |
| `/practice/` — [source](../src/routes/practice.index.tsx) | Local: problem catalog/filter/navigation | Find/filter/sort/reset, difficulty/status, no results, resume draft and meaningful problem links; available language/runner capability explicit | Selection/results feedback and stable list/card positions; not a generic repeated reveal sequence | Query/back/deep-link and empty state tests; readable mobile browsing; progress updates after accepted result |
| `/practice/$slug` — [source](../src/routes/practice.$slug.tsx) | Local: editor, sample/submit paths and Worker runner; Python explicitly unsupported for running | Draft/language persistence, run/submit distinction, reset confirmation, executing/cancel/timeout/error/pass/fail, input-output detail; focus and shortcut behavior | Highlight relevant test/result change only; keep editor/workspace controls reachable and stable; focused mobile editor/results views | Typed IO, supported-language tests, Worker cleanup/timeout, stale result cancellation, repeat-submit/XP idempotency; no trusted-judge or hidden-test secrecy claim for browser tests |
| `/practice/results` — [source](../src/routes/practice.results.tsx) | Local: result-store-driven summary and next actions | Accurate attempted/pass/fail/accepted details, retry/review/next destinations, missing/stale result and direct-load recovery; no result fabricated on refresh | One outcome transition with textual verdict; show actual result values immediately; no fake increasing score | Refresh/back/no-result, problem/result association, repeat-navigation no duplicate reward; durable attempts later |
| `/review` — [source](../src/routes/review.tsx) | Local: question-specific review items, grading and SRS flows; content coverage incomplete | Due/empty/in-session/completed/interrupted states; answer/reveal/grade semantics, session resumption and correct next due; complete coverage per question | Reveal explanation after learner action; stable flashcard/task geometry; small confirmed mastery update, no continuous celebration | Correct answer fixtures and schedule tests, clock/timezone boundaries, repeated grades no duplication, screen-reader/keyboard; durable schedule/conflict policy later |

## F. Engagement — P5, then server-owned outcomes

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/quests` — [source](../src/routes/quests.tsx) | P5 complete locally: all 12 catalog quests derive from current progress; claim, XP and ledger commit atomically | Available/completed/claimed states, meaningful task destinations, special-period empty state, and duplicate/reload protection implemented | Progress and claim feedback follow the confirmed transaction; no reward is shown before the store changes | Chromium double-action/Reload E2E passes; day/period keys are deterministic; server-authoritative awards remain P7–P8 |
| `/achievements` — [source](../src/routes/achievements.tsx) | P5 complete locally: all 24 badges use current achievement criteria; unlock XP and shop redemption use the atomic ledger | Locked/unlocked criteria, tier/status filters, filter empty state, affordability/cap, confirmation and nonduplicated redemption implemented | Static readable badge states with focused progress/redeem feedback; no autoplay celebration or fabricated ownership | Reward/shop unit invariants and redemption Reload E2E pass; server validation and durable ownership remain P7–P8 |
| `/leagues` — [source](../src/routes/leagues.tsx) | P5 complete as an explicit fixture: saved local learner identity/weekly XP are separated from deterministic sample peers, ranks and tier boundaries | Current learner row, sample ranking/tier explanation and fixture limitations are visible; no demo persona or live-competition claim remains | Stable table/standing composition; no fake live rank-change animation | 390px/1440px fit and identity/truth-label E2E pass; real opt-in multi-user data, ranking rules and anti-abuse remain P7–P8 |
| `/notifications` — [source](../src/routes/notifications.tsx) | P5 complete locally: inbox derives only from saved achievements, quest claims, lessons, problems and streak activity | Read/unread/all-read, destinations, real empty state, draft/reset/save preferences and quiet hours persist locally | Read marker/count and filter state change directly; no bouncing popup or fake delivery feedback | Read count and preference Reload E2E pass; email/push delivery, timezone policy and service retry remain P7–P8 |

## G. Account and billing — P0 truth, P5 frontend, P7–P8 services

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/settings/` — [source](../src/routes/settings.index.tsx) | P5 complete locally: saved profile starts empty/current, validates drafts, restores on Reload, and cannot persist fake 2FA | Dirty/save/reset/invalid states and associated field errors implemented; password, photo upload and 2FA remain visibly unconnected | Quiet saved-state confirmation and readable form/error relationships; no security-success animation | Validation/profile Reload E2E and unit tests pass; reauthentication, enrollment/recovery, session revocation and data controls remain P7–P8 |
| `/settings/billing` — [source](../src/routes/settings.billing.tsx) | P5 complete as unavailable frontend: no seeded card, invoice, paid plan, renewal date, cancellation or local entitlement toggle remains | Free local access and actual saved usage are visible; checkout, subscription, payment method and invoice controls are accurately disabled/unconnected | Stable usage/availability summary; no fake pending, paid, upgrade or cancellation state | Truth-label and 390px/1440px fit E2E pass; commercial terms/provider workflow/webhooks and verified entitlements remain P7–P8 |

## H. Developer route — P6/P9 production exclusion

| Route / source | Current evidence | Required interactions and states | Meaningful motion / composition | Verification and live dependency |
| --- | --- | --- | --- | --- |
| `/dev/engine` — [source](../src/routes/dev.engine.tsx) | Developer: engine diagnostics/fixtures | Preserve useful local diagnostics; exclude from public production navigation/routing or protect through an explicitly reviewed policy | Diagnostic accuracy, not marketing polish; useful boundary/seek/reduced-motion fixtures | Production deep-link and indexing checks; exclude sensitive fixture/debug output; hiding a nav link is not access control |

## Shared surfaces — not additional file-route patterns

| Surface | Work required | Acceptance |
| --- | --- | --- |
| Public navigation/footer | Mobile menu; correct Compete/Blog and all label/destination mismatches; active route, login access, brand home link; accessible disclosure/focus return | No `#` placeholders, missing hrefs or unrelated home redirects; touch/keyboard/back/deep-link checks |
| App shell/navigation | Current local identity/progress, correct selected section, responsive navigation and dialogs; no duplicate conflicting persona | Every app route reachable with keyboard/touch; shell does not introduce visualizer scrolling or cover controller |
| Root loading/error/not-found | Helpful boundary messages, meaningful retry/home/back actions, safe recovery from invalid slug/loader/render failure | No blank screen, silent loop or lost recoverable draft; SSR and hydrated behavior verified |
| Forms, dialogs, popovers, toasts | Semantic labels, associated validation, async state contract, Escape/focus return, persistence semantics | No false success, inaccessible clipping or focus traps; motion adapts to reduced preference |
| Metadata/assets/indexing | Correct favicon, social image, titles/descriptions/canonical policy, public sitemap if appropriate, private/developer no-index policy | Actual production asset responses inspected; public vs private routes audited; no private data in metadata |
| Runtime/account states | New/returning guest, signed-in/out/expired session, offline/slow/retry, empty account, old/corrupt local storage | State ownership is explicit, cross-user leakage prevented, error recovery tested; no manufactured signed-in state |

## Missing destinations and claims: resolve deliberately

These are **not counted as implemented routes** and do not justify automatically expanding the product:

- Blog article detail: required if real articles are retained; create a reviewed content destination with not-found/metadata, or remove misleading article links until content exists.
- About / Changelog / Glossary: each label must lead to relevant content, an accurately labeled existing section, or be removed from advertised navigation. Do not send all three home.
- Campus roster / educator analytics / SSO: either a separately authorized capability with real data/service work or clearly planned/removed copy; not simulated institutional software.
- Newsletter / student verification / customer billing portal: choose a working destination/provider workflow or explicit unavailable state. No local-only success.
- Public support/contact: retain only functioning destinations and actual operational commitments.

## Execution tracking

Do not check off a group because a shared hover class was added. Each route must have a ledger entry containing route + source revision, changed actions, state cases, motion contract, viewport/browser/device evidence, tests, live dependency and remaining issues.

| Group | Frontend gate | Motion/responsive/accessibility gate | Live/release gate |
| --- | --- | --- | --- |
| A — Public (8 routes) | P0/P2 local frontend implemented: truthful claims, working discovery/disclosures/form validation and meaningful destinations; editorial publication remains explicitly unavailable | Responsive and representative keyboard/motion checks recorded in P0–P5 acceptance; full P6 certification open | Open; identity, delivery, campus tools, article publication, newsletter, legal approval and billing remain unavailable |
| B — Identity (5 routes) | P3 local frontend complete: validation, labeled preview actions and truthful recovery/security state | P6 phone login/signup: 30 one-viewport state checks passed, including 320×480; homepage still scrolls. Physical keyboard/device certification open. See [P6 evidence](P6_FRONTEND_ACCEPTANCE.md). | Open; no real account/email recovery service |
| C — Onboarding (3 routes) | P3 local frontend complete: saved goals/pace/assessment, retake/skip and catalog-derived path recommendation | Existing Chromium journeys and route sweep pass; full P6 certification open | Open; cloud migration and account ownership later |
| D — Discovery/home (4 routes) | P3 local frontend complete: URL search/back/reload, saved path/resume, own progress/identity and prerequisite links | Existing Chromium journeys and route sweep pass; full P6 certification open | Open; cloud synchronization and durable ownership later |
| E — Learning/practice/review (5 patterns) | Open; 56-question completion required | Open; family history is not full-device certification | Open |
| F — Engagement (4 routes) | P5 complete for local/fixture contracts; atomic rewards, persisted notification state and saved identity implemented | P5 responsive/state gate passes in Chromium at 390px/1440px; full P6 device/manual accessibility matrix remains open | Open; rewards, delivery and competition are not server-authoritative |
| G — Account/billing (2 routes) | P5 complete for local profile and explicit unavailable billing/security contracts | P5 responsive/state gate passes in Chromium at 390px/1440px; full P6 device/manual accessibility matrix remains open | Open; no real identity, security, billing or entitlement service |
| H — Developer (1 route) | Local diagnostic review | Relevant diagnostic checks only | Production exclusion/protection open |

Total: **32 route patterns**. The canonical learning content and backend release gates remain mandatory alongside this page matrix.
