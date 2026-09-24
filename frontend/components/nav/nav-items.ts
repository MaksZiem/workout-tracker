import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  History,
  House,
  LayoutTemplate,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "dashboard"
  | "log"
  | "workouts"
  | "planner"
  | "plans"
  | "templates"
  | "stats"
  | "exercises"
  | "admin";

export type NavGroupKey = "training" | "planning" | "progress" | "admin";

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  group: NavGroupKey;
  adminOnly?: boolean;
  /** Pozycja w dolnym pasku na telefonie. Pozostałe trafiają do „Więcej”. */
  mobileTab?: boolean;
};

/** Jedyne źródło prawdy dla sidebara (desktop) i dolnego paska (mobile). */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/", icon: House, group: "training", mobileTab: true },
  { key: "log", href: "/log", icon: Plus, group: "training", mobileTab: true },
  { key: "workouts", href: "/workouts", icon: History, group: "training", mobileTab: true },
  { key: "planner", href: "/planner", icon: CalendarDays, group: "planning", mobileTab: true },
  { key: "plans", href: "/plans", icon: ClipboardList, group: "planning" },
  { key: "templates", href: "/templates", icon: LayoutTemplate, group: "planning" },
  { key: "stats", href: "/stats", icon: BarChart3, group: "progress" },
  { key: "exercises", href: "/exercises", icon: Dumbbell, group: "progress" },
  { key: "admin", href: "/admin", icon: ShieldCheck, group: "admin", adminOnly: true },
];

export const NAV_GROUPS: NavGroupKey[] = ["training", "planning", "progress", "admin"];

export function visibleNavItems(isAdmin: boolean) {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
