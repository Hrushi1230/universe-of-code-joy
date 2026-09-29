# Universal Learning System

**Phase:** 2 — reuse-boundary audit

**Baseline:** Binary Search Phase 1, frozen 2026-08-29

**Exception:** Watch is intentionally inert and labelled in the roadmap as Coming Soon until approved media exists.

## Goal

Preserve the proven Binary Search journey while exposing only the contracts already demonstrated by the current algorithm catalog. Phase 2 does not redesign the engine, create a parallel visualizer, or generalize a component without a real consumer.

## Dependency direction

Dependencies flow in one direction:

1. `src/engine` produces deterministic `AlgorithmRun`, `Step`, `Frame`, and auxiliary data.
2. Pure functions in `src/lib` derive teaching data such as variables, operations, reasoning, prediction checkpoints, trace sessions, and stage destinations.
3. Zustand stores own playback, prediction, trace, preferences, and product progress state.
4. Visualization, player, learning, trace, and workspace components render typed inputs or select store state and dispatch learner actions.
5. Routes compose the product journey and remain authoritative for navigation, Code, Solve, Review, mastery, XP, streak, and completion handoffs.

React must not calculate an algorithm run. Shared UI must not branch on `binary-search`; variation enters through engine frames, module metadata, pure derived contracts, or typed composition points.

## Reuse-boundary inventory

The decisions mean:

- `KEEP SHARED`: already has a stable contract and demonstrated cross-algorithm or cross-stage use.
- `EXTRACT`: cohesive responsibility currently trapped inside a mixed file.
- `SPLIT`: preserve behaviour while separating independently owned responsibilities.
- `ALGORITHM-SPECIFIC`: keep close to the algorithm or route that owns the behaviour.
- `DEFER`: no safe extraction or second consumer is proven yet.

### Engine, derived data, and state

| Item                                                            | Consumers                                                    | State or data dependency                        | Test evidence                                              | Decision      |
| --------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------- | ------------- |
| `engine/types.ts` frame, step, run, input, and module contracts | Every engine module, player store, frame renderers, input UI | Pure typed data                                 | Engine layout, registry, algorithm, and rendering tests    | `KEEP SHARED` |
| Algorithm modules and registry                                  | Player store, lesson route, visualizer entry points          | Pure validation and deterministic execution     | Algorithm suites, registry/layout tests                    | `KEEP SHARED` |
| `playerStore` and selectors                                     | Workspace, code, reasoning, visualization, playback, hooks   | Canonical run, index, playback, speed, inputs   | Player, keyboard, autoplay, reduced-motion, counters tests | `KEEP SHARED` |
| `predictionStore` plus `lib/prediction`                         | Prediction gate and prediction hook                          | Interaction state separate from execution state | Prediction and Golden journey tests                        | `KEEP SHARED` |
| `traceStore` plus `lib/trace`                                   | Trace workspace and moves                                    | Trace attempts separate from player state       | Trace and Golden journey tests                             | `KEEP SHARED` |
| Progress, review, session, and lesson-stage helpers             | Lesson, practice, and review routes                          | Product authority for completion and retention  | Progress, session, review, lesson-stage, E2E tests         | `KEEP SHARED` |

### Visualization and teaching

