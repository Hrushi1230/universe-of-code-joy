import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
  SITE_NAV,
  SITE_FOOTER_COLS,
  getFooterLinkTarget,
  type SiteNavKey as NavKey,
} from "@/content/nav";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AlgoraGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <line x1="8" y1="22" x2="24" y2="10" stroke="var(--primary)" strokeWidth="1.75" />
      <circle cx="8" cy="22" r="4" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.75" />
      <circle
        cx="24"
        cy="10"
        r="4"
        fill="var(--primary)"
        stroke="var(--primary)"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <AlgoraGlyph />
      <span className="font-mono text-[22px] font-medium tracking-tight text-foreground">
        algora
      </span>
    </Link>
  );
}

export function SiteNav({ active }: { active?: NavKey }) {
  const links = SITE_NAV;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 font-sans text-[15px] text-foreground lg:flex"
        >
          {links.map((l, i) => {
            const isActive = active === l.label;
            return (
              <div key={`${l.label}-${i}`} className="flex items-center">
                <Link
                  to={l.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-3 py-2 transition-colors ${
                    isActive ? "text-primary" : "hover:text-primary"
                  }`}
                >
                  {l.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-primary" />
                  )}
                </Link>
                {i < links.length - 1 && (
                  <span className="text-primary text-xs select-none">•</span>
                )}
              </div>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full border border-hairline bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors sm:block"
          >
            Log in
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-glow transition-colors sm:px-4"
          >
            Start free
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="grid size-11 place-items-center rounded-full border border-hairline bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(88vw,360px)] overflow-y-auto border-hairline bg-card p-0"
            >
              <SheetHeader className="border-b border-hairline px-6 py-5 text-left">
                <SheetTitle className="font-mono text-lg font-medium">Navigate Algora</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile main" className="flex flex-col gap-1 px-4 py-5">
                {links.map((link) => {
                  const isActive = active === link.label;
                  return (
                    <SheetClose asChild key={link.label}>
                      <Link
                        to={link.to}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex min-h-11 items-center rounded-lg px-3 text-base transition-colors ${
                          isActive
                            ? "bg-primary-tint text-primary"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="border-t border-hairline px-4 py-5">
                <SheetClose asChild>
                  <Link
                    to="/login"
                    className="flex min-h-11 items-center justify-center rounded-full border border-hairline bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Log in
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const cols = SITE_FOOTER_COLS;
  return (
    <footer className="mt-10 border-t border-hairline">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_2.5fr] lg:px-8 lg:py-14">
        <div>
          <Wordmark />
          <div className="mt-3 font-sans text-sm text-muted-foreground">
            See the algorithm think.
          </div>
          <div className="mt-2 font-mono text-[12px] text-muted-foreground">© 2026 Algora</div>
        </div>
        <nav
          aria-label="Footer navigation"
          className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6"
        >
          {cols.map((c) => (
            <div key={c.h}>
              <div className="mb-3 font-mono text-[11px] tracking-wider text-primary">{c.h}</div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link
                      to={getFooterLinkTarget(l)}
                      className="font-sans text-sm text-foreground/80 hover:text-primary transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
