ALGORA VISUALIZER CONTRACT

Version 1.0

Product: Algora
Purpose: Define how algorithm execution, visualization, code, variables, explanations, playback, interaction and accessibility must synchronize.

Related documents:

DESIGN_SYSTEM.md → how Algora looks

LEARNING_EXPERIENCE.md → how students learn

VISUALIZER_CONTRACT.md → how the learning engine behaves

This document is a hard implementation contract.

Do not invent a parallel visualizer architecture unless the existing architecture cannot support a required behavior.

1. CORE PRINCIPLE

Algora does not animate algorithms for decoration.

Algora visualizes algorithmic reasoning.

Every meaningful execution step must connect:

CODE
  ↓
ALGORITHM STATE
  ↓
VISIBLE CHANGE
  ↓
VARIABLE CHANGE
  ↓
REASON
  ↓
NEXT DECISION


The student should be able to pause at any step and understand:

what code is executing

what changed

why it changed

which variables changed

what state remains valid

what will likely happen next

2. EXISTING ARCHITECTURE FIRST

Algora already has an execution model based on algorithm Step objects and visualization frames.

Preserve that architecture.

Do not replace working algorithm logic merely to create new visual effects.

The visual layer should consume engine output.

The engine should not depend on UI implementation details.

3. CURRENT STEP MODEL

The existing conceptual contract includes values such as:

type Step = {
  frame: Frame;
  codeLine?: number;
  narration?: string;
  detail?: string;
  phase?: string;
  timelineLabel?: string;
  counters?: Record<string, number>;
  isMilestone?: boolean;
};


Actual project types remain the source of truth.

This document describes how they should be interpreted by the UI.

4. STEP IS THE UNIT OF LEARNING

A step represents one meaningful algorithmic event.

Examples:

Initialize boundaries
Calculate midpoint
Compare midpoint to target
Discard left range
Move pointer
Swap values
Visit node
Enqueue neighbor
Pop stack
Relax edge
Update DP cell
Enter recursion
Return from recursion


A step is not necessarily equivalent to one JavaScript statement.

Educational meaning determines step boundaries.

5. FRAME IS THE CURRENT STATE

A frame describes:

What the algorithm world looks like at this point in execution.

A frame may include:

array

pointers

ranges

active indexes

excluded indexes

comparison state

tree

graph

grid

table

stack

queue

key-value information

counters

output

visited state

frontier state

The frame is the authoritative visual state.

6. PREVIOUS FRAME MATTERS

The visualizer must not render each frame as an unrelated screenshot.

When moving from:

Step N
↓
Step N + 1


the UI should compare:

previousFrame
currentFrame


and determine what changed.

This creates meaningful transition animation.

7. FRAME DIFF PRINCIPLE

Transitions should be derived from state differences where possible.

Example:

Previous:

low = 0
mid = 4
high = 8


Current:

low = 5
mid = 6
high = 8


The UI understands:

low changed 0 → 5
mid changed 4 → 6
high unchanged


Therefore:

animate low

animate mid

do not unnecessarily animate high

8. DO NOT REANIMATE UNCHANGED STATE

If an element did not change, it should normally remain visually stable.

Bad:

Every array cell fades in again when one pointer moves.

Good:

Only the pointer moves.

Stable visual state reduces cognitive load.

9. SYNCHRONIZATION MODEL

Each step must synchronize five primary surfaces:

1. Visual state
2. Code state
3. Variable state
4. Explanation state
5. Playback state


Optional surfaces:

Prediction
Invariant
Complexity
Stack/Queue
Call stack
Expression calculation
Milestone


10. STEP TRANSACTION

A step should behave like one transaction.

Conceptually:

function applyStep(stepIndex: number) {
  const previous = steps[stepIndex - 1];
  const current = steps[stepIndex];

  updateTimeline(current);
  updateCode(current);
  animateFrame(previous?.frame, current.frame);
  updateVariables(previous, current);
  updateExplanation(current);
  announceAccessibilityState(current);
}


Do not let different panels drift onto different step indexes.

11. SINGLE SOURCE OF TRUTH

There must be one canonical:

currentStepIndex


All learning surfaces derive from it.

Avoid:

visualStepIndex
codeStepIndex
explanationStepIndex
timelineStepIndex


unless there is a compelling architectural reason.

Multiple independent step states create synchronization bugs.

12. CODE LINE CONTRACT

codeLine identifies the source-code instruction related to the current execution event.

When currentStepIndex changes:

resolve the correct line for the selected language

update active line

