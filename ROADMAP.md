# Algora — Canonical Product Roadmap

> **Product promise:** Algora helps a learner understand why an algorithm works, not only memorize code.
>
> **Learning journey:** `CONCEPT → WATCH → VISUALIZE → PREDICT → TRACE → CODE → SOLVE → REVIEW → MASTER`
>
> **Release rule:** Beta begins only after all 56 questions, all frontend pages, educational and product motion, responsive behaviour, the backend, integration, and production hardening are complete.

---

## Active Priority — All-Pages Interaction, Motion, and Product Readiness (planned 2026-09-12)

**Latest user direction:** create a researched, complete roadmap for every page to become interactive, animation-first, responsive and product-ready, while preserving the original Algora design. This is not another homepage redesign or authorization to deploy.

- Execution specification: [All-Pages Product Readiness Roadmap](docs/PRODUCT_READINESS_ROADMAP.md).
- Complete route inventory and required interactions/motion: [Page Readiness Matrix](docs/PAGE_READINESS_MATRIX.md) — all **32 file-route patterns**, plus shared surfaces and missing destinations.
- Live registry baseline: **56 questions, 36 resolving to runnable modules, 34 registered modules**. The question matrix records **14 explicit learning slices**; resolution is not full semantic/Golden completion.
- Order: truth/correctness repairs → shared navigation/motion → public pages → discovery/onboarding → all 56 learning experiences → engagement/account frontend → frontend freeze → backend → integration → hardening → beta. This user-directed page priority brings relevant phases 6–8 forward without bypassing the existing question or release gates.
- Execution exception recorded 2026-09-13: by explicit user direction, Product Readiness P4 was skipped and remains open; P5 engagement/account is complete only for its verified local/fixture frontend contract. This does not change the 56-question or release gates.
- P4 resumed 2026-09-29 at the user's direction: each of the 56 questions requires its own visual explanation, with synchronized code on desktop and a focused animation on phones. [Question scene rollout](docs/QUESTION_SCENE_ROLLOUT.md) records all 56 directions. Trapping Rain Water is the first implemented scene; the rest are pending review or implementation. Earlier runnable-module counts do not imply acceptance of their scene design.
- P6 local closeout 2026-09-14: phone login/signup fit one viewport; homepage retains scrolling. Chromium/Firefox/WebKit checks, accessibility repairs, production recovery, bundle budgets and throttled profiles are delivered. See [P6 evidence and remaining freeze gates](docs/P6_FRONTEND_ACCEPTANCE.md). User confirmed no public domain or physical-device testing is available. P4, manual accessibility/device review and hosted CI evidence still prevent final freeze; backend/deployment is not authorized.
- Current frontend checkpoint: Product Readiness P0–P3 and P5 local frontend pass delivered, with 156/156 viewport checks and passing keyboard/motion/form regressions. See [acceptance evidence and limitations](docs/P0_P5_ACCEPTANCE.md). P4, P6 freeze and all live/release services remain open; editorial articles and Watch are still unavailable as disclosed.
- First packet: correct homepage BFS semantics while keeping its original composition; complete mobile navigation; remove misleading demo/auth/security/billing success claims. Pricing and Contact have confirmed mobile overflow and enter the public-page repair packet.
- Fixed learning panels, no visualizer scrolling, readable bounded inputs and the visible bottom controller remain mandatory. Marketing/document pages retain normal vertical reading scroll. Watch remains Coming Soon; no production service or video is marked complete by this plan.
- The older homepage completion claim is narrowed below: an implementation pass exists, but semantic/motion/mobile-navigation acceptance is reopened. Full-site implementation and release remain open.

### Previous checkpoint — Original Homepage Motion (implementation pass; acceptance reopened)

**User-directed correction:** pause question/algorithm expansion, preserve the original homepage design, and turn its static sections into a responsive page with meaningful SVG motion and working interactions. The rejected replacement design was removed.

- The implementation matrix records **36/56 questions resolving to runnable modules**, **20 requiring new or question-specific modules**, and **14 explicit Code/Solve/Trace/Review slices**. These counts do not mean every inherited animation is polished or all questions are complete.
- Latest delivered question: Validate Binary Search Tree. The next recorded question, `lowest-common-ancestor-bst`, is parked while homepage work takes priority.
- Homepage work brings the homepage portion of phases 6–8 forward; remaining product phases and release gates remain open. Watch videos stay deferred.
- Delivery record: [Original Homepage Motion Roadmap](docs/HOMEPAGE_STORYTELLING_ROADMAP.md).
- Planning assumption: normal vertical document scrolling on the marketing homepage; fixed, readable demo boxes with no internal scrolling. Existing learning visualizer routes retain their fixed panels and zero-scroll contract.

### Homepage execution sequence

- [x] H0 — Audit the existing homepage and record the priority change.
- [x] H1 — Restore the original composition and make its layout responsive without replacing its design.
- [x] H2 — Correct BFS operation/code/terminal-state semantics while retaining working playback controls and the original card. Verified on 2026-09-12 with deterministic fixture tests and a browser run through the empty-queue terminal state.
- [x] H3 — Animate the existing SVG/card sections and connect every visible homepage action to a real route.
- [ ] H4 — Reverify stable demo geometry, reduced-motion lifecycle, mobile navigation and responsive behavior after the corrections. Earlier viewport checks are historical, not full acceptance.
- [x] H5 — Pass `bun run verify` and `bun run build`, inspect browser screenshots, and record evidence.

**Current state:** the original homepage composition and motion implementation are preserved, but the 2026-09-12 sitewide audit found unresolved correctness and mobile-navigation issues. See the new roadmap findings A01–A12. The current request expands planning to every route; it does not mark those routes implemented. Deployment remains separately authorized.

---

## Source of Truth and Working Rules

This document is the active execution order for Algora. It supersedes the older static-first release ordering in the prior roadmap.

- Do not rebuild an existing architecture before auditing it.
- Do not claim completion without current verification.
- Preserve the design, learning, and visualizer contracts in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), [`docs/LEARNING_EXPERIENCE.md`](docs/LEARNING_EXPERIENCE.md), and [`docs/VISUALIZER_CONTRACT.md`](docs/VISUALIZER_CONTRACT.md).
- Keep visualization renderers presentational, domain logic pure, and progress state in the existing progress store.
- No backend, cloud progress, Python execution runtime, or new algorithm family until the relevant roadmap phase authorizes it.
- Every implementation phase ends with `bun run verify`; browser, responsive, and accessibility checks are added where the phase requires them.

---

## Original Baseline — Historical Reference

This table records the earlier Binary Search checkpoint, not current checkout cleanliness or current coverage. Use the active priority above and the question implementation matrix for current planning.

