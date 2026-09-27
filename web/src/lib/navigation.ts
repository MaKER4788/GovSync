import {
  Bell,
  Boxes,
  CircleHelp,
  FileStack,
  LayoutDashboard,
  ListChecks,
  Network,
  ScrollText,
  Settings,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** The services an applicant uses. */
export const serviceNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Everything in progress, in one view",
  },
  {
    label: "Applications",
    href: "/applications",
    icon: FileStack,
    description: "Every application on this identity",
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: ListChecks,
    description: "Stages waiting on a decision",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: ScrollText,
    description: "One shared document set",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "Status, action and approval notices",
  },
];

/** The platform surfaces an evaluator can inspect. */
export const platformNav: NavItem[] = [
  {
    label: "Approval Workflow",
    href: "/workflow",
    icon: Workflow,
    description: "Dependency-resolved stage chain",
  },
  {
    label: "Integration",
    href: "/integration",
    icon: Network,
    description: "Department connectors and API health",
  },
  {
    label: "Event Logs",
    href: "/logs",
    icon: ScrollText,
    description: "API calls, events and audit trail",
  },
  {
    label: "Architecture",
    href: "/architecture",
    icon: Boxes,
    description: "Platform layers and components",
  },
];

export const portalNavGroups: NavGroup[] = [
  { id: "services", label: "Services", items: serviceNav },
  { id: "platform", label: "Platform", items: platformNav },
];

/** Secondary items, pinned to the bottom of the navigation. */
export const utilityNav: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Display and notification preferences",
  },
  {
    label: "Help",
    href: "/help",
    icon: CircleHelp,
    description: "How the demo works and where to look",
  },
];

export const portalNav: NavItem[] = [
  ...serviceNav,
  ...platformNav,
  ...utilityNav,
];

/** Departments are informational in the navigation, not separate routes. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
