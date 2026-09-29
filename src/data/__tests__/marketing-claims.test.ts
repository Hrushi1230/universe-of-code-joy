import { describe, expect, it } from "vitest";
import {
  MARKETING_CLAIMS,
  getAllMarketingClaims,
  getUnverifiedMarketingClaims,
  getSubstantiatedMarketingClaims,
  isClaimsRegistryAudited,
  getClaimsAuditLog,
  getMarketingClaim,
  heroProofStats,
  authHeroStats,
  campusHeroStats,
  campusOutcomesStats,
  campusTestimonialClaim,
  campusCohortDemoClaim,
  blogNewsletterClaim,
  pricingCatalogClaim,
  universitySocialProofClaim,
} from "@/data/marketing-claims";
import type { MetricMarketingClaim } from "@/data/marketing-claims";

describe("marketing claims registry & audit (S10.3 / S10.4 — G10 Content Integrity)", () => {
  it("substantiates 100% of marketing claims with empirical evidence and zero unverified claims", () => {
    const allClaims = getAllMarketingClaims();
    expect(allClaims.length).toBeGreaterThanOrEqual(12);

    for (const claim of allClaims) {
      expect(claim.status).toBe("SUBSTANTIATED");
      expect(claim.id).toBeTruthy();
      expect(claim.flagReason.trim().length).toBeGreaterThan(15);
      expect(claim.targetResolution.trim().length).toBeGreaterThan(15);
      expect(claim.evidence.trim().length).toBeGreaterThan(15);
      expect(claim.substantiationMethod.trim().length).toBeGreaterThan(10);
      expect(claim.reviewedBy.trim().length).toBeGreaterThan(3);
      expect(claim.reviewedAt.trim().length).toBeGreaterThan(5);
      expect(claim.surfaces.length).toBeGreaterThanOrEqual(1);

      // Verify each surface begins with a root '/'
      for (const surface of claim.surfaces) {
        expect(surface.startsWith("/")).toBe(true);
      }
    }
  });

  it("returns 0 unverified claims through getUnverifiedMarketingClaims()", () => {
    const unverified = getUnverifiedMarketingClaims();
    expect(unverified).toEqual([]);
    expect(unverified.length).toBe(0);
  });

  it("returns all substantiated claims through getSubstantiatedMarketingClaims()", () => {
    const substantiated = getSubstantiatedMarketingClaims();
    const all = getAllMarketingClaims();
    expect(substantiated.length).toBe(all.length);
  });

  it("confirms complete formal audit sign-off via isClaimsRegistryAudited() and getClaimsAuditLog()", () => {
    expect(isClaimsRegistryAudited()).toBe(true);

    const auditLog = getClaimsAuditLog();
    expect(auditLog.reviewedBy).toBe("Repository evidence audit");
    expect(auditLog.criterion).toContain("S10.4");
    expect(auditLog.unverifiedCount).toBe(0);
    expect(auditLog.substantiatedCount).toBe(auditLog.totalClaimsCount);

    // The log is itself a public claim about the registry, so tie it to the
    // registry rather than to a floor. A new claim that leaves the counts
    // behind is exactly the drift this file exists to prevent.
    const all = getAllMarketingClaims();
    expect(auditLog.totalClaimsCount).toBe(all.length);
    expect(auditLog.substantiatedCount).toBe(
      all.filter((c) => c.status === "SUBSTANTIATED").length,
    );
    expect(auditLog.unverifiedCount).toBe(all.filter((c) => c.status === "UNVERIFIED").length);
  });

  it("retrieves individual substantiated claims by ID or throws on missing ID", () => {
    const claim = getMarketingClaim<MetricMarketingClaim>("hero-learners");
    expect(claim.id).toBe("hero-learners");
    expect(claim.value).toBe("Local");
    expect(claim.label).toBe("browser runner");
    expect(claim.rawText).toBe("In-browser runner");
    expect(claim.status).toBe("SUBSTANTIATED");
    expect(claim.evidence).toContain("Pure client-side Web Worker runner architecture");

    expect(() => getMarketingClaim("non-existent-claim")).toThrow(
      'Marketing claim with id "non-existent-claim" not found in registry.',
    );
  });

  it("exports properly structured substantiated grouped constants for page consumption", () => {
    expect(heroProofStats.map((s) => s.rawText)).toEqual([
      "In-browser runner",
      "56 practice questions",
      "0.5–2× playback",
    ]);
    expect(authHeroStats.map((s) => s.value)).toEqual(["Local", "56", "0.5–2×"]);

    expect(campusHeroStats.map((s) => s.rawText)).toEqual([
      "Core DSA topic coverage",
      "Sample cohort preview",
    ]);

    expect(campusOutcomesStats.map((s) => ({ v: s.value, c: s.label }))).toEqual([
      { v: "3-way", c: "synchronized code, canvas & explanation" },
      { v: "Local", c: "Web Worker runner" },
      { v: "Browser", c: "no native install" },
    ]);

    expect(campusTestimonialClaim.author).toBe("Algora learning principle");
    expect(campusTestimonialClaim.role).toBe("Product specification");
    expect(campusTestimonialClaim.initials).toBe("LP");
    expect(campusTestimonialClaim.status).toBe("SUBSTANTIATED");

    expect(campusCohortDemoClaim.courseCode).toBe("CS 2110");
    expect(campusCohortDemoClaim.term).toBe("Sample Dashboard");
    expect(campusCohortDemoClaim.roster.length).toBe(5);

    expect(blogNewsletterClaim.rawText).toBe("Newsletter sign-up is coming soon.");
    expect(pricingCatalogClaim.rawText).toBe("34 runnable visualizer modules");
    expect(universitySocialProofClaim.label).toBe("Built around core algorithm foundations");
    expect(universitySocialProofClaim.institutions.length).toBe(5);
  });
});
