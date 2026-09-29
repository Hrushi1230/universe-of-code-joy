import { StepBuilder } from "@/engine/builder";
import { parseNumberList } from "@/engine/algorithms/binarySearch";
import { checkRotatedShape, rotationNote } from "@/engine/algorithms/rotatedArray";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const PSEUDOCODE: string[] = [
  "function search(a, target)",
  "  lo <- 0",
  "  hi <- length(a) - 1",
  "  while lo <= hi",
  "    mid <- floor((lo + hi) / 2)",
  "    if a[mid] = target",
  "      return mid",
  "    if a[lo] <= a[mid]",
  "      if a[lo] <= target and target < a[mid]",
  "        hi <- mid - 1",
  "      else",
  "        lo <- mid + 1",
  "    else",
  "      if a[mid] < target and target <= a[hi]",
  "        lo <- mid + 1",
  "      else",
  "        hi <- mid - 1",
  "  return -1",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function searchRotated(a, target) {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo <= hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] === target) {",
    "      return mid;",
    "    }",
    "    if (a[lo] <= a[mid]) {",
    "      if (a[lo] <= target && target < a[mid]) {",
    "        hi = mid - 1;",
    "      } else {",
    "        lo = mid + 1;",
    "      }",
    "    } else {",
    "      if (a[mid] < target && target <= a[hi]) {",
    "        lo = mid + 1;",
    "      } else {",
    "        hi = mid - 1;",
    "      }",
    "    }",
    "  }",
    "  return -1;",
    "}",
  ],
  ts: [
    "function searchRotated(a: number[], target: number): number {",
    "  let lo = 0;",
    "  let hi = a.length - 1;",
    "  while (lo <= hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (a[mid] === target) {",
    "      return mid;",
    "    }",
    "    if (a[lo] <= a[mid]) {",
    "      if (a[lo] <= target && target < a[mid]) {",
    "        hi = mid - 1;",
    "      } else {",
    "        lo = mid + 1;",
    "      }",
    "    } else {",
    "      if (a[mid] < target && target <= a[hi]) {",
    "        lo = mid + 1;",
    "      } else {",
    "        hi = mid - 1;",
    "      }",
    "    }",
    "  }",
    "  return -1;",
    "}",
  ],
  py: [
    "def search_rotated(a, target):",
    "    lo = 0",
    "    hi = len(a) - 1",
    "    while lo <= hi:",
    "        mid = (lo + hi) // 2",
    "        if a[mid] == target:",
    "            return mid",
    "        if a[lo] <= a[mid]:",
    "            if a[lo] <= target < a[mid]:",
    "                hi = mid - 1",
    "            else:",
    "                lo = mid + 1",
    "        else:",
    "            if a[mid] < target <= a[hi]:",
    "                lo = mid + 1",
    "            else:",
    "                hi = mid - 1",
    "    return -1",
  ],
};

/**
 * Python is 1:1 — its chained `a[lo] <= target < a[mid]` is the same shape as the
 * pseudocode. JS and TS drift by the closing braces of the two nested branches.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 23],
  ts: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 23],
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * The ordered half spelled out as a rising chain, so the claim is checkable on
 * screen rather than asserted. Degenerates gracefully: a one-cell half has nothing
 * to chain, and `mid` sits on `lo` often enough for that to come up.
 */
function stretchOf(values: number[], from: number, to: number): string {
  const span = values.slice(from, to + 1);
  if (span.length === 1) return `that stretch is the single cell ${span[0]!}`;
  return `that stretch rises the whole way: ${span.join(" < ")}`;
}

function windowLabel(lo: number, hi: number, previous?: number): string {
  const size = Math.max(0, hi - lo + 1);
  if (previous !== undefined && previous !== size) {
    return `still searching · ${previous} → ${plural(size, "cell")}`;
  }
  return `still searching · ${plural(size, "cell")}`;
}

interface FrameSpec {
  lo: number;
  hi: number;
  mid: number | null;
  showMidMath?: boolean;
  /** The half proven to be in order, shaded whole — `mid` is painted over it. */
  ordered?: { from: number; to: number };
  survivor?: { from: number; to: number };
  found?: number;
  label: string;
}

