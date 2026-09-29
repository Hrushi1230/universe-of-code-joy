import type { LegalDocument } from "./types";

/** Current repository behavior only; review again when real services and regions are chosen. */
export const PRIVACY_POLICY: LegalDocument = {
  id: "privacy",
  title: "Privacy Notice",
  subtitle: "What the current Algora browser preview stores, and what is not connected yet.",
  version: "0.1.0",
  effectiveDate: "2026-09-12",
  lastUpdated: "2026-09-12",
  summaryMarkdown:
    "The current Algora preview is **local-first**. Learning progress and preferences are stored in this browser. Account, cloud sync, email delivery, contact delivery, analytics, and payment services are not connected in this repository build.",
  sections: [
    {
      id: "philosophy",
      title: "1. Scope of this notice",
      summary:
        "This notice covers the current local frontend preview, not a future hosted service.",
      contentMarkdown:
        "This notice describes behavior verified in the current Algora repository build. It does not claim that a future deployment, account system, campus service, or payment integration has been selected or approved. This copy must be reviewed again when those decisions are made.",
    },
    {
      id: "local-storage",
      title: "2. Browser storage",
      summary: "Progress and preferences can remain in this browser between visits.",
      contentMarkdown:
        "Algora currently persists local learning state under `algora-progress` and local profile and interface preferences under `algora-prefs` in browser `localStorage`. This can include practice progress, XP-style preview state, display preferences, and the local profile values you enter. Do not enter sensitive personal information into this preview.",
    },
    {
      id: "zero-tracking",
      title: "3. Analytics and third parties",
      summary:
        "No third-party analytics or advertising integration is configured in this repository build.",
      contentMarkdown:
        "The current source does not configure an advertising tracker or analytics provider. That is a statement about this repository build, not a permanent promise about every future deployment. Any later analytics, hosting, authentication, email, or payment provider must be disclosed here before launch.",
    },
    {
      id: "code-execution",
      title: "4. Local code execution",
      summary: "Supported practice code runs in a browser Web Worker.",
      contentMarkdown:
        "Supported practice code is executed locally in a browser `Web Worker` with a frontend timeout. It is not a secure remote judge and should not be used for secrets or untrusted third-party code. Python shown in reader-only experiences is not a connected Python execution service.",
    },
    {
      id: "account-cloud-data",
      title: "5. Accounts, cloud data, and messages",
      summary: "These services are not connected in the current preview.",
      contentMarkdown:
        "The current login, signup, verification, recovery, settings, billing, campus, and contact screens are local product previews. They do not create a production account, send verification or recovery email, enable real two-factor authentication, charge a payment method, synchronize cloud data, or deliver a contact message.",
    },
    {
      id: "data-portability",
      title: "6. Accessing local data",
      summary: "Browser developer tools can inspect the two current local storage records.",
      contentMarkdown:
        "A production data export is not implemented. In this preview, technical users can inspect `algora-progress` and `algora-prefs` through browser developer tools. Product-ready export and import behavior remains a later frontend and service requirement.",
    },
    {
      id: "right-to-erasure",
      title: "7. Removing local data",
      summary: "Clearing this site's browser data removes the current local preview records.",
      contentMarkdown:
        "There is no cloud account record to delete in this build. You can remove current local preview data by clearing this site's storage in your browser. A verified in-product reset, account deletion workflow, retention schedule, backup policy, and deletion acknowledgment must be designed before a hosted service launches.",
    },
    {
      id: "educational-compliance",
      title: "8. Audience and regional requirements",
      summary: "Launch audience, age range, regions, and institutional obligations are undecided.",
      contentMarkdown:
        "This preview does not claim COPPA, FERPA, GDPR, CCPA, school-vendor, or other regulatory compliance. Those obligations depend on the eventual audience, regions, data flows, providers, contracts, and operating entity. They require specialist legal and security review before public service launch.",
    },
    {
      id: "security-practices",
      title: "9. Security status",
      summary: "Local-only behavior is not a certification or security guarantee.",
      contentMarkdown:
        "No production security certification, uptime commitment, encryption claim, breach process, or cloud infrastructure is represented by this frontend preview. A later release needs an approved threat model, authentication and authorization design, dependency review, monitoring, incident response, and tested recovery plan.",
    },
    {
      id: "contact-dpo",
      title: "10. Questions",
      summary: "Use the current contact page to prepare an inquiry; delivery is not connected yet.",
      contentMarkdown:
        "The repository does not establish a legal entity, Data Protection Officer, postal address, or monitored privacy mailbox. Use the [/contact](/contact) preview to review the intended inquiry fields. It will clearly state that no message was sent until a real delivery service is integrated.",
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  id: "terms",
  title: "Preview Terms",
  subtitle: "Plain-language conditions for evaluating the current local Algora frontend preview.",
  version: "0.1.0",
  effectiveDate: "2026-09-12",
  lastUpdated: "2026-09-12",
  summaryMarkdown:
    "Algora is currently a **local educational software preview**. It has no connected production account, paid subscription, refund program, campus contract, cloud synchronization, or service-level commitment.",
  sections: [
    {
      id: "acceptance",
      title: "1. Preview scope",
      summary:
        "These terms explain the current repository preview and are not launch-ready legal terms.",
      contentMarkdown:
        "You may evaluate the current Algora frontend for learning and product review. The preview can change, contain defects, or lose locally stored state. Final consumer, campus, and commercial terms require the operating entity, launch audience, regions, services, and offers to be decided and reviewed before release.",
    },
    {
      id: "educational-scope",
      title: "2. Educational purpose",
      summary: "Visual explanations support learning but do not guarantee outcomes.",
      contentMarkdown:
        "Algora presents algorithms, practice questions, code, and synchronized visual states for educational use. It does not guarantee interview success, employment, grades, certification, or that every visualization models every implementation detail. Report suspected content errors through the [/contact](/contact) preview.",
    },
    {
      id: "intellectual-property",
      title: "3. Code and content",
      summary: "The local preview does not transmit submitted practice code to a service.",
      contentMarkdown:
        "Practice code entered into the current browser runner remains local to the preview's execution flow. Algora's application source, teaching content, illustrations, and visualizer design retain their existing applicable rights and licenses. No additional ownership transfer or public-content license is created by this preview notice.",
    },
    {
      id: "user-accounts",
      title: "4. Local profiles, not accounts",
      summary: "Current identity screens create local preview state only.",
      contentMarkdown:
        "Signup, login, email verification, recovery, two-factor authentication, sessions, and profile controls are not connected to a production identity service. Do not reuse a real password or treat this preview as a secure account. A future account service will require separate terms and privacy disclosures.",
    },
    {
      id: "acceptable-use",
      title: "5. Responsible evaluation",
      summary: "Use the preview lawfully and do not attempt to harm systems or other people.",
      contentMarkdown:
        "Do not use this preview to distribute malicious code, infringe rights, misrepresent affiliation, or interfere with systems you do not own or have permission to test. The local runner is an educational convenience, not a security sandbox for hostile code.",
    },
    {
      id: "subscriptions-billing",
      title: "6. Pricing and billing status",
      summary: "Displayed plan cards are product structure previews, not a live commercial offer.",
      contentMarkdown:
        "No checkout, subscription, invoice, payment method, entitlement, student verification, or campus billing service is connected. Prices and plan features shown on [/pricing](/pricing) are unapproved preview values and may change. Clicking a plan must not charge you or create a subscription.",
    },
    {
      id: "refund-policy",
      title: "7. Refund status",
      summary: "There is no refund policy because this build cannot accept payment.",
      contentMarkdown:
        "The current preview does not sell a product or collect payment, so it does not offer or process refunds. Any future paid offer needs approved prices, cancellation terms, refund rules, payment-provider behavior, and legally reviewed checkout disclosures before launch.",
    },
    {
      id: "service-availability",
      title: "8. Availability and local data",
      summary: "No uptime, offline-access, backup, or data-recovery guarantee is made.",
      contentMarkdown:
        "The preview is provided for evaluation and may be unavailable or changed without notice. Browser storage may be cleared by the user, browser, device policy, or development changes. There is no cloud backup, cross-device sync, support response time, service-level objective, or guaranteed offline mode in this build.",
    },
    {
      id: "liability-disclaimer",
      title: "9. Accuracy and risk",
      summary: "Verify important decisions independently and report learning-content defects.",
      contentMarkdown:
        "The team aims for correct educational content but this preview is still under verification. Do not rely on it as the sole source for high-stakes academic, hiring, legal, financial, or security decisions. Applicable limitations and consumer rights for a public launch require jurisdiction-specific legal review.",
    },
    {
      id: "termination",
      title: "10. Stopping use",
      summary: "You can stop using the preview and clear its local browser data.",
      contentMarkdown:
        "There is no production account to terminate. You may stop using the preview and clear this site's local browser storage. A future account suspension, appeal, cancellation, and deletion process must be specified before the related service is enabled.",
    },
    {
      id: "governing-law",
      title: "11. Governing terms not selected",
      summary:
        "The operating entity and governing jurisdiction are not asserted by this repository.",
      contentMarkdown:
        "This preview does not invent a company registration, office, governing law, arbitration forum, or legal contact address. Those details require the actual operating entity and launch regions to be confirmed and reviewed by qualified counsel.",
    },
    {
      id: "modifications",
      title: "12. Changes to this preview",
      summary: "The code and preview notices can change while the product is being built.",
      contentMarkdown:
        "Material behavior changes should update these preview documents and their visible version and date. A future production notice process, consent model, and effective-date policy must be designed with the final service and legal requirements.",
    },
    {
      id: "contact-legal",
      title: "13. Questions and review",
      summary: "No monitored legal mailbox or postal office is represented in this build.",
      contentMarkdown:
        "Use the [/contact](/contact) preview to prepare feedback. The form currently validates locally and does not deliver a message. A real legal contact, operating entity, postal address, and support workflow must be added and verified before public launch.",
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<"privacy" | "terms", LegalDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
};
