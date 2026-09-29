import { parseNumberList } from "@/engine/algorithms/binarySearch";
import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_ITEMS = 12;

const PSEUDOCODE = [
  "function threeSum(nums)",
  "  sort nums",
  "  out <- []",
  "  for anchor <- 0 to length(nums) - 3",
  "    if anchor is a duplicate: continue",
  "    left <- anchor + 1; right <- length(nums) - 1",
  "    while left < right",
  "      sum <- nums[anchor] + nums[left] + nums[right]",
  "      if sum < 0: left <- left + 1",
  "      else if sum > 0: right <- right - 1",
  "      else record triplet; move both; skip repeated endpoints",
  "  return out",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function threeSum(a){",
    "  a.sort((x,y)=>x-y);let out=[];",
    "  for(let i=0;i<a.length-2;i++){if(i&&a[i]===a[i-1])continue;",
    "    let l=i+1,r=a.length-1;",
    "    while(l<r){",
    "      let s=a[i]+a[l]+a[r];",
    "      if(s<0)l++;else if(s>0)r--;",
    "      else{let x=a[l],y=a[r];",
    "        out.push([a[i],x,y]);l++;r--;",
    "        while(l<r&&(a[l]===x||a[r]===y)){",
    "          l+=+(a[l]===x);r-=+(a[r]===y);}",
    "  }}}return out;}",
  ],
  ts: [
    "function threeSum(a:number[]):number[][]{",
    "  a.sort((x,y)=>x-y);let out:number[][]=[];",
    "  for(let i=0;i<a.length-2;i++){if(i&&a[i]===a[i-1])continue;",
    "    let l=i+1,r=a.length-1;",
    "    while(l<r){",
    "      let s=a[i]+a[l]+a[r];",
    "      if(s<0)l++;else if(s>0)r--;",
    "      else{let x=a[l],y=a[r];",
    "        out.push([a[i],x,y]);l++;r--;",
    "        while(l<r&&(a[l]===x||a[r]===y)){",
    "          l+=+(a[l]===x);r-=+(a[r]===y);}",
    "  }}}return out;}",
  ],
  py: [
    "def three_sum(a):",
    "    a.sort();out=[]",
    "    for i in range(len(a) - 2):",
    "        if i and a[i]==a[i-1]:continue",
    "        l,r=i+1,len(a)-1",
    "        while l<r:",
    "            s=a[i]+a[l]+a[r]",
    "            if s<0:l+=1",
    "            elif s>0:r-=1",
    "            else:x,y=a[l],a[r];out+=[[a[i],x,y]];l+=1;r-=1",
    "            while s==0 and l<r and(a[l]==x or a[r]==y):l+=a[l]==x;r-=a[r]==y",
    "    return out",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 2, 2, 3, 3, 4, 5, 6, 7, 7, 9, 12],
  ts: [1, 2, 2, 3, 3, 4, 5, 6, 7, 7, 9, 12],
  py: [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
};

interface FrameSpec {
  anchor: number;
  left: number;
  right: number;
  foundCount: number;
  inspectSum?: boolean;
  inspectDuplicateAnchor?: boolean;
  actionIndex?: number;
  foundTriplet?: [number, number, number];
  done?: boolean;
  decision?: ArrayFrame["decision"];
}

function pointerIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

function frameFor(values: number[], spec: FrameSpec): ArrayFrame {
  const {
    anchor,
    left,
    right,
    foundCount,
    inspectSum = false,
    inspectDuplicateAnchor = false,
    actionIndex,
    foundTriplet,
    done = false,
    decision,
  } = spec;
  const states: Record<number, CellState> = {};
  for (let index = 0; index < values.length; index += 1) {
    states[index] = done
      ? "sorted"
      : index < anchor || index < left || index > right
        ? "excluded"
        : "idle";
  }
  if (!done && anchor < values.length) states[anchor] = "active";
  if (inspectSum && left < right) {
    states[left] = "compare";
    states[right] = "compare";
  }
  if (inspectDuplicateAnchor && anchor > 0) {
    states[anchor - 1] = "compare";
    states[anchor] = "compare";
  }
  if (actionIndex !== undefined) states[actionIndex] = "excluded";
  for (const index of foundTriplet ?? []) states[index] = "found";

  const sum =
    anchor < values.length && left < values.length && right < values.length
      ? values[anchor]! + values[left]! + values[right]!
      : 0;
  const comparison = inspectDuplicateAnchor
    ? {
        left: `nums[${anchor}] = ${values[anchor]}`,
        op: "=",
        right: `nums[${anchor - 1}] = ${values[anchor - 1]}`,
        verdict: "duplicate anchor — skip",
        tone: "warning" as const,
      }
    : inspectSum
      ? {
          left: String(sum),
          op: sum === 0 ? "=" : sum < 0 ? "<" : ">",
          right: "0",
          verdict:
            sum === 0
              ? "record triplet"
              : sum < 0
                ? "sum too small — move left"
                : "sum too large — move right",
          tone: sum === 0 ? ("accent" as const) : ("warning" as const),
        }
      : undefined;

  return {
    kind: "array",
    values: [...values],
    states,
    pointers: done
      ? []
      : [
          { name: "anchor", index: pointerIndex(anchor, values.length), note: `fixed ${anchor}` },
          {
            name: "left",
            index: pointerIndex(left, values.length),
            color: "warning",
            note: left >= values.length ? "sweep done" : `left ${left}`,
          },
          {
            name: "right",
            index: pointerIndex(right, values.length),
            color: "error",
            note: right <= anchor ? "sweep done" : `right ${right}`,
          },
        ],
    pointerNotes: true,
    ranges:
      !done && left < right ? [{ from: left, to: right, label: "Pair search", tone: "tint" }] : [],
    rangeRows: 1,
    target: { label: "triplets found", value: foundCount },
    ...(comparison ? { comparison } : {}),
    ...(decision ? { decision } : {}),
  };
}

function formatTriplets(triplets: number[][]): string {
  return `[${triplets.map((triplet) => `[${triplet.join(", ")}]`).join(", ")}]`;
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const original = [...(parsed["values"] as number[])];
  const values = [...original].sort((a, b) => a - b);
  const triplets: number[][] = [];
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);

  b.emit({
    frame: frameFor(values, {
      anchor: 0,
      left: 1,
      right: values.length - 1,
      foundCount: 0,
      decision: { title: "Sort first", detail: `[${values.join(", ")}]`, tone: "accent" },
    }),
    codeLine: 2,
    narration: "Sort the array so pointer movement and duplicate skipping are valid.",
    detail: "Sorted order makes increasing left raise the sum and decreasing right lower it.",
    phase: "setup",
    timelineLabel: "Sort values",
    isMilestone: true,
  });

  for (let anchor = 0; anchor < values.length - 2; anchor += 1) {
    if (anchor > 0 && values[anchor] === values[anchor - 1]) {
      b.emit({
        frame: frameFor(values, {
          anchor,
          left: anchor + 1,
          right: values.length - 1,
          foundCount: triplets.length,
          inspectDuplicateAnchor: true,
        }),
        codeLine: 5,
        narration: `Anchor ${values[anchor]} repeats the previous anchor.`,
        detail: "Repeating the same anchor would regenerate triplets already considered.",
        phase: "inspect-duplicate-anchor",
        timelineLabel: "Check anchor",
        isMilestone: true,
      });
      b.bump("comparisons");
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(values, {
          anchor: anchor + 1,
          left: anchor + 2,
          right: values.length - 1,
          foundCount: triplets.length,
          actionIndex: anchor,
          decision: {
            title: "Skip duplicate anchor",
            detail: `anchor → ${anchor + 1}`,
            tone: "warning",
          },
        }),
        codeLine: 5,
        narration: `Skip duplicate anchor index ${anchor}.`,
        detail: "The output remains unique because this identical anchor is not swept again.",
        phase: "skip-anchor",
        timelineLabel: "Skip anchor",
        isMilestone: true,
      });
      continue;
    }

    let left = anchor + 1;
    let right = values.length - 1;
    b.emit({
      frame: frameFor(values, {
        anchor,
        left,
        right,
        foundCount: triplets.length,
      }),
      codeLine: 6,
      narration: `Fix anchor nums[${anchor}] = ${values[anchor]}; start left at ${left} and right at ${right}.`,
      detail: "The endpoint sweep now searches only the suffix after the anchor.",
      phase: "set-anchor",
      timelineLabel: "Fix anchor",
      isMilestone: true,
    });

    while (left < right) {
      const sum = values[anchor]! + values[left]! + values[right]!;
      b.emit({
        frame: frameFor(values, {
          anchor,
          left,
          right,
          foundCount: triplets.length,
          inspectSum: true,
        }),
        codeLine: 8,
        narration: `${values[anchor]} + ${values[left]} + ${values[right]} = ${sum}.`,
        detail:
          sum === 0
            ? "This sorted triplet is a solution; record it once and skip repeated endpoints."
            : sum < 0
              ? "The sum is too small, so only moving left rightward can increase it."
              : "The sum is too large, so only moving right leftward can decrease it.",
        phase: "compare-triplet",
        timelineLabel: "Compare sum",
        isMilestone: true,
      });
      b.bump("comparisons");

      if (sum < 0) {
        const oldLeft = left;
        left += 1;
        b.bump("pointerMoves");
        b.emit({
          frame: frameFor(values, {
            anchor,
            left,
            right,
            foundCount: triplets.length,
            actionIndex: oldLeft,
            decision: { title: "Increase the sum", detail: `left → ${left}`, tone: "accent" },
          }),
          codeLine: 9,
          narration: `Advance left from ${oldLeft} to ${left}.`,
          detail:
            "With a fixed anchor and right endpoint, sorted order cannot produce a larger sum by moving right.",
          phase: "move-left",
          timelineLabel: "Move left",
          isMilestone: true,
        });
        continue;
      }

      if (sum > 0) {
        const oldRight = right;
        right -= 1;
        b.bump("pointerMoves");
        b.emit({
          frame: frameFor(values, {
            anchor,
            left,
            right,
            foundCount: triplets.length,
            actionIndex: oldRight,
            decision: { title: "Decrease the sum", detail: `right → ${right}`, tone: "accent" },
          }),
          codeLine: 10,
          narration: `Retreat right from ${oldRight} to ${right}.`,
          detail:
            "With a fixed anchor and left endpoint, sorted order cannot produce a smaller sum by moving left.",
          phase: "move-right",
          timelineLabel: "Move right",
          isMilestone: true,
        });
        continue;
      }

      const found: [number, number, number] = [anchor, left, right];
      const triplet = [values[anchor]!, values[left]!, values[right]!];
      triplets.push(triplet);
      const oldLeft = left;
      const oldRight = right;
      left += 1;
      right -= 1;
      while (left < right && values[left] === values[left - 1]) left += 1;
      while (left < right && values[right] === values[right + 1]) right -= 1;
      b.bump("writes");
      b.bump("pointerMoves", left - oldLeft + oldRight - right);
      b.emit({
        frame: frameFor(values, {
          anchor,
          left,
          right,
          foundCount: triplets.length,
          foundTriplet: found,
          decision: {
            title: "Record unique triplet",
            detail: `[${triplet.join(", ")}]; left → ${left}; right → ${right}`,
            tone: "accent",
          },
        }),
        codeLine: 11,
        narration: `Record [${triplet.join(", ")}], move both pointers, and skip repeated endpoint values.`,
        detail:
          "This prevents the same sorted triplet from being emitted again for the current anchor.",
        phase: "record-triplet",
        timelineLabel: "Record triplet",
        isMilestone: true,
      });
    }
  }

  b.emit({
    frame: frameFor(values, {
      anchor: values.length,
      left: values.length,
      right: values.length - 1,
      foundCount: triplets.length,
      done: true,
      decision: {
        title: "All unique triplets found",
        detail: formatTriplets(triplets),
        tone: "accent",
      },
    }),
    codeLine: 12,
    narration: `Return ${triplets.length} unique zero-sum triplet${triplets.length === 1 ? "" : "s"}.`,
    detail: "Every distinct anchor and every feasible sorted endpoint pair has been exhausted.",
    phase: "done",
    timelineLabel: "Return triplets",
    isMilestone: true,
  });

  return b.finish("three-sum", `[${original.join(", ")}]`, `Result: ${formatTriplets(triplets)}.`);
}