keep code visible in a fixed panel or bounded code page without scrolling

visually emphasize it

expose active line semantically for accessibility

13. LANGUAGE-SPECIFIC CODE MAPPING

JavaScript, TypeScript and Python may require different source line numbers.

Never assume:

pseudocode line = JavaScript line = Python line


Use existing language-specific mapping support.

The execution step represents algorithmic meaning.

Language mappings represent source-code presentation.

14. CODE EMPHASIS

Only the currently relevant operation receives primary emphasis.

Recommended:

subtle tinted background

left execution marker

stronger code text

visible line number

Avoid:

flashing

neon highlighting

large saturated backgrounds

animating every token

15. LOGICAL LINE GROUPS

Some algorithmic operations span multiple source lines.

Example:

if (arr[mid] < target) {
  low = mid + 1;
}


The primary line may be:

low = mid + 1;


while the condition is represented through the explanation/comparison layer.

If necessary, a future step model may support:

codeLines: [5, 6]


but do not extend the type solely for styling convenience.

16. ALGORITHM WORLD CONTRACT

The left visualization area is the physical world of the algorithm.

Every important algorithm concept should have a visible representation where feasible.

Examples:

variable → Variable Board
array index → Cell
range → Range Band
pointer → Pointer
comparison → Expression
queue → Queue Panel
stack → Stack Panel
recursion → Call Stack
graph exploration → Frontier + Visited states
DP → Dependency cells + Result cell


17. VISUALIZATION STATE MUST HAVE MEANING

Never assign visual states randomly.

Every state must correspond to an algorithmic meaning.

Canonical vocabulary:

idle
active
visited
frontier
compare
found
excluded
sorted
error


Use the design-system tokens.

Do not invent algorithm-specific random color meanings.

18. STATE PRIORITY

Sometimes an element belongs to multiple states.

Example:

An array cell may be:

inside active range
currently compared
contains target


Rendering priority must be deterministic.

Recommended conceptual priority:

found
>
error
>
compare / active
>
frontier
>
sorted
>
visited
>
excluded
>
idle


Exact rendering details may vary by primitive.

Meaning must remain clear.

19. ARRAY CONTRACT

Array visualization supports:

values
indices
pointers
ranges
comparison
swap
target
excluded state
sorted state


Each array cell must preserve its identity during transitions where possible.

Do not recreate cells solely to animate changes.

20. ARRAY CELL CONTENT

Default cell:

index
value
state


Optional educational overlays:

target
comparison
pointer anchor
sorted marker


Do not overload one cell with too many text labels simultaneously.

21. POINTER CONTRACT

Pointers are persistent algorithm objects.

Examples:

low
high
mid
left
right
slow
fast
i
j


Pointer should contain:

semantic name

current position

state

optional calculation/explanation

When its position changes:

old position → new position


animate spatial movement where motion is enabled.

22. POINTER IDENTITY MUST BE STABLE

A low pointer remains the same visual object across steps.

Bad:

Remove old low.

Create new low.

Good:

Update the position of the existing low.

This helps the student perceive movement rather than disappearance/reappearance.

23. POINTER COLLISION

When multiple pointers occupy the same index:

Do not overlap their labels unreadably.

Possible strategies:

vertical stacking
horizontal offset
grouped label
alternate anchor


Example:

low · mid
    ↓
   [24]


The pointer system should handle collisions consistently.

24. POINTER ARITHMETIC

When a pointer calculation is educationally important, show it near the pointer or variable area.

Example:

mid = floor((low + high) / 2)

mid = floor((0 + 8) / 2)

mid = 4


Do not show arithmetic for every trivial increment.

25. RANGE CONTRACT

Ranges communicate the current valid region of an algorithm.

Examples:

Binary Search:

[low ........ high]


Sliding Window:

[left ........ right]


Quick Sort:

current partition range


26. RANGE TRANSITIONS

When a range shrinks:

The discarded region should visibly transition to excluded.

The student should perceive:

previous candidates
↓
reasoning decision
↓
smaller candidate set


Do not instantly redraw an unrelated smaller array.

27. SWAP CONTRACT

For sorting algorithms, swapping should preserve element identity.

When:

a ↔ b


the visual motion should communicate that two existing values exchanged positions.

Avoid:

value A disappears
value B disappears
new cells appear


when motion is enabled.

28. COMPARISON CONTRACT

Comparisons should be visible when they drive algorithm decisions.

Example:

24 < 42


Then:

TRUE


Then:

search right


This may appear as an expression panel, inline reaction or temporary annotation.

