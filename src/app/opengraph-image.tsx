import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const alt = "Didier Open Graph Image";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image(_req: NextRequest) {
  const title = "Didier";
  const subtitle = "React Three Fiber • Rapier • Next.js";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0ea5e9,#1f2937)",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: 64,
          }}
        >
          <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -1 }}>Didier</div>
          <div style={{ fontSize: 36, opacity: 0.9, marginTop: 12 }}>{subtitle}</div>
          <div style={{ fontSize: 24, opacity: 0.7, marginTop: 24 }}>{title}</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

