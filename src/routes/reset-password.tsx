import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AlgoraGlyph } from "@/components/site-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoNotice } from "@/components/demo-notice";
import useHydrated from "@/hooks/useHydrated";
import { usePrefsStore } from "@/stores/prefsStore";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password — Algora" },
      {
        name: "description",
        content: "Preview Algora password validation. Account recovery is not connected.",
      },
      { property: "og:title", content: "Set a new password — Algora" },
      {
        property: "og:description",
        content: "Preview Algora password validation. Account recovery is not connected.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const userEmail = usePrefsStore((s) => s.profile.email);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must include at least one number.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must include at least one uppercase letter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    navigate({ to: "/login" });
  };

  const matches = password && confirmPassword && password === confirmPassword;

  return (
    <div className="flex min-h-screen flex-col bg-paper text-foreground">
      <header className="shrink-0 border-b border-hairline bg-card">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-2">
            <AlgoraGlyph />
            <span className="font-mono text-[22px] font-medium tracking-tight text-foreground">
              algora
            </span>
          </Link>
          <span className="font-mono text-[13px] text-muted-foreground">
            {hydrated && userEmail ? userEmail : "Local profile"}
          </span>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 items-center justify-center px-6 py-6">
        <div className="w-full max-w-[560px] rounded-2xl border border-hairline bg-card px-10 py-8 shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
              <ShieldCheck className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
              <span className="text-[10px]">◆</span> CHOOSE A NEW PASSWORD
            </div>
          </div>

          <h1 className="mt-3 text-center font-sans text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Set a new password
            <span className="ml-1.5 inline-block h-2.5 w-2.5 bg-primary" />
          </h1>

          <p className="mt-2.5 text-center font-mono text-[13px] text-muted-foreground">
            Preview the password rules before account recovery is connected.
          </p>

          <div className="mt-4">
            <DemoNotice>No account password will be changed.</DemoNotice>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 font-mono text-[12px] text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="new-password"
                className="font-mono text-[11px] uppercase tracking-wider text-foreground"
              >
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-hairline bg-card pr-11 font-mono text-[15px] tracking-[0.15em] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex flex-1 gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        password.length >= (i + 1) * 2 ? "bg-primary" : "bg-hairline"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[12px] text-primary">
                  {password.length >= 8 ? "Strong" : "Weak"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-1.5 pt-1.5">
                {[
                  { label: "8+ characters", valid: password.length >= 8 },
                  { label: "One number", valid: /\d/.test(password) },
                  { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
                ].map((r) => (
                  <span
                    key={r.label}
                    className="flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground"
                  >
                    <Check
                      className={`h-3.5 w-3.5 ${r.valid ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    {r.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-password"
                className="font-mono text-[11px] uppercase tracking-wider text-foreground"
              >
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl border-hairline bg-card pr-11 font-mono text-[15px] tracking-[0.15em] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                {matches ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-tint px-3 py-1.5 font-mono text-[12px] text-primary">
                    <Check className="h-3.5 w-3.5" /> Passwords match
                  </span>
                ) : (
                  <span className="font-mono text-[12px] text-muted-foreground">
                    Passwords must match
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-primary font-mono text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
            >
              Finish local preview
            </button>
          </form>

          <p className="mt-3 text-center font-mono text-[12px] text-muted-foreground">
            You'll be signed in automatically after resetting.
          </p>
        </div>
      </main>

      <footer className="flex h-[44px] shrink-0 items-center justify-center border-t border-hairline bg-card">
        <div className="text-center font-mono text-[12px] text-muted-foreground">
          © 2026 Algora · Account security
        </div>
      </footer>
    </div>
  );
}
