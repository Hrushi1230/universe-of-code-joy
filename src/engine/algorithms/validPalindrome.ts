import { StepBuilder } from "@/engine/builder";
import type {
  AlgorithmModule,
  AlgorithmRun,
  ArrayFrame,
  CellState,
  CodeLineMap,
  ValidationResult,
} from "@/engine/types";

const MAX_CHARACTERS = 12;

const PSEUDOCODE = [
  "function isPalindrome(text)",
  "  left <- 0; right <- length(text) - 1",
  "  while left < right",
  "    if text[left] is not alphanumeric: left <- left + 1",
  "    else if text[right] is not alphanumeric: right <- right - 1",
  "    else if lowercase(text[left]) != lowercase(text[right]): return false",
  "    else: left <- left + 1; right <- right - 1",
  "  return true",
] as const;

const CODE_BY_LANG: AlgorithmRun["codeByLang"] = {
  js: [
    "function isPalindrome(s) {",
    "  const ok = c => /[a-z0-9]/i.test(c);",
    "  let left = 0, right = s.length - 1;",
    "  while (left < right) {",
    "    if (!ok(s[left])) { left++; continue; }",
    "    if (!ok(s[right])) { right--; continue; }",
    "    if (s[left].toLowerCase() !== s[right].toLowerCase())",
    "      return false;",
    "    left++; right--;",
    "  }",
    "  return true;",
    "}",
  ],
  ts: [
    "function isPalindrome(s: string): boolean {",
    "  const ok = (c: string) => /[a-z0-9]/i.test(c);",
    "  let left = 0, right = s.length - 1;",
    "  while (left < right) {",
    "    if (!ok(s[left])) { left++; continue; }",
    "    if (!ok(s[right])) { right--; continue; }",
    "    if (s[left].toLowerCase() !== s[right].toLowerCase())",
    "      return false;",
    "    left++; right--;",
    "  }",
    "  return true;",
    "}",
  ],
  py: [
    "def is_palindrome(s):",
    "    left, right = 0, len(s) - 1",
    "    while left < right:",
    "        if not s[left].isalnum(): left += 1; continue",
    "        if not s[right].isalnum(): right -= 1; continue",
    "        if s[left].lower() != s[right].lower():",
    "            return False",
    "        left += 1; right -= 1",
    "    return True",
  ],
};

const CODE_MAP: CodeLineMap = {
  js: [1, 3, 4, 5, 6, 7, 9, 11],
  ts: [1, 3, 4, 5, 6, 7, 9, 11],
  py: [1, 2, 3, 4, 5, 6, 8, 9],
};

function isAlphanumeric(character: string): boolean {
  return /^[a-z0-9]$/i.test(character);
}

function visibleCharacter(character: string): string {
  return character === " " ? "␠" : character;
}

type Action = "skip-left" | "skip-right" | "match" | "mismatch";

interface FrameSpec {
  left: number;
  right: number;
  outcome: "undecided" | "true" | "false";
  inspect?: boolean;
  action?: Action;
  actionIndices?: [number, number?];
  done?: boolean;
  decision?: ArrayFrame["decision"];
}

function actionFor(characters: string[], left: number, right: number): Action {
  if (!isAlphanumeric(characters[left]!)) return "skip-left";
  if (!isAlphanumeric(characters[right]!)) return "skip-right";
  return characters[left]!.toLowerCase() === characters[right]!.toLowerCase()
    ? "match"
    : "mismatch";
}

