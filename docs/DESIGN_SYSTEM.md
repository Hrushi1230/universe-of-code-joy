# ALGORA LEARNING DESIGN SYSTEM

Version 1.1 — P6 contrast corrections, 2026-09-14

Product principle:
See the algorithm think.

Algora is not designed as a generic SaaS dashboard. Every screen must help a student understand, practise, remember, or measure an algorithmic concept.

## 01. PRODUCT PERSONALITY

Algora must feel:

- Precise.
- Calm.
- Technical.
- Educational.
- Premium.
- Interactive.
- Human-readable.

Algora must never feel:

- Gamey for the sake of being gamey.
- Like a crypto dashboard.
- Like an AI-generated template.
- Like a dark developer IDE.
- Like a children's learning application.
- Overdecorated.

The product should communicate:

Complex computer science made visually understandable.

## 02. CORE VISUAL LANGUAGE

Background

Primary application background:

`--paper: #F7F9F8`

Primary elevated surface:

`--card: #FFFFFF`

Border:

`--hairline: #E4E9E7`

Primary text:

`--ink: #0E1513`

Secondary text:

`--slate: #5B6763`

Tertiary text:

`--slate-soft: var(--slate)` — readable tertiary text; hierarchy uses size/spacing, not failing contrast.

## 03. BRAND ACCENT

Primary:

`--accent-strong: #087563`

Primary text/buttons and their hover foreground/background pair use this readable teal. Keep the brighter highlight for graphics, not small text on pale surfaces.

Interactive highlight:

`--highlight: #14B8A6`

Accent tint:

`--tint: #E6F5F2`

Teal is reserved for:

- Primary actions
- Current execution state
- Progress
- Links
- Selected controls
- Correct algorithmic movement
- Brand identity

Do not use teal as meaningless decoration.

## 04. SEMANTIC COLOURS

Success:

`#16785F`

Warning:

`#895A14` — readable on the warning tint.

Error / comparison conflict:

`#C0453E`

Semantic colours must communicate information.

Never introduce random additional colours for visual variety.

## 05. VISUALIZATION STATE GRAMMAR

Every algorithm uses the same state language.

| State   | Meaning                              |
| ------- | ------------------------------------ |
| Idle    | Not yet involved                     |
| Active  | Current algorithm focus              |
| Visited | Already processed                    |
| Frontier| Waiting to be processed              |
| Compare | Currently being compared             |
| Found   | Desired result found                 |
| Excluded| Proven irrelevant                    |
| Sorted  | Final confirmed position             |
| Error   | Invalid / failed condition           |

A student learning BFS and a student learning Binary Search should already understand the colour grammar from another Algora lesson.

Colour must never be the only signal.

Use labels, icons, outlines, pointer names, opacity, or shape changes where appropriate.

## 06. TYPOGRAPHY

Interface and educational prose

Instrument Sans.

Code, variables, complexity, values, timestamps and algorithmic expressions

JetBrains Mono.

Type scale

Display:
48–56px / 1.05

Page title:
36–40px / 1.1

Section title:
28–32px / 1.2

Panel title:
18–20px / 1.3

Body:
15–16px / 1.55

Secondary:
13–14px / 1.5

Label:
11–12px / 1.4

Code:
13–14px / 1.65

Large numerical values:
JetBrains Mono, 24–32px.

Never use more than approximately three visually dominant text sizes in one viewport.

## 07. SPACING

Use a 4px base rhythm.

Preferred scale:

- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64
- 96

Major panels should have 20–24px internal padding.

Compact algorithm controls may use 8–12px spacing.

Do not create arbitrary values when an existing spacing value works.

## 08. RADII

Small controls:
8px

Inputs and compact cards:
12px

Primary panels:
16px

Large educational surfaces:
24px maximum

Avoid pill shapes except for status badges, filters, tags and compact segmented controls.

## 09. ELEVATION

Borders establish structure first.

Shadows establish elevation second.

Default panel:

1px hairline border
No obvious shadow

Floating interaction:

Shadow level 1

Dropdown / menu:

Shadow level 2

Temporary modal:

Shadow level 3