| Area                       | Current evidence in this checkout                                                                                       | Status      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| Repository                 | `main` at `6820edc` (`Added Binary Search review`); clean worktree                                                      | Confirmed   |
| Binary Search workspace    | Guided visualizer, variables, reasoning, semantic playback, prediction, trace, code and solve-stage wiring exist        | Implemented |
| Code and Solve distinction | Code uses `binary-search-classic`; Solve uses `search-insert-position`                                                  | Implemented |
| Review                     | `/review`, six Binary Search active-recall items, SRS card grading, stage-strip wiring, and derived mastery logic exist | Implemented |
| Catalog                    | Repository contains 56 problem records and 26 algorithm records                                                         | Confirmed   |
| Backend                    | No real auth, database, cloud progress, or server-authoritative progression is implemented                              | Not started |
| Full product completion    | All 56 Golden learning experiences, all pages, product-wide motion, responsive QA, and frontend freeze are not complete | Not started |

### Immediate verification checkpoint

The latest Binary Search Review implementation must be verified in the current checkout before it is treated as the frozen master template:

- `bun run verify`
- `bun run build`
- `bun run test:e2e`
- Browser checks for Code → Solve → Review, review outcomes, SRS scheduling, and stage states
- Keyboard, reduced-motion, and responsive checks for the full Binary Search journey

---

## Phase 1 — Finish and Freeze the Binary Search Golden Template

**Purpose:** establish one complete, reusable learning specification before scaling.

**Status:** frozen for Phase 2 with one explicit product exception: Binary Search Watch remains an inert Coming Soon stage until the video is produced and approved.

### 1.1 Verify the existing Binary Search journey

- [x] Verify Visualize, Predict, Trace, Code, Solve, and Review in the current checkout.
- [x] Verify `binary-search-classic` completion is authoritative for Code.
- [x] Verify `search-insert-position` completion is authoritative for Solve.
- [x] Verify Review does not mark the learner permanently mastered after one session.
- [x] Verify no duplicate XP, streak, SRS, or mastery reward can be farmed through refresh, revisit, or navigation.

### 1.2 Complete any remaining Golden-template requirements

- [x] Defer Binary Search Watch as Coming Soon; map the title, duration, captions, and Continue to Visualize action when the approved video is available.
- [x] Complete Binary Search mobile and desktop behaviour across 320, 375, 390, 430, tablet, 1024, 1440, and 1920 pixel widths.
  - Verified 2026-08-29 and corrected 2026-08-31: the shared desktop workspace uses fixed panel geometry and a fixed 58px playback row; visualizer panels do not scroll.
  - Measured identical boundaries across Binary Search Compare, Eliminate, and Found states, plus BFS and Merge Sort representative states. At 1920×955 the workspace remains 715px tall, playback remains `top 889 / bottom 947`, page scroll remains zero, and the full controller stays inside the viewport.
  - Browser evidence also passed at 1440×900 and 1024×768; focused E2E passed the 320px Golden journey, target-width reflow, desktop journey, and Binary Search visual check.
- [x] Complete the Binary Search edge-case, accessibility, motion, navigation, and browser QA matrix.
- [x] Fix only confirmed gaps found by these checks.

### 1.3 Freeze the template

The Binary Search template is frozen with Watch recorded as a deliberate Coming Soon exception. When the approved video is available, Watch must still supply the complete mapping below without changing the frozen Visualize baseline.

`CONTENT + WATCH + VISUALIZER + PREDICT + TRACE + CODE + SOLVE + REVIEW + MASTERY + MOBILE + ACCESSIBILITY + ANIMATION + EDGE CASES + TESTS`

**Definition of done:** a learner can move through the whole journey with one clear next action, and each stage has distinct evidence:

| Stage     | Meaning                                   |
| --------- | ----------------------------------------- |
| Visualize | I understand what happens.                |
| Predict   | I can anticipate a decision.              |
| Trace     | I can execute the algorithm.              |
| Code      | I can implement it.                       |
| Solve     | I can adapt the pattern.                  |
| Review    | I can recall it later.                    |
| Master    | I have repeatedly demonstrated retention. |

---

## Phase 2 — Extract the Universal Learning System

**Purpose:** turn the proven Binary Search patterns into reusable components and contracts before applying them to 56 questions.

**Status:** complete and frozen for the Phase 3 catalog audit. Phase 1 Watch remains explicitly deferred as Coming Soon.

### Phase 2 entry gate

- [x] Record Binary Search Watch as an approved Coming Soon exception; finish its media mapping in a later content pass.
- [x] Re-verify the fixed desktop workspace, complete playback controller, responsive matrix, and no step-to-step box movement.
- [x] Capture the approved Binary Search baseline: key screenshots, DOM structure, keyboard behaviour, reduced motion, deep links, and passing verification commands.
- [x] Freeze the Phase 1 acceptance evidence before changing shared boundaries, with Watch documented as the only deferred stage.

### 2.1 Produce the reuse-boundary audit

- [x] Inventory every Binary Search learning component, its consumers, state dependencies, and tests.
- [x] Classify each item as `KEEP SHARED`, `EXTRACT`, `SPLIT`, `ALGORITHM-SPECIFIC`, or `DEFER`.
- [x] Record confirmed existing shared primitives before creating anything new:
  - frame dispatch and family views: `FrameView`, `ArrayView`/`ArrayCanvas`, `TreeView`, `GraphView`, `GridView`, and `TableView`
  - teaching views: `VariableBoard`, `CurrentOperation`, `ExpressionView`, and `AuxPanels`
  - playback: `ControlStrip`, `StepTimeline`, `SpeedControl`, and `PlaybackBand`
  - interaction: `PredictionGate` and the existing Trace components
- [x] Treat `GoldenWorkspace`, `AlgorithmWorldPanel`, and the lesson route composition as candidate boundaries, not automatically reusable abstractions; require a real second consumer before generalizing their APIs.
- [x] Identify mixed-responsibility files, especially `WorkspacePanels.tsx`, and define the smallest safe split without changing behaviour.

**Deliverable:** `docs/UNIVERSAL_LEARNING_SYSTEM.md` containing the inventory, decision table, ownership rules, and dependency direction.

### 2.2 Freeze the data and ownership contracts