29. COMPARISON DURATION

Do not leave comparison overlays permanently when they no longer matter.

They should normally persist for:

current step


or until the next meaningful decision replaces them.

Historical information belongs in logs/timeline, not permanent clutter.

30. VARIABLE BOARD CONTRACT

The visualizer should expose algorithmically important variables.

Example:

low       0 → 5
mid       4
high      8
target    42


Changed variables receive stronger emphasis.

Unchanged variables remain stable.

31. VARIABLE DIFF

Variable Board should compute:

previousValue
currentValue
changed


Optional presentation:

low
0 → 5


Do not show previous values forever.

Transition history is temporary teaching context.

32. VARIABLE SELECTION

Do not expose every internal implementation variable.

Show variables that matter to understanding.

Good:

low
high
mid
target


Potentially unnecessary:

temporary DOM id
internal loop metadata
implementation-only bookkeeping


33. AUXILIARY STRUCTURE CONTRACT

When the algorithm uses:

stack
queue
heap
map
set
distance table
parent map
frequency map


and understanding depends on it, expose it visually.

The engine already emits auxiliary state in some algorithms.

The UI must not silently ignore engine state that is educationally relevant.

34. KEY-VALUE PANEL

Key-value state should support structures such as:

distance
frequency
parent
visited mapping
window counts


Example:

DISTANCE

A    0
B    4
C    7
D    ∞


When one entry changes, emphasize only that entry.

35. STACK CONTRACT

Stack visualization should clearly communicate:

top
push
pop


Newest item should appear at the top according to the chosen visual convention.

The convention must remain consistent across Algora.

36. QUEUE CONTRACT

Queue visualization must clearly communicate:

head
tail
enqueue
dequeue


Recommended:

HEAD → [A][B][C] ← TAIL


or another consistent direction.

Do not reverse direction between algorithms.

37. TREE CONTRACT

Tree visualization should support:

current node
visited nodes
child relationship
parent relationship
comparison
traversal order


Layout stability is critical.

Nodes should not jump to unrelated positions between steps unless tree structure changes.

38. GRAPH CONTRACT

Graph visualization should support:

current node
frontier
visited
active edge
rejected edge
distance
weight
parent


Graph layout should remain stable during one run.

Never recalculate arbitrary node positions every step.

39. GRAPH EDGE MEANING

Edges may need distinct semantic states:

idle
considered
selected
relaxed
rejected
tree edge


Reuse standard color grammar and secondary line patterns/icons where necessary.

Do not create a rainbow edge system.

40. GRID CONTRACT

Grid algorithms should communicate:

current cell
frontier
visited
blocked
path
target


Grid coordinates should remain stable.

Traversal motion should reflect actual adjacency.

41. DP TABLE CONTRACT

Dynamic Programming must visualize reasoning, not merely a completed table.

Each update should show:

current state
dependencies
transition/formula
computed value


Example:

dp[i] = max(
  dp[i - 1],
  nums[i] + dp[i - 2]
)


Highlight:

dependency cells
↓
formula
↓
new cell value


42. RECURSION CONTRACT

Recursive algorithms should expose call structure.

Recommended representation:

CALL STACK

fib(5)
↓
fib(4)
↓
fib(3)


Each entry may contain:

function
arguments
status
return value


43. RECURSION TRANSITIONS

Two major events:

ENTER
RETURN


Students should distinguish:

new recursive call


from:

result returning to caller


44. EXPLANATION CONTRACT

The explanation panel follows the active step.

It must not describe the previous or next state.

Possible fields:

Action
Why
Invariant
Detail
Complexity insight


45. ACTION COPY

Action describes what occurred.

Example:

Move low to index 5.


Recommended:

5–15 words.

46. WHY COPY

Why explains the reasoning.

Example:

24 is smaller than 42, so values at or left of index 4 cannot be the target.


Keep language simple.

47. DETAIL COPY

Detail may provide deeper context.

Example:

Because the array is sorted in ascending order, all earlier elements are also ≤ 24.


Use progressively.

Do not overload every execution step.

48. INVARIANT CONTRACT

If a step exposes an invariant, it must remain logically correct for the displayed state.

Example:

If the target exists, it lies between low and high.


Never display stale invariant text after state changes.

49. PHASE CONTRACT

phase groups execution into conceptual sections.

Example Binary Search:

Initialize
Calculate midpoint
Compare
Eliminate
Repeat
Found


Example BFS:

Initialize
Dequeue
Visit
Explore neighbors
Enqueue
Complete


