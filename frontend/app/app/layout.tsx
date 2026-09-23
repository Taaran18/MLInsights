import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · MLInsights" },
  description:
    "Upload a dataset, explore and clean it, then train, compare, and export machine-learning models.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/app" },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
