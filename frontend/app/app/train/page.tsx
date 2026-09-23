import type { Metadata } from "next";
import { TrainView } from "@/components/features/training/TrainView";

export const metadata: Metadata = { title: "Train Models" };

export default function Page() {
  return <TrainView />;
}
