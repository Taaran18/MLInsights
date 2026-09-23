import type { Metadata } from "next";
import { CleanView } from "@/components/features/cleaning/CleanView";

export const metadata: Metadata = { title: "Clean Data" };

export default function Page() {
  return <CleanView />;
}
