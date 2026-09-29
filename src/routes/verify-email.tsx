import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mail, Check } from "lucide-react";
import { AlgoraGlyph } from "@/components/site-chrome";
import useHydrated from "@/hooks/useHydrated";
import { usePrefsStore } from "@/stores/prefsStore";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
  head: () => ({
    meta: [
      { title: "Verify your email — Algora" },
      {
        name: "description",
        content: "Preview Algora's six-digit verification flow. No email is sent.",
      },
      { property: "og:title", content: "Verify your email — Algora" },
      {
        property: "og:description",
        content: "Preview Algora's six-digit verification flow. No email is sent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-foreground">
      <VerifyTopBar />
      <main className="flex flex-1 min-h-0 flex-col items-center justify-center px-6 py-6">
        <VerifyCard />
        <StepProgress />
      </main>
      <VerifyFooter />
    </div>
  );
}

function VerifyTopBar() {
  return (
    <header className="shrink-0 border-b border-hairline bg-card">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <AlgoraGlyph />
          <span className="font-mono text-[22px] font-medium tracking-tight text-foreground">
            algora
          </span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-[13px]">
          <span className="text-muted-foreground">Wrong email?</span>
          <Link to="/auth" className="text-primary hover:underline">
            Change it
          </Link>
        </div>
      </div>
    </header>
  );
}

function VerifyCard() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const userEmail = usePrefsStore((s) => s.profile.email);

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(42);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      setFocusedIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setResendSeconds(60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.some((digit) => !/^\d$/.test(digit))) return;
    navigate({ to: "/onboarding/goals" });
  };

  const formatTime = (s: number) => {
    const secs = Math.max(0, s);
    return `00:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-hairline bg-card px-8 py-9 shadow-sm">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
          <div className="relative">
            <Mail className="h-7 w-7 text-primary" strokeWidth={1.75} />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-primary">
              <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
          <span className="text-[10px]">◆</span> VERIFY EMAIL
        </div>
      </div>

      <h1 className="mt-4 text-center font-sans text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
        Preview verification
        <span className="ml-1.5 inline-block h-2.5 w-2.5 bg-primary" />.
      </h1>

      <p className="mx-auto mt-3 max-w-[340px] text-center font-mono text-[13px] leading-relaxed text-muted-foreground">
        No email was sent. Enter any 6 digits to continue the local setup for{" "}
        <span className="text-foreground">
          {hydrated && userEmail ? userEmail : "your local profile"}
        </span>
        .
      </p>

      <div className="mt-4">
        <DemoNotice>This step does not verify an email address or create an account.</DemoNotice>
      </div>

      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2.5">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocusedIndex(i)}
              className={`flex h-[58px] min-w-0 w-full max-w-[52px] appearance-none items-center justify-center rounded-xl border bg-card text-center font-mono text-[22px] font-medium text-foreground outline-none transition-all ${
                focusedIndex === i ? "border-primary ring-4 ring-primary/15" : "border-hairline"
              } placeholder:text-muted-foreground/40`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={code.some((digit) => !/^\d$/.test(digit))}
          className="mt-5 h-12 w-full rounded-xl bg-primary font-mono text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-45"
        >
          Continue local preview
        </button>
      </form>

      <div className="mt-4 text-center font-mono text-[13px] text-muted-foreground">
        {resendSeconds > 0 ? (
          <>
            Resend code in <span className="text-foreground">{formatTime(resendSeconds)}</span>
          </>
        ) : (
          <button type="button" onClick={handleResend} className="text-primary hover:underline">
            Restart demo timer
          </button>
        )}
      </div>

      <div className="relative my-5 flex items-center">
        <div className="flex-1 border-t border-hairline" />
      </div>

      <p className="text-center font-mono text-[13px] text-muted-foreground">
        Didn&apos;t get the email? Check spam, or{" "}
        <Link to="/auth" className="text-primary underline">
          use a different address
        </Link>
      </p>
    </div>
  );
}

function StepProgress() {
  const steps = [
    { label: "Account", active: false },
    { label: "Verify", active: true },
    { label: "Start", active: false },
  ];

  return (
    <div className="mt-8 flex items-center gap-2 sm:gap-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                step.active
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40 bg-transparent"
              }`}
            />
            <span
              className={`font-mono text-[12px] ${
                step.active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="mb-5 h-px w-8 bg-hairline sm:w-16" />}
        </div>
      ))}
    </div>
  );
}

function VerifyFooter() {
  return (
    <footer className="flex h-[44px] shrink-0 items-center justify-center border-t border-hairline bg-card">
      <div className="text-center font-mono text-[12px] text-muted-foreground">
        © 2026 Algora · Local preview · Reduced-motion friendly
      </div>
    </footer>
  );
}
