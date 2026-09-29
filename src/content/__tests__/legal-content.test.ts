import { describe, expect, it } from "vitest";
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  LEGAL_DOCUMENTS,
  getLegalDocument,
  getLegalDocuments,
  fetchLegalDocument,
  fetchLegalDocuments,
} from "../legal";
import { LegalDocumentSchema } from "../schemas";
import { getFooterLinkTarget, FOOTER_ROUTE_MAP } from "../nav";

describe("Legal Content & Schema Validation (S10.7 & S6.7)", () => {
  it("validates Privacy Policy against LegalDocumentSchema", () => {
    const result = LegalDocumentSchema.safeParse(PRIVACY_POLICY);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error);
    }
  });

  it("validates Terms of Service against LegalDocumentSchema", () => {
    const result = LegalDocumentSchema.safeParse(TERMS_OF_SERVICE);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error);
    }
  });

  it("enforces zero-placeholder policy across all legal documents (S10.7)", () => {
    const placeholderRegex = /\b(lorem\s+ipsum|placeholder|\[insert\s+|\[company\s+|TODO|TBD)\b/i;

    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      expect(placeholderRegex.test(doc.summaryMarkdown)).toBe(false);
      expect(doc.summaryMarkdown.length).toBeGreaterThan(50);

      for (const section of doc.sections) {
        expect(placeholderRegex.test(section.title)).toBe(false);
        expect(placeholderRegex.test(section.contentMarkdown)).toBe(false);
        expect(section.contentMarkdown.length).toBeGreaterThan(20);

        if (section.subsections) {
          for (const sub of section.subsections) {
            expect(placeholderRegex.test(sub.title)).toBe(false);
            expect(placeholderRegex.test(sub.contentMarkdown)).toBe(false);
            expect(sub.contentMarkdown.length).toBeGreaterThan(20);
          }
        }
      }
    }
  });

  it("describes only the current local-preview privacy behavior", () => {
    const doc = PRIVACY_POLICY;
    const allMarkdown = [
      doc.summaryMarkdown,
      ...doc.sections.map((s) => s.contentMarkdown),
      ...doc.sections.flatMap((s) => s.subsections?.map((sub) => sub.contentMarkdown) ?? []),
    ].join(" ");

    expect(allMarkdown).toContain("algora-progress");
    expect(allMarkdown).toContain("algora-prefs");
    expect(allMarkdown).toContain("localStorage");
    expect(allMarkdown).toContain("Web Worker");
    expect(allMarkdown).toContain("GDPR");
    expect(allMarkdown).toContain("CCPA");
    expect(allMarkdown).toContain("not connected");
    expect(allMarkdown).not.toContain("Stripe");
    expect(allMarkdown).not.toContain("privacy@algora.io");
    expect(allMarkdown).not.toContain("within 24 hours");
  });

  it("keeps unavailable commercial and legal terms explicit", () => {
    const doc = TERMS_OF_SERVICE;
    const allMarkdown = [
      doc.summaryMarkdown,
      ...doc.sections.map((s) => s.contentMarkdown),
      ...doc.sections.flatMap((s) => s.subsections?.map((sub) => sub.contentMarkdown) ?? []),
    ].join(" ");

    expect(allMarkdown).toContain("No checkout");
    expect(allMarkdown).toContain("refund");
    expect(allMarkdown).toContain("not connected");
    expect(allMarkdown).not.toContain("14-day");
    expect(allMarkdown).not.toContain("99.9%");
    expect(allMarkdown).not.toContain("legal@algora.io");
    expect(allMarkdown).not.toContain("binding individual arbitration");
  });

  it("provides synchronous and asynchronous legal accessors (S10.2)", async () => {
    expect(getLegalDocument("privacy").id).toBe("privacy");
    expect(getLegalDocument("terms").id).toBe("terms");
    expect(getLegalDocuments()).toHaveLength(2);

    const asyncPrivacy = await fetchLegalDocument("privacy");
    expect(asyncPrivacy?.id).toBe("privacy");

    const asyncTerms = await fetchLegalDocument("terms");
    expect(asyncTerms?.id).toBe("terms");

    const asyncDocs = await fetchLegalDocuments();
    expect(asyncDocs).toHaveLength(2);
  });

  it("maps footer link labels to valid application routes", () => {
    expect(getFooterLinkTarget("Terms")).toBe("/terms");
    expect(getFooterLinkTarget("Privacy")).toBe("/privacy");
    expect(getFooterLinkTarget("Contact")).toBe("/contact");
    expect(getFooterLinkTarget("Pricing")).toBe("/pricing");
    expect(getFooterLinkTarget("Visualizer")).toBe("/visualizer");
    expect(getFooterLinkTarget("Paths")).toBe("/paths");
    expect(getFooterLinkTarget("NonExistent")).toBe("/");
  });
});
