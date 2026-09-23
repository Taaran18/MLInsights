import type { Metadata } from "next";
import { ResultsView } from "@/components/features/results/ResultsView";

export const metadata: Metadata = { title: "Training Results" };

export default function Page() {
  return <ResultsView />;
}