- [x] Document the existing engine boundary: algorithm modules produce deterministic `AlgorithmRun`/`Step`/`Frame` data; React does not calculate algorithm execution.
- [x] Document which step fields are universal, which are optional enhancements, and how older modules degrade when metadata is absent.
- [x] Define the presentation inputs for frame, variables, operation, reasoning, code synchronization, timeline, prediction, and trace without adding algorithm-specific conditions to shared UI.
- [x] Keep derived teaching logic pure in `src/lib`; stores own playback/progress state; components only render and dispatch learner actions.
- [x] Define the family contract categories required by the current engine: array, tree, graph, grid, table, and auxiliary stack/queue/key-value/log/cost data.
- [x] Do not redesign engine types in this phase unless the audit proves an existing Golden requirement cannot be represented.
  - Verified 2026-08-30: the frozen contracts, fallback rules, presentation inputs, ownership matrix, and dependency direction are recorded in `docs/UNIVERSAL_LEARNING_SYSTEM.md`; no engine schema change was required.
  - `learning-contract.test.tsx` now sweeps every registered preset for deterministic output and required step fields, exercises optional-metadata degradation, and server-renders every frame and auxiliary family.
  - Phase 2.2 passed 133 focused tests, `bun run verify` (61 files / 756 tests), and `bun run build`.

### 2.3 Split and expose proven shared pieces

- [x] Split mixed panel code only where ownership is already clear: code, reasoning, input, about, and shell composition.
  - Verified 2026-08-29: `CodePane`, `ExplainPane`, `InputPane`, and `AboutPane` now have owned files; `WorkspacePanels.tsx` retains compatibility composition and exports.
  - The extraction passed `bun run verify` (747 tests), `bun run build`, and four focused Chromium baselines: desktop journey, 320px journey, target-width reflow, and Binary Search screenshot.
- [x] Give each extracted component a narrow typed API, one owner, and a direct test; avoid prop bags that expose player-store internals unnecessarily.
- [x] Consolidate public exports for the learning workspace, player, visualization, prediction, and trace packages.
- [x] Remove duplication created by the extraction, but do not refactor unrelated routes or algorithm modules.
- [x] Preserve existing CSS geometry, focus order, accessible names, keyboard shortcuts, and responsive ordering exactly.
  - Verified 2026-08-30: Prediction now reuses the typed `ChoiceGroup` and `LearningFeedback` contracts already exercised by Trace, while retaining its own store transitions, wording, and Continue/Retry/Reveal actions.
  - Public barrels and direct tests now cover learning, player panes, prediction, trace, visualization, and workspace boundaries.
  - Phase 2.3 passed 61 focused tests, `bun run verify` (64 files / 763 tests), `bun run build`, and the four frozen Chromium baselines: desktop journey, 320px journey, target-width reflow, and Binary Search screenshot.

### 2.4 Establish the reusable learning-workspace contract

- [x] Document the canonical composition: lesson context and stages → Algorithm World + Code/Reasoning → full-width playback.
- [x] Keep desktop boxes fixed between execution steps; neither dynamic content nor the page scrolls.
- [x] Keep the controller fully visible and fixed in height on desktop; mobile keeps Previous, Play/Pause, and Next immediately accessible.
- [x] Define slots or typed composition points only for demonstrated variation: frame family, auxiliary state, reasoning content, prediction, trace, input, and stage handoffs.
- [x] Keep Code, Solve, Review, mastery, XP, streak, and completion authority in their existing product-state sources.
- [x] Do not rename or replace `GoldenWorkspace` merely for architectural symmetry; change it only if the extracted contract requires it.
  - Verified 2026-08-30 and corrected 2026-08-31: `docs/UNIVERSAL_LEARNING_SYSTEM.md` freezes desktop/mobile composition, zero-scroll ownership, demonstrated typed variation points, and product authority without adding speculative slots or renaming `GoldenWorkspace`.
  - Four focused workspace-contract tests protect semantic composition, the fixed `58fr / 42fr` desktop grid and `58px` controller row, mobile transport ordering, and the five-phase non-scrolling timeline window.
  - Phase 2.4 passed `bun run verify` (65 files / 767 tests), `bun run build`, and all four frozen Chromium baselines: desktop journey, 320px journey, target-width reflow, and Binary Search screenshot.

### 2.5 Extract interaction and feedback contracts

- [x] Reuse one accessible choice/answer pattern across Prediction and Trace only after confirming their feedback and focus requirements match.
- [x] Document prediction blocking, skip, reveal, replay, and URL-seek behaviour.
- [x] Document trace attempt, correction, completion, and handoff behaviour without coupling Trace state to the guided player store.
- [x] Standardize feedback semantics—correct, incorrect, explanation, retry, and next action—without flattening meaningful stage differences.
- [x] Verify step changes never move DOM focus or vertically scroll the page.
  - Verified 2026-08-30: Prediction and Trace share native-radio `ChoiceGroup` and focused polite `LearningFeedback`, while their stores, progression, and next actions remain separate.
  - Trace now keeps correct/revealed explanations visible until explicit Next step/Complete trace acknowledgement; incorrect attempts retain explicit Try again and Show answer actions and never advance learner state.
  - Headed Chromium confirmed controller focus survives entry into a blocking prediction at `scrollY = 0`, incorrect Prediction focuses its explanation, and correct Trace focuses/preserves its explanation with progress unchanged until acknowledgement.
  - Phase 2.5 passed 62 focused interaction/contract tests, `bun run verify` (66 files / 774 tests), `bun run build`, and all four frozen Chromium desktop/mobile baselines.

### 2.6 Prove the system with existing modules

- [x] Keep Binary Search as the locked visual and behavioural reference throughout extraction.
- [x] Exercise the extracted frame and playback contracts against representative existing array, tree, graph, grid/table, and auxiliary-panel modules; this is contract validation, not Phase 5 completion.
- [x] Add or update focused tests for each extracted boundary, synchronization, backward compatibility, keyboard behaviour, and reduced motion.
- [x] Compare the post-extraction Binary Search milestones against the Phase 1 baseline at desktop and mobile target widths.
- [x] Run `bun run verify`, `bun run build`, and the relevant browser E2E suite after each focused extraction set.
  - Verified 2026-08-30: Binary Search, Heap Sort, BFS, Quick Sort, Merge Sort, and Koko Eating Bananas exercise every frame family emitted by registered modules (`array`, `tree`, and `graph`) and every real auxiliary family (`stack`, `queue`, `keyvalue`, `log`, and `cost`) through the extracted workspace and player contracts.
  - `grid` and `table` remain typed renderer fixtures because no registered module currently emits either family; Phase 2 did not invent placeholder Phase 5 content to claim production coverage.
  - Focused contract coverage passed 40 tests for cross-module rendering, synchronization, optional-metadata compatibility, keyboard behaviour, reduced motion, and fixed workspace/playback geometry.
  - Headed Chromium confirmed the tree, graph with queue/log, and problem-specific array with cost/piles variants retain the semantic Algorithm World and Playback regions. The frozen Binary Search desktop journey, 320px journey, target-width reflow, and screenshot baselines all passed.
  - Phase 2.6 passed `bun run verify` (66 files / 782 tests), `bun run build`, and all four relevant Chromium E2E baselines.

