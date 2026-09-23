import { ImageResponse } from "next/og";
import { SESSION_TTL_HOURS, TOTAL_MODELS } from "@/lib/site";

export const alt =
  "MLInsights: train and compare machine-learning models from any spreadsheet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background:
          "radial-gradient(900px 500px at 15% -10%, rgba(99,102,241,0.45), transparent 60%), radial-gradient(700px 420px at 95% 10%, rgba(168,85,247,0.3), transparent 60%), #000000",
        color: "#f3f4f7",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            borderRadius: 22,
            background:
              "linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #7c3aed 100%)",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#ffffff">
            <rect
              x="4.25"
              y="14"
              width="3.5"
              height="6"
              rx="1.2"
              fillOpacity="0.72"
            />
            <rect
              x="10.25"
              y="10"
              width="3.5"
              height="10"
              rx="1.2"
              fillOpacity="0.86"
            />
            <rect x="16.25" y="5.5" width="3.5" height="14.5" rx="1.2" />
            <path d="M7 3.2l.85 2.35L10.2 6.4l-2.35.85L7 9.6l-.85-2.35L3.8 6.4l2.35-.85L7 3.2z" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: -1.5,
          }}
        >
          <span>ML</span>
          <span style={{ color: "#a5b4fc" }}>Insights</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -3,
            maxWidth: 1000,
          }}
        >
          Turn Raw Spreadsheets Into Trained ML Models in Minutes
        </div>
        <div
          style={{ display: "flex", gap: 16, fontSize: 28, color: "#a7adba" }}
        >
          <span>{TOTAL_MODELS} models</span>
          <span style={{ color: "#4f46e5" }}>•</span>
          <span>No code, no account</span>
          <span style={{ color: "#4f46e5" }}>•</span>
          <span>Data expires in {SESSION_TTL_HOURS} hours</span>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