| Item                                                  | Consumers                                        | State or data dependency                                            | Test evidence                                 | Decision      |
| ----------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------- | ------------- |
| `FrameView`                                           | Algorithm world, thumbnails, legacy visual stage | `Frame` discriminated union                                         | Frame/layout and family rendering tests       | `KEEP SHARED` |
| `ArrayView` / `ArrayCanvas`                           | Frame dispatch, Golden workspace, Trace          | `ArrayFrame`; canvas adds stable Golden geometry                    | Animation, pointer, token, screenshot tests   | `KEEP SHARED` |
| `TreeView`, `GraphView`, `GridView`, `TableView`      | `FrameView`                                      | Their matching frame family                                         | Engine layout and representative module tests | `KEEP SHARED` |
| `AuxPanels`                                           | Algorithm world                                  | `Step.aux` stack, queue, key-value, log, and cost families          | Visualization and animation tests             | `KEEP SHARED` |
| `VariableBoard`, `CurrentOperation`, `ExpressionView` | Algorithm world                                  | Pure results from `lib/variables`                                   | Variables, operations, and visual tests       | `KEEP SHARED` |
| `AlgorithmWorldPanel`                                 | `GoldenWorkspace` across registered modules      | Player selectors, prediction reveal rule, pure teaching derivations | Golden journey, animation, a11y, screenshots  | `DEFER`       |

`AlgorithmWorldPanel` is a candidate composition boundary, not a new public abstraction. It already renders multiple frame families through one lesson route, but there is no second workspace consumer proving a broader API. Keep its geometry and ownership unchanged during the first split.

### Playback

| Item                                                         | Consumers                            | State dependency                      | Test evidence                            | Decision      |
| ------------------------------------------------------------ | ------------------------------------ | ------------------------------------- | ---------------------------------------- | ------------- |
| `ControlStrip`                                               | `PlaybackBand`, legacy `VisualStage` | Player navigation, play state, bounds | Playback a11y, keyboard, Golden E2E      | `KEEP SHARED` |
| `StepTimeline`                                               | `PlaybackBand`, legacy `VisualStage` | Run phases and current index          | Timeline, no-page-scroll, Golden E2E     | `KEEP SHARED` |
| `SpeedControl`                                               | `ControlStrip`, `PlaybackBar`        | Preference/player speed               | Playback and keyboard tests              | `KEEP SHARED` |
| `PlaybackBand`                                               | `GoldenWorkspace`                    | Composition only                      | Fixed-height responsive browser baseline | `KEEP SHARED` |
| `PlaybackBar`, `StepScrubber`, `VisualStage` playback footer | Older visualizer composition         | Player store                          | Existing player tests                    | `DEFER`       |

The older playback composition is not removed in Phase 2. It remains a valid consumer and compatibility surface until a later audit proves it is duplicate and unused.

### Workspace and route composition

| Item                                           | Consumers                                            | State or data dependency                            | Test evidence                                     | Decision             |
| ---------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- | -------------------- |
| `GoldenWorkspace` and its private right column | Algorithm lesson route for all supported modules     | Algorithm metadata, module, player-backed children  | Frozen desktop/mobile Golden baseline             | `DEFER`              |
| `LessonContextRow`                             | Algorithm lesson route                               | Algorithm and progress metadata                     | Route and Golden E2E                              | `KEEP SHARED`        |
| `LessonStageStrip`                             | Algorithm lesson route                               | Explicit stage destinations and completion state    | Lesson-stage unit tests and Golden E2E            | `KEEP SHARED`        |
| `algorithms.$slug.tsx` lesson composition      | Algorithm lesson journey                             | Route search, product progress, stage handoffs      | Golden journey and deep-link tests                | `ALGORITHM-SPECIFIC` |
| `WorkspacePanels.tsx`                          | Golden workspace plus older side/visual compositions | Player, prediction, engine input, algorithm content | Code-line, live-region, playback a11y, Golden E2E | `SPLIT`              |

`GoldenWorkspace` remains the locked visual composition. Do not rename it or introduce slot APIs merely for symmetry. Its current route consumer already covers many algorithms, but a different workspace composition must demonstrate a variation before its API grows.

### Learning interactions