### Phase 2 definition of done

- [x] `docs/UNIVERSAL_LEARNING_SYSTEM.md` is complete and matches the code.
- [x] Reusable boundaries have at least two demonstrated consumers or a contract-mandated reason to exist.
- [x] Algorithm execution remains pure and algorithm-specific; reusable React contains no Binary Search branching.
- [x] Binary Search has no visual, behavioural, responsive, accessibility, navigation, or progression drift.
- [x] Existing algorithm modules still render through the compatible frame contract.
- [x] No parallel visualizer, duplicate player, speculative family API, or backend work was introduced.
- [x] All Phase 2 verification gates pass, then the universal learning system is frozen for the Phase 3 catalog audit.
  - Phase 2 frozen 2026-08-30. The next implementation step is Phase 3: audit and classify the actual 56-question catalog before creating new question-specific visualization work.

---

## Phase 3 — Audit and Classify All 56 Questions

**Purpose:** build from actual catalog data, not assumptions.

**Status:** complete. The verified matrix is frozen as the input to Phase 4 family work.

- [x] Audit every existing question and algorithm record.
- [x] Create and maintain an implementation matrix with:
  - question and algorithm/pattern
  - data structure and frame type
  - variables and auxiliary structures
  - important operations and visual semantics
  - prediction and trace interaction type
  - Code, Solve, and Review mapping
  - animation, responsive, accessibility, test, and completion status
- [x] Group by actual reusable families: arrays/searching, two pointers, sliding window, sorting, stacks/queues, linked lists, trees/BSTs, heaps, graphs/BFS/DFS, grids, recursion/backtracking, greedy, and dynamic programming.
- [x] Do not create a question-specific implementation until its matrix entry is complete.
  - Verified 2026-08-30: `docs/QUESTION_IMPLEMENTATION_MATRIX.md` records all 56 questions exactly once, their authoritative algorithm ownership, teaching state, interaction, stage mapping, current visualizer coverage, and family delivery status.
  - The audit confirms 21 questions currently resolve to a runnable module and 35 require new or question-specific work. Number of Islands and Top K Frequent Elements are explicitly marked as educationally incomplete when they inherit only a generic family module.
  - Fixed-layout authoring limits are now frozen per family: arrays 12 cells, stacks/queues 8 entries, linked lists 8 nodes, trees 15 nodes/4 levels, graphs 10 nodes/16 edges, and grids/tables 8 × 10 cells. Inputs beyond those limits are rejected or summarized before rendering; neither the page nor a visualizer box may scroll.
  - The matrix records that only Binary Search currently has explicit Code, Solve, Trace, and Review mappings. Missing stage content remains open for Phase 5 instead of being reported as complete.
  - Four focused matrix tests enforce count, uniqueness, catalog ownership, teaching-contract completeness, module status, and fixed-workspace limits. Phase 3 passed `bun run verify` (67 files / 786 tests) and `bun run build`.

---

## Phase 4 — Build Visualization Families

**Purpose:** provide the visual grammar required by the audited matrix.

**Status:** complete. Every visualization family is independently verified; the remaining question-specific modules and learning stages stay explicit Phase 5 work.

- [x] Array family: cells, indices, pointers, range bands, comparisons, swaps, excluded/sorted/target states.
  - Verified 2026-08-30: the existing `ArrayFrame` contract already represents arbitrary left/right/read/write/three-pointer roles, indexed strings, ranges, comparisons, swaps, and every current cell state without algorithm-specific React branching.
  - `ArrayCanvas` keeps the normal 10-cell Binary Search reference and every accepted input non-scrolling. Array modules reject more than 12 values, and swap cells retain visible plus screen-reader emphasis.
  - Independent family fixtures cover left/right, read/write with swap, three-pointer string, 13-cell over-limit rejection, and the unchanged Binary Search threshold.
  - The 12-cell hard boundary preserves readable cells without a horizontal track. Across Setup and Find Mid, Algorithm World stays `top 162 / bottom 822 / height 660` and Playback stays `top 834 / bottom 892 / height 58`.
  - Phase 4 array-family verification passed `bun run verify` (68 files / 791 tests), `bun run build`, and all four frozen Binary Search Chromium baselines: desktop journey, 320px journey, target-width reflow, and screenshot.
- [x] Stack and queue family: push/pop/top and enqueue/dequeue/head/tail with meaningful motion.
  - Verified 2026-08-30: the existing auxiliary `stack` and `queue` contracts are sufficient. The shared renderer now exposes LIFO/FIFO order, bottom/top or head/tail endpoints, active/frontier state symbols, accessible structure summaries, and distinct push/pop versus enqueue/dequeue motion without adding duplicate frame types or algorithm-specific branches.
  - Structures keep a fixed `96px` card and show at most eight entries. Overflowing stacks retain the eight entries nearest the top with a lower-entry summary; overflowing queues retain four entries at each endpoint with a middle summary, so the next dequeue and enqueue positions remain visible together.
  - Six independent fixtures cover the exact eight-entry stack boundary, lower-stack summarization, both queue endpoints with middle summarization, single and empty structures, state semantics, motion direction, and the `420px` companion graph cap that keeps auxiliary structures visible.
  - Headed Chromium at 1440×900 verified BFS enqueue/dequeue and DFS push/top behavior, including a 10-entry DFS chain rendered as eight entries plus `+2 below`. The stack stayed `height 96`, page `scrollY` stayed zero, Algorithm World stayed `top 162 / bottom 822 / height 660`, and Playback stayed `top 834 / bottom 892 / height 58`.
  - Phase 4 Stack/Queue-family verification passed `bun run verify` (70 files / 802 tests), `bun run build`, and all four frozen Binary Search Chromium baselines: desktop journey, 320px journey, target-width reflow, and screenshot.
- [x] Linked-list family: nodes, references, head/tail/current/slow/fast, and visible reference mutation.
  - Verified 2026-08-30: a reusable `LinkedListFrame` and `LinkedListView` now cover stable engine-owned node positions, forward/reversed/cycle links, explicit `null` endpoints, detached old links, two-row merge teaching, node states/badges, and stacked head/tail/current/prev/slow/fast pointers without question-specific rendering branches.
  - `nodeSlots` reserves the largest list layout for the full run, so removal and relinking never reflow surviving nodes. The hard limit is eight nodes; larger inputs are rejected before rendering.
  - Six independent fixtures cover reversal, stacked pointers, two-list merge, cycle/removal links, the exact eight-node boundary plus nine-slot rejection, and empty-list null pointers.
  - Detached, bypass, cycle, and null-link fixtures keep every accepted node rectangle at exactly `0px` before/after geometry delta without creating an internal viewport.
  - Phase 4 Linked-list-family verification passed `bun run verify` (71 files / 809 tests), `bun run build`, and all four frozen Binary Search Chromium baselines: desktop journey, 320px journey, target-width reflow, and screenshot. The five linked-list question modules remain deliberately `Missing module / Planned` for Phase 5.
