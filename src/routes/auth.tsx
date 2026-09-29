import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Check, Users, BookOpen, Star } from "lucide-react";
import { AlgoraGlyph } from "@/components/site-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePrefsStore } from "@/stores/prefsStore";
import { authHeroStats, pricingCatalogClaim } from "@/content/marketing-claims";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign up — Algora" },
      {
        name: "description",
        content: `Start learning algorithms for free. ${authHeroStats[1].rawText}, ${pricingCatalogClaim.rawText.toLowerCase()}, no credit card required.`,
      },
      { property: "og:title", content: "Sign up — Algora" },
      {
        property: "og:description",
        content: `Start learning algorithms for free. ${authHeroStats[1].rawText}, ${pricingCatalogClaim.rawText.toLowerCase()}, no credit card required.`,
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function AuthPage() {
  return (
    <div className="auth-viewport flex min-h-screen flex-col bg-paper text-foreground">
      <AuthTopBar />
      <main className="flex flex-1 min-h-0">
        <div className="flex w-full flex-col lg:flex-row">
          <LeftPanel />
          <RightPanel />
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}

function AuthTopBar() {
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
          <span className="hidden text-muted-foreground sm:inline">Already have an account?</span>
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}

function LeftPanel() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must include at least one number.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the terms to create an account.");
      return;
    }

    setError(null);
    setLoading(true);

    if (fullName || email) {
      updateProfile({
        fullName: fullName || "Learner",
        email,
      });
    }

    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/verify-email" });
    }, 400);
  };

  return (
    <section className="auth-form-panel flex flex-1 items-center justify-center px-6 py-6">
      <div className="w-full max-w-[500px] rounded-2xl border border-hairline bg-card p-7 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
          <span className="text-[10px]">◆</span> CREATE ACCOUNT
        </div>

        <h1 className="font-sans text-[24px] font-semibold tracking-tight md:mt-4 md:text-[32px] md:leading-[1.1]">
          <span className="md:hidden">Create your profile</span>
          <span className="hidden md:inline">
            Create a local learner profile
            <span className="ml-1.5 inline-block h-2.5 w-2.5 bg-primary" />.
          </span>
        </h1>
        <p className="auth-promotion mt-2.5 font-sans text-[15px] text-muted-foreground">
          {authHeroStats[1].rawText}, {pricingCatalogClaim.rawText}, no credit card.
        </p>

        <p className="auth-mobile-notice md:hidden text-[12px] text-muted-foreground">
          Local preview only. No account is created.
        </p>
        <div className="hidden md:block mt-4">
          <DemoNotice>No account or verification email is created yet.</DemoNotice>
        </div>

        <div className="hidden md:block mt-5 space-y-2.5">
          <SocialButton provider="google">Google sign-up coming soon</SocialButton>
          <SocialButton provider="github">GitHub sign-up coming soon</SocialButton>
        </div>

        <div className="relative my-5 hidden md:flex items-center">
          <div className="flex-1 border-t border-hairline" />
          <span className="px-3 font-mono text-[12px] text-muted-foreground">
            or set up a local profile
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
              htmlFor="fullName"
              className="font-mono text-[11px] uppercase tracking-wider text-foreground"
            >
              Full name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-xl border-hairline bg-card font-sans text-[15px] placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="font-mono text-[11px] uppercase tracking-wider text-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl border-hairline bg-card font-sans text-[15px] placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="font-mono text-[11px] uppercase tracking-wider text-foreground"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-xl border-hairline bg-card pr-10 font-sans text-[15px] placeholder:text-muted-foreground/70"
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
            <div className="hidden md:flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const filled = password.length >= i * 2;
                  return (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        filled ? "bg-primary" : "bg-hairline"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[11px] text-primary">
                {password.length >= 8 ? "Length met" : `${password.length}/8 characters`}
              </span>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              8+ characters, one number.
            </p>
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(c) => setAgreed(c === true)}
              className="mt-0.5 rounded-[4px] border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label
              htmlFor="terms"
              className="cursor-pointer font-sans text-[13px] leading-snug text-muted-foreground"
            >
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-xl bg-primary font-sans text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-50"
          >
            {loading ? "Opening setup..." : "Continue to local setup"}
          </button>
        </form>

        <p className="mt-3 text-center font-mono text-[12px] text-muted-foreground">
          Local preview only. No subscription is created.
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
        <div className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[13px] text-foreground">
              Binary Tree — Level Order Traversal
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="font-mono text-[11px] text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-tint-strong" />
                <span className="font-mono text-[11px] text-muted-foreground">Visited</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6">
            <div className="flex-1">
              <AuthTreeSvg />
            </div>
            <div className="flex w-[120px] flex-col items-center justify-center gap-2 border-l border-hairline pl-6">
              <ProgressRing progress={320 / 500} />
              <span className="font-mono text-[12px] text-muted-foreground">320 / 500 XP</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="font-sans text-[20px] font-medium tracking-tight text-foreground">
            See the algorithm think
            <span className="ml-1 inline-block h-2 w-2 bg-primary" />.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 font-mono text-[13px] text-muted-foreground">
            <StatItem
              icon={<Users className="h-4 w-4" />}
              value={authHeroStats[0].value}
              label={authHeroStats[0].label ?? "students"}
            />
            <StatItem
              icon={<BookOpen className="h-4 w-4" />}
              value={authHeroStats[1].value}
              label={authHeroStats[1].label ?? "lessons"}
            />
            <StatItem
              icon={<Star className="h-4 w-4" />}
              value={authHeroStats[2].value}
              label={authHeroStats[2].label ?? "rating"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-primary">{icon}</div>
      <div className="font-sans text-[16px] font-semibold text-foreground">{value}</div>
      <div className="text-[11px]">{label}</div>
    </div>
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
        <span className="font-sans text-[20px] font-semibold leading-none text-foreground">1</span>
      </div>
    </div>
  );
}

