import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MLInsights — Automated ML Analysis",
  description: "Upload a dataset, get instant insights, train & compare ML models, download reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
            success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
