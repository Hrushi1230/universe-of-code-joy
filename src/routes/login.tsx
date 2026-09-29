import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Check, Flame } from "lucide-react";
import { AlgoraGlyph } from "@/components/site-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrefsStore } from "@/stores/prefsStore";
import { DemoNotice } from "@/components/demo-notice";
import { authHeroStats, pricingCatalogClaim } from "@/content/marketing-claims";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — Algora" },
      {
        name: "description",
        content: `Log in to Algora and keep your learning streak. ${authHeroStats[1].rawText}, ${pricingCatalogClaim.rawText.toLowerCase()}.`,
      },
      { property: "og:title", content: "Log in — Algora" },
      {
        property: "og:description",
        content: `Log in to Algora and keep your learning streak. ${authHeroStats[1].rawText}, ${pricingCatalogClaim.rawText.toLowerCase()}.`,
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function LoginPage() {
  return (
    <div className="auth-viewport flex min-h-screen flex-col bg-paper text-foreground">
      <LoginTopBar />
      <main className="flex flex-1 min-h-0">
        <div className="flex w-full flex-col lg:flex-row">
          <LeftPanel />
          <RightPanel />
        </div>
      </main>
      <LoginFooter />
    </div>
  );
}

function LoginTopBar() {
  return (
    <header className="shrink-0 border-b border-hairline bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <AlgoraGlyph />
          <span className="font-mono text-[22px] font-medium tracking-tight text-foreground">
            algora
          </span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-[13px]">
          <span className="hidden text-muted-foreground sm:inline">New to Algora?</span>
          <Link to="/auth" className="text-primary hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </header>
  );
}

function LeftPanel() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateProfile = usePrefsStore((s) => s.updateProfile);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setLoading(true);

    if (email) {
      updateProfile({ email });
    }

    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/dashboard" });
    }, 400);
  };

  return (
    <section className="auth-form-panel flex flex-1 items-center justify-center px-6 py-6">
      <div className="w-full max-w-[420px] rounded-2xl border border-hairline bg-card p-7 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
          <span className="text-[10px]">◆</span> WELCOME BACK
        </div>

        <h1 className="font-sans text-[24px] font-semibold tracking-tight md:mt-4 md:text-[32px] md:leading-[1.1]">
          <span className="md:hidden">Welcome back</span>
          <span className="hidden md:inline">
            Continue to your local workspace
            <span className="ml-1.5 inline-block h-2.5 w-2.5 bg-primary" />.
          </span>
        </h1>
        <p className="auth-promotion mt-2.5 font-sans text-[15px] text-muted-foreground">
          Preview the learner experience stored on this device.
        </p>

        <p className="auth-mobile-notice md:hidden text-[12px] text-muted-foreground">
          Local preview only. No account is created.
        </p>
        <div className="hidden md:block mt-4">
          <DemoNotice>No account or authenticated session is created.</DemoNotice>
        </div>

        <div className="hidden md:block mt-5 space-y-2.5">
          <SocialButton provider="google">Google sign-in coming soon</SocialButton>
          <SocialButton provider="github">GitHub sign-in coming soon</SocialButton>
        </div>

        <div className="relative my-5 hidden md:flex items-center">
          <div className="flex-1 border-t border-hairline" />
          <span className="px-3 font-mono text-[12px] text-muted-foreground">
            or continue with a local profile
          </span>
          <div className="flex-1 border-t border-hairline" />
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/50 p-3 font-mono text-[12px] text-red-600"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="font-mono text-[11px] uppercase tracking-wider text-foreground"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-xl border-hairline bg-card pl-10 font-sans text-[15px] placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="font-mono text-[11px] uppercase tracking-wider text-foreground"
              >
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="font-mono text-[11px] text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-xl border-hairline bg-card pl-10 pr-10 font-sans text-[15px] placeholder:text-muted-foreground/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-xl bg-primary font-sans text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-50"
          >
            {loading ? "Opening preview..." : "Continue to local preview"}
          </button>
        </form>

        <p className="mt-3 text-center font-mono text-[12px] text-muted-foreground">
          Your email is saved only in this browser&apos;s local preview data.
        </p>
      </div>
    </section>
  );
}

