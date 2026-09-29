# P0–P5 frontend acceptance — P4 excluded

Date: 2026-09-13. Scope: the 26 public, identity, onboarding, discovery, engagement and account route patterns. P4 learning/practice/review and the developer route are excluded. The frontend implementation owns these checks; production services and release acceptance retain the owners defined by P7–P10.

## Changes in this pass

- Homepage uses the existing reactive motion preference hook. Changing the system preference cancels playback; manual pause survives leaving and re-entering the viewport. No new animation framework or visual composition was introduced.
- Public navigation uses its accessible menu through tablet widths; the full navigation starts at 1024px. Short menus scroll as ordinary navigation, without changing the learning workspace contract.
- Login, signup, verification and recovery pages allow document reading scroll instead of clipping forms. Signup/login headers reflow on phones; verification digits and the progress indicator fit 320px.
- Password visibility buttons have accessible names. Signup validates the displayed number requirement and announces errors. Length feedback no longer claims password strength. Local-preview footers, recovery copy and pricing/contact metadata no longer promise unconnected services.
- Notification preferences retain their full content height and all ten switches remain reachable.
- Footer Glossary and Careers advertisements were removed because their destinations did not provide the named content. Existing blog articles remain clearly marked editorial previews; no article publication is claimed.
- Historical code-scroll instructions now agree with the fixed visualizer requirement. This documentation correction does not execute P4 or claim additional question coverage.

## Verification record

- `bun run verify`: 92 files, 1,010 tests passed; typecheck and content validation passed; lint has zero errors and eight existing Fast Refresh warnings.
- `bun run build`: passed; existing bundle-size and toolchain advisories remain.
- Existing public, app chrome, discovery/onboarding and engagement/account Chromium suites: 18/18 passed during this pass.
- [Keyboard and motion script](../output/playwright/p05-interactions.txt): 22 checks passed. Covers public/app menu keyboard opening and Escape focus return, live reduced-motion cancellation, correct BFS terminal state, stable card height, pause/re-entry, five forms at 320×480 and ten notification switches.
- [Public action script](../output/playwright/p05-public-actions.txt): 14 checks passed. Covers pricing selection and keyboard FAQ, empty/valid contact validation with accurate unavailable delivery, signup requirement/visibility, and seven routes at the 720×450 CSS viewport corresponding to 200% reflow of 1440×900.
- [Route sweep](../output/playwright/p05-acceptance.txt): **156/156 passed, zero failures**. 26 routes at 320, 390, 768, 1024, 1440 and 1920px, height 600px. Checks document overflow, placeholder links and visibly unnamed buttons. Final CLI result: `{"checked":156,"failures":[]}`.

The first sweep found shared public navigation overflow at 768px. The navigation breakpoint was corrected. The signup checkbox finding was an audit false positive: its native associated label supplies its accessible name; the script now checks that association.

An initial CSS `style.zoom` experiment failed because it doubles rendering without changing media-query breakpoints. It is not recorded as passing browser zoom evidence. The passing follow-up uses the equivalent CSS viewport; real browser zoom, text-only zoom, screen readers, other browser engines and physical devices remain P6 acceptance work.

## Visual evidence

- [Homepage phone](../output/playwright/p05-home-390.png) and [desktop](../output/playwright/p05-home-1440.png).
- [Signup phone](../output/playwright/p05-auth-390.png) and [desktop](../output/playwright/p05-auth-1440.png).
- [Notifications phone](../output/playwright/p05-notifications-390.png) and [desktop](../output/playwright/p05-notifications-1440.png).
- [Pricing phone](../output/playwright/p05-pricing-390.png) and [Contact phone](../output/playwright/p05-contact-390.png).

These are Chromium viewport captures, not physical-device certification. The original paper/white/teal design is retained.

## Boundaries

Local accounts, preferences, attempts and rewards are not cloud-authenticated or server-authoritative. League peers and rank boundaries remain labeled fixtures. Video, article publication, email delivery, 2FA, payments, subscriptions and invoice services are unavailable as disclosed in their pages. P6 frontend freeze is still blocked by skipped P4; P7–P10 are not executed by this acceptance pass. Nothing was deployed.