| Item                                                        | Consumers                                     | State dependency                          | Test evidence                           | Decision      |
| ----------------------------------------------------------- | --------------------------------------------- | ----------------------------------------- | --------------------------------------- | ------------- |
| `ChoiceGroup`                                               | Trace today; intended shared option primitive | Controlled selection only                 | Trace keyboard and interaction tests    | `KEEP SHARED` |
| `LearningFeedback`                                          | Trace and Review                              | Controlled message and focus target       | Trace/review tests                      | `KEEP SHARED` |
| `PredictionGate`                                            | Explain pane                                  | Prediction store and typed prediction     | Prediction, keyboard, focus, Golden E2E | `KEEP SHARED` |
| `TraceMove`                                                 | Trace workspace                               | Trace store and typed checkpoint          | Trace tests                             | `KEEP SHARED` |
| `TraceWorkspace`, `TraceAlgorithmWorld`, `TraceSummaryCard` | Trace lesson stage                            | Trace session/store and stage handoff     | Trace and Golden E2E                    | `KEEP SHARED` |
| `ReviewSession`                                             | Review route                                  | Review session state and progress handoff | Review tests                            | `KEEP SHARED` |

Prediction reuses `ChoiceGroup` and `LearningFeedback` because both Prediction and Trace require native radio behaviour, disabled checking until selection, polite feedback, and focus on the explanation. Prediction keeps its own store transitions, reveal/continue semantics, wording, and layout.

## Frozen data and ownership contracts

Phase 2.2 freezes the contracts below as descriptions of the current code. No engine type change was required.

### Engine boundary

An `AlgorithmModule` owns input fields, presets, validation, and deterministic execution. The application calls the boundary in this order:

1. Resolve a module by algorithm or problem slug.
2. Merge the module's input defaults with learner input.
3. Call `validate(raw)` and either retain the previous run with an error or receive parsed data.
4. Call `run(parsed)` to produce one complete `AlgorithmRun`.
5. Store that immutable execution result in `playerStore`; playback changes only the current index.

`StepBuilder` is pure TypeScript with no React, DOM, timers, stores, analytics, or product progress. It deep-clones emitted frame and auxiliary data, assigns stable zero-based step indices, validates code-line bounds, carries cumulative counters forward, caps runaway execution, and returns the run. React never calculates, mutates, or advances algorithm execution independently.

For identical parsed input, a module must return structurally identical run data. `learning-contract.test.tsx` enforces this across every registered preset.

### `AlgorithmRun` contract

| Field           | Requirement                                | Presentation owner           | Fallback                            |
| --------------- | ------------------------------------------ | ---------------------------- | ----------------------------------- |
| `slug`          | Required module identity                   | Player and route diagnostics | None                                |
| `steps`         | Required ordered canonical states          | Player store                 | Empty runs are non-playable         |
| `pseudocode`    | Required source indexed by `Step.codeLine` | Engine/code synchronization  | None                                |
| `codeByLang`    | Required JS, TS, and Python line arrays    | `CodePane`                   | An empty listing renders no lines   |
| `codeMap`       | Optional pseudocode-to-language mapping    | `resolveCodeLine`            | Identity mapping, then bounds check |
| `inputSummary`  | Required human-readable input              | Session and diagnostics      | None                                |
| `result`        | Required human-readable outcome            | Result/diagnostic consumers  | None                                |
| `totalCounters` | Required final counter snapshot            | Counter consumers            | Empty object                        |
| `truncated`     | Optional legacy-compatible run flag        | Diagnostics                  | Absent means not declared truncated |

### `Step` contract

The universal required fields are the minimum synchronized teaching state:

| Field       | Requirement and invariant                                            |
| ----------- | -------------------------------------------------------------------- |
| `i`         | Required stable zero-based index; equals its position in `run.steps` |
| `frame`     | Required canonical visual state from the frame-family union          |
| `codeLine`  | Required 1-based pseudocode line within the run's pseudocode bounds  |
| `narration` | Required non-empty immediate event sentence                          |
| `phase`     | Required non-empty semantic grouping and timeline fallback           |
| `counters`  | Required cumulative snapshot; values never decrease                  |

Optional fields enhance but never gate rendering:

| Field           | Enhancement                                           | Absence behaviour                                                      |
| --------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `aux`           | Stack, queue, key-value, log, or cost evidence        | `AuxPanels` renders nothing; variables may fall back to frame pointers |
| `detail`        | Additional prose for consumers that choose to show it | Core Golden reasoning remains derived from semantic state              |
| `timelineLabel` | Short learner-facing event label                      | Timeline uses `phase`                                                  |
| `isMilestone`   | Quiz/seek emphasis                                    | Treated as `false`                                                     |

Array-frame enhancements are also optional: `pointerNotes`, `rangeRows`, `swapPair`, `target`, `comparison`, and `decision`. Their absence removes only the associated row, callout, or calculation. Base values, states, pointers, and ranges still render. `rangeRows` falls back to the current range count; state entries fall back to `idle`; colour tones fall back to `accent`.

### Presentation input contracts

| Surface              | Typed input/source                                           | Pure transformation                                                                                      | Missing-data behaviour                                            |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Frame                | `currentStep.frame`                                          | `FrameView` dispatches by `frame.kind`; Golden arrays use `ArrayCanvas`                                  | No current step shows a preparing state                           |
| Variables            | Current and previous `Step`                                  | `deriveVariables` prefers key-value aux rows, then array pointers and target                             | Returns an empty list                                             |
| Operation            | Current/previous step plus canonical run slice               | `deriveOperation` chooses one result, comparison, midpoint, or boundary event                            | Returns `null`; no empty card                                     |
| Reasoning            | Current/previous step and 1-based display number             | `deriveReasoning` reads semantic array state                                                             | Returns `null` for unsupported/non-array teaching derivation      |
| Code synchronization | `codeLine`, `codeByLang`, optional `codeMap`                 | `resolveCodeLine` maps pseudocode to selected language                                                   | Identity mapping; invalid/out-of-range mapping highlights nothing |
| Timeline             | Ordered `Step[]`                                             | `buildTimelineNodes` groups consecutive semantic labels                                                  | Uses `phase`; milestones default false                            |
| Prediction           | Canonical run and current player index                       | `buildPredictionCheckpoints` and `derivePrediction` create typed questions from eligible semantic states | No checkpoint means no gate and no playback block                 |
| Trace                | Canonical `AlgorithmRun` plus curated trace exercise/session | `buildTraceSession`, `viewAt`, and `traceFrame` remain pure                                              | Route exposes Trace only when a compatible exercise exists        |

Presentation components may select store state for convenience, but they only render and dispatch learner actions. They cannot invent a frame, alter a run, calculate the next algorithm state, award completion, or use local state as a second execution engine.

### Frame-family contracts

`Frame` is a discriminated union. `FrameView` must exhaustively dispatch every member:

| Family  | Required canonical data                          | Optional enhancement data                                             |
| ------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `array` | Values, per-index states, pointers, ranges       | Pointer notes, reserved rows, swap pair, target, comparison, decision |
| `tree`  | Positioned nodes and edges                       | Node badge; edge label                                                |
| `graph` | Directed/weighted flags, positioned nodes, edges | Distance, node badge, edge weight                                     |
| `grid`  | Dimensions and addressed cells                   | Cell label, path                                                      |
| `table` | Row labels, column labels, addressed cells       | Title                                                                 |

Auxiliary state is a separate discriminated union:

| Family            | Required canonical data      | Optional enhancement data  |
| ----------------- | ---------------------------- | -------------------------- |
| `stack` / `queue` | Label and ordered items      | Item visual state          |
| `keyvalue`        | Label and key/value rows     | Row highlight              |
| `log`             | Label and ordered lines      | None                       |
| `cost`            | Label and per-item cost rows | Total, budget, and verdict |

Array, tree, graph, grid, and table fixtures must render through `FrameView`; every auxiliary family must render through `AuxPanels`. This is contract validation, not a claim that every family already has full catalog content.

### Ownership matrix

