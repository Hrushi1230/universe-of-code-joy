import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  OnboardingFooter,
  OnboardingTopBar,
  StepBadge,
  TealPeriod,
} from "@/components/onboarding-chrome";
import { readOnboardingState, writeOnboardingState } from "@/lib/onboarding";

export const Route = createFileRoute("/onboarding/assessment")({
  component: AssessmentPage,
  head: () => ({
    meta: [
      { title: "Skill assessment — Algora onboarding" },
      {
        name: "description",
        content:
          "Step 2 of 3: a short diagnostic quiz on traversals and data structures that calibrates your Algora starting point.",
      },
      { property: "og:title", content: "Skill assessment — Algora onboarding" },
      {
        property: "og:description",
        content:
          "Step 2 of 3: answer a few algorithm questions so Algora can calibrate your learning path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const NODES: { id: number; x: number; y: number }[] = [
  { id: 1, x: 160, y: 34 },
  { id: 2, x: 100, y: 100 },
  { id: 3, x: 220, y: 100 },
  { id: 4, x: 62, y: 166 },
  { id: 5, x: 138, y: 166 },
  { id: 6, x: 182, y: 166 },
  { id: 7, x: 258, y: 166 },
];
const EDGES: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 4],
  [2, 5],
  [3, 6],
  [3, 7],
];

function TreeCard() {
  const byId = (id: number) => NODES.find((n) => n.id === id)!;
  return (
    <div className="rounded-xl border border-hairline bg-card p-4">
      <svg
        viewBox="0 0 320 210"
        className="h-[196px] w-full"
        role="img"
        aria-label="Binary tree for traversal assessment"
      >
        <g>
          <text
            x="18"
            y="38"
            className="fill-primary font-mono"
            fontSize="12"
            fontFamily="JetBrains Mono, monospace"
          >
            Start
          </text>
          <line
            x1="62"
            y1="34"
            x2="132"
            y2="34"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path d="M132 34 l-6 -3 v6 z" fill="var(--primary)" />
        </g>
        {EDGES.map(([a, b]) => {
          const p = byId(a);
          const c = byId(b);
          return (
            <line
              key={`${a}-${b}`}
              x1={p.x}
              y1={p.y}
              x2={c.x}
              y2={c.y}
              stroke="var(--hairline)"
              strokeWidth="1.5"
            />
          );
        })}
        {NODES.map((n) => {
          const isRoot = n.id === 1;
          return (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r="17"
                fill={isRoot ? "var(--primary)" : "var(--card)"}
                stroke={isRoot ? "var(--primary)" : "var(--hairline)"}
                strokeWidth="1.5"
              />
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                fontSize="14"
                fontFamily="JetBrains Mono, monospace"
                fill={isRoot ? "var(--card)" : "var(--foreground)"}
              >
                {n.id}
              </text>
            </g>
          );
        })}
        <g>
          <circle cx="112" cy="198" r="6" fill="var(--primary)" />
          <text
            x="126"
            y="202"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
            fill="var(--muted-foreground)"
          >
            Start
          </text>
          <circle
            cx="182"
            cy="198"
            r="6"
            fill="var(--card)"
            stroke="var(--hairline)"
            strokeWidth="1.5"
          />
          <text
            x="196"
            y="202"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
            fill="var(--muted-foreground)"
          >
            Unvisited
          </text>
        </g>
      </svg>
    </div>
  );
}

const CODE: { kw?: string; text?: string }[][] = [
  [{ kw: "from" }, { text: " collections " }, { kw: "import" }, { text: " deque" }],
  [{ kw: "def" }, { text: " traverse(root):" }],
  [{ text: "    q = deque([root])" }],
  [{ text: "    order = []" }],
  [{ text: "    " }, { kw: "while" }, { text: " q:" }],
  [{ text: "        node = q.popleft()" }],
  [{ text: "        order.append(node.val)" }],
  [{ text: "        q.extend([node.left, node.right])" }],
];

function CodeCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="font-mono text-[13px] text-foreground">Traversal</span>
        <span className="inline-flex items-center gap-1 font-mono text-[12px] text-muted-foreground">
          Python <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="py-2">
        {CODE.map((line, i) => (
          <div key={i} className="flex items-start font-mono text-[12.5px] leading-[22px]">
            <span className="w-10 shrink-0 pr-3 text-right text-muted-foreground/60">{i + 1}</span>
            <pre className="whitespace-pre text-foreground">
              {line.map((part, j) =>
                part.kw ? (
                  <span key={j} className="text-primary">
                    {part.kw}
                  </span>
                ) : (
                  <span key={j}>{part.text}</span>
                ),
              )}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

const QUESTIONS = [
  {
    question: "Which node is visited first?",
    answers: [
      { letter: "A", text: "Node 1, the root", correct: true },
      { letter: "B", text: "Node 2, the left child", correct: false },
      { letter: "C", text: "Node 4, the leftmost leaf", correct: false },
      { letter: "D", text: "Node 7, the rightmost leaf", correct: false },
    ],
    explanation: "Breadth-first traversal starts with the root placed in the queue.",
  },
  {
    question: "After node 1, which nodes leave the queue next?",
    answers: [
      { letter: "A", text: "4, then 5", correct: false },
      { letter: "B", text: "2, then 3", correct: true },
      { letter: "C", text: "3, then 2", correct: false },
      { letter: "D", text: "7, then 6", correct: false },
    ],
    explanation: "The root enqueues its children left to right, so 2 is dequeued before 3.",
  },
  {
    question: "What is the traversal's time complexity for n nodes?",
    answers: [
      { letter: "A", text: "O(1)", correct: false },
      { letter: "B", text: "O(log n)", correct: false },
      { letter: "C", text: "O(n)", correct: true },
      { letter: "D", text: "O(n²)", correct: false },
    ],
    explanation: "Every node enters and leaves the queue once, so the work grows linearly.",
  },
];

function AssessmentPage() {
  const navigate = useNavigate();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = readOnboardingState();
    if (saved.assessmentAnswers.length >= QUESTIONS.length) {
      navigate({ to: "/onboarding/path", replace: true });
      return;
    }
    const completed = Math.min(saved.assessmentAnswers.length, QUESTIONS.length - 1);
    setQuestionIndex(completed);
    setScore(saved.assessmentScore ?? 0);
  }, [navigate]);

  const q = QUESTIONS[questionIndex];
  const totalQuestions = QUESTIONS.length;
  const displayIndex = questionIndex + 1;
  const pct = Math.round((displayIndex / totalQuestions) * 100);
  const selected = q.answers.find((answer) => answer.letter === selectedAnswer);

  const handleNext = useCallback(() => {
    if (!selectedAnswer) return;
    const answer = q.answers.find((a) => a.letter === selectedAnswer);
    if (!checked) {
      const newScore = score + (answer?.correct ? 1 : 0);
      const saved = readOnboardingState();
      writeOnboardingState({
        assessmentAnswers: [...saved.assessmentAnswers.slice(0, questionIndex), selectedAnswer],
        assessmentScore: newScore,
        assessmentTotal: totalQuestions,
        assessmentSkipped: false,
      });
      setScore(newScore);
      setChecked(true);
      return;
    }

    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((index) => index + 1);
      setSelectedAnswer(null);
      setChecked(false);
      return;
    }
    navigate({ to: "/onboarding/path" });
  }, [checked, q.answers, questionIndex, selectedAnswer, score, totalQuestions, navigate]);

  const handleSkip = useCallback(() => {
    writeOnboardingState({
      assessmentAnswers: [],
      assessmentScore: null,
      assessmentTotal: totalQuestions,
      assessmentSkipped: true,
    });
    navigate({ to: "/onboarding/path" });
  }, [navigate, totalQuestions]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-foreground">
      <OnboardingTopBar
        current={2}
        right={
          <button type="button" onClick={handleSkip} className="hover:text-foreground">
            Skip assessment
          </button>
        }
      />

      <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-4 sm:items-center sm:px-6">
        <div className="w-full max-w-[940px] rounded-2xl border border-hairline bg-card px-5 py-5 shadow-sm sm:px-9 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepBadge>
              QUESTION {displayIndex} OF {totalQuestions}
            </StepBadge>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary sm:w-[300px]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-[12px] text-muted-foreground">{pct}%</span>
            </div>
          </div>

          <h1 className="mt-3 font-sans text-[26px] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-[32px]">
            {q.question}
            <TealPeriod />
          </h1>
          <p className="mt-2 font-mono text-[13.5px] text-muted-foreground">
            No pressure — this just calibrates your starting point.
          </p>
          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 font-mono text-[12px] text-muted-foreground underline underline-offset-4 md:hidden"
          >
            Skip this diagnostic
          </button>

          <div className="mt-4 hidden grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-4 sm:grid">
            <TreeCard />
            <CodeCard />
          </div>

          <div className="mt-4 sm:hidden">
            <TreeCard />
          </div>

          <div className="mt-4 space-y-2.5">
            {q.answers.map(({ letter, text }) => {
              const selected = selectedAnswer === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => !checked && setSelectedAnswer(letter)}
                  disabled={checked}
                  className={[
                    "flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary-tint/50"
                      : "border-hairline bg-card hover:bg-secondary/60",
                  ].join(" ")}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-card font-mono text-[12px] text-foreground">
                    {letter}
                  </span>
                  <span
                    className={[
                      "flex-1 font-mono text-[14px]",
                      selected ? "text-primary" : "text-foreground",
                    ].join(" ")}
                  >
                    {text}
                  </span>
                  {selected ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-hairline" />
                  )}
                </button>
              );
            })}
          </div>

          {checked && selected ? (
            <div
              role="status"
              className={`mt-4 rounded-xl border px-4 py-3 font-mono text-[13px] ${
                selected.correct
                  ? "border-primary/40 bg-primary-tint/50 text-primary"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              }`}
            >
              <strong>{selected.correct ? "Correct." : "Not quite."}</strong> {q.explanation}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between">
            <Link
              to="/onboarding/goals"
              className="flex h-11 items-center rounded-xl border border-hairline bg-card px-8 font-mono text-[14px] text-foreground transition-colors hover:bg-secondary"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-8 font-mono text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-50"
            >
              {checked
                ? questionIndex === totalQuestions - 1
                  ? "See recommendation"
                  : "Next question"
                : "Check answer"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      <OnboardingFooter middle="Calibrating your path" />
    </div>
  );
}
