import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Plus, GraduationCap, Play, Flag } from "lucide-react";
import { SiteNav, SiteFooter, AlgoraGlyph } from "@/components/site-chrome";
import { pricingCatalogClaim } from "@/content/marketing-claims";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Algora" },
      {
        name: "description",
        content:
          "Explore free local learning and preview planned Algora plans. Paid checkout is not available yet.",
      },
      { property: "og:title", content: "Pricing — Algora" },
      {
        property: "og:description",
        content:
          "Explore free local learning and planned plans. Paid checkout is not available yet.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <SiteNav active="Pricing" />
      <main id="main-content">
        <Hero billing={billing} setBilling={setBilling} />
        <PricingCards billing={billing} />
        <CompareTable />
        <StudentBanner />
        <FaqSection />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero({
  billing,
  setBilling,
}: {
  billing: "monthly" | "annual";
  setBilling: (value: "monthly" | "annual") => void;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-10 pt-14 text-center sm:px-8 sm:pt-20">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
        <span className="text-[10px]">◆</span> PRICING
      </div>
      <h1 className="mt-6 font-sans text-[42px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]">
        Free to start. Built for students
        <span className="inline-block ml-1 h-3 w-3 translate-y-[-2px] bg-primary" />
      </h1>
      <p className="mx-auto mt-5 max-w-[640px] font-sans text-[16px] text-muted-foreground">
        Learn the fundamentals for free. Preview the plans being considered for launch.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center rounded-full border border-hairline bg-card p-1">
          <button
            type="button"
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-1.5 font-sans text-sm ${
              billing === "monthly" ? "bg-primary text-primary-foreground" : "text-foreground/80"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
            className={`rounded-full px-5 py-1.5 font-sans text-sm ${
              billing === "annual" ? "bg-primary text-primary-foreground" : "text-foreground/80"
            }`}
          >
            Annual
          </button>
        </div>
        <span className="rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] text-primary">
          Pricing preview
        </span>
      </div>
    </section>
  );
}

function Tick() {
  return (
    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10">
      <Check className="size-3 text-primary" strokeWidth={3} />
    </span>
  );
}

function PriceCard({
  name,
  price,
  suffix,
  tagline,
  features,
  cta,
  ctaVariant = "ghost",
  popular = false,
  ctaTo,
}: {
  name: string;
  price: string;
  suffix?: string;
  tagline: string;
  features: string[];
  cta: string;
  ctaVariant?: "ghost" | "solid";
  popular?: boolean;
  ctaTo: "/auth" | "/contact";
}) {
  return (
    <div className="relative">
      {popular && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-md bg-primary px-3 py-1 font-mono text-[10px] tracking-wider text-primary-foreground">
          MOST POPULAR
        </div>
      )}
      <div
        className={`flex h-full flex-col rounded-2xl bg-card p-8 ${
          popular
            ? "border-2 border-primary shadow-[0_8px_30px_-12px_rgba(14,156,134,0.25)]"
            : "border border-hairline"
        }`}
      >
        <div className="font-sans text-[22px] text-foreground">{name}</div>
        <div className="mt-5 flex items-baseline gap-1">
          <span className="font-mono text-[42px] leading-none tracking-tight text-foreground">
            {price}
          </span>
          {suffix && <span className="font-sans text-sm text-muted-foreground">{suffix}</span>}
        </div>
        <div className="mt-3 font-sans text-sm text-muted-foreground">{tagline}</div>
        <div className="my-6 h-px bg-hairline" />
        <ul className="flex-1 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 font-sans text-[14px] text-foreground">
              <Tick />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link
          to={ctaTo}
          className={`mt-8 rounded-xl py-3 text-center font-sans text-sm font-medium transition-colors ${
            ctaVariant === "solid"
              ? "bg-primary text-primary-foreground hover:bg-primary-glow"
              : "border border-hairline bg-card text-foreground hover:bg-secondary"
          }`}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function PricingCards({ billing }: { billing: "monthly" | "annual" }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-8 sm:px-8">
      <div className="mb-6">
        <DemoNotice>
          Plans, payments, discounts, and entitlements are not connected. These cards preview the
          intended product structure.
        </DemoNotice>
      </div>
      <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-3">
        <PriceCard
          name="Free"
          price="$0"
          tagline="For getting started"
          features={["Core lessons", "Basic visualizer", "Daily streaks", "Community access"]}
          cta="Start free"
          ctaTo="/auth"
        />
        <PriceCard
          name="Pro"
          price={billing === "monthly" ? "$12" : "$96"}
          suffix={billing === "monthly" ? "/month" : "/year"}
          tagline="For serious prep"
          features={[
            "Everything in Free",
            pricingCatalogClaim.rawText,
            "Step-through debugger",
            "Spaced-repetition review",
            "Leagues + XP boosts",
            "Priority support",
          ]}
          cta="Go Pro"
          ctaVariant="solid"
          popular
          ctaTo="/auth"
        />
        <PriceCard
          name="Campus"
          price="Custom"
          tagline="For universities & cohorts"
          features={[
            "Planned volume seats",
            "Planned admin dashboard",
            "Planned cohort analytics",
            "Planned SSO",
            "Planned onboarding",
          ]}
          cta="Contact sales"
          ctaTo="/contact"
        />
      </div>
    </section>
  );
}

function Cell({ v }: { v: boolean }) {
  return (
    <div className="flex items-center justify-center">
      {v ? (
        <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <span className="sr-only">Included</span>
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      ) : (
        <span className="flex items-center">
          <span className="sr-only">Not included</span>
          <span className="h-px w-4 bg-muted-foreground/50" />
        </span>
      )}
    </div>
  );
}

function CompareTable() {
  const rows: [string, boolean, boolean, boolean][] = [
    ["Core lessons", true, true, true],
    ["All algorithms", false, true, true],
    ["Interactive visualizer", true, true, true],
    ["Step-through debugger", false, true, true],
    ["Spaced repetition", false, true, true],
    ["Mastery map", true, true, true],
    ["Leagues & leaderboards", false, true, true],
    ["XP boosts", false, true, true],
    ["Admin dashboard", false, false, true],
    ["SSO", false, false, true],
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
      <h2 className="mb-5 text-center font-sans text-[28px] tracking-[-0.02em] text-foreground">
        Planned feature comparison
      </h2>
      <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-card md:block">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center border-b border-hairline">
          <div className="px-6 py-4 font-sans text-[15px] text-foreground">Compare features</div>
          <div className="py-4 text-center font-sans text-sm text-muted-foreground">Free</div>
          <div className="bg-primary-tint/50 py-4 text-center font-sans text-sm text-foreground">
            Pro
          </div>
          <div className="py-4 text-center font-sans text-sm text-muted-foreground">Campus</div>
        </div>
        {rows.map(([label, f, p, c], i) => (
          <div
            key={label}
            className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center ${
              i < rows.length - 1 ? "border-b border-hairline" : ""
            }`}
          >
            <div className="px-6 py-3.5 font-sans text-[14px] text-foreground">{label}</div>
            <div className="py-3.5">
              <Cell v={f} />
            </div>
            <div className="bg-primary-tint/50 py-3.5">
              <Cell v={p} />
            </div>
            <div className="py-3.5">
              <Cell v={c} />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map(([label, free, pro, campus]) => (
          <div key={label} className="rounded-xl border border-hairline bg-card p-4">
            <div className="font-sans text-[15px] text-foreground">{label}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px] text-muted-foreground">
              {[
                ["Free", free],
                ["Pro", pro],
                ["Campus", campus],
              ].map(([plan, available]) => (
                <div key={String(plan)} className="rounded-lg bg-secondary/60 px-2 py-2">
                  <div>{plan}</div>
                  <div className="mt-1 text-foreground">{available ? "Planned" : "—"}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudentBanner() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-hairline bg-primary-tint/60 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative grid size-14 place-items-center">
            <span className="absolute inset-0 rounded-full border border-dashed border-primary/40" />
            <GraduationCap className="size-6 text-primary" />
          </div>
          <div className="font-sans text-[18px] text-foreground">
            Student pricing is not available yet
          </div>
        </div>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-xl border border-hairline bg-secondary/50 px-5 py-2.5 font-sans text-sm font-medium text-muted-foreground"
        >
          Verification coming soon
        </button>
      </div>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    ["Can I pay for Pro today?", "No. Billing is not connected in this local preview."],
    ["Is there a student discount?", "Student pricing has not been approved or integrated yet."],
    [
      "Can I cancel or request a refund?",
      "Cancellation and refund terms will be published with the real checkout flow.",
    ],
    [
      "How does campus billing work?",
      "Campus pricing, seats, SSO, and billing remain planned capabilities.",
    ],
    [
      "What can I use now?",
      "You can explore the current local learning catalog and runnable visualizers.",
    ],
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-8">
      <h2 className="text-center font-sans text-[32px] tracking-[-0.02em] text-foreground sm:text-[36px]">
        Frequently asked questions
      </h2>
      <div className="mx-auto mt-8 max-w-[900px] overflow-hidden rounded-2xl border border-hairline bg-card">
        {faqs.map(([question, answer], index) => (
          <details
            key={question}
            className={index < faqs.length - 1 ? "group border-b border-hairline" : "group"}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-sans text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-6">
              {question}
              <Plus className="size-5 shrink-0 text-primary transition-transform group-open:rotate-45" />
            </summary>
            <p className="px-5 pb-5 font-sans text-[14px] leading-relaxed text-muted-foreground sm:px-6">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <div className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-hairline bg-primary-tint/60 px-5 py-9 sm:px-10 lg:grid-cols-[auto_1fr_auto] lg:py-10">
        <div className="mx-auto hidden items-center gap-3 lg:flex">
          <div className="rounded-lg border border-hairline bg-card p-3">
            <div className="mb-2 flex gap-1">
              <span className="size-1.5 rounded-full bg-hairline" />
              <span className="size-1.5 rounded-full bg-hairline" />
              <span className="size-1.5 rounded-full bg-hairline" />
            </div>
            <Play className="size-6 text-primary" fill="currentColor" />
          </div>
          <AlgoraGlyph size={28} />
        </div>
        <div className="text-center">
          <div className="font-sans text-[24px] text-foreground">
            Explore the local learning preview
          </div>
          <Link
            to="/auth"
            className="mt-4 inline-flex rounded-xl bg-primary px-6 py-3 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Create local profile
          </Link>
          <div className="mt-3 font-mono text-[12px] text-muted-foreground">
            No account or subscription is created.
          </div>
        </div>
        <div className="relative mx-auto hidden size-24 place-items-center lg:grid">
          <span className="absolute inset-0 rounded-full border border-dashed border-primary/40" />
          <Flag className="size-7 text-primary" />
        </div>
      </div>
    </section>
  );
}