| Owner                   | Owns                                                                              | Must not own                                            |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/engine`            | Validation, deterministic execution, run/step/frame data, code listings, counters | React, DOM, timers, analytics, product progress         |
| `src/lib`               | Pure teaching derivation, synchronization, stage resolution                       | Zustand state, navigation side effects, component state |
| `playerStore`           | Loaded run, index, playback, seek, loop, raw input, validation error              | Algorithm implementation, XP, mastery                   |
| Prediction/Trace stores | Attempts and feedback state for their own interaction                             | Player execution or each other's state                  |
| Progress/prefs stores   | Product progress and user preferences                                             | Algorithm execution                                     |
| Components              | Typed rendering, focus, fixed overflow-free layout, learner action dispatch       | Deriving the next algorithm state or awarding authority |
| Routes                  | Journey composition, deep links, stage handoffs                                   | Reimplementing engine or store logic                    |

Dependency direction is enforced as `engine → lib derivation → stores/selectors → components → routes`. Product-state stores are orthogonal authorities consumed by routes; they do not flow back into engine execution.

## Reusable learning-workspace contract

Phase 2.4 freezes the proven composition; it does not introduce a second workspace API. The canonical lesson is composed in this order:

1. The route renders `LessonContextRow` and `LessonStageStrip` as the lesson and stage context.
2. `GoldenWorkspace` renders Algorithm World beside the Code/Input/About and Reasoning column.
3. `PlaybackBand` spans the full width below both desktop columns.

On desktop, the workspace uses a `58fr / 42fr` top grid and a fixed `58px` playback row. Every grid and flex ancestor that owns a bounded region retains `min-h-0`; changing execution steps must not resize the cards or scroll the page or any visualizer panel. Dynamic frame inputs are capped at their readable family limits, auxiliary structures summarize hidden logical entries, and the phase timeline renders a five-phase window around the active phase. No visualizer component uses `scrollIntoView`, `scrollLeft`, or `scrollTop`.

On mobile, responsive order is Algorithm World → playback → Code/Input/About and Reasoning. Previous, Play/Pause, and Next remain the first transport controls and therefore immediately accessible; Restart follows them, the timeline window stays bounded, and speed is secondary. Changing a step must not move focus or any scroll offset.

### Demonstrated composition points

These are typed domain seams already exercised by the product. They are contracts, not a request for speculative React slots:

| Variation         | Existing typed composition point                                                      | Owner                              |
| ----------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| Frame family      | `Frame.kind` exhaustive dispatch through `FrameView`; Golden arrays use `ArrayCanvas` | Engine data and visualization      |
| Auxiliary state   | Optional `Step.aux` rendered by `AuxPanels`                                           | Engine data and visualization      |
| Reasoning content | Pure `deriveReasoning(current, previous, stepNumber)` result                          | `src/lib` derivation               |
| Prediction        | Typed checkpoints from `usePredictionGate` rendered by `PredictionGate`               | Prediction domain and Explain pane |
| Trace             | `TraceExercise` and `TraceWorkspace` as a separate learner-driven composition         | Trace domain and lesson route      |
| Input             | `AlgorithmModule.inputs`, presets, and validation rendered by `InputPane`             | Engine module and player store     |
| Stage handoffs    | Explicit destinations and completion props passed to `LessonStageStrip`               | Lesson route and stage helpers     |

No broad `children`, render-prop, or slot surface is added until a real second workspace needs a composition that these typed points cannot express. `GoldenWorkspace` keeps its name and current props; architectural symmetry alone is not a reason to replace it.

### Product authority remains outside the workspace

| Product concern                                       | Existing authority                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Code, Solve, Review navigation and stage availability | Lesson route plus stage-resolution helpers                                     |
| Mastery, completion, and completed stages             | Progress store and route handoffs                                              |
| XP and streak                                         | Existing product progress/session sources rendered by the app shell and routes |
| Player index, playback, speed, and validated inputs   | Player and preference stores                                                   |

Workspace components may display these values or dispatch an explicit learner action, but cannot award XP, update mastery, mark completion, or decide a stage destination.

## Interaction and feedback contracts

Phase 2.5 shares presentation semantics while preserving separate domain transitions. Prediction and Trace both use `ChoiceGroup` because both require labelled native radio inputs, keyboard-native selection, a disabled Check action until selection, and a non-colour selection indicator. Both use `LearningFeedback` because each outcome needs one polite, atomic announcement and a focusable explanation sentence. The components do not share a store, progression model, or next action.

### Feedback semantics

| Semantic state | Shared presentation                                                  | Prediction transition                                             | Trace transition                                                      |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Unanswered     | Labelled radio group; Check disabled                                 | Playback blocks at the checkpoint                                 | Trace remains on the active checkpoint                                |
| Selected       | Selection has weight and check glyph; Check enabled                  | Still blocking until checked                                      | Still on the same checkpoint until checked                            |
| Incorrect      | “Not quite.” plus misconception explanation; feedback receives focus | Remains blocking; Try again clears selection; reveal is available | Does not advance; Try again clears selection; reveal is available     |
| Correct        | Correct explanation in the polite feedback region                    | Resolves playback, then Continue reveals same-step reasoning      | Remains on the explanation until Next step/Complete trace             |
| Revealed       | Correct explanation without claiming success                         | Outcome is `revealed`; resolves playback, then requires Continue  | Outcome is `revealed`; remains until Next step/Complete trace         |
| Next action    | Explicit primary action after explanation                            | Continue stays on the canonical player step                       | Next step advances learner progress; Complete trace opens the summary |

Focus moves only after an answer is checked or revealed, and only to that interaction's feedback sentence. Ordinary player next, previous, autoplay, timeline seek, URL restore, and trace stage changes do not call focus or change a scroll offset. `ExplainPane`, `CodePane`, and `StepTimeline` are non-scrolling.

### Prediction lifecycle

- `playerStore` remains the only owner of the canonical step index and timer. Prediction reads the current step and can block forward actions, but cannot move execution.
- Unanswered, selected, and incorrect entries block playback. Correct, revealed, and skipped entries resolve the checkpoint; only correct outcomes claim success.
- A manual forward timeline seek records every crossed unresolved checkpoint as `skipped`. Backward seeks and landing directly on a checkpoint do not skip it.
- A restored `?step=` URL seeks the canonical player directly. Landing on a checkpoint presents it unresolved; opening beyond it does not manufacture a correct or skipped outcome. Returning backward presents the still-unanswered checkpoint.
- Continue dismisses the resolved gate on the same step so the hidden Why/Invariant/Next reasoning can render. It does not call `next`.
- Restart/replay at index zero clears prediction entries. A changed algorithm or validated input run also clears them; the same run identity keeps them.

### Trace lifecycle and handoff

- `traceStore` owns only selected answers, checked attempts, hints, outcomes, and explanation acknowledgement. It has no player index, timer, frame mutation, XP, mastery, or completion authority and never imports `playerStore`.
- The engine run is the source of correct answers. An incorrect attempt records feedback and cannot alter the learner-visible algorithm state.
- Try again clears the selected answer while preserving attempts and hints. Show answer records `revealed`, selects the correct option, exposes the answer-level hint state, and never claims a correct outcome.
- Correct and revealed answers keep their explanation visible until the learner chooses Next step. The final checkpoint uses Complete trace; only then does the trace summary replace the question.
- Restart clears answers, attempts, hints, and acknowledgement while preserving the exercise input. A different exercise run key also clears interaction state.
- The completion summary reports only tracked steps, attempts, hints, and candidate path. Its Code handoff uses the route-provided implementation slug and does not award product completion or XP.

## Cross-module proof

Phase 2.6 validates the extracted contracts against existing catalog content; it does not claim Phase 5 completion or create missing algorithm lessons.

| Representative        | Registered frame family | Demonstrated auxiliary families | Shared surfaces exercised                               |
| --------------------- | ----------------------- | ------------------------------- | ------------------------------------------------------- |
| `binary-search`       | Array                   | None required                   | Golden reference, Algorithm World, playback, prediction |
| `heap-sort`           | Tree                    | Key/value                       | Frame dispatch, auxiliary panel, playback               |
| `bfs`                 | Graph                   | Queue, log                      | Frame dispatch, multiple auxiliary panels, playback     |
| `quicksort`           | Array                   | Stack                           | Array compatibility, stack panel, playback              |
| `merge-sort`          | Array                   | Log                             | Long run/timeline, log panel, playback                  |
| `koko-eating-bananas` | Array                   | Cost                            | Problem-module resolution, cost panel, playback         |

Every representative is loaded through the real registry and player store, then server-rendered through `AlgorithmWorldPanel` and `PlaybackBand`. The proof checks canonical frame and auxiliary kinds, semantic workspace/playback regions, transport controls, and phase timeline without adding algorithm-name branches to shared React.

The current registry emits array, tree, and graph frames. Grid and table remain valid members of the exhaustive `Frame` union and render through `FrameView` fixture contracts, but no registered algorithm or problem module emits either family yet. That is a catalog limitation for later visualization-family work, not permission to invent placeholder modules during extraction.

Backward compatibility is covered by a minimal step/run fixture with no optional metadata. Keyboard contracts remain in `usePlayerKeys` and playback-control tests; reduced-motion tests exercise next, previous, seek, milestones, first, and last without changing execution semantics. Binary Search remains the visual and behavioural baseline at desktop, 320px, and every target reflow width.

## Smallest safe split

`WorkspacePanels.tsx` currently owns unrelated responsibilities and legacy composition. Split it without changing component APIs or markup:

1. Move `CodePane` and its language/code-line helpers to `player/CodePane.tsx`.
2. Move `ExplainPane` to `player/ExplainPane.tsx`; prediction remains a child interaction.
3. Move input defaulting and `InputPane` to `player/InputPane.tsx`.
4. Move `AboutPane` to `player/AboutPane.tsx`.
5. Leave `SidePanel` and `VisualStage` in `WorkspacePanels.tsx` as compatibility composition importing those pieces.
6. Preserve temporary re-exports from `WorkspacePanels.tsx`, then update consumers to direct imports and the player barrel.

This split is mechanical. It must preserve DOM order, ids, accessible names, focus behaviour, zero-scroll CSS geometry, and player-store selectors.

## Ownership rules

- Engine modules own execution, frames, code listings, inputs, presets, and counters.
- `src/lib` owns pure derivation and stage-resolution logic.
- Player, prediction, trace, and progress stores remain separate owners; one store does not absorb another stage.
- Visualization components own frame presentation, never algorithm execution.
- Workspace components own layout and composition, never product completion.
- Routes own navigation and handoffs to Code, Solve, Review, and future Watch media.
- Dynamic step content fits its fixed panel through hard input limits and summaries. Step changes never move DOM focus or any scroll offset.
- Public APIs expose typed domain inputs, not broad player-store prop bags.

## Extraction sequence

1. Completed: mechanical `WorkspacePanels.tsx` split with compatibility exports and direct pane tests.
2. Completed: reuse `ChoiceGroup` and `LearningFeedback` inside `PredictionGate` while preserving prediction-only semantics.
3. Consolidate package exports for workspace, player, visualization, prediction, and trace only where current consumers prove the boundary.
4. Validate frame and playback contracts with representative array, tree, graph, grid/table, and auxiliary modules.
5. Re-run the frozen Binary Search desktop/mobile baseline after every extraction set.

Each set must pass `bun run verify`, `bun run build`, focused browser E2E, keyboard checks, and reduced-motion checks before the next set begins.
