import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #fbbf24 0%, #f97316 55%, #ef4444 100%)",
      }}
    >
      <svg width="112" height="112" viewBox="0 0 24 24" fill="#ffffff">
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
    </div>,
    { ...size },
  );
}
