"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={10}
      containerStyle={{ bottom: 20, left: 16, right: 20 }}
      toastOptions={{
        duration: 4500,
        style: {
          background: "var(--surface)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--pop-shadow)",
          borderRadius: "14px",
          fontSize: "14px",
          lineHeight: "1.45",
          maxWidth: "30rem",
          padding: "10px 14px",
        },
        success: { iconTheme: { primary: "#10b981", secondary: "#ffffff" } },
        error: {
          duration: 7000,
          iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
        },
      }}
    />
  );
}