- [x] Tree and BST family: stable layout, nodes, edges, traversal, path, and recursive-stack context.
  - Verified 2026-08-30: the existing `TreeFrame` contract keeps engine-owned node coordinates stable and represents traversal state, path edges, BST bounds, queue/level order, returned heights, LCA results, and inverted links through reusable node badges and edge state/labels—without question-specific React branches.
  - `TreeView` fits up to 15 nodes and four levels inside a `420px` teaching canvas. Larger or deeper trees are rejected before rendering instead of creating a viewport, widening the page, or shrinking nodes.
  - Five independent fixtures cover level-order traversal, BST bounds/recursive returns/LCA, inversion link mutation with unchanged coordinates, the exact 15-node/four-level boundary, and over-limit balanced plus skewed trees.
  - Headed Chromium at 1440×900 verifies accepted trees without internal overflow; page `scrollY` remains zero, Algorithm World stays `top 162 / bottom 822 / height 660`, and Playback stays `top 834 / bottom 892 / height 58` across animation steps.
  - Phase 4 Tree/BST-family verification passed `bun run verify` (69 files / 796 tests), `bun run build`, and all four frozen Binary Search Chromium baselines: desktop journey, 320px journey, target-width reflow, and screenshot.
- [x] Graph family: nodes, edges, visited/frontier/current state, queue/stack, weights, distance, parent, and relaxation.
  - Verified 2026-08-31: the reusable `GraphFrame` and `GraphView` keep engine-owned coordinates stable while representing directed and weighted edges, traversal states, edge annotations, distances, parents, indegrees, node badges, and queue/stack companions without question-specific rendering branches.
  - Dijkstra now records and emits each node's parent on successful relaxation, while Topological Sort emits explicit indegrees. Node metadata is stacked into compact teaching labels, and the accessible graph summary includes the same semantic state.
  - The hard graph limit is 10 nodes and 16 edges. Larger or denser inputs are rejected before rendering, preserving node size and the frozen surrounding workspace without any internal viewport.
  - Six independent fixtures cover traversal with queue/stack companions, weighted relaxation, directed indegrees, discover/reject/union/component semantics, the exact limit, and node-heavy or edge-heavy rejection.
  - Headed Chromium verified stable graph geometry across steps, while a real 6-node/7-edge Dijkstra run remained non-overflowing and displayed distance/parent labels cleanly. The parser now rejects the 17th edge.
  - Phase 4 Graph-family verification passed `bun run verify` (72 files / 815 tests), `bun run build`, and all four frozen Binary Search Chromium baselines: desktop journey, 320px journey, target-width reflow, and screenshot. This proves the renderer foundation only: the union-find module for `number-of-connected-components` remains `Missing module / Planned`, and Number of Islands still needs its grid-specific module in Phase 5.
- [x] Heap family: synchronized tree and array representations where educationally useful.
  - Verified 2026-08-31: one canonical `HeapFrame` now drives both the complete-tree and indexed backing-array representations. Its stable slots support min/max heaps, an explicit active heap boundary, node/cell states, parent-child edge states, annotations, and swap pairs without duplicating values in an auxiliary panel.
  - Heap Sort now emits the reusable Heap family directly. Tree labels and array values update from the same slots, while index-owned coordinates remain constant as values sift, swap, leave the heap, and become sorted.
  - Heap inputs are capped at 12 slots so both the complete tree and compact backing array remain fully visible at teaching size without any viewport.
  - Six independent fixtures cover canonical tree/array synchronization, parent-child swaps, stable coordinates, shrinking boundaries, the 12-slot hard limit, over-limit rejection, and both min/max semantics.
  - Headed Chromium at 1440x900 verifies Heap Sort from setup through completion with exactly `0px` node-geometry delta. Algorithm World stays `top 162 / bottom 822 / height 660`, Playback stays `top 834 / bottom 892 / height 58`, and the accepted heap never scrolls.
  - Phase 4 Heap-family verification passed `bun run verify` (73 files / 822 tests), `bun run build`, and all four frozen Binary Search Chromium baselines: desktop journey, 320px journey, target-width reflow, and screenshot. `top-k-frequent-elements` still needs its problem-specific frequency table and size-k min-heap module in Phase 5.
- [x] Recursion/backtracking family: call stack, arguments, choices, enter/return, failure/success, and undo.
  - Verified 2026-08-31: a reusable `callstack` auxiliary contract now carries ordered calls, named arguments, enter/active/return/failure/success/undo state, the current choice, and returned result without placing recursion logic in the renderer.
  - The fixed `112px` call-stack panel shows at most eight teaching-size frames. Deeper runs retain the newest eight calls and summarize older calls as `+N older`, while the accessible label preserves the complete logical stack.
  - Quick Sort now emits its real recursive calls and returns instead of the former generic "partitions waiting" stack. Setup reserves the same panel height, and non-search array algorithms now keep their module-authored reasoning rather than inheriting Binary Search target/midpoint copy.
  - Independent renderer fixtures cover enter, return, success, failure, undo, empty state, the exact eight-frame limit, and overflow. Engine and learning-contract tests verify real Quick Sort depth, arguments, pivot choices, return state, and removal of the fake generic stack.
  - At 1440x900, a real worst-case 12-value Quick Sort displayed eight frames plus `+4 older` at depth 12. Algorithm World stayed `top 162 / bottom 822 / height 660`, Playback stayed `top 834 / bottom 892 / height 58`, the call-stack panel stayed `112px`, and page `scrollY` and document overflow remained zero.
  - Phase 4 Recursion-family verification passed `bun run verify` (74 files / 831 tests), `bun run build`, and all four frozen Binary Search Chromium baselines. This proves the reusable family and the existing Quick Sort consumer only; the frozen 56-question catalog contains no dedicated recursion/backtracking records, so none were invented.
