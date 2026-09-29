import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ArrowRight,
  Shield,
  Headphones,
  Building2,
  Share2,
  BookOpen,
  FileText,
  Plus,
  ChevronDown,
  Play,
  Flag,
} from "lucide-react";
import { SiteNav, SiteFooter, AlgoraGlyph } from "@/components/site-chrome";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Algora" },
      {
        name: "description",
        content:
          "Preview the Algora inquiry form for learning, campus plans and partnerships. Message delivery is coming soon.",
      },
      { property: "og:title", content: "Contact — Algora" },
      {
        property: "og:description",
        content: "Preview Algora's inquiry form. Message delivery is coming soon.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <SiteNav />
      <main id="main-content">
        <Hero />
        <PrimaryArea />
        <SelfServe />
        <FaqSection />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const trust = ["Product questions", "Campus inquiries", "Partnerships"];
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-10 pt-12 text-center sm:px-8 sm:pt-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
        <span className="text-[10px]">◆</span> CONTACT
      </div>
      <h1 className="mt-6 font-sans text-[42px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]">
        Let's solve it together
        <span className="inline-block ml-1 h-3 w-3 translate-y-[-2px] bg-primary" />
      </h1>
      <p className="mx-auto mt-5 max-w-[640px] font-sans text-[16px] leading-[1.6] text-muted-foreground">
        Questions about learning, campus plans, partnerships, or your account? Reach the right team
        and expect a thoughtful response.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-sans text-[14px] text-foreground/80">
        {trust.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-full bg-primary/10">
              <Check className="size-3 text-primary" strokeWidth={3} />
            </span>
            {t}
          </div>
        ))}
      </div>
    </section>
  );
}

function Label({
  children,
  htmlFor,
  required,
}: {
  children: React.ReactNode;
  htmlFor: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-mono text-[11px] tracking-wider text-muted-foreground"
    >
      {children}
      {required && <span className="text-primary ml-1">*</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-hairline bg-card px-3.5 py-3 font-sans text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition";

function PrimaryArea() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(
      "Your message is ready, but delivery is not connected yet. Nothing was sent or stored.",
    );
  };

  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.9fr_1fr]">
        {/* Form */}
        <form
          id="contact-form"
          className="rounded-2xl border border-hairline bg-card p-5 sm:p-8"
          onSubmit={handleSubmit}
        >
          <h2 className="font-sans text-[28px] tracking-[-0.01em] text-foreground">
            Send us a message
          </h2>
          <p className="mt-2 font-sans text-[14px] text-muted-foreground">
            Prepare a question about learning, campus plans or partnerships.
          </p>

          <div className="mt-5">
            <DemoNotice>
              Message delivery is coming soon. This form currently validates only.
            </DemoNotice>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-first-name" required>
                FIRST NAME
              </Label>
              <input
                id="contact-first-name"
                name="firstName"
                required
                autoComplete="given-name"
                className={inputCls}
              />
            </div>
            <div>
              <Label htmlFor="contact-last-name" required>
                LAST NAME
              </Label>
              <input
                id="contact-last-name"
                name="lastName"
                required
                autoComplete="family-name"
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-5">
            <Label htmlFor="contact-email" required>
              EMAIL ADDRESS
            </Label>
            <input
              id="contact-email"
              className={`${inputCls} border-primary ring-2 ring-primary/25`}
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="mt-5">
            <Label htmlFor="contact-topic" required>
              WHAT CAN WE HELP WITH?
            </Label>
            <div className="relative">
              <select
                id="contact-topic"
                className={`${inputCls} appearance-none pr-10 text-muted-foreground`}
                defaultValue=""
                name="topic"
                required
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option>Product support</option>
                <option>Campus plans</option>
                <option>Partnerships</option>
                <option>Press</option>
                <option>Careers</option>
                <option>Something else</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="mt-5">
            <Label htmlFor="contact-message" required>
              MESSAGE
            </Label>
            <div className="relative">
              <textarea
                id="contact-message"
                rows={6}
                className={`${inputCls} resize-none`}
                placeholder="Tell us more about your question or request..."
                name="message"
                required
                maxLength={1000}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setResult(null);
                }}
              />
              <div className="absolute bottom-2 right-3 font-mono text-[11px] text-muted-foreground">
                {message.length} / 1000
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 font-sans text-[13px] text-muted-foreground">
            <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              Review how local preview data is handled. <br />
              See our{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-2">
                Privacy Policy
              </Link>{" "}
              for details.
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-primary py-3.5 font-sans text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Check message
          </button>
          {result && (
            <div role="status" className="mt-3 text-center font-mono text-[12px] text-primary">
              {result}
            </div>
          )}
        </form>

        {/* Route cards */}
        <div className="flex flex-col gap-5">
          <RouteCard
            Icon={Headphones}
            title="Product support"
            body="Get help with lessons, progress, billing, or your account."
            href="#contact-form"
          />
          <RouteCard
            Icon={Building2}
            title="Campus & teams"
            body="Bring visual algorithm learning to your university or cohort."
            href="#contact-form"
          />
          <RouteCard
            Icon={Share2}
            title="Partnerships"
            body="Collaborate on curriculum, communities, or student programs."
            href="#contact-form"
          />
        </div>
      </div>
    </section>
  );
}

function RouteCard({
  Icon,
  title,
  body,
  href,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-hairline bg-card p-6 transition-colors hover:border-primary/40"
    >
      <Icon className="size-7 text-primary" strokeWidth={1.75} />
      <div className="mt-4 font-sans text-[20px] tracking-[-0.01em] text-foreground">{title}</div>
      <p className="mt-2 font-sans text-[14px] leading-[1.55] text-muted-foreground">{body}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 font-sans text-[14px] text-primary">
        Use the contact form
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </a>
  );
}

