import type { Metadata } from "next";
import { InsightsView } from "@/components/features/insights/InsightsView";

export const metadata: Metadata = { title: "Dataset Insights" };

export default function Page() {
  return <InsightsView />;
}