export const threeSumModule: AlgorithmModule = {
  slug: "three-sum",
  inputs: [
    {
      name: "values",
      label: "Numbers",
      kind: "numbers",
      default: "-1, 0, 1, 2, -1, -4",
      help: "Use 3–12 integers; the visualizer sorts them first.",
      max: MAX_ITEMS,
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const list = parseNumberList(raw["values"] ?? "");
    if (!list.ok) return { ok: false, error: list.error };
    if (list.values.length < 3) return { ok: false, error: "Enter at least three numbers." };
    if (list.values.some((value) => !Number.isInteger(value))) {
      return { ok: false, error: "3Sum requires integer values." };
    }
    return { ok: true, parsed: { values: list.values } };
  },
  run,
  presets: [
    { label: "Classic", values: { values: "-1, 0, 1, 2, -1, -4" } },
    { label: "No solution", values: { values: "0, 1, 1" } },
    { label: "All zeroes", values: { values: "0, 0, 0" } },
    { label: "Repeated endpoints", values: { values: "-2, 0, 1, 1, 2" } },
    { label: "Duplicate anchors", values: { values: "-2, -2, 0, 0, 2, 2" } },
    { label: "All positive", values: { values: "1, 2, 3, 4, 5" } },
    {
      label: "Maximum visible",
      values: { values: "-4, -4, -3, -2, -1, 0, 0, 1, 2, 3, 4, 4" },
    },
  ],
};

export default threeSumModule;