function SelfServe() {
  const items = [
    {
      Icon: BookOpen,
      title: "Browse algorithms",
      body: "Explore available lessons and questions.",
      to: "/explore",
    },
    {
      Icon: FileText,
      title: "Billing FAQ",
      body: "Review the current pricing preview and common questions.",
      to: "/pricing",
    },
    {
      Icon: Building2,
      title: "Campus overview",
      body: "See the planned educator experience.",
      to: "/campus",
    },
    {
      Icon: Share2,
      title: "Learning paths",
      body: "Choose a structured route through the catalog.",
      to: "/paths",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 text-center sm:px-8">
      <h2 className="font-sans text-[36px] tracking-[-0.02em] text-foreground">
        Find an answer faster
      </h2>
      <p className="mx-auto mt-3 max-w-[560px] font-sans text-[15px] text-muted-foreground">
        Explore the most common questions before sending a message.
      </p>
      <div className="mt-9 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 xl:grid-cols-4">
        {items.map((it) => (
          <Link
            to={it.to}
            key={it.title}
            className="rounded-2xl border border-hairline bg-card p-6 transition-colors hover:border-primary/40"
          >
            <it.Icon className="size-6 text-primary" strokeWidth={1.75} />
            <div className="mt-4 font-sans text-[17px] tracking-[-0.01em] text-foreground">
              {it.title}
            </div>
            <p className="mt-2 font-sans text-[13px] leading-[1.55] text-muted-foreground">
              {it.body}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 font-sans text-[13px] text-primary">
              Explore <ArrowRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const rows = [
    {
      q: "Can I use the current Algora preview?",
      a: "Yes. The current experience runs locally in your browser. Account and payment services are not connected yet.",
    },
    {
      q: "Is the student discount available?",
      a: "Not yet. Pricing and student verification are product previews until billing is integrated.",
    },
    {
      q: "Can universities request a demo?",
      a: "The campus page explains the planned experience. Contact delivery must be connected before this form can send a request.",
    },
    {
      q: "How quickly does support respond?",
      a: "A response-time commitment has not been established because the support channel is not connected yet.",
    },
    {
      q: "Where can I report a technical issue?",
      a: "Use the contact form to prepare the message. It will clearly say when delivery is available.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <div className="rounded-2xl border border-hairline bg-card p-5 sm:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.8fr] lg:gap-10">
          <div>
            <div className="font-mono text-[11px] tracking-wider text-primary">
              COMMON QUESTIONS
            </div>
            <h2 className="mt-3 font-sans text-[34px] leading-[1.1] tracking-[-0.02em] text-foreground">
              Before you hit send
              <span className="inline-block ml-1 h-2.5 w-2.5 translate-y-[-2px] bg-primary" />
            </h2>
            <p className="mt-4 font-sans text-[14px] leading-[1.6] text-muted-foreground">
              Quick answers to the most common questions from learners and teams.
            </p>
            <p className="mt-4 font-sans text-[14px] leading-[1.6] text-muted-foreground">
              If you still need help, we're here for you.
            </p>
          </div>
          <div>
            {rows.map((row, index) => (
              <details
                key={row.q}
                className={index === 0 ? "group" : "group border-t border-hairline"}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-sans text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                  {row.q}
                  <Plus className="size-4 shrink-0 text-primary transition-transform group-open:rotate-45" />
                </summary>
                <div className="mb-4 rounded-lg bg-primary-tint/50 px-4 py-3 font-sans text-[14px] leading-[1.6] text-muted-foreground">
                  {row.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <div className="rounded-2xl bg-primary-tint px-5 py-8 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
          {/* Browser icon */}
          <div className="mx-auto hidden w-[150px] rounded-lg border border-primary/30 bg-card p-3 lg:block">
            <div className="flex gap-1">
              <span className="size-1.5 rounded-full bg-primary/40" />
              <span className="size-1.5 rounded-full bg-primary/40" />
              <span className="size-1.5 rounded-full bg-primary/40" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-primary-tint">
                <Play className="size-4 text-primary" fill="currentColor" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-1.5 rounded-full bg-primary/25" />
                <div className="h-1.5 w-2/3 rounded-full bg-primary/15" />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <AlgoraGlyph size={16} />
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-sans text-[30px] tracking-[-0.02em] text-foreground">
              Ready to learn instead?
            </h3>
            <p className="mt-2 font-sans text-[14px] text-muted-foreground">
              Start visualizing your first algorithm in minutes.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                className="rounded-full bg-primary px-5 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                Start learning free
              </Link>
              <Link
                to="/visualizer"
                className="rounded-full border border-primary/40 bg-card px-5 py-2.5 font-sans text-sm font-medium text-primary transition-colors hover:bg-primary-tint"
              >
                Explore the visualizer
              </Link>
            </div>
            <div className="mt-3 font-mono text-[11px] text-muted-foreground">
              No credit card required.
            </div>
          </div>

          {/* Flag illustration */}
          <div className="relative mx-auto hidden size-[120px] lg:block">
            <svg
              viewBox="0 0 120 120"
              className="size-full text-primary"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 4"
                opacity="0.6"
              />
              <path
                d="M40 90 Q 30 60, 60 55 T 82 30"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 4"
                fill="none"
                opacity="0.7"
              />
            </svg>
            <Flag className="absolute right-6 top-6 size-8 text-primary" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </section>
  );
}
