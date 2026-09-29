import { Link } from "@tanstack/react-router";
export type { SettingsNavKey } from "@/content/nav";
import { SETTINGS_NAV as ITEMS, type SettingsNavKey } from "@/content/nav";

export function SettingsNav({ active }: { active: SettingsNavKey }) {
  return (
    <nav
      aria-label="Settings"
      className="grid w-full shrink-0 grid-cols-3 gap-1 self-start rounded-2xl border border-hairline bg-card p-2 lg:w-[220px] lg:grid-cols-1 lg:p-3"
    >
      {ITEMS.map(({ label, icon: Icon, to, muted }) => {
        const isActive = label === active;
        return (
          <Link
            key={label}
            to={to}
            className={[
              "relative flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2.5 font-mono text-[12px] transition-colors sm:text-[13px] lg:justify-start lg:gap-3 lg:px-3 lg:text-[13.5px]",
              isActive
                ? "bg-primary-tint text-primary"
                : muted
                  ? "text-muted-foreground/70 hover:bg-secondary"
                  : "text-foreground hover:bg-secondary",
            ].join(" ")}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              strokeWidth={1.7}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
