import type { Metadata } from "next";
import { UploadView } from "@/components/features/upload/UploadView";

export const metadata: Metadata = { title: "Upload Data" };

export default function Page() {
  return <UploadView />;
}
