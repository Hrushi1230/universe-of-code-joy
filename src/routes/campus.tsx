import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { UniversityStrip } from "@/components/university-lockups";
import { DemoNotice } from "@/components/demo-notice";
import {
  campusHeroStats,
  campusCohortDemoClaim,
  campusOutcomesStats,
  campusTestimonialClaim,
} from "@/content/marketing-claims";

export const Route = createFileRoute("/campus")({
  head: () => ({
    meta: [
      { title: "Algora for Campus — Visual Algorithm Learning for CS Departments" },
      {
        name: "description",
        content:
          "Preview how Algora's synchronized visualizer and guided paths could support a CS department, bootcamp, or student club.",
      },
      { property: "og:title", content: "Algora for Campus — Built for CS Departments" },
      {
        property: "og:description",
        content: `Preview planned cohort tools and current browser learning. ${campusHeroStats[0].rawText}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampusPage,
});

/* ------------------------------- primitives ------------------------------ */
function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3.5 py-1.5 font-mono text-[11px] tracking-[0.14em] text-primary">
      <span className="text-[9px]">◆</span>
      {children}
    </span>
  );
}

function Check({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className="shrink-0 text-primary"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path
        d="M6 10.3 L8.7 13 L14 7.6"
        fill="none"
        stroke="var(--card)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <line x1="2" y1="8" x2="13" y2="8" />
      <path d="M9 4 L13 8 L9 12" />
    </svg>
  );
}

/* ---------------------------------- hero --------------------------------- */
function Hero() {
  return (
    <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-start gap-10 px-4 pb-10 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
      <div className="pt-4">
        <Badge>ALGORA FOR CAMPUS</Badge>
        <h1 className="mt-7 font-display text-[42px] font-semibold leading-[1.06] tracking-[-0.025em] text-foreground sm:text-[56px]">
          Bring the visualizer to your whole department
          <span className="ml-0.5 inline-block h-3 w-3 bg-primary align-baseline" />
        </h1>
        <p className="mt-6 max-w-[440px] font-sans text-[16px] leading-[1.7] text-muted-foreground">
          Give every CS student synchronized visualization, guided paths, and progress you can
          actually see.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link
            to="/contact"
            hash="contact-form"
            className="rounded-lg bg-primary px-6 py-3.5 text-center text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Request campus access
          </Link>
          <Link
            to="/contact"
            hash="contact-form"
            className="rounded-lg border border-hairline bg-card px-6 py-3.5 text-center text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Ask about a walkthrough
          </Link>
        </div>
        <div className="mt-6">
          <DemoNotice>
            Campus accounts, rosters, analytics, SSO, pricing, and walkthrough booking are planned,
            not connected services.
          </DemoNotice>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[12px] text-muted-foreground">
          <span>{campusHeroStats[0].rawText}</span>
          <span className="size-1 rounded-full bg-primary" />
          <span>{campusHeroStats[1].rawText}</span>
        </div>
      </div>
      <CohortCard />
    </section>
  );
}

function CohortCard() {
  return (
    <div className="rounded-2xl border border-hairline bg-card shadow-[0_1px_2px_rgba(14,21,19,0.04),0_12px_32px_-16px_rgba(14,21,19,0.10)]">
      <div className="flex items-center justify-between px-7 pt-6">
        <div className="flex items-center gap-2 font-mono text-[13px] text-foreground">
          {campusCohortDemoClaim.courseCode} <span className="text-primary">·</span>{" "}
          {campusCohortDemoClaim.term}
        </div>
        <div className="font-mono text-[12px] text-muted-foreground">Class dashboard</div>
      </div>

      <div className="px-7 pt-6">
        <div className="mb-2 font-mono text-[12px] text-muted-foreground">
          {campusCohortDemoClaim.avgMastery}% avg mastery
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${campusCohortDemoClaim.avgMastery}%` }}
            />
          </div>
          <span className="font-mono text-[12px] text-foreground">
            {campusCohortDemoClaim.avgMastery}%
          </span>
        </div>
      </div>

      <div className="mt-6 hidden grid-cols-[1fr_auto_120px] items-center gap-4 border-b border-hairline px-7 pb-3 font-sans text-[13px] text-muted-foreground sm:grid">
        <span>Student</span>
        <span>XP</span>
        <span className="text-right">Mastery</span>
      </div>

      <div className="px-7">
        {campusCohortDemoClaim.roster.map((s) => (
          <div
            key={s.initials}
            className="grid grid-cols-1 gap-2 border-b border-hairline py-3.5 last:border-b-0 sm:grid-cols-[1fr_auto_120px] sm:items-center sm:gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-tint font-mono text-[11px] text-primary">
                {s.initials}
              </span>
              <span className="font-sans text-[14px] text-foreground">{s.name}</span>
            </div>
            <span className="font-mono text-[12px] text-muted-foreground">{s.xp}</span>
            <div className="flex items-center gap-2.5 sm:justify-end">
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${s.mastery}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[11px] text-muted-foreground">
                {s.mastery}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-hairline px-7 py-4 font-mono text-[12px] text-muted-foreground">
        Illustrative fixture · {campusCohortDemoClaim.studentCount} sample learners
      </div>
    </div>
  );
}

/* ------------------------------- value cards ----------------------------- */
function ChartIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="4.5" y="13" width="3.5" height="5.5" />
      <rect x="10.2" y="9" width="3.5" height="9.5" />
      <rect x="15.9" y="5" width="3.5" height="13.5" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M3 6.5 L9.5 4 L14.5 6.5 L21 4 V17.5 L14.5 20 L9.5 17.5 L3 20 Z" />
      <line x1="9.5" y1="4" x2="9.5" y2="17.5" />
      <line x1="14.5" y1="6.5" x2="14.5" y2="20" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="16.8" cy="8.6" r="2.6" />
      <path d="M3.5 18.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 13.8c2.4.2 4.3 2.1 4.3 4.7" />
    </svg>
  );
}

function ValueCards() {
  const cards = [
    {
      icon: <ChartIcon />,
      title: "Cohort dashboards",
      body: "A planned view for class-wide mastery and learners who may need help.",
    },
    {
      icon: <MapIcon />,
      title: "Curriculum-aligned paths",
      body: "A planned way to map current lessons to a course or cohort sequence.",
    },
    {
      icon: <PeopleIcon />,
      title: "Zero setup for students",
      body: "Current lessons work in the browser; roster links and SSO are not connected.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 sm:py-16">
      <h2 className="mb-12 text-center font-display text-[38px] font-semibold tracking-[-0.02em] text-foreground">
        Why departments choose Algora
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-hairline bg-card p-7">
            <div className="text-primary">{c.icon}</div>
            <h3 className="mt-6 font-display text-[19px] font-semibold text-foreground">
              {c.title}
            </h3>
            <p className="mt-3 max-w-[260px] font-sans text-[14.5px] leading-[1.65] text-muted-foreground">
              {c.body}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 font-mono text-[12px] text-primary">
              Planned capability <Arrow />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ how it works ----------------------------- */
function HowItWorks() {
  const steps = [
    {
      n: 1,
      label: "Invite your cohort",
      body: "Plan the cohort and invite model; roster links and SSO require integration.",
    },
    {
      n: 2,
      label: "Assign paths & lessons",
      body: "Review existing learning paths and define the course sequence.",
    },
    {
      n: 3,
      label: "Track mastery live",
      body: "Durable progress reporting requires the later backend integration phase.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 sm:py-16">
      <h2 className="mb-14 text-center font-display text-[34px] font-semibold tracking-[-0.02em] text-foreground">
        How it works
      </h2>
      <div className="relative mx-auto max-w-[980px]">
        <div className="absolute inset-x-[16%] top-5 hidden h-px bg-primary/45 md:block" />
        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col items-center px-8 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary font-mono text-[14px] text-primary-foreground">
                {s.n}
              </span>
              <div className="mt-6 font-mono text-[13px] text-foreground">
                {s.n} <span className="text-primary">·</span> {s.label}
              </div>
              <p className="mt-3 max-w-[220px] font-sans text-[14px] leading-[1.6] text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- outcomes -------------------------------- */
function Outcomes() {
  const stats = campusOutcomesStats.map((s) => ({ v: s.value, c: s.label }));
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8">
      <div className="grid grid-cols-1 rounded-2xl border border-primary-tint-strong bg-primary-tint py-4 sm:grid-cols-3 sm:py-10">
        {stats.map((s, i) => (
          <div
            key={s.v}
            className={`flex flex-col items-center py-6 sm:py-0 ${i > 0 ? "border-t border-primary-tint-strong sm:border-l sm:border-t-0" : ""}`}
          >
            <div className="font-mono text-[38px] leading-none text-primary">{s.v}</div>
            <div className="mt-4 font-sans text-[14px] text-muted-foreground">{s.c}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ testimonial ------------------------------ */
function Testimonial() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-8">
      <div className="mx-auto flex max-w-[1000px] gap-4 rounded-2xl border border-hairline bg-card px-6 py-8 sm:gap-8 sm:px-12 sm:py-12">
        <span className="-mt-2 font-display text-[64px] leading-none text-primary/70">“</span>
        <div>
          <blockquote className="font-display text-[22px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground sm:text-[26px]">
            “{campusTestimonialClaim.quote}”
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-tint font-mono text-[13px] text-primary">
              {campusTestimonialClaim.initials}
            </span>
            <div className="font-mono text-[13px] text-muted-foreground">
              {campusTestimonialClaim.author} <span className="text-primary">·</span>{" "}
              {campusTestimonialClaim.role}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- plans --------------------------------- */
function Plans() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 sm:py-16">
      <h2 className="mb-12 text-center font-display text-[34px] font-semibold tracking-[-0.02em] text-foreground">
        Plans for campus
      </h2>
      <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-hairline bg-card p-8">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[22px] font-semibold text-foreground">
              Student clubs
            </h3>
            <span className="rounded-md bg-primary-tint px-2 py-1 font-mono text-[11px] tracking-wider text-primary">
              FREE
            </span>
          </div>
          <p className="mt-3 font-sans text-[14.5px] leading-[1.65] text-muted-foreground">
            Perfect for clubs, study groups, and hackathon teams.
          </p>
          <ul className="mt-6 space-y-3 border-t border-hairline pt-6">
            {[
              "Planned club profiles",
              "Planned invitation links",
              "Planned group leaderboard",
              "Current public learning catalog",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 font-mono text-[12.5px] text-foreground"
              >
                <Check /> {f}
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            hash="contact-form"
            className="mt-8 w-full rounded-lg border border-hairline bg-card py-3 text-center text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Ask about clubs
          </Link>
        </div>

        <div className="flex flex-col rounded-2xl border border-hairline bg-card p-8">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[22px] font-semibold text-foreground">Departments</h3>
            <span className="rounded-md bg-primary-tint px-2 py-1 font-mono text-[11px] tracking-wider text-primary">
              CUSTOM
            </span>
          </div>
          <p className="mt-3 font-sans text-[14.5px] leading-[1.65] text-muted-foreground">
            Built for courses and programs that need insights and support.
          </p>
          <ul className="mt-6 space-y-3 border-t border-hairline pt-6">
            {[
              "Planned cohort dashboards",
              "Planned SSO and roster sync",
              "Planned support model",
              "Planned onboarding",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 font-mono text-[12.5px] text-foreground"
              >
                <Check /> {f}
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            hash="contact-form"
            className="mt-8 w-full rounded-lg bg-primary py-3 text-center text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Talk to our team
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- CTA band ------------------------------- */
function CtaBand() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-8 rounded-2xl border border-primary-tint-strong bg-primary-tint px-6 py-10 sm:px-14 sm:py-12">
        <svg
          width="90"
          height="90"
          viewBox="0 0 90 90"
          className="hidden shrink-0 text-primary lg:block"
          aria-hidden="true"
        >
          <circle cx="45" cy="45" r="34" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M27 40 L45 30 L63 40 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <line x1="27" y1="58" x2="63" y2="58" stroke="currentColor" strokeWidth="1.4" />
          <line x1="33" y1="43" x2="33" y2="58" stroke="currentColor" strokeWidth="1.4" />
          <line x1="41" y1="43" x2="41" y2="58" stroke="currentColor" strokeWidth="1.4" />
          <line x1="49" y1="43" x2="49" y2="58" stroke="currentColor" strokeWidth="1.4" />
          <line x1="57" y1="43" x2="57" y2="58" stroke="currentColor" strokeWidth="1.4" />
        </svg>

        <div className="flex flex-1 flex-col items-center">
          <h3 className="text-center font-display text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            Equip your students to see the algorithm think
            <span className="ml-0.5 inline-block h-2 w-2 bg-primary align-baseline" />
          </h3>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              to="/contact"
              hash="contact-form"
              className="rounded-lg bg-primary px-6 py-3 text-center text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
            >
              Request campus access
            </Link>
            <Link
              to="/contact"
              hash="contact-form"
              className="rounded-lg border border-primary-tint-strong bg-card px-6 py-3 text-center text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Ask for the one-pager
            </Link>
          </div>
          <p className="mt-4 font-mono text-[12px] text-muted-foreground">
            Educator pricing is not published yet. Reduced-motion friendly.
          </p>
        </div>

        <svg
          width="72"
          height="90"
          viewBox="0 0 72 90"
          className="hidden shrink-0 text-primary lg:block"
          aria-hidden="true"
        >
          <rect
            x="8"
            y="8"
            width="56"
            height="74"
            rx="4"
            fill="var(--card)"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <line x1="20" y1="24" x2="52" y2="24" stroke="currentColor" strokeWidth="1.4" />
          <line x1="20" y1="34" x2="52" y2="34" stroke="currentColor" strokeWidth="1.4" />
          <line x1="20" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="1.4" />
          <line x1="20" y1="54" x2="52" y2="54" stroke="currentColor" strokeWidth="1.4" />
          <line x1="20" y1="64" x2="38" y2="64" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    </section>
  );
}

/* --------------------------------- page ---------------------------------- */
function CampusPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteNav active="For educators" />
      <main id="main-content">
        <Hero />
        <UniversityStrip label="Built around core algorithm foundations" />
        <ValueCards />
        <HowItWorks />
        <Outcomes />
        <Testimonial />
        <Plans />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