function frameFor(characters: string[], spec: FrameSpec): ArrayFrame {
  const {
    left,
    right,
    outcome,
    inspect = false,
    action,
    actionIndices,
    done = false,
    decision,
  } = spec;
  const states: Record<number, CellState> = {};
  for (let index = 0; index < characters.length; index += 1) {
    states[index] = done || index < left || index > right ? "excluded" : "idle";
  }
  if (inspect && left < right) {
    states[left] = "compare";
    states[right] = "compare";
  }
  const actionLeft = actionIndices?.[0];
  const actionRight = actionIndices?.[1];
  if ((action === "skip-left" || action === "skip-right") && actionLeft !== undefined) {
    states[actionLeft] = "active";
  }
  if ((action === "match" || action === "mismatch") && actionLeft !== undefined) {
    states[actionLeft] = action === "match" ? "found" : "active";
    if (actionRight !== undefined) states[actionRight] = action === "match" ? "found" : "active";
  }

  const leftCharacter = characters[left] ?? "";
  const rightCharacter = characters[right] ?? "";
  const nextAction = left < right ? actionFor(characters, left, right) : null;
  const comparison =
    inspect && nextAction
      ? nextAction === "skip-left"
        ? {
            left: visibleCharacter(leftCharacter),
            op: "→",
            right: "skip left",
            verdict: "not alphanumeric",
            tone: "warning" as const,
          }
        : nextAction === "skip-right"
          ? {
              left: visibleCharacter(rightCharacter),
              op: "→",
              right: "skip right",
              verdict: "not alphanumeric",
              tone: "warning" as const,
            }
          : {
              left: leftCharacter.toLowerCase(),
              op: nextAction === "match" ? "=" : "≠",
              right: rightCharacter.toLowerCase(),
              verdict: nextAction === "match" ? "characters match" : "not a palindrome",
              tone: nextAction === "match" ? ("accent" as const) : ("error" as const),
            }
      : undefined;

  return {
    kind: "array",
    values: characters.map(visibleCharacter),
    states,
    pointers: [
      { name: "left", index: left },
      { name: "right", index: right, color: "warning" },
    ],
    ranges:
      left < right ? [{ from: left, to: right, label: "Unchecked characters", tone: "tint" }] : [],
    rangeRows: 1,
    target: { label: "palindrome", value: outcome },
    ...(comparison ? { comparison } : {}),
    ...(decision ? { decision } : {}),
  };
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const text = parsed["text"] as string;
  const characters = [...text];
  const b = new StepBuilder([...PSEUDOCODE], CODE_BY_LANG, CODE_MAP);
  let left = 0;
  let right = characters.length - 1;

  b.emit({
    frame: frameFor(characters, { left, right, outcome: "undecided" }),
    codeLine: 2,
    narration: "Place one pointer at each end of the original text.",
    detail: "Spaces and punctuation stay visible so each skipped character can be justified.",
    phase: "setup",
    timelineLabel: "Set pointers",
    isMilestone: true,
  });

  while (left < right) {
    const action = actionFor(characters, left, right);
    b.emit({
      frame: frameFor(characters, { left, right, outcome: "undecided", inspect: true }),
      codeLine: action === "skip-left" ? 4 : action === "skip-right" ? 5 : 6,
      narration:
        action === "skip-left"
          ? `${visibleCharacter(characters[left]!)} is not alphanumeric, so skip it on the left.`
          : action === "skip-right"
            ? `${visibleCharacter(characters[right]!)} is not alphanumeric, so skip it on the right.`
            : `Compare ${characters[left]!.toLowerCase()} with ${characters[right]!.toLowerCase()} after normalizing case.`,
      detail:
        action === "match"
          ? "The normalized characters match, so both endpoints are proved and can move inward."
          : action === "mismatch"
            ? "One unequal normalized pair is enough to prove the whole string is not a palindrome."
            : "Non-alphanumeric characters do not participate in the palindrome comparison.",
      phase: "inspect-characters",
      timelineLabel: "Inspect ends",
      isMilestone: true,
    });
    b.bump("inspections");

    if (action === "skip-left") {
      const skipped = left;
      left += 1;
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(characters, {
          left,
          right,
          outcome: "undecided",
          action,
          actionIndices: [skipped],
          decision: { title: "Skip left character", detail: `left → ${left}`, tone: "warning" },
        }),
        codeLine: 4,
        narration: `Advance left to ${left}.`,
        detail: "The skipped symbol cannot affect palindrome equality.",
        phase: "skip-left",
        timelineLabel: "Skip left",
        isMilestone: true,
      });
      continue;
    }

    if (action === "skip-right") {
      const skipped = right;
      right -= 1;
      b.bump("pointerMoves");
      b.emit({
        frame: frameFor(characters, {
          left,
          right,
          outcome: "undecided",
          action,
          actionIndices: [skipped],
          decision: { title: "Skip right character", detail: `right → ${right}`, tone: "warning" },
        }),
        codeLine: 5,
        narration: `Retreat right to ${right}.`,
        detail: "The skipped symbol cannot affect palindrome equality.",
        phase: "skip-right",
        timelineLabel: "Skip right",
        isMilestone: true,
      });
      continue;
    }

    if (action === "mismatch") {
      b.emit({
        frame: frameFor(characters, {
          left,
          right,
          outcome: "false",
          action,
          actionIndices: [left, right],
          decision: { title: "Mismatch found", detail: "return false", tone: "error" },
        }),
        codeLine: 6,
        narration: `${characters[left]!.toLowerCase()} and ${characters[right]!.toLowerCase()} differ, so return false.`,
        detail: "A palindrome requires every mirrored alphanumeric pair to match.",
        phase: "mismatch",
        timelineLabel: "Return false",
        isMilestone: true,
      });
      return b.finish(
        "valid-palindrome",
        JSON.stringify(text),
        "The text is not a valid palindrome.",
      );
    }

    const matchedLeft = left;
    const matchedRight = right;
    left += 1;
    right -= 1;
    b.bump("comparisons");
    b.bump("pointerMoves", 2);
    b.emit({
      frame: frameFor(characters, {
        left,
        right,
        outcome: "undecided",
        action,
        actionIndices: [matchedLeft, matchedRight],
        decision: {
          title: "Normalized pair matches",
          detail: `left → ${left}; right → ${right}`,
          tone: "accent",
        },
      }),
      codeLine: 7,
      narration: `The pair matches; move both pointers inward to ${left} and ${right}.`,
      detail:
        "Everything outside the new pointer interval is already proved or irrelevant punctuation.",
      phase: "move-both",
      timelineLabel: "Move both",
      isMilestone: true,
    });
  }

  b.emit({
    frame: frameFor(characters, {
      left,
      right,
      outcome: "true",
      done: true,
      decision: { title: "All mirrored pairs match", detail: "return true", tone: "accent" },
    }),
    codeLine: 8,
    narration: "The pointers have met or crossed, so return true.",
    detail: "Every alphanumeric character has a matching normalized mirror.",
    phase: "done",
    timelineLabel: "Return true",
    isMilestone: true,
  });

  return b.finish("valid-palindrome", JSON.stringify(text), "The text is a valid palindrome.");
}

export const validPalindromeModule: AlgorithmModule = {
  slug: "valid-palindrome",
  inputs: [{ name: "text", label: "Text", kind: "text", default: "Nurses, run" }],
  validate(raw: Record<string, string>): ValidationResult {
    const text = raw["text"] ?? "";
    const characters = [...text];
    if (characters.length < 1) return { ok: false, error: "Enter at least one character." };
    if (characters.length > MAX_CHARACTERS) {
      return {
        ok: false,
        error: "Use 12 or fewer visible characters so the fixed visualizer stays readable.",
      };
    }
    return { ok: true, parsed: { text } };
  },
  run,
  presets: [
    { label: "Phrase", values: { text: "Nurses, run" } },
    { label: "Mixed case", values: { text: "Race Car" } },
    { label: "Not palindrome", values: { text: "race a car" } },
    { label: "Punctuation", values: { text: "7, abba, 7" } },
    { label: "Symbols only", values: { text: "!!!" } },
    { label: "Single", values: { text: "A" } },
    { label: "Maximum visible", values: { text: "A1,b2!!2b,1A" } },
  ],
};

export default validPalindromeModule;
