import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { AlgoraGlyph } from "@/components/site-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Forgot password — Algora" },
      {
        name: "description",
        content: "Preview account recovery. Reset email delivery is not connected yet.",
      },
      { property: "og:title", content: "Forgot password — Algora" },
      {
        property: "og:description",
        content: "Preview account recovery. Reset email delivery is not connected yet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

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
          <div className="flex items-center gap-2 font-mono text-[13px]">
            <span className="text-muted-foreground">Remembered it?</span>
            <Link to="/login" className="text-primary hover:underline">
              Back to log in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 items-center justify-center px-6 py-6">
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-hairline bg-card px-8 py-9 shadow-sm">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
                <KeyRound className="h-7 w-7 text-primary" strokeWidth={1.75} />
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
                <span className="text-[10px]">◆</span> RESET PASSWORD
              </div>
            </div>

            <h1 className="mt-4 text-center font-sans text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              Forgot your password?
              <span className="ml-1 inline-block h-2.5 w-2.5 bg-primary" />
            </h1>

            <p className="mx-auto mt-3 max-w-[320px] text-center font-mono text-[13px] leading-relaxed text-muted-foreground">
              {sent
                ? `A demo reset step is ready for ${email}. No email was sent.`
                : "Enter an email to preview the recovery flow on this device."}
            </p>

            <div className="mt-4">
              <DemoNotice>Password recovery is not connected to an account service.</DemoNotice>
            </div>

            {!sent ? (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reset-email"
                    className="font-mono text-[11px] uppercase tracking-wider text-foreground"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl border-hairline bg-card pl-11 font-mono text-[14px] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary font-mono text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
                >
                  Prepare demo reset
                </button>

                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-hairline bg-card font-mono text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Back to log in
                </Link>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/reset-password" })}
                  className="h-12 w-full rounded-xl bg-primary font-mono text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
                >
                  Open reset link (Demo)
                </button>
                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-hairline bg-card font-mono text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Back to log in
                </Link>
              </div>
            )}

            <p className="mt-4 text-center font-mono text-[12px] text-muted-foreground">
              This preview does not issue a recovery link or token.
            </p>
          </div>

          <p className="mt-6 text-center font-mono text-[13px] text-muted-foreground">
            Need to change the preview address?{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-primary hover:underline"
            >
              Edit email
            </button>
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