Never use dramatic shadows, glow or neon effects.

## 10. MAIN LEARNING WORKSPACE

Desktop learning workspace uses two conceptual zones.

Left — Algorithm World

Recommended width:
55–62%

Contains:

- Main data structure
- Pointers
- Traversal movement
- Current values
- Ranges
- Comparison expressions
- Stack / queue / heap when relevant
- DP state when relevant
- Algorithm transitions

Right — Reasoning World

Recommended width:
38–45%

Upper approximately 65–70%:

Code

Lower approximately 30–35%:

Explanation / Why / Invariant

Playback belongs to the overall workspace, not individually to either pane.

## 11. THE SYNCHRONIZATION CONTRACT

Every execution step must answer four questions simultaneously.

1 — WHAT CODE CAUSED THIS?

Exactly one meaningful code line or logical group receives primary emphasis.

2 — WHAT CHANGED?

The corresponding element, pointer, node, range or value changes in Algorithm World.

3 — WHY DID IT CHANGE?

The explanation describes the reason in plain English.

4 — WHAT REMAINS TRUE?

When useful, show the algorithm's invariant.

Example:

Code:

`low = mid + 1`

Visual:

low travels from index 0 to index 5.

Explanation:

“24 is smaller than 42, so everything at or before index 4 can be discarded.”

Invariant:

“If 42 exists, it remains inside [low, high].”

There must never be animation without understandable meaning.

There must never be an explanation disconnected from the visual cause.

There must never be an active code line with no visible consequence when that consequence can be represented.

## 12. ALGORITHM MOTION SYSTEM

Existing timing foundation:

Fast:
120ms

Standard:
220ms

Teaching movement:
380ms

For complex educational transitions, sequencing multiple 220–380ms actions is preferred over one long animation.

Motion hierarchy:

Highlight cause
→ Move pointer / focus
→ Change data state
→ Show result
→ Update explanation

Do not make several unrelated educational events move simultaneously.

The student's eye should know where to look.

Autoplay may sequence transitions automatically.

Manual stepping must always remain available.

Reduced-motion mode keeps every informational state but removes unnecessary interpolation and autoplay.

## 13. POINTER DESIGN

Pointers are first-class educational objects.

Every pointer includes:

- Name
- Position
- Optional arithmetic explanation

Example:

`mid`

`floor((0 + 8) / 2) = 4`

Pointer movement must animate from previous position to next position rather than simply appearing at the destination whenever motion is enabled.

Common pointer names remain visually stable:

- low
- high
- mid
- left
- right
- slow
- fast
- i
- j

## 14. VARIABLE BOARD

Important changing variables should not be hidden in prose.

Provide a compact Variable Board.

Example:

`LOW 0 → 5`
`MID 4`
`HIGH 8`
`TARGET 42`

Only values changed during the current step receive strong visual emphasis.

Previous value may appear briefly to show transition.

## 15. EXPRESSION SYSTEM

Algorithm calculations should be visual objects.

Instead of explanation only:

“mid becomes 4”

prefer:

`floor((0 + 8) / 2)`

↓

`4`

For comparisons:

`24 < 42`

↓

`TRUE`

↓

Move low to mid + 1

Calculation → result → consequence.

## 16. EXPLANATION PANEL

Each explanation can contain four levels.

ACTION

What happened?

WHY

Why was this operation valid?

INVARIANT

What remains guaranteed?

COMPLEXITY IMPACT

Only when educationally useful.

Do not show all four sections when they add no value.

Keep the immediate narration short.

Deeper reasoning should be secondary.

## 17. PREDICTION GATE

Students must periodically switch from passive watching to active reasoning.

Playback may pause at meaningful milestones.

Example:

What happens next?

- `low = mid + 1`
- `high = mid - 1`
- `return mid`

The student predicts.

Then Algora reveals the execution.

Prediction should target understanding, not trivia.

## 18. CODE PANEL

Code is part of the visualization.

Requirements:

