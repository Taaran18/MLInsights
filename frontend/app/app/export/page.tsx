import type { Metadata } from "next";
import { ExportView } from "@/components/features/export/ExportView";

export const metadata: Metadata = { title: "Export" };

export default function Page() {
  return <ExportView />;
}
