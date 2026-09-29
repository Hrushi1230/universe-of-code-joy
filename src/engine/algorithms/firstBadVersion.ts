import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_VERSIONS = 12;

/**
 * Everything below is in VERSION space, 1-based, matching the problem statement
 * and the pseudocode. Version `v` lives at array index `v - 1`; the conversion
 * happens only where a frame is built.
 */
const PSEUDOCODE: string[] = [
  "function firstBadVersion(n)",
  "  lo <- 1",
  "  hi <- n",
  "  while lo < hi",
  "    mid <- floor((lo + hi) / 2)",
  "    if isBadVersion(mid)",
  "      hi <- mid",
  "    else",
  "      lo <- mid + 1",
  "  return lo",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function firstBadVersion(n) {",
    "  let lo = 1;",
    "  let hi = n;",
    "  while (lo < hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (isBadVersion(mid)) {",
    "      hi = mid;",
    "    } else {",
    "      lo = mid + 1;",
    "    }",
    "  }",
    "  return lo;",
    "}",
  ],
  ts: [
    "function firstBadVersion(n: number): number {",
    "  let lo = 1;",
    "  let hi = n;",
    "  while (lo < hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (isBadVersion(mid)) {",
    "      hi = mid;",
    "    } else {",
    "      lo = mid + 1;",
    "    }",
    "  }",
    "  return lo;",
    "}",
  ],
  py: [
    "def first_bad_version(n):",
    "    lo = 1",
    "    hi = n",
    "    while lo < hi:",
    "        mid = (lo + hi) // 2",
    "        if is_bad_version(mid):",
    "            hi = mid",
    "        else:",
    "            lo = mid + 1",
    "    return lo",
  ],
};

/**
 * The Python listing is 1:1 with the pseudocode, so it needs no entry. JS and TS
 * only drift at `return lo`, which sits below two closing braces.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

function windowLabel(lo: number, hi: number, previous?: number): string {
  const size = Math.max(0, hi - lo + 1);
  if (previous !== undefined && previous !== size) {
    return `still possible · ${previous} → ${plural(size, "version")}`;
  }
  return `still possible · ${plural(size, "version")}`;
}

interface FrameSpec {
  /** Window bounds, in version numbers. */
  lo: number;
  hi: number;
  /** The version being tested, or null on frames where nothing is under test. */
  mid: number | null;
  showMidMath?: boolean;
  /** The window that is about to survive, lit before the other side is cut. */
  survivor?: { from: number; to: number };
  found?: number;
  label: string;
}

/**
 * The tri-partition is the invariant, so it is derived rather than tracked:
 * below `lo` is deduced good, above `hi` is deduced bad, and the rest is still
 * in play. Nothing outside that is ever revealed — the array knows which version
 * is bad and the animation must not leak it ahead of the API answers.
 *
 * `visited`/Check reads as "passes the quality check" and `excluded`/Ban as
 * "fails it", which is why good and bad are mapped that way round rather than
 * both collapsing into `excluded` the way a plain binary search would.
 */