50. TIMELINE CONTRACT

Timeline should represent meaningful algorithm progress.

If available, use:

phase
timelineLabel
milestone


instead of only:

Step 7 / 23


The student should understand where they are conceptually.

51. MILESTONE CONTRACT

isMilestone identifies important pedagogical states.

Examples:

first range elimination
partition completed
target found
new BFS level
base case
row completed
heap restored


Milestones may trigger:

stronger explanation
prediction gate
brief pause
phase update


Do not make every step a milestone.

52. PREDICTION INTEGRATION

Prediction is associated with a meaningful execution state.

Playback pauses before revealing the next important transition.

Flow:

Current state
↓
Ask prediction
↓
Student answers
↓
Feedback
↓
Reveal next step


Prediction must never desynchronize engine state.

53. PREDICTION DOES NOT ALTER THE ENGINE

For guided lessons, incorrect prediction should not mutate the official algorithm execution.

Student answer affects:

feedback
mastery signal
attempt record


Official engine execution remains deterministic.

54. PLAYBACK CONTRACT

Canonical controls:

Previous
Play / Pause
Next
Timeline
Speed
Restart
Input


The current step remains the central state.

55. NEXT

Next advances to:

currentStepIndex + 1


unless a prediction gate or other intentional learning interaction blocks reveal.

56. PREVIOUS

Previous returns to the previous deterministic state.

The UI must accurately restore:

frame
code line
variables
explanation
timeline


Never attempt to reverse animations logically.

Render the previous state and transition toward it.

57. RESTART

Restart must reset to the canonical starting step.

It should clear:

autoplay timers
temporary comparison effects
temporary feedback
prediction reveal state
transient animation state


It should not necessarily erase permanent lesson progress.

58. AUTOPLAY

Autoplay advances through meaningful steps automatically.

Autoplay must pause when:

lesson requires prediction
run completes
user manually interacts
browser/app state makes continuation inappropriate


59. SPEED

Recommended speeds:

0.5x
1x
1.5x
2x


Speed changes teaching transition durations.

It should not create race conditions between panels.

60. AUTOPLAY STATE MACHINE

Recommended conceptual states:

idle
playing
paused
waiting-for-prediction
completed


Avoid representing playback with multiple unrelated booleans such as:

isPlaying
isPaused
isStopped
isWaiting


when a single state machine would be clearer.

61. ANIMATION CONTRACT

Motion explains state transitions.

Order of educational attention should generally be:

1. show cause
2. move focus/pointer
3. mutate state
4. show consequence
5. settle


Not every transition needs all stages.

62. ANIMATION TIMINGS

Use design-system timing tokens.

Suggested semantic timings:

micro feedback      ~120ms
standard UI         ~220ms
teaching transition ~380ms


Complex sequences should combine shorter transitions.

Avoid long 1–3 second animations for ordinary algorithm operations.

63. NO ANIMATION QUEUE DRIFT

Autoplay must not advance before the current teaching transition is considered settled.

Possible model:

apply step
↓
run transition
↓
settled
↓
schedule next step


Do not keep pushing step changes into an uncontrolled timer queue.

64. INTERRUPTIBLE MOTION

If a student presses:

Next
Previous
Pause
Restart


during animation:

The interface should settle into the requested canonical state.

Do not leave intermediate transforms or ghost elements behind.

65. REDUCED MOTION

When reduced motion is enabled:

Preserve:

state changes
active code
variable updates
comparison results
explanations


Remove or reduce:

travel animations
decorative transitions
autoplay motion


Learning information must remain complete.

66. INPUT CONTRACT

Algorithms may allow custom input.

Changing input must:

validate input
generate deterministic steps
reset current step
reset playback
clear temporary feedback
render new initial frame


Do not reuse steps generated for the old input.

67. INPUT VALIDATION

Handle:

empty input
invalid values
duplicate values
negative numbers
extreme sizes
algorithm-specific restrictions


Never expose:

NaN
undefined
Infinity
broken visual state


68. VISUALIZATION SIZE LIMITS

Custom inputs should be bounded for visual teaching.

Example:

A 10,000-element array may be valid computationally but useless visually.

The interface should enforce or recommend a manageable visualization range.

Complexity demonstrations may use aggregate representations for larger inputs.

69. DETERMINISTIC RUNNER

For the same:

algorithm
input
configuration


the guided visualizer should generate the same canonical step sequence unless randomness is an intentional algorithm feature.

This is important for:

tests
video synchronization
lesson cue mapping
progress restoration
bug reproduction


70. VIDEO SYNCHRONIZATION CONTRACT

Future video synchronization maps time ranges to existing step indexes.

Example:

const videoCues = [
  { time: 0, step: 0 },
  { time: 23.8, step: 1 },
  { time: 39.4, step: 2 },
];


Video does not own algorithm state.

The algorithm step remains canonical.

71. VIDEO FOLLOW MODE

Potential future modes:

Video drives visualizer
Visualizer drives video
Independent


Default should avoid surprising seek behavior.

Students must retain manual control.

72. VISUALIZER COMPONENT ARCHITECTURE

Recommended high-level composition:

AlgorithmWorkspace
│
├── AlgorithmWorld
│   ├── VisualizationRenderer
│   ├── VariableBoard
│   ├── AuxiliaryPanel
│   └── ExpressionView
│
├── ReasoningWorld
│   ├── CodePane
│   ├── ExplanationPanel
│   └── InvariantCard
│
├── PredictionGate
│
└── PlaybackBar


Names may follow existing project conventions.

Do not duplicate existing reusable components unnecessarily.

73. FRAME RENDERER

Use one frame renderer that delegates by frame type.

Conceptually:

switch (frame.kind) {
  case "array":
    return <ArrayVisualizer />;
  case "tree":
    return <TreeVisualizer />;
  case "graph":
    return <GraphVisualizer />;
  case "grid":
    return <GridVisualizer />;
  case "table":
    return <TableVisualizer />;
}


Keep rendering separated from algorithm logic.

74. FRAME RENDERER MUST NOT KNOW ALGORITHM NAMES

Bad:

if (algorithm === "binary-search") {
  // draw low/high
}


Better:

render(frame.pointers)
render(frame.ranges)
render(frame.comparison)


The visualization primitives should compose based on state.

This makes the system reusable.

75. ALGORITHM LOGIC MUST NOT KNOW CSS

Bad engine output:

{
  color: "#14B8A6",
  left: "34px"
}


Good engine output:

{
  state: "active",
  index: 4
}


The design system decides color and physical presentation.

76. CONTENT AND RENDERING SEPARATION

Algorithm content provides:

state
meaning
reason
labels


Renderer provides:

layout
color
animation
typography
responsive behavior


Do not mix these responsibilities.

77. VISUALIZATION PRIMITIVES

Build and reuse canonical primitives.

Recommended:

AlgorithmCell
Pointer
RangeBand
ComparisonExpression
VariableItem
StackItem
QueueItem
TreeNode
GraphNode
GraphEdge
GridCell
TableCell
CallFrame
TimelineMarker


78. COMPONENT CONSISTENCY

The same Pointer primitive should ideally power:

Binary Search low/high/mid
Two Pointers left/right
Sliding Window left/right
Fast/Slow pointers


Do not build visually unrelated pointer systems per algorithm.

79. VIEW MODEL LAYER

If raw engine frames become cumbersome for UI rendering, introduce a presentation/view-model layer.

Example:

type VisualizerViewModel = {
  frame;
  variables;
  activeCodeLine;
  explanation;
  timeline;
};


But:

Do not duplicate algorithm state into a second independent execution engine.

80. OPTIONAL TRANSITION MODEL

Only introduce explicit transition metadata if frame diffing is insufficient.

Example future contract:

type TransitionHint =
  | {
      type: "pointer-move";
      pointer: string;
      from: number;
      to: number;
    }
  | {
      type: "swap";
      first: number;
      second: number;
    };


This is optional.

Do not require it for every step prematurely.

81. WHEN TRANSITION HINTS ARE JUSTIFIED

Use explicit hints when the same previous/current states could reasonably produce different teaching animations.

Example:

Two array values exchanged places.

A pure frame diff knows:

index 2 changed
index 5 changed


but may not know:

these values swapped


Then a swapPair or transition hint adds useful semantic information.

82. EXISTING SEMANTIC FIELDS SHOULD BE USED FIRST

Before adding new types, inspect existing support such as:

swapPair
pointers
ranges
comparison
decision
target
keyvalue
milestone


Use existing engine capabilities.

Avoid unnecessary architecture churn.

83. RESPONSIVE CONTRACT

Desktop canonical layout:

Visualization | Code + Reasoning


At narrower widths:

Visualization
Playback
Code
Reasoning
Exercises


Do not simply reduce every element until it fits.

Reflow.

84. MINIMUM LEGIBILITY

Do not allow:

code panel too narrow to read
pointer labels overlapping constantly
array cells below readable size
graph nodes too dense to inspect


When space becomes insufficient:

switch between focused World / Code / Reason views while preserving the current step
keep the bottom playback controller visible without page or internal scrolling
bound accepted inputs and paginate secondary information without shrinking text below readable size
collapse optional panels without moving the workspace boundaries


85. MOBILE PLAYBACK

Playback controls should remain thumb-friendly.

Primary actions:

Previous
Play/Pause
Next


must remain immediately available.

Advanced controls may move into secondary UI.

86. ACCESSIBILITY CONTRACT

Visualizer information cannot depend exclusively on visual motion.

Every step should have a meaningful text representation.

87. ACTIVE CODE ACCESSIBILITY

Active line should use semantic indication such as:

aria-current


or equivalent.

Screen-reader output should communicate current execution meaning without reading the entire code file repeatedly.

88. LIVE REGION

Step changes may announce concise descriptions.

Example:

Step 4. Move low from index 0 to index 5 because 24 is less than 42.

Avoid excessive announcements during fast autoplay.

89. KEYBOARD CONTRACT

When visualizer controls are focused and the user is not typing inside an editor/input:

Space → Play/Pause
ArrowRight → Next
ArrowLeft → Previous
R → Restart


Do not hijack keyboard events globally.

90. FOCUS CONTRACT

Changing algorithm steps should not continuously move DOM focus.

Focus remains with the student's control.

State changes are communicated through:

visual update
aria-live
aria-current


91. NON-COLOR SIGNALS

States should combine color with:

outline
opacity
label
icon
shape
text
pattern


Example:

Found:

green state + check marker + "FOUND"


not green alone.

92. TESTING CONTRACT

Visualizer behavior needs tests at multiple layers.

93. ENGINE TESTS

Verify:

same input → same steps
valid step sequence
valid frame data
valid code mappings
correct algorithm result
correct counters
correct milestones


94. COMPONENT TESTS

Verify:

pointer position
range rendering
active line
variables
auxiliary panel
explanation
timeline


for representative steps.

95. SYNCHRONIZATION TESTS

Critical test:

Given:

currentStepIndex = N


assert:

frame === steps[N].frame
active code === mapping(steps[N])
explanation === steps[N]
timeline === steps[N]
variables === derived state N


This protects against drift.

96. PLAYBACK TESTS

Test:

next
previous
restart
play
pause
completion
speed
prediction pause
input reset


97. ACCESSIBILITY TESTS

Test:

keyboard controls
focus visibility
aria-current
live announcements
reduced motion
non-color states
contrast


98. GOLDEN VISUAL TESTS

For foundational algorithms, maintain reference screenshots or visual regression cases for key milestones.

Recommended first:

Binary Search initialization
midpoint calculation
range elimination
target found


99. PERFORMANCE CONTRACT

Visualizer should feel immediate.

Changing steps should not trigger unnecessary full-page rerenders.

Prefer stable object identity for expensive visualization structures when practical.

100. GRAPH PERFORMANCE

For graphs/trees:

Avoid recalculating layout on every playback step if topology is unchanged.

Calculate structural layout once.

Update semantic states independently.

101. ANIMATION PERFORMANCE

Prefer:

transform
opacity


for motion where possible.

Avoid excessive layout thrashing.

Performance must not sacrifice teaching correctness.

102. COMPLETION CONTRACT

When algorithm execution finishes:

Show clear completion state.

Possible:

Found target at index 6


or:

Target does not exist


Playback stops.

Primary next action becomes obvious.

103. COMPLETION DOES NOT MEAN MASTERY

Visualizer completion may contribute to learning progress.

It must not automatically mean:

Mastered


Mastery follows LEARNING_EXPERIENCE.md.

104. ERROR STATE

If engine execution fails:

Do not leave a broken visualizer.

Show a contained error:

We couldn't generate this visualization.
Try resetting the input.


Development environment may expose technical details separately.

105. EMPTY STATE

If no algorithm data exists:

Do not display empty panels pretending to be functional.

Show a useful state:

Choose an example input to begin.


106. AUTHORING REQUIREMENT

Algorithm authors must think in learning states.

Every important execution segment should include enough metadata for the visualizer to communicate:

what
why
where


107. BINARY SEARCH GOLDEN CONTRACT

Binary Search becomes the first reference implementation.

It must demonstrate:

array
indices
target
low pointer
mid pointer
high pointer
active range
discarded range
mid arithmetic
comparison
variable changes
code line synchronization
plain-English explanation
invariant
phase
timeline
prediction checkpoint
playback
responsive behavior
accessibility


