import {
  Award,
  Bell,
  Code2,
  Compass,
  CreditCard,
  LayoutGrid,
  Map as MapIcon,
  Notebook,
  Settings,
  Trophy,
  User,
  type LucideIcon,
} from "lucide-react";

export type AppNavKey =
  | "Dashboard"
  | "Explore"
  | "My Path"
  | "Practice"
  | "Review"
  | "Compete"
  | "Achievements"
  | "Settings"
  | "Notifications";

export interface AppNavItem {
  id: string;
  label: AppNavKey;
  title: string;
  detail: string;
  icon: LucideIcon;
  to: string;
  inSidebar: boolean;
}

export const APP_NAV: AppNavItem[] = [
  {
    id: "nav-dash",
    label: "Dashboard",
    title: "Dashboard",
    detail: "Overview & today's plan",
    icon: LayoutGrid,
    to: "/dashboard",
    inSidebar: true,
  },
  {
    id: "nav-explore",
    label: "Explore",
    title: "Explore",
    detail: "Browse all algorithms",
    icon: Compass,
    to: "/explore",
    inSidebar: true,
  },
  {
    id: "nav-map",
    label: "My Path",
    title: "My Path / Mastery Map",
    detail: "Skill graph & prerequisites",
    icon: MapIcon,
    to: "/mastery-map",
    inSidebar: true,
  },
  {
    id: "nav-practice",
    label: "Practice",
    title: "Practice Challenges",
    detail: "Code editor & runner",
    icon: Code2,
    to: "/practice",
    inSidebar: true,
  },
  {
    id: "nav-review",
    label: "Review",
    title: "Review Queue",
    detail: "Spaced repetition practice",
    icon: Notebook,
    to: "/review",
    inSidebar: true,
  },
  {
    id: "nav-leagues",
    label: "Compete",
    title: "Leagues / Leaderboard",
    detail: "Weekly XP competition",
    icon: Trophy,
    to: "/leagues",
    inSidebar: true,
  },
  {
    id: "nav-achievements",
    label: "Achievements",
    title: "Achievements",
    detail: "Badges & rewards",
    icon: Award,
    to: "/achievements",
    inSidebar: true,
  },
  {
    id: "nav-settings",
    label: "Settings",
    title: "Settings",
    detail: "Profile & preferences",
    icon: Settings,
    to: "/settings",
    inSidebar: false,
  },
];

export type SiteNavKey = "Learn" | "Visualizer" | "Paths" | "Compete" | "Pricing" | "For educators";

export interface SiteNavItem {
  label: SiteNavKey;
  to: string;
}

export const SITE_NAV: SiteNavItem[] = [
  { label: "Learn", to: "/" },
  { label: "Visualizer", to: "/visualizer" },
  { label: "Paths", to: "/paths" },
  { label: "Compete", to: "/leagues" },
  { label: "Pricing", to: "/pricing" },
  { label: "For educators", to: "/campus" },
];

export interface SiteFooterLink {
  label: string;
  to: string;
}

export interface SiteFooterCol {
  h: string;
  links: string[];
}

export const FOOTER_ROUTE_MAP: Record<string, string> = {
  Terms: "/terms",
  Privacy: "/privacy",
  Security: "/privacy",
  Cookies: "/privacy",
  Contact: "/contact",
  Pricing: "/pricing",
  Visualizer: "/visualizer",
  Paths: "/paths",
  Compete: "/leagues",
  Blog: "/blog",
  Careers: "/contact",
  "Data Structures": "/explore",
  Algorithms: "/explore",
  "Interview Prep": "/paths",
  "Study Plans": "/paths",
  Glossary: "/explore",
};

export function getFooterLinkTarget(label: string): string {
  return FOOTER_ROUTE_MAP[label] ?? "/";
}

export const SITE_FOOTER_COLS: SiteFooterCol[] = [
  { h: "PRODUCT", links: ["Visualizer", "Paths", "Compete", "Pricing"] },
  {
    h: "LEARN",
    links: ["Data Structures", "Algorithms", "Interview Prep", "Study Plans"],
  },
  { h: "COMPANY", links: ["Blog", "Contact"] },
  { h: "LEGAL", links: ["Terms", "Privacy", "Security", "Cookies"] },
];

export type SettingsNavKey =
  | "Profile"
  | "Security"
  | "Preferences"
  | "Notifications"
  | "Billing"
  | "Danger zone";

export interface SettingsNavItem {
  label: SettingsNavKey;
  icon: LucideIcon;
  to: string;
  muted?: boolean;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { label: "Profile", icon: User, to: "/settings" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Billing", icon: CreditCard, to: "/settings/billing" },
];

/**
 * Synchronous content accessor for main application navigation items.
 */
export function getAppNav(): AppNavItem[] {
  return APP_NAV;
}

/**
 * Synchronous content accessor for marketing / site navigation items.
 */
export function getSiteNav(): SiteNavItem[] {
  return SITE_NAV;
}

/**
 * Synchronous content accessor for settings tab navigation items.
 */
export function getSettingsNav(): SettingsNavItem[] {
  return SETTINGS_NAV;
}

/**
 * Asynchronous content accessor for main application navigation items (Seam 1 / S10.2).
 */
export async function fetchAppNav(): Promise<AppNavItem[]> {
  return getAppNav();
}

/**
 * Asynchronous content accessor for marketing / site navigation items.
 */
export async function fetchSiteNav(): Promise<SiteNavItem[]> {
  return getSiteNav();
}

/**
 * Asynchronous content accessor for settings tab navigation items.
 */
export async function fetchSettingsNav(): Promise<SettingsNavItem[]> {
  return getSettingsNav();
}
