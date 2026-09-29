import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  HardDrive,
  Cookie,
  Cpu,
  FileDown,
  Trash2,
  GraduationCap,
  Scale,
  Lock,
  Mail,
  Search,
  Link as LinkIcon,
  Check,
  Printer,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { PRIVACY_POLICY } from "@/content/legal";
import type { LegalSection, LegalSubSection } from "@/content/types";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Algora" },
      {
        name: "description",
        content:
          "Read what the current local Algora browser preview stores and which services are not connected.",
      },
      { property: "og:title", content: "Privacy Policy — Algora" },
      {
        property: "og:description",
        content: "Repository-accurate privacy information for the current local Algora preview.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

const SECTION_ICONS: Record<string, typeof ShieldCheck> = {
  philosophy: ShieldCheck,
  "local-storage": HardDrive,
  "zero-tracking": Cookie,
  "code-execution": Cpu,
  "account-cloud-data": Lock,
  "data-portability": FileDown,
  "right-to-erasure": Trash2,
  "educational-compliance": GraduationCap,
  "rights-matrix": Scale,
  "security-practices": Lock,
  "contact-dpo": Mail,
};

function PrivacyPage() {
  const doc = PRIVACY_POLICY;
  const [activeSection, setActiveSection] = useState<string>(doc.sections[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);

  // Set up intersection observer for sticky TOC
  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0.1,
    });

    for (const section of doc.sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [doc.sections]);

  // Copy anchor link
  const handleCopyLink = (sectionId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    navigator.clipboard.writeText(url);
    setCopiedSectionId(sectionId);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return doc.sections;
    const q = searchQuery.toLowerCase();
    return doc.sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.contentMarkdown.toLowerCase().includes(q) ||
        sec.summary?.toLowerCase().includes(q) ||
        sec.subsections?.some(
          (sub) =>
            sub.title.toLowerCase().includes(q) || sub.contentMarkdown.toLowerCase().includes(q),
        ),
    );
  }, [doc.sections, searchQuery]);

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <SiteNav />

      <main id="main-content" className="mx-auto max-w-[1280px] px-6 lg:px-8 pt-12 pb-24">
        {/* Breadcrumb & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
          <div className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
            <span>LEGAL</span>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">PRIVACY POLICY</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-1.5 font-sans text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <Printer className="size-3.5" />
              Print Policy
            </button>
            <span className="rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] font-medium text-primary">
              v{doc.version}
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="mt-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 font-mono text-[11px] tracking-wider text-primary">
            <ShieldCheck className="size-3.5" /> LOCAL PREVIEW PRIVACY
          </div>
          <h1 className="mt-4 font-sans text-[44px] sm:text-[52px] leading-[1.1] tracking-[-0.02em] text-foreground font-semibold">
            {doc.title}
          </h1>
          <p className="mt-4 font-sans text-[17px] leading-[1.6] text-muted-foreground">
            {doc.subtitle}
          </p>

          <div className="mt-5 max-w-[720px]">
            <DemoNotice>
              This is repository-accurate preview information, not final launch legal advice or a
              compliance certification.
            </DemoNotice>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 font-mono text-[12px] text-muted-foreground">
            <div>
              Effective Date:{" "}
              <span className="text-foreground font-medium">{doc.effectiveDate}</span>
            </div>
            <div>•</div>
            <div>
              Last Updated: <span className="text-foreground font-medium">{doc.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Key Guarantees Callout Card */}
        <div className="mt-8 rounded-2xl border border-hairline bg-card p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-wider text-primary font-semibold">
            <Sparkles className="size-4" /> CORE ARCHITECTURAL COMMITMENTS
          </div>
          <p className="mt-3 font-sans text-[15px] leading-[1.65] text-foreground/90">
            {doc.summaryMarkdown.replace(/\*\*/g, "")}
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-hairline/80 bg-paper p-4">
              <div className="font-mono text-[11px] text-primary font-semibold">LOCAL-FIRST</div>
              <div className="mt-1 font-sans text-[13px] text-muted-foreground">
                Progress and preferences use browser localStorage.
              </div>
            </div>
            <div className="rounded-xl border border-hairline/80 bg-paper p-4">
              <div className="font-mono text-[11px] text-primary font-semibold">
                ZERO AD TRACKING
              </div>
              <div className="mt-1 font-sans text-[13px] text-muted-foreground">
                No analytics or advertising provider is configured in this build.
              </div>
            </div>
            <div className="rounded-xl border border-hairline/80 bg-paper p-4">
              <div className="font-mono text-[11px] text-primary font-semibold">
                LOCAL INSPECTION
              </div>
              <div className="mt-1 font-sans text-[13px] text-muted-foreground">
                Browser developer tools can inspect the two current records.
              </div>
            </div>
            <div className="rounded-xl border border-hairline/80 bg-paper p-4">
              <div className="font-mono text-[11px] text-primary font-semibold">LOCAL REMOVAL</div>
              <div className="mt-1 font-sans text-[13px] text-muted-foreground">
                Clearing site storage removes local preview data; no cloud record exists.
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout: Sticky Sidebar + Reading Column */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Table of Contents */}
          <aside className="sticky top-24 hidden lg:block rounded-2xl border border-hairline bg-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <span className="font-mono text-[11px] tracking-wider text-primary font-semibold">
                TABLE OF CONTENTS
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {doc.sections.length} Sections
              </span>
            </div>

            {/* Quick Filter */}
            <div className="relative mt-4 mb-4">
              <input
                type="text"
                placeholder="Filter clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-paper px-3 py-1.5 pl-8 font-sans text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            </div>

            <nav
              aria-label="Table of contents"
              className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-1 pr-1"
            >
              {filteredSections.map((section) => {
                const Icon = SECTION_ICONS[section.id] ?? ShieldCheck;
                const isActive = activeSection === section.id;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left font-sans text-[13px] leading-snug transition-colors ${
                      isActive
                        ? "bg-primary-tint font-medium text-primary"
                        : "text-muted-foreground hover:bg-paper hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 size-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`}
                    />
                    <span className="line-clamp-2">{section.title}</span>
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Main Legal Sections Body */}
          <article className="min-w-0 space-y-12">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-hairline bg-card p-8 text-center">
                <Search className="mx-auto size-8 text-muted-foreground/60" />
                <h3 className="mt-3 font-sans text-[16px] font-medium text-foreground">
                  No matching clauses found
                </h3>
                <p className="mt-1 font-sans text-[13px] text-muted-foreground">
                  Try searching for terms like "local storage", "cookies", "export", or "GDPR".
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 font-sans text-[13px] text-primary-foreground"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <SectionBlock
                  key={sec.id}
                  section={sec}
                  isCopied={copiedSectionId === sec.id}
                  onCopyLink={() => handleCopyLink(sec.id)}
                />
              ))
            )}
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionBlock({
  section,
  isCopied,
  onCopyLink,
}: {
  section: LegalSection;
  isCopied: boolean;
  onCopyLink: () => void;
}) {
  const Icon = SECTION_ICONS[section.id] ?? ShieldCheck;

  return (
    <section
      id={section.id}
      className="scroll-mt-24 rounded-2xl border border-hairline bg-card p-6 sm:p-8 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-tint text-primary">
            <Icon className="size-5" />
          </span>
          <h2 className="font-sans text-[22px] sm:text-[24px] font-semibold text-foreground tracking-[-0.01em]">
            {section.title}
          </h2>
        </div>

        <button
          onClick={onCopyLink}
          title="Copy section link"
          className="inline-flex items-center gap-1 rounded-md border border-hairline/80 bg-paper px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="size-3 text-primary" />
              <span className="text-primary font-medium">Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="size-3" />
              <span>Link</span>
            </>
          )}
        </button>
      </div>

      {section.summary && (
        <div className="mt-4 rounded-xl bg-primary-tint/40 border border-primary/20 px-4 py-3 font-sans text-[13px] leading-relaxed text-foreground/80 font-medium">
          💡 <strong>Key Takeaway:</strong> {section.summary}
        </div>
      )}

      {/* Content Markdown rendering */}
      <div className="mt-5 space-y-4 font-sans text-[15px] leading-[1.7] text-foreground/85">
        <RenderMarkdown content={section.contentMarkdown} />
      </div>

      {/* Subsections if present */}
      {section.subsections && section.subsections.length > 0 && (
        <div className="mt-6 space-y-4 pt-4 border-t border-hairline/60">
          {section.subsections.map((sub: LegalSubSection) => (
            <div
              key={sub.id}
              id={sub.id}
              className="rounded-xl border border-hairline/70 bg-paper p-5"
            >
              <h3 className="font-sans text-[16px] font-semibold text-foreground">{sub.title}</h3>
              <div className="mt-2 space-y-3 font-sans text-[14px] leading-[1.65] text-muted-foreground">
                <RenderMarkdown content={sub.contentMarkdown} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Lightweight structured Markdown renderer for legal formatting:
 * Handles bullet points, bolding, code tokens, tables, and external links.
 */
function RenderMarkdown({ content }: { content: string }) {
  // Check if content contains a Markdown table
  if (content.includes("|") && content.includes("\n|")) {
    const lines = content.split("\n");
    const tableLines = lines.filter((l) => l.trim().startsWith("|"));
    const textBefore = lines.slice(0, lines.indexOf(tableLines[0])).join("\n").trim();

    return (
      <div className="space-y-4">
        {textBefore && <p>{textBefore}</p>}
        <div className="overflow-x-auto rounded-xl border border-hairline bg-card">
          <table className="w-full text-left font-sans text-[13px]">
            <thead className="border-b border-hairline bg-paper font-mono text-[11px] text-primary">
              <tr>
                {tableLines[0]
                  .split("|")
                  .filter(Boolean)
                  .map((h, idx) => (
                    <th key={idx} className="px-4 py-3 font-semibold">
                      {h.trim()}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {tableLines.slice(2).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-paper/50 transition-colors">
                  {row
                    .split("|")
                    .filter(Boolean)
                    .map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-foreground/90">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: parseInlineMarkdown(cell.trim()),
                          }}
                        />
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const paragraphs = content.split("\n\n");

  return (
    <>
      {paragraphs.map((para, idx) => {
        // Bullet list
        if (para.startsWith("- ") || para.startsWith("• ") || para.startsWith("1. ")) {
          const items = para.split("\n");
          return (
            <ul key={idx} className="space-y-2 list-disc pl-5">
              {items.map((it, iIdx) => {
                const cleanItem = it.replace(/^[-•\d.]+\s+/, "");
                return (
                  <li
                    key={iIdx}
                    dangerouslySetInnerHTML={{
                      __html: parseInlineMarkdown(cleanItem),
                    }}
                  />
                );
              })}
            </ul>
          );
        }

        return (
          <p
            key={idx}
            dangerouslySetInnerHTML={{
              __html: parseInlineMarkdown(para),
            }}
          />
        );
      })}
    </>
  );
}

function parseInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-paper px-1.5 py-0.5 font-mono text-[12px] text-primary border border-hairline">$1</code>',
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline underline-offset-2 hover:text-accent-strong transition-colors">$1</a>',
    );
}