- [x] Dynamic-programming family: tables, dependencies, formula, computation, and write state.
  - Verified 2026-08-31: the canonical `TableFrame`/`TableView` contract represents 1-D and 2-D state, base/dependency/target/write/result roles, read/compute/write phases, formulas, bounded candidate choices, and computed results without problem-specific React branches.
  - Climbing Stairs and Unique Paths now provide truthful problem modules and deterministic setup, dependency-read, compute, write, and done steps. The other five DP questions remain deliberately `Missing module / Planned` rather than inheriting an inaccurate generic animation.
  - The table shell stays `396px` high with a fixed `288px` matrix box and `72px` computation strip. One-dimensional inputs are capped at 12 total cells; two-dimensional inputs are capped at 8 × 10, with teaching-size cells and no scrolling.
  - Independent renderer and engine fixtures cover formulas, dependencies, candidates, roles, all phases, exact limits, over-limit rejection, fixed setup/active geometry, Climbing Stairs output, and Unique Paths output.
  - At 1440×900, maximum-size 12-cell Climbing Stairs and 8×10 Unique Paths runs keep Algorithm World at `top 162 / bottom 822 / height 660`, Playback at `top 834 / bottom 892 / height 58`, the table at `height 396`, and every scroll offset at zero from setup through their final writes.
  - Zero-scroll correction verified 2026-08-31: every visualizer surface uses fixed clipping or a bounded summary instead of page or panel scrolling. The maximum 12-cell Binary Search run exposes no `auto`/`scroll` overflow element, and a 13th value is rejected with a readable-limit message. Full verification passed 75 files / 851 tests, production build, and four frozen Chromium baselines.
- [x] Test every family independently before using it across its assigned questions.

---

## Phase 5 — Complete the Golden Learning Loop for All 56 Questions

**Purpose:** make every catalog question a complete learning experience, adapted to its data structure rather than forced into Binary Search visuals.

### Phase 5.1 — Two pointers

- [ ] `sort-colors` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic low/mid/high visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-cell input boundary, edge-case presets, invariant reasoning, result state, and accessible non-colour state cues.
  - [x] Three-action Prediction checkpoint derived from semantic pointer state.
  - [x] Question-specific Trace exercise over a different canonical input, with misconception feedback, progressive hints, and a truthful completion summary.
  - [x] Code maps to `sort-colors`, Solve maps to `move-zeroes`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (76 files / 862 tests), production build, two Sort Colors Chromium regressions, and all four frozen Binary Search Chromium baselines. At 1440×900 the 12-cell final state keeps all nodes, the complete code listing, Algorithm World, and the bottom Playback controller visible with zero page or internal scrolling.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `two-sum` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic left/right pair-sum visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-cell sorted-input boundary, solution/no-solution presets, invariant reasoning, 1-indexed result state, and accessible non-colour state cues.
  - [x] Three-action Prediction checkpoint derives `left++`, `right--`, or return-pair from the current endpoint sum.
  - [x] Question-specific Trace exercise uses a different sorted input, five semantic pair checkpoints, misconception feedback, progressive hints, and a truthful candidate-span summary.
  - [x] Code maps to `two-sum`, Solve maps to `container-with-most-water`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer without replacing the Sort Colors slice.
  - [x] Verification passed `bun run verify` (77 files / 877 tests), production build, two dedicated Two Sum Chromium regressions, and the seven-test Binary Search + Sort Colors + Two Sum golden regression suite. At 1440×900 the maximum 12-cell final state has zero page or internal scrolling, keeps Algorithm World at `top 162 / bottom 822`, and keeps the fixed Playback controller at `top 834 / bottom 892`; all 12 compact code lines fit inside the right panel.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `container-with-most-water` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic left/right wall visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-wall input boundary, edge-case presets, area and limiting-height reasoning, result state, and accessible non-colour state cues.
  - [x] Three-action Prediction checkpoint derives `left++`, `right--`, or moving both equal walls from the current endpoint heights.
  - [x] Question-specific Trace exercise uses a different six-wall input, four semantic width/area checkpoints, misconception feedback, progressive hints, and a truthful maximum-area summary.
  - [x] Code maps to `container-with-most-water`, Solve maps to `trapping-rain-water`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (78 files / 888 tests), production build, two dedicated Container Chromium regressions, and the nine-test Binary Search + Sort Colors + Two Sum + Container golden regression suite. At the maximum 12-wall final state, the 1440×900 document remains exactly 1440×900 with zero scrollable regions; Algorithm World remains `top 162 / bottom 822`, Playback remains `top 834 / bottom 892`, and all 12 compact code lines fit inside the fixed right panel.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `trapping-rain-water` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic boundary-maximum visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-bar input boundary, no-water and basin edge cases, exact accumulated-water reasoning, terminal result, and accessible non-colour state cues.
  - [x] Three-action Prediction checkpoint derives whether the left or right side is bounded, with a deterministic left-on-tie rule and an explicit not-finished distractor.
  - [x] Question-specific Trace exercise uses a different six-bar elevation map, five semantic boundary checkpoints, misconception feedback, progressive hints, and a truthful unresolved-bars summary.
  - [x] Code maps to `trapping-rain-water`, Solve maps to `valid-palindrome`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (79 files / 899 tests), production build, and two dedicated Trapping Rain Water Chromium journeys. Live browser QA at the maximum 12-bar final state confirmed an exact 1440×900 document with zero scrollable regions, Algorithm World at `top 162 / bottom 822`, Playback at `top 834 / bottom 892`, and all 12 compact code lines fully visible inside the fixed right panel.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `valid-palindrome` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic converging-pointer visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-character input boundary, spaces/punctuation and mixed-case presets, invariant reasoning, true/false result states, and accessible non-colour state cues.
  - [x] Four-action Prediction checkpoint derives whether to skip left, skip right, move both matched endpoints, or return false.
  - [x] Question-specific Trace exercise uses a different punctuation-bearing string, four semantic endpoint checkpoints, misconception feedback, progressive hints, and a truthful unchecked-characters summary.
  - [x] Code maps to `valid-palindrome`, Solve maps to `move-zeroes`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (80 files / 910 tests), production build, and two dedicated Valid Palindrome Chromium journeys. Live QA of the maximum 12-character preset at 1440×900 confirmed all character cells and all 12 code lines remain visible, the Algorithm World and right panel stay frozen, the bottom Playback controller remains visible, and no page or internal scroll surface appears.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `move-zeroes` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic read/write visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-cell input boundary, zero/no-zero/negative presets, stable-order reasoning, completed-array result state, and accessible non-colour state cues.
  - [x] Three-action Prediction checkpoints derive whether to copy a non-zero, skip a scanned zero, or write a trailing zero after the scan.
  - [x] Question-specific Trace exercise uses a different five-value input, seven semantic scan/fill checkpoints, misconception feedback, progressive hints, and a truthful write-boundary summary.
  - [x] Code maps to `move-zeroes`, Solve maps to `remove-duplicates-from-sorted-array`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (81 files / 921 tests), production build, and both dedicated Move Zeroes Chromium journeys. At the maximum 12-cell final state, every cell and all 12 code lines remain visible inside the fixed panels, completed pointer markers disappear, the bottom Playback controller remains visible, and page/internal scrolling stays at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `remove-duplicates-from-sorted-array` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic read/write visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-cell sorted-input boundary, duplicate/unique/negative presets, unique-prefix reasoning, `k` result state, and accessible non-colour state cues.
  - [x] Three-action Prediction checkpoints derive whether to copy a new unique value, skip a duplicate, or reject an invalid write-only move.
  - [x] Question-specific Trace exercise uses a different seven-value input, six semantic comparison checkpoints, misconception feedback, progressive hints, and a truthful unique-count summary.
  - [x] Code maps to `remove-duplicates-from-sorted-array`, Solve maps to `three-sum`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (82 files / 932 tests), production build, and both dedicated Remove Duplicates Chromium journeys. Headed QA at the maximum 12-cell final state confirmed all cells and 10 code lines remain visible, the unique prefix and unspecified suffix are distinct, the fixed bottom Playback controller remains visible, and page/internal scrolling stays at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `three-sum` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic sort/anchor/left/right visualizer, synchronized JavaScript/TypeScript/Python code, fixed 12-cell input boundary, solution/no-solution/duplicate presets, uniqueness reasoning, bounded triplet-count state, and accessible non-colour state cues.
  - [x] Four-action Prediction checkpoints derive left movement, right movement, triplet recording with endpoint duplicate skipping, or duplicate-anchor skipping.
  - [x] Question-specific Trace exercise uses a different duplicate-heavy six-value input, six semantic sum/anchor checkpoints, misconception feedback, progressive hints, and a truthful triplet-count summary.
  - [x] Code maps to `three-sum`, Solve maps to `two-sum`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (83 files / 943 tests), production build, `git diff --check`, and both dedicated 3Sum Chromium journeys. Headed QA at the maximum 12-cell, 74-step terminal state confirmed all cells and all 12 code lines remain visible inside the fixed left/right panels, the bottom Playback controller remains fully visible, and page/internal scrolling stays at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [x] All eight Two Pointers catalog questions now have truthful question modules and complete non-video Golden stages.
