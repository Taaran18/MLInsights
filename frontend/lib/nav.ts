import {
  BrainCircuit,
  CloudUpload,
  Database,
  Download,
  GitCompareArrows,
  Settings,
  Trophy,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresSession: boolean;
}

export const WORKFLOW_NAV: AppNavItem[] = [
  {
    href: "/app",
    label: "Upload Data",
    icon: CloudUpload,
    requiresSession: false,
  },
  {
    href: "/app/insights",
    label: "Dataset Insights",
    icon: Database,
    requiresSession: true,
  },
  {
    href: "/app/clean",
    label: "Clean Data",
    icon: WandSparkles,
    requiresSession: true,
  },
  {
    href: "/app/train",
    label: "Train Models",
    icon: BrainCircuit,
    requiresSession: true,
  },
  {
    href: "/app/results",
    label: "Results",
    icon: Trophy,
    requiresSession: true,
  },
  {
    href: "/app/compare",
    label: "Compare Models",
    icon: GitCompareArrows,
    requiresSession: true,
  },
  {
    href: "/app/export",
    label: "Export",
    icon: Download,
    requiresSession: true,
  },
];

export const GENERAL_NAV: AppNavItem[] = [
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
    requiresSession: false,
  },
];

export const ALL_NAV = [...WORKFLOW_NAV, ...GENERAL_NAV];

export function findNavItem(pathname: string): AppNavItem | undefined {
  return (
    ALL_NAV.find((item) => item.href === pathname) ??
    ALL_NAV.find(
      (item) => item.href !== "/app" && pathname.startsWith(item.href),
    )
  );
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/app"
    ? pathname === "/app"
    : pathname === href || pathname.startsWith(`${href}/`);
}