function AuthTreeSvg() {
  const nodes: Record<
    number,
    { x: number; y: number; state: "current" | "visited" | "unvisited" }
  > = {
    1: { x: 120, y: 28, state: "current" },
    2: { x: 70, y: 78, state: "visited" },
    3: { x: 170, y: 78, state: "visited" },
    4: { x: 45, y: 128, state: "unvisited" },
    5: { x: 95, y: 128, state: "unvisited" },
    6: { x: 170, y: 128, state: "unvisited" },
  };
  const edges: [number, number][] = [
    [1, 2],
    [1, 3],
    [2, 4],
    [2, 5],
    [3, 6],
  ];
  const fill = (s: string) =>
    s === "current"
      ? "var(--primary)"
      : s === "visited"
        ? "var(--primary-tint-strong)"
        : "var(--card)";
  const stroke = (s: string) => (s === "unvisited" ? "var(--viz-edge)" : "var(--primary)");
  const textColor = (s: string) => (s === "current" ? "var(--card)" : "var(--ink)");

  return (
    <svg viewBox="0 0 220 160" className="w-full" aria-hidden="true">
      {edges.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="var(--viz-edge)"
          strokeWidth="1.25"
        />
      ))}
      {Object.entries(nodes).map(([id, n]) => (
        <g key={id}>
          <circle
            cx={n.x}
            cy={n.y}
            r="18"
            fill={fill(n.state)}
            stroke={stroke(n.state)}
            strokeWidth="1.5"
          />
          <text
            x={n.x}
            y={n.y}
            dy="0.35em"
            textAnchor="middle"
            fill={textColor(n.state)}
            className="font-mono text-[13px] font-medium"
          >
            {id}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AuthFooter() {
  return (
    <footer className="shrink-0 h-[44px] border-t border-hairline bg-card flex items-center justify-center">
      <div className="mx-auto max-w-[1280px] px-8 text-center font-mono text-[12px] text-muted-foreground">
        © 2026 Algora · Local preview · Reduced-motion friendly
      </div>
    </footer>
  );
}