- [ ] `binary-tree-level-order` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic breadth-first tree visualizer, synchronized JavaScript/TypeScript/Python code, fixed 15-node/four-level boundary, complete/sparse/single/empty presets, stable node coordinates, queue and completed-level state, and accessible non-colour traversal cues.
  - [x] Four-action Prediction checkpoints derive whether to enqueue both children, only the left child, only the right child, or no children.
  - [x] Question-specific Trace exercise uses a different seven-node tree, seven semantic queue checkpoints, misconception feedback, progressive hints, and a truthful completed-level summary rendered with the reusable tree view.
  - [x] Code maps to `binary-tree-level-order`, Solve maps to `binary-tree-right-side-view`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (84 files / 957 tests), production build, `git diff --check`, and both dedicated Chromium journeys. Headed QA at the maximum 15-node/four-level, 39-step terminal state confirmed all 15 full-size nodes on a question-owned wide canvas; bottom-level center spacing is `17.5` units, all 12 code lines remain visible, the left/right panels and full bottom Playback controller stay fixed, and page/internal scrolling remains at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `binary-tree-right-side-view` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic breadth-first visualizer records exactly the final left-to-right node at each frozen level boundary, synchronizes JavaScript/TypeScript/Python code, reuses the fixed 15-node/four-level tree contract, and exposes queue, level-position, visible-output, and non-colour selected-node state.
  - [x] Two-action Prediction checkpoints derive whether the current node is the final node of its level and therefore enters the right-side view.
  - [x] Question-specific Trace uses a different six-node sparse tree, six semantic visibility checkpoints, misconception feedback, progressive hints, and a truthful visible-node summary rendered with the reusable tree view.
  - [x] Code maps to `binary-tree-right-side-view`, Solve maps to `maximum-depth-of-binary-tree`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (85 files / 969 tests), production build, `git diff --check`, and both dedicated Chromium journeys. Headed QA at the maximum 15-node/four-level, 39-step terminal state confirmed all full-size nodes and right-view badges remain readable, all 12 code lines are visible, the left/right panels and bottom Playback controller stay fixed, and the 1440×900 document has zero page or internal scrolling.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `maximum-depth-of-binary-tree` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic breadth-first visualizer counts one depth per frozen queue boundary, synchronizes JavaScript/TypeScript/Python code, reuses the fixed 15-node/four-level wide tree canvas, and exposes queue, completed-level, next-level, and non-colour traversal state.
  - [x] Two-action Prediction checkpoints derive whether queued nodes form another level or the completed depth should be returned.
  - [x] Question-specific Trace uses a different six-node/four-level sparse tree with four semantic depth checkpoints, misconception feedback, progressive hints, and a truthful completed-level summary.
  - [x] Code maps to `maximum-depth-of-binary-tree`, Solve maps to `invert-binary-tree`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (86 files / 977 tests), production build, `git diff --check`, and both dedicated Chromium journeys. Headed QA at the maximum 15-node/four-level, 25-step terminal state confirmed all nodes, level badges, and 12 code lines remain visible, fixed panels and Playback remain in place, and page/internal scrolling stays at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `invert-binary-tree` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic breadth-first visualizer swaps each node's left and right child references so whole subtrees move, synchronizes JavaScript/TypeScript/Python code, and preserves stable readable slots inside the fixed 15-node/four-level wide tree canvas.
  - [x] Three-action Prediction checkpoints distinguish swapping child links from keeping links or swapping only values.
  - [x] Question-specific Trace uses a different seven-node tree with seven semantic link-swap checkpoints, misconception feedback, progressive hints, and a truthful swap-count summary.
  - [x] Code maps to `invert-binary-tree`, Solve maps back to `binary-tree-level-order`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (87 files / 985 tests), production build, `git diff --check`, and both dedicated Chromium journeys. Headed QA at the maximum 15-node/four-level, 32-step terminal state confirmed the mirrored values remain readable, all 11 code lines are visible, the left/right panels and bottom Playback controller stay fixed, and page/internal scrolling remains at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.