/**
 * The new element on screen is the `sorted` band: the half that is provably in
 * order. No other module in this family uses that state, and it earns it — "one
 * half is always sorted" is the entire insight the question turns on.
 *
 * The band is laid down across the half *including* `mid`, then `mid` is painted
 * over it as `compare`. That is not a cosmetic detail: what stays visibly shaded
 * is then exactly the set of cells the containment test is about, since the test
 * excludes `mid` at one end (`target < a[mid]`, or `a[mid] < target`).
 *
 * Unlike its three siblings, `survivor` never contains `mid` — both branches move
 * by mid ± 1. So `mid` stays `compare` to the end of the step and visibly does not
 * survive, which is the honest picture: this is the one question in the family that
 * may discard the midpoint, because it already tested it for equality.
 */
function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const { lo, hi, mid, showMidMath, ordered, survivor, found, label } = spec;
  const n = values.length;
  const states: Record<number, CellState> = {};
  // One state for both ruled-out sides, unlike the find-minimum module: here the
  // two sides mean the same thing — nowhere left that could hold the target.
  for (let i = 0; i < n; i += 1) states[i] = i < lo || i > hi ? "excluded" : "idle";
  if (ordered) {
    for (let i = Math.max(0, ordered.from); i <= Math.min(n - 1, ordered.to); i += 1) {
      states[i] = "sorted";
    }
  }
  if (mid !== null) states[mid] = "compare";
  if (survivor) {
    for (let i = Math.max(0, survivor.from); i <= Math.min(n - 1, survivor.to); i += 1) {
      states[i] = "frontier";
    }
  }
  if (found !== undefined) states[found] = "found";

  const pointers: ArrayFrame["pointers"] = [
    { name: "lo", index: lo },
    { name: "hi", index: hi },
  ];
  if (mid !== null) {
    pointers.push({
      name: "mid",
      index: mid,
      color: "accent",
      ...(showMidMath ? { note: `(${lo} + ${hi}) / 2 = ${mid}` } : {}),
    });
  }

  return {
    kind: "array",
    values: [...values],
    states,
    pointers,
    pointerNotes: true,
    ranges: lo <= hi ? [{ from: lo, to: hi, label, tone: "tint" }] : [],
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  // Never sorted: the rotation is the obstacle the question is built around.
  const values = parsed["values"] as number[];
  const target = parsed["target"] as number;
  const n = values.length;

  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  let lo = 0;
  let hi = n - 1;
  let probes = 0;
  let foundIndex = -1;

  b.bump("probes", 0);
  b.bump("linear worst", n);

  b.emit({
    frame: frameFor(values, { lo, hi, mid: null, label: windowLabel(lo, hi) }),
    codeLine: 3,
    narration: `Find ${target} in a sorted list that has been cut and swapped, in O(log n).`,
    detail: `Halving needs to know which side of the midpoint the target is on, and a rotated list breaks the usual answer — the values are not in order, so a[mid] < target says nothing on its own. The way out is that a single cut cannot disorder both halves: whichever side of the midpoint you take, at least one of them is still in plain ascending order. Each step finds that half, checks whether the target's value falls inside its range, and keeps the half that could hold it.`,
    phase: "setup",
    isMilestone: true,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const here = values[mid]!;
    const size = hi - lo + 1;
    probes += 1;
    b.bump("probes");

    b.emit({
      frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
      codeLine: 5,
      narration: `Middle of the ${plural(size, "cell")} still in play is index ${mid}, holding ${here}.`,
      detail: `mid = floor((lo + hi) / 2) = floor((${lo} + ${hi}) / 2) = ${mid}.`,
      phase: "probe",
      isMilestone: true,
    });

    if (here === target) {
      foundIndex = mid;
      b.emit({
        frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
        codeLine: 6,
        narration: `a[${mid}] = ${here}, which is the target — done.`,
        detail: `The equality test comes first, before any reasoning about halves. That ordering is what lets this algorithm discard the midpoint later on: by the time a half is thrown away, mid has already been ruled in or out on its own.`,
        phase: "match",
        isMilestone: true,
      });
      break;
    }

    b.emit({
      frame: frameFor(values, { lo, hi, mid, showMidMath: true, label: windowLabel(lo, hi) }),
      codeLine: 6,
      narration: `a[${mid}] = ${here}, not ${target}. So index ${mid} is out either way.`,
      detail: `Worth checking before anything else, and worth noticing that it settles mid completely: whatever happens next, index ${mid} never needs looking at again.`,
      phase: "compare",
    });

    /* a[lo] <= a[mid] means no cut inside [lo, mid], so that half is in order.
       Otherwise the cut is inside it, and [mid, hi] must be the clean one. */
    const leftOrdered = values[lo]! <= here;
    const ordered = leftOrdered ? { from: lo, to: mid } : { from: mid, to: hi };
    const low = leftOrdered ? values[lo]! : here;
    const high = leftOrdered ? here : values[hi]!;

    /* The shaded half is a plain sorted range, so one range test settles it. */
    const inOrderedHalf = leftOrdered
      ? low <= target && target < here
      : here < target && target <= high;
    const nextLo = inOrderedHalf === leftOrdered ? lo : mid + 1;
    const nextHi = inOrderedHalf === leftOrdered ? mid - 1 : hi;
    const remaining = Math.max(0, nextHi - nextLo + 1);
    const survivor = remaining > 0 ? { survivor: { from: nextLo, to: nextHi } } : {};

    /* A window of one or two cells puts mid on lo, which makes the tidy half
       nothing but the midpoint itself — already tested and spent. There is no
       genuine choice of halves left, and the containment test cannot succeed
       against a range of zero width, so the two frames that would narrate that
       choice collapse into one that states the real situation. Splitting them
       produced "a[6] = 2 is below a[6] = 2" over two frames that showed no change.
       This only ever arises on the left branch: mid = hi requires lo = hi, and
       then a[lo] = a[mid], so the right half is never the degenerate one. */
    if (mid === lo) {
      b.emit({
        frame: frameFor(values, {
          lo,
          hi,
          mid,
          showMidMath: true,
          ...survivor,
          label: windowLabel(lo, hi),
        }),
        codeLine: 9,
        // mid = lo forces hi <= lo + 1, so what is left is one cell or none — never a range.
        narration: `The tidy half is index ${mid} alone, and it is spent — so ${remaining === 0 ? "there is nothing left" : `only index ${nextLo} remains`}.`,
        detail: `a[${lo}] <= a[${mid}] holds trivially when lo and mid are the same cell, so the left half is technically the ordered one — but it is a range of zero width containing only the midpoint we just tested. Nothing can fall strictly inside it, so the test fails and the search keeps the other side.`,
        phase: "which-half",
        isMilestone: true,
      });
    } else {
      b.emit({
        frame: frameFor(values, {
          lo,
          hi,
          mid,
          showMidMath: true,
          ordered,
          label: windowLabel(lo, hi),
        }),
        codeLine: 8,
        narration: leftOrdered
          ? `a[${lo}] = ${values[lo]!} is below a[${mid}] = ${here}, so the left half is the tidy one.`
          : `a[${lo}] = ${values[lo]!} is above a[${mid}] = ${here}, so the cut is on the left — the right half is the tidy one.`,
        detail: leftOrdered
          ? `A cut inside [${lo}, ${mid}] would have left a[${lo}] above a[${mid}], and it did not, so ${stretchOf(values, lo, mid)}. Nothing is known yet about the other side.`
          : `a[${lo}] above a[${mid}] can only happen if the cut falls inside [${lo}, ${mid}] — and one cut cannot also fall inside [${mid}, ${hi}], so ${stretchOf(values, mid, hi)}.`,
        phase: "which-half",
        isMilestone: true,
      });

      b.emit({
        frame: frameFor(values, {
          lo,
          hi,
          mid,
          showMidMath: true,
          ordered,
          ...survivor,
          label: windowLabel(lo, hi),
        }),
        codeLine: leftOrdered ? 9 : 14,
        narration: inOrderedHalf
          ? `${target} falls between ${low} and ${high}, so it can only be in the tidy half.`
          : `${target} is outside ${low} to ${high}, so the tidy half cannot hold it.`,
        detail: inOrderedHalf
          ? `Because that half is in plain ascending order, its first and last values bound everything in it. ${target} sits inside those bounds, so if it is anywhere it is in there — and the messy half can go.`
          : `Same bound, used the other way round: an ordered stretch running ${low} to ${high} contains nothing outside that span, so ${target} is definitely not in the tidy half. That is what makes it safe to keep the half we know nothing about.`,
        phase: "in-range",
      });
    }

    const movesRight = nextLo !== lo;
    b.emit({
      frame: frameFor(values, {
        lo: nextLo,
        hi: nextHi,
        mid: null,
        label: windowLabel(nextLo, nextHi, size),
      }),
      codeLine: leftOrdered ? (inOrderedHalf ? 10 : 12) : inOrderedHalf ? 15 : 17,
      narration:
        remaining === 0
          ? `The window closes: lo ${nextLo} has passed hi ${nextHi}, with nothing left.`
          : movesRight
            ? `lo moves to ${nextLo}, dropping index ${mid} along with the half before it.`
            : `hi drops to ${nextHi}, dropping index ${mid} along with the half after it.`,
      detail: `${movesRight ? "lo <- mid + 1" : "hi <- mid - 1"} — and note the ± 1. Its three sibling questions in this family all have to write hi <- mid, keeping the midpoint because it might be the answer they are converging on. This one tested mid for equality up front, so it is already spent and can go. ${plural(size, "cell")} → ${remaining}.`,
      phase: movesRight ? "narrow-right" : "narrow-left",
      isMilestone: true,
    });

    lo = nextLo;
    hi = nextHi;
  }

  b.emit({
    frame: frameFor(values, {
      lo,
      hi,
      mid: null,
      ...(foundIndex === -1 ? {} : { found: foundIndex }),
      label: windowLabel(lo, hi),
    }),
    codeLine: foundIndex === -1 ? 18 : 7,
    narration:
      foundIndex === -1
        ? `Nowhere left to look, so ${target} is not in this list: return -1.`
        : `${target} is at index ${foundIndex}.`,
    detail:
      foundIndex === -1
        ? `Every cell has been ruled out — not one at a time, but in halves, each discarded on a bound rather than a look. ${plural(probes, "midpoint")} settled all ${plural(n, "cell")}.`
        : `${plural(probes, "midpoint")} instead of the ${plural(n, "cell")} a scan might have to touch. The rotation never had to be undone: no pass to find the cut, no second search afterwards, just one walk that re-derives which half is tidy at every step.`,
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "search-rotated-sorted-array",
    `[${values.join(", ")}] (${rotationNote(values)}), target ${target}`,
    foundIndex === -1 ? `${target} not found` : `Found ${target} at index ${foundIndex}`,
  );
}

const WHY_UNIQUE =
  "With duplicates, a[lo] = a[mid] leaves it undecidable which half is the sorted one, and the O(log n) guarantee is lost.";

export const searchRotatedModule: AlgorithmModule = {
  slug: "search-rotated-sorted-array",
  inputs: [
    {
      name: "values",
      label: "Rotated sorted list",
      kind: "numbers",
      default: "4, 5, 6, 7, 0, 1, 2",
      help: "Up to 12 unique numbers: a sorted list cut once and swapped end to end.",
      max: 12,
    },
    { name: "target", label: "Target", kind: "number", default: 0, min: -9999, max: 9999 },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    const problem = checkRotatedShape(list.values, WHY_UNIQUE);
    if (problem) return { ok: false, error: problem };
    const rawTarget = (raw["target"] ?? "").trim();
    if (rawTarget.length === 0) return { ok: false, error: "Target is required." };
    const target = Number(rawTarget);
    if (!Number.isFinite(target)) {
      return {
        ok: false,
        error: `"${rawTarget}" is not a number. Use a plain number like 0 or -7.`,
      };
    }
    return { ok: true, parsed: { values: list.values, target } };
  },
  run,
  presets: [
    { label: "Target after the cut", values: { values: "4, 5, 6, 7, 0, 1, 2", target: "0" } },
    { label: "Not in the list at all", values: { values: "4, 5, 6, 7, 0, 1, 2", target: "3" } },
    /* Starts on the other branch: a[lo] is above a[mid], so the cut is on the left
       and it is the right half that gets shaded. */
    { label: "Right half is the tidy one", values: { values: "6, 7, 0, 1, 2, 4, 5", target: "4" } },
    /* Twelve cells use the full fixed teaching width while keeping both ramps and
       the rotation cliff visible. */
    {
      label: "See the cliff",
      values: {
        values: "235, 245, 255, 265, 275, 305, 105, 125, 145, 165, 185, 205",
        target: "165",
      },
    },
  ],
};

export default searchRotatedModule;
