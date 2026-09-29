import * as React from "react";
import { Check, Copy } from "lucide-react";
import { resolveCodeLine } from "@/engine/builder";
import { tokenizeLine, type TokenKind } from "@/lib/syntaxHighlight";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import { usePrefsStore, type CodeLanguage } from "@/stores/prefsStore";

/** Token colours, all from the theme tokens — the palette stays teal + ink. */
const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-accent-strong",
  number: "text-ink",
  string: "text-accent-strong/80",
  comment: "text-slate-soft italic",
  fn: "text-ink font-medium",
  punct: "text-slate",
  plain: "",
};

const LANGS: { id: CodeLanguage; label: string; name: string }[] = [
  { id: "js", label: "JS", name: "JavaScript" },
  { id: "ts", label: "TS", name: "TypeScript" },
  { id: "py", label: "PY", name: "Python" },
];

export function CodePane({
  className,
  /** Hides the pane's own heading when a tab strip already names it. */
  hideTitle = false,
}: {
  className?: string;
  hideTitle?: boolean;
}): React.ReactElement | null {
  const run = usePlayerStore((s) => s.run);
  const index = usePlayerStore((s) => s.index);
  const language = usePrefsStore((s) => s.language);
  const setLanguage = usePrefsStore((s) => s.setLanguage);
  const [copied, setCopied] = React.useState(false);

  const rawCodeLine = run?.steps[index]?.codeLine ?? null;
  /** `rawCodeLine` indexes the pseudocode; the listings need it translated. */
  const codeLine = run ? resolveCodeLine(run, language, rawCodeLine) : null;
  const lines = React.useMemo(() => run?.codeByLang[language] ?? [], [run, language]);

  if (!run) return null;

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const activeLang = LANGS.find((l) => l.id === language) ?? LANGS[0];
  const rainWater = run.slug === "trapping-rain-water";
  const windowStart = rainWater ? Math.max(0, Math.min((codeLine ?? 1) - 4, lines.length - 8)) : 0;
  const visibleLines = rainWater ? lines.slice(windowStart, windowStart + 8) : lines;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-2xl border border-hairline bg-card shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-hairline px-4 py-3",
          hideTitle ? "justify-end" : "justify-between",
        )}
      >
        {hideTitle ? null : (
          <h2 className="font-sans text-[14px] font-medium text-ink">Code ({activeLang.name})</h2>
        )}
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              aria-label="Code language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
              className="appearance-none bg-transparent pr-4 font-mono text-[12px] text-ink outline-none cursor-pointer"
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate">
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => void onCopy()}
            className="flex items-center gap-1.5 font-mono text-[12px] text-primary hover:opacity-80 transition-opacity"
          >
            {copied ? (
              <Check className="h-3 w-3" strokeWidth={2.5} />
            ) : (
              <Copy className="h-3 w-3" strokeWidth={2} />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-2 py-3">
        {rainWater && windowStart > 0 ? (
          <p className="px-10 font-mono text-[11px] text-slate">↑ Earlier lines</p>
        ) : null}
        {visibleLines.map((line, i) => {
          const lineNo = windowStart + i + 1;
          const isActive = codeLine === lineNo;
          return (
            <div
              key={lineNo}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group flex items-start gap-4 px-2 py-0 font-mono text-[13px] leading-5",
                "transition-[background-color,border-color,color] duration-300 ease-out",
                isActive
                  ? "border-l-2 border-primary bg-tint text-ink"
                  : "border-l-2 border-transparent text-slate",
              )}
            >
              {isActive ? (
                <div className="flex w-6 shrink-0 select-none items-center justify-end text-primary">
                  <svg
                    aria-hidden="true"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 3 14 9-14 9z" />
                  </svg>
                </div>
              ) : (
                <span className="w-6 shrink-0 select-none text-right text-slate">{lineNo}</span>
              )}
              <code className="whitespace-pre">
                {line === ""
                  ? " "
                  : tokenizeLine(line).map((t, ti) => (
                      <span key={ti} className={TOKEN_CLASS[t.kind]}>
                        {t.text}
                      </span>
                    ))}
              </code>
            </div>
          );
        })}
        {rainWater && windowStart + visibleLines.length < lines.length ? (
          <p className="px-10 font-mono text-[11px] text-slate">↓ Later lines</p>
        ) : null}
      </div>
    </div>
  );
}

export default CodePane;