- [ ] `validate-binary-search-tree` — Golden loop (Watch video remains intentionally deferred).
  - [x] Question-keyed deterministic recursive-bounds visualizer checks every node against the strict range inherited from all ancestors, synchronizes JavaScript/TypeScript/Python code, shows recursion depth and bounds evidence in compact fixed auxiliary pills, and reuses the fixed 15-node/four-level wide tree canvas.
  - [x] Three-action Prediction checkpoints distinguish accepting a value inside its bounds, rejecting a violation, and the parent-only misconception.
  - [x] Question-specific Trace uses a different seven-node valid BST with seven semantic bounds checkpoints, misconception feedback, progressive hints, and a truthful checked-node summary.
  - [x] Code maps to `validate-binary-search-tree`, Solve maps to `diameter-of-binary-tree`, and six active-recall Review prompts cover concept, invariant, classification, boundary, code, and transfer.
  - [x] Verification passed `bun run verify` (88 files / 993 tests), production build, `git diff --check`, and both dedicated Chromium journeys. Headed QA at the maximum 15-node/four-level terminal state confirmed every node and level badge remain readable, all 7 code lines are visible, the compact recursion-depth and bounds pills stay inside the fixed world, the left/right panels and bottom Playback controller stay fixed, and page/internal scrolling remains at zero.
  - [ ] Watch video remains under construction by explicit product decision; do not mark this question fully complete until that stage is supplied.

For each matrix entry:

- [ ] Concept and Watch content.
- [ ] Deterministic visualizer with code synchronization.
- [ ] Variables, current operation, reasoning, invariant/insight, timeline, and result/failure states.
- [ ] Prediction and Trace interactions appropriate to the algorithm.
- [ ] Code implementation mapping, transfer/Solve mapping, and active-recall Review mapping.
- [ ] Custom input and relevant edge cases.
- [ ] Educational motion, accessibility, responsive behaviour, and unit/browser coverage.
- [ ] Completion only when the question satisfies its full definition of done—not merely when a visualizer renders.

---

## Phase 6 — Complete Every Frontend Page

**Priority exception (2026-09-11):** the homepage is now active ahead of remaining question expansion; follow H0–H5 in the [homepage roadmap](docs/HOMEPAGE_STORYTELLING_ROADMAP.md). Other frontend pages remain in this phase.

**Purpose:** finish the actual product routes after the core learning experiences are complete.

- [ ] Audit every route in the route tree.
- [ ] For every page, verify real data, correct navigation, loading/empty/error states, accessibility, responsive behaviour, no placeholders, no fake user data, and no dead calls to action.
- [ ] Complete Help around actual product behaviour.
- [ ] Complete pages only when their product prerequisites exist; defer admin/RBAC pages until backend authorization exists.
- [ ] Ensure legal, pricing, profile, security, and account language describes only implemented functionality.

---

## Phase 7 — Product-Wide Educational and UI Motion

**Current motion focus:** homepage SVG storytelling under H2–H4. This does not mark product-wide motion complete.

**Purpose:** use motion to explain state and improve interaction, never as decoration.

- [ ] Educational motion: pointer movement, swaps, range elimination, queue/stack changes, traversal, DP writes, recursion enter/return, and reference mutation.
- [ ] Product motion: page, stage, tab, progress, feedback, navigation, accordion, and dialog transitions.
- [ ] Respect reduced motion while preserving all learning functionality.
- [ ] Verify motion adds causal understanding and remains deterministic for player seeking/replay.

---

## Phase 8 — Responsive and Accessibility Completion

**Purpose:** make every page and visualization family usable across target devices and assistive technology.

- [ ] Test 320, 375, 390, 430, tablet portrait, tablet landscape, 1024, 1280, 1440, 1600, and 1920 pixel widths.
- [ ] Define a deliberate small-screen strategy per visualization family; trees, graphs, arrays, and DP tables must not simply shrink.
- [ ] No page-level or internal visualizer scrolling; inputs are limited to what fits readably inside each frozen box.
- [ ] Complete keyboard-only, focus-order, screen-reader, zoom, high-contrast, and reduced-motion checks.

---

## Phase 9 — Frontend Completion Audit and Freeze

**Purpose:** stop feature churn before backend architecture begins.

- [ ] All 56 questions: pass/fail audit against their matrix definition of done.
- [ ] All routes and interactions: pass/fail audit.
- [ ] All educational and UI motion: pass/fail audit.
- [ ] All responsive and accessibility checks: pass/fail audit.
- [ ] Run unit, typecheck, lint, content validation, build, and browser E2E gates.
- [ ] Fix confirmed failures only, then declare **FRONTEND FREEZE**.

---

## Phase 10 — Design the Backend from the Finished Product

**Purpose:** derive persistence and security requirements from the completed frontend instead of inventing infrastructure early.

- [ ] Audit final frontend data flows and define the backend architecture.
- [ ] Design authentication, users/profiles, content access, cloud progress, lesson/question state, prediction/trace evidence, code submissions, Review/SRS, mastery, XP, streaks, achievements, quests, analytics, administration, RBAC, and audit logging.
- [ ] Make the final code-execution architecture decision, including Python support, from real product requirements.
- [ ] Define migrations from existing local-first persistence without losing user progress.

---

## Phase 11 — Build Backend and Real Product State

- [ ] Implement authentication and authorization.
- [ ] Implement database and cloud progress.
- [ ] Make solved questions, mastery, Review/SRS, XP, streaks, achievements, and submissions server-authoritative where required.
- [ ] Add secure code-execution infrastructure if the Phase 10 decision requires it.
- [ ] Add administration/RBAC/audit log only with real backend permissions.
- [ ] Update legal and product copy only after each capability exists.

---

## Phase 12 — Backend-to-Frontend Integration

- [ ] Replace local-only feature paths progressively without redesigning completed frontend flows.
- [ ] Wire Dashboard, Review, Profile, Practice, Golden lessons, Prediction, Trace, video progress, and navigation to real state.
- [ ] Verify cross-device progress restoration and migration behaviour.
- [ ] Verify duplicate reward, race, authorization, and persistence failure cases.

---

## Phase 13 — Full-System QA and Production Hardening

- [ ] Test the full learner journey: sign up → learn → review → logout → sign in on another device → restored progress.
- [ ] Complete security, authorization, rate-limit, validation, code-isolation, database, backup/recovery, error-monitoring, CI/CD, performance, bundle-size, SEO, metadata, sitemap, privacy, and analytics checks.
- [ ] Run Chromium, Firefox, and WebKit browser smoke tests.
- [ ] Resolve all P0/P1 learning-flow defects before beta.

---

## Phase 14 — Beta Testing, Fixes, and Production Release

- [ ] Start beta only after Phases 1–13 are complete.
- [ ] Collect evidence on learning clarity, visualization quality, prediction, trace, practice, review, navigation, mobile usability, performance, and confusion points.
- [ ] Fix confirmed beta findings.
- [ ] Produce a release candidate, run final QA and backup checks, deploy, smoke test, and release.

---

## Execution Protocol

1. Work strictly in phase order.
2. Audit existing code before adding or replacing systems.
3. Make one focused change set at a time.
4. Verify before marking any checkbox complete.
5. Do not start backend work before frontend freeze.
6. Do not start beta before backend integration and production hardening are complete.