function SocialButton({
  provider,
  children,
}: {
  provider: "google" | "github";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-hairline bg-secondary/50 font-sans text-[14px] font-medium text-muted-foreground"
    >
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.21 1.125-.845 2.078-1.797 2.716v2.259h2.908c1.702-1.567 2.685-3.874 2.685-6.616z"
        fill="var(--color-google-blue)"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.48 18 9 18z"
        fill="var(--color-google-green)"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.165.282-1.71V4.958H.96A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.96 4.042l3.004-2.332z"
        fill="var(--color-google-yellow)"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.436 1.344l2.58-2.58C13.463.891 11.426 0 9 0 5.48 0 2.44 2.017.96 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="var(--color-google-red)"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 0C4.027 0 0 4.027 0 9c0 3.98 2.58 7.35 6.154 8.54.45.083.615-.195.615-.433 0-.213-.008-.777-.012-1.525-2.504.544-3.03-1.207-3.03-1.207-.41-1.04-1-1.317-1-1.317-.817-.558.062-.547.062-.547.903.064 1.378.927 1.378.927.802 1.374 2.104.978 2.617.747.082-.58.314-.978.572-1.203-1.998-.227-4.096-.999-4.096-4.442 0-.981.35-1.783.925-2.41-.093-.227-.402-1.14.088-2.377 0 0 .754-.241 2.474.92A8.64 8.64 0 0 1 9 4.35a8.64 8.64 0 0 1 2.256.3c1.718-1.162 2.47-.92 2.47-.92.492 1.238.183 2.15.09 2.377.576.627.923 1.43.923 2.41 0 3.453-2.1 4.212-4.105 4.435.323.277.61.825.61 1.663 0 1.2-.01 2.168-.01 2.463 0 .24.162.52.62.432C15.424 16.347 18 12.983 18 9c0-4.973-4.027-9-9-9z"
        fill="var(--ink)"
      />
    </svg>
  );
}

function RightPanel() {
  return (
    <section className="relative hidden flex-1 items-center justify-center bg-primary-tint px-8 py-8 lg:flex">
      <div className="w-full max-w-[440px]">
        <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-sans text-[22px] font-semibold tracking-tight text-foreground">
                23-day streak
              </div>
              <div className="font-mono text-[12px] text-muted-foreground">
                Keep the flame alive
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-between">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
              const done = i < 5;
              return (
                <div key={day + i} className="flex flex-col items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{day}</span>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-hairline bg-card text-muted-foreground"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-hairline pt-4 font-sans text-[14px] text-muted-foreground">
            Keep it up! You’re building something great.
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6 rounded-2xl border border-hairline bg-card p-5 shadow-sm">
          <ProgressRing progress={2150 / 2400} />
          <div className="flex-1">
            <div className="font-mono text-[13px] text-foreground">2,150 / 2,400 XP</div>
            <div className="mt-1 font-mono text-[12px] text-muted-foreground">
              250 XP to next level
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(2150 / 2400) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="font-sans text-[20px] font-medium tracking-tight text-foreground">
            Consistency compounds
            <span className="ml-1 inline-block h-2 w-2 bg-primary" />.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 34;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex h-[90px] w-[90px] items-center justify-center">
      <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90" aria-hidden="true">
        <circle
          cx="45"
          cy="45"
          r={normalizedRadius}
          fill="transparent"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />
        <circle
          cx="45"
          cy="45"
          r={normalizedRadius}
          fill="transparent"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[11px] text-muted-foreground">Lvl</span>
        <span className="font-sans text-[20px] font-semibold leading-none text-foreground">12</span>
      </div>
    </div>
  );
}

function LoginFooter() {
  return (
    <footer className="shrink-0 h-[44px] border-t border-hairline bg-card flex items-center justify-center">
      <div className="mx-auto max-w-[1280px] px-8 text-center font-mono text-[12px] text-muted-foreground">
        © 2026 Algora · Local preview · Reduced-motion friendly
      </div>
    </footer>
  );
}