function frameFor(n: number, spec: FrameSpec): ArrayFrame {
  const { lo, hi, mid, showMidMath, survivor, found, label } = spec;
  const states: Record<number, CellState> = {};
  for (let v = 1; v <= n; v += 1) {
    states[v - 1] = v < lo ? "visited" : v > hi ? "excluded" : "idle";
  }
  if (mid !== null && mid >= lo && mid <= hi) states[mid - 1] = "compare";
  // Applied after `mid`, and the membership does the rest: a bad midpoint is
  // inside its own surviving window so it turns `frontier` — it survives — while
  // a good midpoint is outside and stays `compare` on its way out. That
  // asymmetry is the whole difference from binary search.
  if (survivor) {
    const from = Math.max(1, survivor.from);
    const to = Math.min(n, survivor.to);
    for (let v = from; v <= to; v += 1) states[v - 1] = "frontier";
  }
  if (found !== undefined) states[found - 1] = "found";

  const pointers: ArrayFrame["pointers"] = [
    { name: "lo", index: lo - 1 },
    { name: "hi", index: hi - 1 },
  ];
  if (mid !== null) {
    pointers.push({
      name: "mid",
      index: mid - 1,
      color: "accent",
      ...(showMidMath ? { note: `(${lo} + ${hi}) / 2 = ${mid}` } : {}),
    });
  }

  return {
    kind: "array",
    values: Array.from({ length: n }, (_, i) => i + 1),
    states,
    pointers,
    pointerNotes: true,
    ranges: lo <= hi ? [{ from: lo - 1, to: hi - 1, label, tone: "tint" }] : [],
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const n = parsed["n"] as number;
  const bad = parsed["bad"] as number;

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  let lo = 1;
  let hi = n;
  let calls = 0;

  // Both counters exist from the first step. Binary search lets its second
  // counter appear mid-run, but "minimal API calls" is what this question is
  // scored on, so the column has to be readable from step one — and when n is 1
  // the loop never runs, which would otherwise leave the count off screen
  // entirely instead of showing the honest answer of 0.
  b.bump("api calls", 0);
  b.bump("linear worst", n);

  b.emit({
    frame: frameFor(n, { lo, hi, mid: null, label: windowLabel(lo, hi) }),
    codeLine: 3,
    narration: `${plural(n, "version")}, and every one after the first bad one is bad too.`,
    detail: `The only way to learn anything is to ask isBadVersion(v). Each answer splits the versions into good-then-bad, so the whole line looks like good, good, …, bad, bad — and that single shape is what lets us halve instead of walking. Checking one at a time would cost ${plural(n, "call")} in the worst case.`,
    phase: "setup",
    isMilestone: true,
  });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const size = hi - lo + 1;

    b.emit({
      frame: frameFor(n, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
      codeLine: 5,
      narration: `Test the middle of what is left: version ${mid}.`,
      detail: `mid = floor((lo + hi) / 2) = floor((${lo} + ${hi}) / 2) = ${mid}. One call decides the fate of about half of the ${plural(size, "version")} still in play.`,
      phase: "probe",
      isMilestone: true,
    });

    b.bump("api calls");
    calls += 1;
    const isBad = mid >= bad;

    const nextLo = isBad ? lo : mid + 1;
    const nextHi = isBad ? mid : hi;
    const remaining = nextHi - nextLo + 1;

    b.emit({
      frame: frameFor(n, {
        lo,
        hi,
        mid,
        showMidMath: true,
        survivor: { from: nextLo, to: nextHi },
        label: windowLabel(lo, hi),
      }),
      codeLine: 6,
      narration: isBad
        ? `isBadVersion(${mid}) says yes — version ${mid} is bad.`
        : `isBadVersion(${mid}) says no — version ${mid} is fine.`,
      detail: isBad
        ? `Every version after a bad one is bad, so ${mid} being bad rules out all ${plural(n - mid, "version")} above it. But it does not rule out ${mid}: it might be the very first bad one, so it stays a candidate.`
        : `Versions only get worse, never better, so ${mid} being good means everything up to and including it is good. That rules ${plural(mid - lo + 1, "version")} out for good.`,
      phase: "compare",
    });

    b.emit({
      frame: frameFor(n, {
        lo: nextLo,
        hi: nextHi,
        mid: null,
        label: windowLabel(nextLo, nextHi, size),
      }),
      codeLine: isBad ? 7 : 9,
      narration: isBad
        ? `hi drops to ${nextHi} — the one we just tested, not the one before it.`
        : `lo jumps to ${nextLo}, past every version we now know is good.`,
      detail: isBad
        ? `This is the line that makes or breaks the solution: hi <- mid, not mid - 1. A plain binary search throws the midpoint away because it can never be the answer. Here it can be, so hi lands on it. ${plural(size, "version")} → ${remaining}.`
        : `lo <- mid + 1 is safe in a way hi <- mid - 1 would not be: a good version is definitely not the first bad one, so nothing is lost. ${plural(size, "version")} → ${remaining}.`,
      phase: isBad ? "narrow-left" : "narrow-right",
      isMilestone: true,
    });

    lo = nextLo;
    hi = nextHi;
  }

  const answer = lo;
  const zeroCalls = calls === 0;

  b.emit({
    frame: frameFor(n, { lo, hi, mid: null, found: answer, label: windowLabel(lo, hi) }),
    codeLine: 10,
    narration: zeroCalls
      ? `With only one version there is nothing to narrow — version ${answer} is the answer.`
      : `lo and hi have met on version ${answer}, so that is the first bad version.`,
    detail: zeroCalls
      ? `A single version and the guarantee that a bad one exists is enough on its own: it has to be version 1. Zero API calls.`
      : `The loop stops when one candidate is left, and the invariant has held the whole way: everything below lo passed, everything above hi failed. Version ${answer} is the boundary. It took ${plural(calls, "call")} instead of the ${plural(n, "call")} a version-by-version scan could need.`,
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "first-bad-version",
    `${plural(n, "version")}, first bad is ${bad}`,
    `version ${answer} is the first bad version`,
  );
}

/** Whole numbers only, with the range spelled out in the error. */
function parseWhole(raw: string, label: string, min: number, max: number): number | string {
  const text = raw.trim();
  // `label` is capitalised and leads every message, so it reads as a sentence
  // subject rather than being dropped into the middle of one.
  if (text.length === 0) return `${label} is required.`;
  const value = Number(text);
  if (!Number.isInteger(value)) return `${label} must be a whole number, not "${text}".`;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}.`;
  return value;
}

export const firstBadVersionModule: AlgorithmModule = {
  slug: "first-bad-version",
  inputs: [
    { name: "n", label: "Versions", kind: "number", default: 12, min: 1, max: MAX_VERSIONS },
    {
      name: "bad",
      label: "First bad version",
      kind: "number",
      default: 11,
      min: 1,
      max: MAX_VERSIONS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const n = parseWhole(raw["n"] ?? "", "The number of versions", 1, MAX_VERSIONS);
    if (typeof n === "string") return { ok: false, error: n };
    const bad = parseWhole(raw["bad"] ?? "", "The first bad version", 1, MAX_VERSIONS);
    if (typeof bad === "string") return { ok: false, error: bad };
    if (bad > n) {
      return {
        ok: false,
        error: `Version ${bad} does not exist yet — there are only ${plural(n, "version")}.`,
      };
    }
    return { ok: true, parsed: { n, bad } };
  },
  run,
  // 16 versions so every halving lands on a whole number and the call count is
  // exactly 4 — "4 calls, not 16" is the point. The first three presets cover the
  // three shapes the loop can take: mixed answers, all bad, all good.
  presets: [
    { label: "Broke somewhere in the middle", values: { n: "12", bad: "8" } },
    { label: "Broken from the start", values: { n: "12", bad: "1" } },
    { label: "Only the newest is bad", values: { n: "12", bad: "12" } },
    { label: "A single version", values: { n: "1", bad: "1" } },
  ],
};

export default firstBadVersionModule;