108. BINARY SEARCH REQUIRED STATES

At minimum:

INITIALIZE

low = 0
high = n - 1


MIDPOINT

mid = floor((low + high) / 2)


COMPARE

arr[mid] ? target


ELIMINATE LEFT

low = mid + 1


or

ELIMINATE RIGHT

high = mid - 1


REPEAT

new midpoint

FOUND

return index

NOT FOUND

return -1

109. BINARY SEARCH VISUAL TEST

At a range-elimination step, a student must be able to see simultaneously:

active code line
comparison result
current low/mid/high
discarded range
new valid range
plain-English why
invariant


If any of these are disconnected, the experience is incomplete.

110. BINARY SEARCH PREDICTION

At least one learning checkpoint should ask something like:

arr[mid] = 24
target = 42

What happens next?


Possible responses:

Move low right
Move high left
Return mid
Stop with not found


Feedback explains reasoning.

111. BINARY SEARCH COMPLEXITY VISUALIZATION

At some point in the lesson, demonstrate:

16 candidates
↓
8
↓
4
↓
2
↓
1


Then connect this repeated halving to:

O(log n)


Complexity should be visually motivated.

112. GOLDEN LESSON IMPLEMENTATION RULE

Do not modify other algorithms extensively while building the first Golden Lesson.

Binary Search is used to discover:

missing primitives
bad abstractions
responsive problems
animation issues
content requirements


Fix reusable systems there first.

Then scale.

113. POST-GOLDEN EXTRACTION

After Binary Search is approved, identify what became reusable.

Likely candidates:

AlgorithmWorkspace
Pointer
RangeBand
VariableBoard
ComparisonExpression
ExplanationPanel
InvariantCard
PredictionGate
PlaybackBar
CodePane
Timeline


Move reusable behavior into shared modules.

114. NEXT VISUALIZATION FAMILY

Recommended scaling order:

Binary Search
↓
Two Pointers
↓
Sliding Window
↓
Sorting
↓
Stack / Queue
↓
Linked List
↓
Tree
↓
BFS / DFS
↓
Heap
↓
Recursion / Backtracking
↓
Dynamic Programming


Each family validates new visual primitives.

115. DO NOT BUILD PER-ALGORITHM UI

Avoid architecture like:

BinarySearchVisualizer.tsx
TwoPointersVisualizer.tsx
SlidingWindowVisualizer.tsx
...


when most of the implementation is duplicated.

Prefer:

ArrayVisualizer
PointerLayer
RangeLayer
ComparisonLayer
VariableBoard


driven by algorithm state.

Algorithm-specific composition is acceptable when the algorithm genuinely requires unique semantics.

116. LOVABLE / AI IMPLEMENTATION RULE

AI coding tools must inspect before modifying.

Required reading before visualizer changes:

/docs/DESIGN_SYSTEM.md
/docs/LEARNING_EXPERIENCE.md
/docs/VISUALIZER_CONTRACT.md


Then inspect:

existing engine types
algorithm runner
frame renderer
player
code pane
existing visualization components
styles
tests


Do not assume components are missing before searching.

117. NO PARALLEL PROTOTYPE

Do not create a completely separate:

/v2-visualizer
/new-binary-search
/experimental-player


unless explicitly requested.

The goal is to evolve the product architecture.

Not build a disconnected demo.

118. NO RANDOM DESIGN CHANGES

Implementation of this contract does not authorize unrelated changes to:

dashboard
navigation
authentication
pricing
marketing
admin
landing page


Focus only on necessary visualizer and learning-workspace changes unless separately approved.

119. NO FEATURE DELETION

Existing functionality must be preserved unless explicitly superseded.

Before removing anything, determine:

what it does
where it is used
whether tests cover it
whether another feature depends on it


120. BACKWARD COMPATIBILITY

Existing algorithms should continue working during migration.

New enhanced components should gracefully render older steps where optional metadata is absent.

Example:

If no invariant exists:

Do not render an empty Invariant card.

If no comparison exists:

Do not render an empty Comparison panel.

121. PROGRESSIVE ENHANCEMENT

A basic algorithm step containing only:

frame
codeLine
narration


must still render correctly.

Additional metadata enhances the experience.

It should not become mandatory merely to satisfy a visual component.

122. CONTENT DENSITY

Show information at the moment it becomes relevant.

Do not place:

all variables
all theory
all complexity
all edge cases
all hints
all timeline data