- Visible line numbers
- One primary active line
- Language selector
- JS / TypeScript / Python
- Active line uses tinted background, not saturated block colour
- No dark editor theme
- Keep the active line visible within the fixed code panel; use bounded code pages or focused views where needed
- No page or internal scrolling in the learning visualizer; retain readable text and the visible bottom controller
- Accessible aria-current behaviour
- Code font always JetBrains Mono

When one pseudocode operation maps differently to each language, use the language-specific code map.

## 19. DATA STRUCTURE PRIMITIVES

Algora should standardise a limited family of teaching primitives.

ARRAY

- Cells
- Index labels
- Pointers
- Range bands
- Swap movement

STACK

- Vertical elements
- Push from top
- Pop from top

QUEUE

- Horizontal direction
- Enqueue tail
- Dequeue head

LINKED LIST

- Node
- Value
- Next reference
- Pointer traversal

TREE

- Node
- Edge
- Current node
- Visited node
- Traversal order

GRAPH

- Node
- Weighted/unweighted edge
- Frontier
- Visited
- Rejected edge
- Current distance

HEAP

- Tree representation
- Optional synchronized array representation

DP

- Table
- Current dependency cells
- Formula
- Computed cell

RECURSION

- Call stack
- Arguments
- Return values
- Current depth

Every new algorithm should compose these primitives rather than inventing a custom visual language.

## 20. PLAYER CONTROLS

Canonical order:

- Previous meaningful step
- Play / Pause
- Next meaningful step
- Timeline
- Current step / total
- Speed
- Restart
- Input

Advanced actions should remain secondary.

The control bar should not visually compete with the algorithm.

## 21. LEARNING LESSON STRUCTURE

Every complete lesson follows:

CONCEPT

Explain the idea without implementation complexity.

WATCH

Teacher / YouTube explanation.

GUIDED VISUALIZER

Synchronized algorithm execution.

PREDICT

Student anticipates important operations.

TRACE

Student manually follows a new input.

IMPLEMENT

Student writes or completes code.

SOLVE

Interview-style challenge.

REVIEW

SRS revisits the concept.

MASTER

Progress updates.

This is Algora's canonical learning loop.

## 22. FEEDBACK SYSTEM

Correct action:

Small positive confirmation.

Incorrect action:

Explain the misconception.

Never punish a student visually.

Never use aggressive red screens.

Error communicates:

- What was incorrect
- Why
- What mental model should replace it

## 23. GAMIFICATION

XP, levels, streaks and achievements support learning.

They must never dominate the lesson.

Priority hierarchy:

1. Understanding
2. Practice
3. Mastery
4. Progress
5. Gamification

Not:

1. XP
2. Animations
3. Badges
4. Learning

## 24. RESPONSIVE PRINCIPLE

Desktop is the canonical visualizer experience.

At reduced widths:

Algorithm World stays above.
Code follows.
Explanation follows.
Controls remain accessible.

Do not squeeze a desktop two-column visualization until neither pane is readable.

Educational clarity outranks layout symmetry.

## 25. FORBIDDEN VISUAL PATTERNS

No dark application surfaces.
No black code editor.
No purple.
No rainbow gradients.
No glowing blobs.
No neon.
No glassmorphism.
No arbitrary 3D.
No decorative charts.
No random illustrations inside technical learning views.
No card inside card inside card without hierarchy.
No excessive pills.
No excessive shadows.
No gradients used merely to make the product “premium”.

Premium comes from precision, typography, spacing, motion and teaching quality.

## 26. GOLDEN RULE

Before adding any visual element, ask:

Does this help the student understand what the algorithm is thinking?

If no:

remove it.

Before adding any animation, ask:

Does motion explain a state transition?

If no:

do not animate it.

Before adding any panel, ask:

Is this information necessary at this moment?

If no:

hide or defer it.

## 27. ALGORA EXPERIENCE STANDARD

A student should be able to pause on any meaningful execution step and answer:

- Where are we?
- Which code is running?
- Which data is active?
- What changed?
- Why did it change?
- What happens next?
- How does this move us toward the answer?

If the screen cannot answer these questions, the visualization is incomplete.

## 28. DESIGN PRINCIPLE

Algora does not animate code.

Algora visualizes reasoning.

That distinction defines the entire product.
