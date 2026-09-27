import {
  FileStack,
  LayoutDashboard,
  Network,
  ScrollText,
  Workflow,
  Boxes,
  type LucideIcon,
} from "lucide-react";

import { primaryApplicationId } from "@/lib/data/applications";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const portalNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Applications, approvals and notifications",
  },
  {
    label: "Application",
    href: `/applications/${primaryApplicationId}`,
    icon: FileStack,
    description: "Manufacturing Unit Approval",
  },
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

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  if (href.startsWith("/applications/")) return pathname.startsWith("/applications");
  return pathname === href || pathname.startsWith(`${href}/`);
}