on screen simultaneously.

The learning workspace should remain calm.

123. VISUAL ATTENTION BUDGET

At any moment, there should usually be one primary educational focus.

Examples:

mid pointer movement
comparison
swap
current graph edge
DP write
recursive return


Secondary information supports it.

Do not animate five important things simultaneously.

124. VISUAL CAUSALITY

Whenever possible, the visual sequence should preserve cause and effect.

Example:

24 < 42
↓
left range becomes impossible
↓
low moves right


Not:

low moves
array fades
comparison appears afterward


The student must see why movement happened.

125. TEMPORAL CAUSALITY

Code highlighting may precede or coincide with the visible consequence.

It should not significantly lag behind the visual event.

Recommended conceptual order:

highlight operation
↓
perform visible transition
↓
settle into new state


126. EXPLANATION TIMING

Explanation text should update with the corresponding step.

For teaching sequences, a calculation or comparison may reveal progressively.

However, the final step state must always be deterministic and immediately restorable.

127. MANUAL STEP IS AUTHORITATIVE

When manually navigating:

Previous
Next
Timeline selection


the student should arrive directly at a canonical meaningful state.

Manual navigation should not force them to watch long transition sequences.

128. TIMELINE SEEK

If timeline supports direct seek:

Selecting step N must synchronize every surface to N.

Any active autoplay stops unless explicitly designed otherwise.

129. DEEP LINKING

Future enhancement:

A visualization may support restoring:

algorithm
input
language
step


from URL/session state.

Step indices must therefore remain stable enough within a content version.

130. VERSIONING

If lesson execution steps materially change after release, video cues or persisted step positions may become invalid.

Future content model should consider:

algorithmVersion
lessonVersion


Do not implement prematurely, but avoid designs that make versioning impossible.

131. ANALYTICS EVENTS

Future analytics may record educational interactions:

visualizer_started
step_viewed
prediction_answered
prediction_correct
step_replayed
visualizer_completed
input_changed
speed_changed


Do not wire analytics directly into core engine logic.

132. DEBUGGING SUPPORT

Development mode should make it easy to inspect:

currentStepIndex
frame kind
codeLine
phase
timelineLabel
counters
milestone
raw frame data


This may be a development-only panel.

Never expose technical debugging noise in production learning UI.

133. DESIGN-SYSTEM DEV ROUTE

Recommended:

/dev/design-system


and optionally:

/dev/visualizer


to test primitives independently.

Useful fixtures:

pointer collisions
long arrays
empty queues
graph states
DP dependency highlights
recursion depths
reduced motion
mobile width


134. DEFINITION OF DONE — VISUALIZER FEATURE

A visualizer enhancement is not complete because it “looks good”.

It is complete when:

engine data correct
visual state correct
code sync correct
variable sync correct
explanation sync correct
previous/next work
autoplay works
restart works
responsive works
keyboard works
reduced motion works
tests pass
existing algorithms remain functional


135. GOLDEN LESSON DEFINITION OF DONE

Binary Search Golden Lesson is approved only when a beginner can understand:

search space
low
high
mid
mid calculation
comparison
range elimination
termination
found state
not-found state
O(log n)


through the synchronized experience.

It must work on:

desktop
tablet
mobile
keyboard
reduced motion
JS
TypeScript
Python


where those languages are supported by the existing product.

136. MOST IMPORTANT ENGINEERING RULE

Never let UI state become a second algorithm engine.

Algorithm execution belongs to the engine.

The UI interprets execution.

137. MOST IMPORTANT DESIGN RULE

Never animate something simply because it can move.

Animate it because its movement explains algorithm state.

138. MOST IMPORTANT LEARNING RULE

Every meaningful visual change should answer:

Why did that happen?

139. MOST IMPORTANT PRODUCT RULE

The student must never need to mentally synchronize:

code on one side
animation on another side
explanation somewhere else


Algora performs that synchronization for them.

That is the product.

140. FINAL CONTRACT

The canonical Algora execution cycle is:

CURRENT STEP
      ↓
ACTIVE CODE
      ↓
ALGORITHM ACTION
      ↓
VISIBLE STATE CHANGE
      ↓
VARIABLE / AUXILIARY STATE CHANGE
      ↓
PLAIN-ENGLISH REASON
      ↓
INVARIANT / INSIGHT
      ↓
NEXT STEP OR PREDICTION


If these pieces disagree, the implementation is incorrect.

If they are synchronized, the algorithm becomes understandable.

Algora's job is to make that reasoning visible.
