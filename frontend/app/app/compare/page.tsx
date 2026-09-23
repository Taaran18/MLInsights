import type { Metadata } from "next";
import { CompareView } from "@/components/features/compare/CompareView";

export const metadata: Metadata = { title: "Compare Models" };

export default function Page() {
  return <CompareView />;
}
